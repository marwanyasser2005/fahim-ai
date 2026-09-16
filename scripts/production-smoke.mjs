const base = process.env.SMOKE_BASE_URL || 'https://fahim-ai-egypt.vercel.app';
const authToken = process.env.SMOKE_AUTH_TOKEN?.trim();
const requireBilling = process.env.SMOKE_REQUIRE_BILLING === 'true';
const pages = [
  '/',
  '/about',
  '/showcase',
  '/evidence',
  '/trust',
  '/privacy',
  '/ai-policy',
  '/credentials-policy',
  '/how-it-works',
  '/pricing',
  '/courses',
  '/ask-fahim',
  '/quiz-lab',
  '/videos',
  '/library',
  '/knowledge-vault',
  '/review',
  '/studio',
  '/dashboard',
  '/login',
  '/profile',
  '/admin',
  '/teacher',
];

const pageResults = [];
for (const path of pages) {
  const response = await fetch(`${base}${path}`);
  pageResults.push({
    path,
    status: response.status,
    contentType: response.headers.get('content-type'),
  });
}

const homeResponse = await fetch(`${base}/`);
const home = await homeResponse.text();
const cssPath = home.match(/href="([^"]+\.css)"/)?.[1];
const jsPath = home.match(/src="([^"]+\.js)"/)?.[1];

if (!cssPath || !jsPath) {
  throw new Error('Could not discover the production CSS and JavaScript assets.');
}

const [cssResponse, jsResponse, healthResponse] = await Promise.all([
  fetch(`${base}${cssPath}`),
  fetch(`${base}${jsPath}`),
  fetch(`${base}/api/health?mode=ready`),
]);
const health = await healthResponse.json();

const streamResponse = await fetch(`${base}/api/chat`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    origin: base,
    ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
  },
  body: JSON.stringify({
    question: 'اشرح الفرق بين التعلم الآلي والتعلم العميق بمثال مصري قصير',
    language: 'ar',
    mode: 'explain',
    stream: true,
  }),
});
const streamText = await streamResponse.text();

const youtubeResponse = await fetch(
  `${base}/api/youtube?q=${encodeURIComponent('تعلم البرمجة')}&language=ar&duration=short&captions=true`,
);
const youtube = await youtubeResponse.json();

const deniedResponse = await fetch(`${base}/api/chat`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    origin: 'https://evil.example',
  },
  body: JSON.stringify({ question: 'test request' }),
});

const invalidTypeResponse = await fetch(`${base}/api/chat`, {
  method: 'POST',
  headers: { 'content-type': 'text/plain', origin: base, ...(authToken ? { authorization: `Bearer ${authToken}` } : {}) },
  body: JSON.stringify({ question: 'test request' }),
});

const knowledgeResponse = await fetch(
  `${base}/api/search?q=${encodeURIComponent('الذكاء الاصطناعي في التعليم')}&language=ar&source=all&openAccess=true`,
);
const knowledge = await knowledgeResponse.json();

const sourcesResponse = await fetch(
  `${base}/api/search?q=${encodeURIComponent('فيزياء الصف الثالث الثانوي')}&language=ar&source=official`,
);
const sources = await sourcesResponse.json();

const quizResponse = await fetch(`${base}/api/quiz`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    origin: base,
    ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
  },
  body: JSON.stringify({
    action: 'generate',
    topic: 'قانون نيوتن الثاني وتطبيقاته',
    subject: 'الفيزياء',
    grade: 'الصف الثالث الثانوي',
    language: 'ar',
    difficulty: 'medium',
    count: 3,
  }),
});
const quiz = await quizResponse.json();
const firstQuizQuestion = quiz.questions?.[0];
const gradeResponse = firstQuizQuestion?.token
  ? await fetch(`${base}/api/quiz`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: base,
        ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({ action: 'grade', token: firstQuizQuestion.token, answerIndex: 0 }),
    })
  : null;
const grade = gradeResponse ? await gradeResponse.json() : null;

const checkoutResponse = await fetch(`${base}/api/billing-checkout`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    origin: base,
  },
  body: JSON.stringify({
    planCode: 'plus_monthly',
    fullName: 'Fahim Release Check',
    phone: '01000000000',
  }),
});

