import { test, expect } from '@playwright/test';

// Browser contract suite with mocked transport. Does not certify live AI or database RLS.
async function fixtures(page, language = 'ar') {
  await page.addInitScript((lang) => localStorage.setItem('fahim-language', lang), language);
  const id = '00000000-0000-4000-8000-000000000001';
  const user = { id, aud: 'authenticated', role: 'authenticated', is_anonymous: true, app_metadata: {}, user_metadata: { full_name: 'Fixture Learner' }, created_at: new Date().toISOString() };
  const jwt = `${Buffer.from('{}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: id, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.fixture`;
  await page.route('https://fixture.supabase.co/**', async (route) => {
    const url = route.request().url();
    let body = [];
    if (url.includes('/auth/v1/signup') || url.includes('/auth/v1/token')) body = { access_token: jwt, refresh_token: 'fixture-refresh', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer', user };
    else if (url.includes('/auth/v1/user')) body = user;
    else if (url.includes('current_access_v1')) body = { status: 'active', onboardingComplete: true, canUseCore: true };
    await route.fulfill({ json: body });
  });
}

const sessionId = '00000000-0000-4000-8000-000000000002';
function agentResult(overrides = {}) {
  return { sessionId, conceptKey: 'force', awaiting: true, prompt: 'ليه التسارع بيتضاعف لما القوة تتضاعف والكتلة ثابتة؟', expects: 'choice', item: { question: 'Force?', options: ['القوة المحصلة مقسومة على الكتلة', 'التسارع مستقل عن القوة', 'الكتلة بتزيد تلقائيًا', 'القوة بتقل مع التسارع'] }, mastery: .2, ability: 0, attempts: 0, stage: 'diagnose', confidence: .25, state: { conceptKey: 'force', sources: [] }, ...overrides };
}
async function agentFixture(page) {
  let turn = 0;
  await page.route('**/api/agent', async (route) => {
    const body = route.request().postDataJSON();
    let result;
    if (!body.learnerInput) result = agentResult();
    else if (body.learnerInput.answerIndex !== undefined) { turn += 1; result = agentResult({ expects: 'text', prompt: 'طبّق الفكرة بمثال جديد واشرح السبب.', item: null, attempts: turn, mastery: .6, stage: 'prove', state: { conceptKey: 'force', explanation: 'عند ثبات الكتلة، القوة المحصلة بتحدد مقدار التسارع. جرّب تحسبه لجسم كتلته 2 كجم وقوة 6 نيوتن.', sources: [] } }); }
    else result = agentResult({ awaiting: false, prompt: null, expects: null, item: null, stage: 'complete', summary: 'اتحفظت محاولتك، والمراجعة الجاية بعد يومين.', attempts: 2, mastery: .85 });
    await route.fulfill({ contentType: 'application/x-ndjson', body: [{ type: 'meta', sessionId, generationId: 'fixture', conceptKey: 'force' }, { type: 'result', result }, { type: 'done' }].map((entry) => JSON.stringify(entry)).join('\n') + '\n' });
  });
}

test('open exploration, diagnostic resume, explanation and completion', async ({ page }) => {
  await fixtures(page); await agentFixture(page);
  await page.goto('/agent?goal=لماذا%20تتناسب%20القوة%20مع%20التسارع');
  await expect(page.getByRole('heading', { name: 'افهم الفكرة، وجرّبها بنفسك' })).toBeVisible();
  await page.getByRole('button', { name: 'ابدأ جلسة موثّقة' }).click();
  await expect(page.getByRole('button', { name: /القوة المحصلة مقسومة/ })).toBeVisible();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'استكمال الجلسة' }).click();
  await expect(page.getByRole('button', { name: /القوة المحصلة مقسومة/ })).toBeVisible();
  await page.getByRole('button', { name: /القوة المحصلة مقسومة/ }).click();
  await page.getByRole('button', { name: 'تأكيد المحاولة' }).click();
  await expect(page.getByText('عند ثبات الكتلة، القوة المحصلة بتحدد مقدار التسارع.', { exact: false })).toBeVisible();
  await page.getByPlaceholder('اشرح بطريقتك: ليه ده بيحصل؟ وادّينا مثال صغير…').fill('لأن القوة المحصلة تساوي الكتلة في التسارع، فعند ثبات الكتلة لو القوة زادت للضعف التسارع يزيد للضعف.');
  await page.getByRole('button', { name: 'إرسال التفسير' }).click();
  await expect(page.getByText('اكتملت الجولة', { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('fahim-agent-session-v2'))).toBeNull();
});

