import { authenticatedFetch } from '@/lib/supabase/client';

export type TutorMode = 'explain' | 'plan' | 'quiz' | 'flashcards' | 'summary' | 'project' | 'teach' | 'recall';
export interface TutorHistoryItem { role: 'user' | 'assistant'; text: string; }
export interface TutorSource {
  citationId?: string;
  title: string;
  url: string;
  description?: string;
  authority?: string;
  sourceType?: string;
  verifiedAt?: string;
}
export interface TutorSourceContext { id: string; citationId: string; title: string; text: string; }
export interface TutorRequest { question: string; language: 'ar' | 'en'; grade: string; subject: string; mode: TutorMode; history?: TutorHistoryItem[]; sourceContext?: TutorSourceContext[]; conversationId?: string; clientMessageId?: string; }
export interface TutorReply { answer: string; mode: 'ai' | 'unavailable'; sources?: TutorSource[]; errorCode?: string; generationId?: string; }
export type TutorStreamEvent =
  | { type: 'meta'; sources: TutorSource[]; generationId: string }
  | { type: 'delta'; text: string }
  | { type: 'done' }
  | { type: 'error'; error: string };

const unavailableReply = ({ language }: TutorRequest, errorCode = 'not-configured'): TutorReply => {
  return {
    mode: 'unavailable',
    errorCode,
    answer: language === 'ar'
      ? 'خدمة الذكاء الاصطناعي غير متاحة الآن. لم يتم توليد إجابة أو استبدالها بنص جاهز. حاول لاحقًا أو افتح مصدرًا موثوقًا من خزانة المعرفة.'
      : 'The AI service is unavailable. No answer was generated or replaced with canned content. Try again later or open a verified source from your knowledge vault.',
  };
};

export async function askFahim(request: TutorRequest): Promise<TutorReply> {
  try {
    const response = await authenticatedFetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) });
    const data = await response.json().catch(() => ({})) as { answer?: string; sources?: TutorSource[]; error?: string; generationId?: string };
    if (!response.ok || !data.answer) return unavailableReply(request, response.status === 503 ? 'not-configured' : 'provider-error');
    return { answer: data.answer, sources: data.sources || [], mode: 'ai', generationId: data.generationId };
  } catch { return unavailableReply(request, 'network-error'); }
}

export async function streamFahim(
  request: TutorRequest,
  handlers: { onMeta?: (sources: TutorSource[], generationId: string) => void; onDelta: (text: string) => void },
  signal?: AbortSignal,
): Promise<void> {
  const response = await authenticatedFetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...request, stream: true }),
    signal,
  });
  if (!response.ok || !response.body) {
    const payload = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(payload.error || 'AI stream is unavailable');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line) as TutorStreamEvent;
      if (event.type === 'meta') handlers.onMeta?.(event.sources, event.generationId);
      if (event.type === 'delta') handlers.onDelta(event.text);
      if (event.type === 'error') throw new Error(event.error);
    }
  }
}
