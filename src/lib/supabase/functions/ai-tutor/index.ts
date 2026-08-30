import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const allowedOrigins = new Set((Deno.env.get('FAHIM_ALLOWED_ORIGINS') ?? Deno.env.get('PUBLIC_SITE_URL') ?? '')
  .split(',').map((value) => value.trim().replace(/\/$/, '')).filter(Boolean));

const corsHeaders = (request: Request) => {
  const origin = request.headers.get('origin')?.replace(/\/$/, '') ?? '';
  return {
    ...(origin && allowedOrigins.has(origin) ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
};

const json = (body: Record<string, unknown>, headers: Record<string, string>, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
});

serve(async (request) => {
  const cors = corsHeaders(request);
  const origin = request.headers.get('origin');
  if (origin && !cors['Access-Control-Allow-Origin']) return json({ error: 'Origin not allowed' }, cors, 403);
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, cors, 405);

  try {
    const body = await request.json() as { question?: unknown; language?: unknown };
    const question = typeof body.question === 'string' ? body.question.trim() : '';
    const language = body.language === 'en' ? 'en' : 'ar';

    if (!question || question.length > 1500) {
      return json({ error: 'Question must be between 1 and 1500 characters.' }, cors, 400);
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) return json({ error: 'AI tutor is not configured yet.' }, cors, 503);

    const instructions = language === 'ar'
      ? 'أنت فَهيم، معلّم سقراطي داخل نظام للفهم الموثق. حرّك المتعلم عبر هدف → سياق → نشاط → محاولة → تغذية راجعة → تصحيح → تدريب → دليل → خطوة تالية. لا تعط الحل الكامل قبل المحاولة عندما يكون السؤال تدريبيًا. افصل بين: VERIFIED_SOURCE وINFERRED وTEACHING_EXPLANATION وGENERAL_KNOWLEDGE وNEEDS_REVIEW. لا تخترع مصدرًا أو صفحة أو منهجًا أو رابطًا، ولا تدّع اعتمادًا أو صفة رسمية. عند نقص الدليل قل NEEDS_REVIEW. اشرح الخطأ دون لوم، واستخدم العربية الفصحى الطبيعية مع المصطلح الإنجليزي عند فائدته. اختم بسؤال تحقق واحد أو فعل تالٍ واحد. لا تطلب بيانات شخصية ولا تساعد في غش أو تسريب امتحان.'
      : 'You are FAHIM, a Socratic tutor inside a verified learning system. Move the learner through goal → context → activity → attempt → feedback → correction → practice → evidence → next action. Do not reveal a full solution before an attempt when the task is practice. Distinguish VERIFIED_SOURCE, INFERRED, TEACHING_EXPLANATION, GENERAL_KNOWLEDGE, and NEEDS_REVIEW. Never invent sources, pages, curricula, links, accreditation, or official status. Use NEEDS_REVIEW when evidence is insufficient. Diagnose mistakes without shame and end with one check question or one next action. Never request personal data or facilitate cheating or leaked exams.';

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: Deno.env.get('OPENAI_MODEL') ?? 'gpt-5',
        instructions,
        input: question,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI request failed', response.status, await response.text());
      return json({ error: 'The tutor is temporarily unavailable. Please try again.' }, cors, 502);
    }

    const data = await response.json() as {
      output_text?: string;
      output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    };
    const fallbackAnswer = data.output
      ?.flatMap((item) => item.content ?? [])
      .filter((item) => item.type === 'output_text')
      .map((item) => item.text ?? '')
      .join('\n');
    const answer = data.output_text ?? fallbackAnswer ?? '';

    if (!answer.trim()) return json({ error: 'The tutor returned an empty response.' }, cors, 502);
    return json({ answer }, cors);
  } catch (error) {
    console.error('ai-tutor error', error);
    return json({ error: 'Invalid request.' }, cors, 400);
  }
});