test('Egyptian Arabic and English quality reports render without horizontal overflow', async ({ page }) => {
  await fixtures(page, 'en');
  await page.goto('/ai-quality');
  await expect(page.getByRole('heading', { name: 'What have we actually tested?' })).toBeVisible();
  await expect(page.getByText('120/120', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
});

test('new browser context does not inherit an unfinished session', async ({ page }) => {
  await fixtures(page); await agentFixture(page);
  await page.goto('/agent');
  await expect(page.getByRole('button', { name: 'استكمال الجلسة' })).toHaveCount(0);
  await page.getByPlaceholder('مثال: لماذا تتناسب القوة مع التسارع؟').fill('عايز أفهم الحركة والتسارع');
  await page.getByRole('button', { name: 'ابدأ جلسة موثّقة' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
});

test('personal path uses saved progress, retries failures, replans and grades server-side', async ({ page }) => {
  await fixtures(page);
  const pathId = '00000000-0000-4000-8000-000000000003';
  const lessonId = '00000000-0000-4000-8000-000000000004';
  const text = { ar: 'تطبيق قانون نيوتن', en: 'Apply Newton’s law' };
  let saved = false; let failSave = true; let writes = 0;
  const path = { id: pathId, title: text, description: text, outcomes: [text], goal: text.ar, level: 'beginner', durationWeeks: 2, weeklyMinutes: 180, version: 1, createdAt: new Date().toISOString(), modules: [{ index: 0, title: text, lessons: [{ id: lessonId, title: text, summary: text, practice: text, type: 'practice', durationMinutes: 30, position: 0 }] }], adaptivePlan: { remainingLessons: 1, estimatedWeeksRemaining: 1, reviewMinutesPerWeek: 0 } };
  await page.route('**/api/learning-paths**', async route => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      if (body.action === 'replan') { path.weeklyMinutes = body.weeklyMinutes; path.version += 1; }
    }
    path.adaptivePlan.remainingLessons = saved ? 0 : 1;
    await route.fulfill({ json: route.request().url().includes('?id=') || route.request().method() === 'POST' ? { path } : { paths: [] } });
  });
  await page.route('https://fixture.supabase.co/rest/v1/progress**', async route => {
    if (route.request().method() === 'POST') {
      writes += 1;
      if (failSave) { failSave = false; await route.fulfill({ status: 503, json: { message: 'Retry fixture' } }); return; }
      saved = true; await route.fulfill({ json: [] }); return;
    }
    await route.fulfill({ json: saved ? [{ lesson_id: lessonId, status: 'completed', completion_percentage: 100 }] : [] });
  });
  await page.route('**/rpc/course_assessment_v1', route => route.fulfill({ json: [{ quizId: pathId, questionId: lessonId, prompt: 'كتلة 2 كجم وقوة 6 نيوتن: التسارع؟', choices: ['3 متر/ث²', '12 متر/ث²', '2 متر/ث²', '6 متر/ث²'], points: 1, position: 0 }] }));
  await page.route('**/rpc/submit_course_assessment_v1', route => route.fulfill({ json: { attempt: 1, correctCount: 1, questionCount: 1, percentage: 100, passed: true, feedback: [] } }));
  await page.goto('/personal-paths?goal=عايز%20أطبق%20قانون%20نيوتن%20بمثال%20عملي');
  await page.getByRole('button', { name: 'ابنِ مساري الآن' }).click();
  await expect(page.getByRole('heading', { name: text.ar }).first()).toBeVisible();
  await page.getByRole('button', { name: 'أكملت الدرس', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('button', { name: 'إلغاء الاكتمال' })).toHaveCount(0);
  await page.getByRole('button', { name: 'أكملت الدرس', exact: true }).click();
  await expect(page.getByRole('button', { name: 'إلغاء الاكتمال' })).toBeVisible();
  expect(writes).toBe(2);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: 'إلغاء الاكتمال' })).toBeVisible();
  await page.getByRole('spinbutton').fill('60');
  await page.getByRole('button', { name: 'عدّل الجدول واحفظ النسخة' }).click();
  await expect(page.getByText('نسخة 2.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: /3 متر\/ث²/ }).click();
  await page.getByRole('button', { name: 'أرسل الإجابات' }).click();
  await expect(page.getByText('اجتزت التقييم.', { exact: true })).toBeVisible();
});

test('public credential verification never labels an invalid signature as authentic', async ({ page }) => {
  await fixtures(page);
  await page.route('**/rpc/verify_certificate_v3', route => route.fulfill({ json: { id: sessionId, certificate_number: 'FAH-2026-000000000001', status: 'issued', signature_valid: false, issued_at: '2026-10-07T00:00:00Z', learner_name: 'Synthetic learner', course_title: 'Synthetic path', evidence: { completedLessons: 1, totalLessons: 1, finalAssessmentScore: 80 } } }));
  await page.goto(`/verify/${sessionId}`);
  await expect(page.getByText('السجل موجود، لكن صحة الشهادة غير مؤكدة', { exact: false })).toBeVisible();
  await expect(page.getByText('الشهادة صادرة وتوقيعها مطابق لسجل فَهيم.', { exact: true })).toHaveCount(0);
  await expect(page.getByText('دي شهادة إتمام من فَهيم، مش اعتماد حكومي', { exact: false })).toBeVisible();
});