const result = {
  pages: pageResults,
  assets: {
    css: {
      status: cssResponse.status,
      contentType: cssResponse.headers.get('content-type'),
      path: cssPath,
    },
    javascript: {
      status: jsResponse.status,
      contentType: jsResponse.headers.get('content-type'),
      path: jsPath,
    },
  },
  health,
  security: {
    hsts: homeResponse.headers.get('strict-transport-security'),
    csp: homeResponse.headers.get('content-security-policy'),
    frameOptions: homeResponse.headers.get('x-frame-options'),
    contentTypeOptions: homeResponse.headers.get('x-content-type-options'),
    openerPolicy: homeResponse.headers.get('cross-origin-opener-policy'),
    apiRobots: healthResponse.headers.get('x-robots-tag'),
  },
  stream: {
    authenticated: Boolean(authToken),
    status: streamResponse.status,
    contentType: streamResponse.headers.get('content-type'),
    events: (streamText.match(/"type":"delta"/g) || []).length,
    done: streamText.includes('"type":"done"'),
    characters: streamText.length,
  },
  youtube: {
    status: youtubeResponse.status,
    count: Array.isArray(youtube.items) ? youtube.items.length : 0,
    first: youtube.items?.[0]
      ? {
          duration: youtube.items[0].duration,
          captions: youtube.items[0].hasCaptions,
          score: youtube.items[0].learningScore,
        }
      : null,
  },
  sources: {
    status: sourcesResponse.status,
    count: Array.isArray(sources.items) ? sources.items.length : 0,
    hasOfficial: Boolean(sources.items?.some((item) => item.authority === 'official')),
  },
  knowledge: {
    status: knowledgeResponse.status,
    count: Array.isArray(knowledge.items) ? knowledge.items.length : 0,
    providers: knowledge.providers || [],
  },
  quiz: {
    authenticated: Boolean(authToken),
    status: quizResponse.status,
    count: Array.isArray(quiz.questions) ? quiz.questions.length : 0,
    answerHidden: Boolean(
      firstQuizQuestion?.token &&
      !firstQuizQuestion.token.includes('correctIndex') &&
      !Object.hasOwn(firstQuizQuestion, 'correctIndex'),
    ),
    gradeStatus: gradeResponse?.status ?? null,
    graded: typeof grade?.correct === 'boolean',
  },
  billing: {
    configured: Boolean(health.billingConfigured),
    provider: health.billingProvider,
    retiredCheckoutStatus: checkoutResponse.status,
  },
  crossOriginStatus: deniedResponse.status,
  invalidContentTypeStatus: invalidTypeResponse.status,
};

const streamFailure = authToken
  ? streamResponse.status !== 200 || !result.stream.done || result.stream.events === 0
    ? 'authenticated AI streaming'
    : null
  : streamResponse.status !== 401
    ? 'unauthenticated AI access control'
    : null;

const failures = [
  ...pageResults.filter(({ status }) => status !== 200).map(({ path }) => `page ${path}`),
  cssResponse.status !== 200 || !cssResponse.headers.get('content-type')?.includes('text/css')
    ? 'CSS asset'
    : null,
  jsResponse.status !== 200 ||
  !jsResponse.headers.get('content-type')?.includes('application/javascript')
    ? 'JavaScript asset'
    : null,
  healthResponse.status !== 200 || !health.ok ? 'health endpoint' : null,
  !health.aiConfigured || Number(health.aiProviderCount) < 1 ? 'AI provider configuration' : null,
  Number(health.aiProviderCount) > 1 && !health.aiRedundancyConfigured
    ? 'AI provider redundancy'
    : null,
  !health.youtubeConfigured ? 'YouTube configuration' : null,
  !health.quizSecurityConfigured ? 'quiz token security configuration' : null,
  !health.supabaseConfigured || !health.serverAuthorizationConfigured
    ? 'Supabase server configuration'
    : null,
  requireBilling && (!health.billingConfigured || health.billingProvider !== 'manual-review')
    ? 'manual billing configuration'
    : null,
  !result.security.hsts ||
  !result.security.csp?.includes("frame-ancestors 'none'") ||
  result.security.frameOptions !== 'DENY' ||
  result.security.contentTypeOptions !== 'nosniff' ||
  !result.security.openerPolicy
    ? 'security headers'
    : null,
  !result.security.apiRobots?.includes('noindex') ? 'API indexing protection' : null,
  streamFailure,
  youtubeResponse.status !== 200 || result.youtube.count === 0 ? 'YouTube search' : null,
  sourcesResponse.status !== 200 || result.sources.count === 0 || !result.sources.hasOfficial
    ? 'verified source registry'
    : null,
  knowledgeResponse.status !== 200 || result.knowledge.count === 0
    ? 'multi-source knowledge search'
    : null,
  authToken
    ? quizResponse.status !== 200 || result.quiz.count !== 3 || !result.quiz.answerHidden || gradeResponse?.status !== 200 || !result.quiz.graded
      ? 'authenticated structured quiz and grading'
      : null
    : quizResponse.status !== 401
      ? 'unauthenticated quiz access control'
      : null,
  deniedResponse.status !== 403 ? 'cross-origin protection' : null,
  invalidTypeResponse.status !== (authToken ? 415 : 401) ? 'request validation order' : null,
  health.billingProvider === 'manual-review' && checkoutResponse.status !== 410
    ? 'retired provider checkout boundary'
    : null,
].filter(Boolean);

console.log(JSON.stringify({ ok: failures.length === 0, failures, ...result }, null, 2));
if (failures.length) process.exitCode = 1;
