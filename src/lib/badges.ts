export type BadgeColorKey = 'lapis' | 'nile' | 'saffron' | 'vermilion';
export type BadgeIconKey = 'compass' | 'attempt' | 'lens' | 'bridge' | 'return' | 'proof' | 'memory' | 'transfer' | 'finish';

export type FahimBadge = {
  key: string;
  stageOrder: number;
  stageKey: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  requirementAr: string;
  requirementEn: string;
  iconKey: BadgeIconKey;
  colorKey: BadgeColorKey;
  threshold: number;
  xpReward: number;
  earnedAt: string | null;
  evidence: Record<string, unknown> | null;
};

export type BadgeProgress = {
  earnedCount: number;
  totalCount: number;
  certificateCount: number;
  badgeXp: number;
  badges: FahimBadge[];
};

export const BADGE_FALLBACK_CATALOG: FahimBadge[] = [
  ['starting_compass', 1, 'start', 'بوصلة البداية', 'Starting Compass', 'حوّلت هدفًا عامًا إلى نقطة بداية قابلة للقياس.', 'Turned a broad goal into a measurable starting point.', 'ابدأ أول تشخيص تعلّم.', 'Start your first learning diagnostic.', 'compass', 'lapis', 1, 25],
  ['brave_attempt', 2, 'practice', 'جرأة المحاولة', 'Brave Attempt', 'أظهرت فهمك الحقيقي قبل رؤية الإجابة.', 'Showed your real thinking before seeing the answer.', 'قدّم أول محاولة أصلية.', 'Submit your first original attempt.', 'attempt', 'saffron', 1, 35],
  ['gap_hunter', 3, 'insight', 'صيّاد الفجوات', 'Gap Hunter', 'حوّلت الخطأ إلى نمط يمكن فهمه ومعالجته.', 'Turned an error into an explainable, actionable pattern.', 'اكتشف أول نمط خطأ مفاهيمي.', 'Identify your first misconception pattern.', 'lens', 'vermilion', 1, 45],
  ['understanding_engineer', 4, 'growth', 'مهندس الفهم', 'Understanding Engineer', 'استخدمت تدخلًا تعليميًا موجّهًا بدل حفظ إجابة جاهزة.', 'Used a targeted intervention instead of memorizing a ready answer.', 'أكمل أول تدخل تعليمي موجّه.', 'Complete your first targeted intervention.', 'bridge', 'nile', 1, 55],
  ['smarter_return', 5, 'growth', 'عودة أذكى', 'Smarter Return', 'عدت للمسألة بنموذج ذهني أفضل وصححت محاولتك.', 'Returned with a stronger mental model and corrected your attempt.', 'قدّم أول إعادة محاولة بعد التدخل.', 'Submit your first retry after intervention.', 'return', 'saffron', 1, 65],
  ['evidence_builder', 6, 'evidence', 'باني الدليل', 'Evidence Builder', 'أنشأت أكثر من أثر يوضح كيف تغيّر فهمك.', 'Created multiple artifacts showing how your understanding changed.', 'أنشئ دليلي تعلّم مكتملين.', 'Create two completed learning-evidence records.', 'proof', 'nile', 2, 90],
  ['memory_keeper', 7, 'memory', 'حارس الذاكرة', 'Memory Keeper', 'أثبت أن التعلم بقي بعد مرور الوقت، لا أثناء الجلسة فقط.', 'Proved learning remained after time—not only during the session.', 'أكمل 3 مراجعات استرجاعية.', 'Complete three spaced recall reviews.', 'memory', 'lapis', 3, 120],
  ['connection_maker', 8, 'transfer', 'صانع الروابط', 'Connection Maker', 'نقلت الفهم إلى سياق جديد بدل تكرار المثال نفسه.', 'Transferred understanding to a new context instead of repeating the same example.', 'طبّق مفهومين في سياقات جديدة.', 'Apply two concepts in new contexts.', 'transfer', 'vermilion', 2, 150],
  ['path_finisher', 9, 'completion', 'متمّم المسار', 'Path Finisher', 'أكملت كل دروس مسار منشور وأصبحت على خطوة من الشهادة.', 'Completed every lesson in a published path and moved one step from the credential.', 'أكمل 100% من دروس مسار منشور.', 'Complete 100% of a published learning path.', 'finish', 'saffron', 1, 200],
].map(([key, stageOrder, stageKey, titleAr, titleEn, descriptionAr, descriptionEn, requirementAr, requirementEn, iconKey, colorKey, threshold, xpReward]) => ({
  key: String(key), stageOrder: Number(stageOrder), stageKey: String(stageKey), titleAr: String(titleAr), titleEn: String(titleEn),
  descriptionAr: String(descriptionAr), descriptionEn: String(descriptionEn), requirementAr: String(requirementAr), requirementEn: String(requirementEn),
  iconKey: iconKey as BadgeIconKey, colorKey: colorKey as BadgeColorKey, threshold: Number(threshold), xpReward: Number(xpReward), earnedAt: null, evidence: null,
}));

export const EMPTY_BADGE_PROGRESS: BadgeProgress = {
  earnedCount: 0,
  totalCount: BADGE_FALLBACK_CATALOG.length,
  certificateCount: 0,
  badgeXp: 0,
  badges: BADGE_FALLBACK_CATALOG,
};

export function normalizeBadgeProgress(value: unknown): BadgeProgress {
  if (!value || typeof value !== 'object') return EMPTY_BADGE_PROGRESS;
  const raw = value as Partial<BadgeProgress>;
  const received = Array.isArray(raw.badges) ? raw.badges : [];
  const byKey = new Map(received.map((badge) => [badge.key, badge]));
  const badges = BADGE_FALLBACK_CATALOG.map((fallback) => ({ ...fallback, ...byKey.get(fallback.key) }));
  return {
    earnedCount: Number(raw.earnedCount ?? badges.filter((badge) => badge.earnedAt).length),
    totalCount: Number(raw.totalCount ?? badges.length),
    certificateCount: Number(raw.certificateCount ?? 0),
    badgeXp: Number(raw.badgeXp ?? 0),
    badges,
  };
}
