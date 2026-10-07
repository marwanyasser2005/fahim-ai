import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

// Real API/storage smoke test using a dedicated anonymous synthetic session.
// No credentials are printed. No certificate is issued and no human outcome is inferred.
const base = 'https://fahim-ai-egypt.vercel.app';
const client = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const { data, error } = await client.auth.signInAnonymously({ options: { data: { synthetic_evaluation: true } } });
assert.ifError(error);
const token = data.session.access_token;
const results = [];
async function request(path, body, timeoutMs = 58_000) {
  const begin = Date.now();
  const response = await fetch(base + path, { method: body ? 'POST' : 'GET', headers: { Origin: base, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(timeoutMs) });
  const value = await response.json();
  assert(response.ok, `${path}: ${response.status} ${value.error || ''}`);
  results.push({ endpoint: path.split('?')[0], status: response.status, latencyMs: Date.now() - begin });
  return value;
}
const sourceContext = process.argv.includes('--sources') ? [{ id: 'synthetic-caption-file', title: 'Synthetic physics transcript · 00:01', text: 'القوة المحصلة تساوي الكتلة مضروبة في التسارع. عند ثبات الكتلة، مضاعفة القوة المحصلة تضاعف التسارع. لا يعني هذا أن السرعة تتضاعف لحظيًا. مثال: كتلة 2 كجم وقوة 6 نيوتن ينتج عنهما تسارع 3 متر لكل ثانية تربيع.' }] : [];
const start = await request('/api/agent', { goal: 'ليه القوة المحصلة بتتناسب مع التسارع عند ثبات الكتلة؟', subject: 'physics', grade: 'secondary', language: 'ar', stream: false, sourceContext });
assert.equal(start.expects, 'choice');
assert.equal(start.item.options.length, 4);
assert(start.item.options.every(option => option.trim().length > 3));
const resumed = await request('/api/agent', { sessionId: start.sessionId, stream: false });
assert.deepEqual(resumed.item.options, start.item.options);
assert.equal(resumed.attempts, start.attempts);
if (sourceContext.length) {
  assert.equal(start.state.sources.find(source => source.citationId === 'U1')?.sourceType, 'uploaded-source');
  assert.equal(resumed.state.sources.find(source => source.citationId === 'U1')?.excerpt, sourceContext[0].text);
}
const attempt = await request('/api/agent', { sessionId: start.sessionId, learnerInput: { answerIndex: 0 }, stream: false });
assert.equal(attempt.expects, 'text');
assert.equal(attempt.attempts, start.attempts + 1);
const proof = await request('/api/agent', { sessionId: start.sessionId, learnerInput: { text: 'القوة المحصلة تساوي الكتلة مضروبة في التسارع. لجسم كتلته 2 كجم وقوة محصلة 6 نيوتن، التسارع 3 متر لكل ثانية تربيع. لو القوة اتضاعفت إلى 12 نيوتن والكتلة ثابتة، التسارع يبقى 6 متر لكل ثانية تربيع، مش السرعة نفسها.' }, stream: false });
assert(proof.state && typeof proof.mastery === 'number');
console.log(JSON.stringify({ phase: 'agent', checks: ['meaningful-diagnostic-options', 'server-resume-without-regrading', 'attempt-count', 'reasoning-roundtrip'], status: 'passed', stage: proof.stage, sourceCount: start.state.sources?.length || 0 }));

if (process.argv.includes('--paths')) {
  const generated = await request('/api/learning-paths', { goal: 'مسار تجريبي مصطنع: أتعلم تحليل بيانات ببايثون وأنفذ مشروعًا بسيطًا لحساب المتوسط والوسيط ورسم جدول مبيعات.', level: 'beginner', durationWeeks: 4, weeklyMinutes: 180, language: 'ar', preferences: 'اختبار تقني مصطنع، مش مشاركة طالب حقيقي.' }, 125_000);
  const id = generated.path.id;
  const loaded = await request(`/api/learning-paths?id=${id}`);
  assert(loaded.path.modules.length >= 2);
  assert(loaded.path.workflow.phases.includes('server-save'));
  const lessonId = loaded.path.modules[0].lessons[0].id;
  const teaching = await request('/api/learning-paths', { action: 'lesson-content', pathId: id, lessonId, language: 'ar' }, 75_000);
  assert(teaching.lesson.text.length > 150);
  const cached = await request('/api/learning-paths', { action: 'lesson-content', pathId: id, lessonId, language: 'ar' });
  assert.equal(cached.lesson.text, teaching.lesson.text);
  assert.equal(cached.lesson.cached, true);
  const changed = await request('/api/learning-paths', { action: 'replan', pathId: id, weeklyMinutes: 60, expectedVersion: loaded.path.version });
  assert.equal(changed.path.version, loaded.path.version + 1);
  assert.equal(changed.path.weeklyMinutes, 60);
  const assessment = await client.rpc('course_assessment_v1', { target_course: id });
  assert.ifError(assessment.error); assert(assessment.data.length >= 5);
  assert(assessment.data.every(question => question.choices.length === 4 && !('correctIndex' in question)));
  console.log(JSON.stringify({ phase: 'path', checks: ['generated-curriculum-stored', 'owner-path-read', 'versioned-schedule-update', 'assessment-without-answer-key'], status: 'passed', modules: loaded.path.modules.length, questions: assessment.data.length }));
}
console.log(JSON.stringify({ synthetic: true, humanParticipants: 0, certificateIssued: false, requests: results }));
