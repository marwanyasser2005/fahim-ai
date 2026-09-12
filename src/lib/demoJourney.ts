import { loadLearningSessions, saveLearningSession, type LearningEvent, type LearningSession } from '@/lib/learningEvidence';
import { recordStudyAction, clearDemoStudyEvents } from '@/lib/studyProgress';
import { persistReviewCards, loadReviewCards } from '@/lib/spacedReview';
import { readScopedJson, writeScopedJson } from '@/lib/userScope';
import { syncEvidenceToReviewCards } from '@/lib/reviewBridge';

/**
 * Guided demo journey (Mariam, secondary physics + two companion concepts).
 * Lets a reviewer see Today, Review, and the Passport fully populated without
 * completing an assessment. Everything is labelled demo data and can be wiped
 * with one action; nothing is uploaded to the cloud on the reviewer's behalf.
 */

const FLAG_KEY = 'fahim-demo-journey-v1';
const ID_PREFIX = 'demo-mariam-';
const CARD_PREFIX = 'ev-demo-mariam-';

type ConceptSeed = {
  id: string;
  conceptAr: string;
  conceptEn: string;
  sourceTitle: string;
  sourceLocation: string;
  attemptSummary: string;
  misconception: string;
  intervention: string;
  retrySummary: string;
  scorePercent: number;
  dueInHours: number;
  misconceptionCategory: LearningEvent['misconception'];
};

const seeds: ConceptSeed[] = [
  {
    id: `${ID_PREFIX}physics`,
    conceptAr: 'قانون نيوتن الثاني',
    conceptEn: "Newton's Second Law",
    sourceTitle: 'OpenStax University Physics, Volume 1',
    sourceLocation: 'Chapter 5 — Section 5.3',
    attemptSummary: '2/5 · 38% · «القوة الأكبر تعني سرعة أكبر دائمًا حتى لو تغيّرت الكتلة»',
    misconception: 'خلط بين السرعة المتوسطة والتسارع: المتعلمة تربط القوة بالسرعة لا بتغير السرعة.',
    intervention: 'مثال مضاد بخط زمني: مقذوف يصل لسرعة قصوى ثابتة رغم استمرار قوة الشبكة — القوة تقرر التسارع لا السرعة.',
    retrySummary: 'أجابت إجابة صحيحة على سؤالين جديدين بعد التدخل دون تسريب الإجابة السابقة.',
    scorePercent: 62,
    dueInHours: -1,
    misconceptionCategory: 'concept_confusion',
  },
  {
    id: `${ID_PREFIX}redox`,
    conceptAr: 'التأكسد والاختزال',
    conceptEn: 'Redox reactions',
    sourceTitle: 'OpenStax Chemistry 2e',
    sourceLocation: 'Chapter 4 — Section 4.2',
    attemptSummary: '4/5 · 76% · تتبع أعداد التأكسد مع خطأ في العامل المؤكسد',
    misconception: 'قلب اتجاه الإلكترونات: المؤكسد ينتزع الإلكترونات ولا يمنحها.',
    intervention: 'قاعدة الاتجاه بذاكرة بصرية: OIL RIG مع مثال صدأ الحديد خطوة بخطوة.',
    retrySummary: 'صححت اتجاه الإلكترونات في سؤالين تطبيقيين متتاليين.',
    scorePercent: 76,
    dueInHours: 48,
    misconceptionCategory: 'causal_reversal',
  },
  {
    id: `${ID_PREFIX}derivatives`,
    conceptAr: 'مشتقات الدوال',
    conceptEn: 'Function derivatives',
    sourceTitle: 'OpenStax Calculus Volume 1',
    sourceLocation: 'Chapter 3 — Section 3.2',
    attemptSummary: '5/5 بعد تدخل واحد · 88% · قاعدة السلسلة',
    misconception: 'نسيان الضرب الداخلي عند اشتقاق الدوال المركبة.',
    intervention: 'تفكيك الدالة المركبة إلى طبقتين واشتقاق كل طبقة على حدة.',
    retrySummary: 'طبقت قاعدة السلسلة على ثلاث دوال مركبة جديدة بنجاح كامل.',
    scorePercent: 88,
    dueInHours: 120,
    misconceptionCategory: 'procedure_gap',
  },
];

const eventsFor = (seed: ConceptSeed, base: number): LearningEvent[] => {
  const at = (offset: number) => new Date(base + offset * 60_000).toISOString();
  const mk = (id: string, type: LearningEvent['type'], title: string, summary: string, extra: Partial<LearningEvent> = {}): LearningEvent => ({
    id: `${seed.id}-${id}`,
    sessionId: seed.id,
    sequence: 0,
    type,
    conceptKey: seed.conceptEn.toLowerCase().replace(/\s+/g, '-'),
    title,
    summary,
    occurredAt: at(0),
    ...extra,
  });
  const list = [
    mk('d1', 'diagnostic_started', 'اختبار تشخيصي قصير', 'خمسة أسئلة تطبيقية لتكشف نقطة البداية'),
    mk('a1', 'attempt_submitted', 'محاولة مع تفسير التفكير', seed.attemptSummary),
    mk('m1', 'misconception_detected', 'التباس محتمل', seed.misconception, { confidence: 0.7, misconception: seed.misconceptionCategory }),
    mk('i1', 'intervention_completed', 'تدخل موجّه', seed.intervention),
    mk('r1', 'retry_submitted', 'إعادة محاولة بعد التدخل', seed.retrySummary),
    mk('e1', 'evidence_created', 'دليل تعلّم جاهز', 'قوة الدليل محسوبة من خمسة أبعاد بعد تصحيح خادمي موقّع'),
  ];
  list.forEach((event, index) => { event.sequence = index + 1; event.occurredAt = at(index * 4); });
  return list;
};

export function isDemoJourneyLoaded(): boolean {
  return readScopedJson<boolean>(FLAG_KEY, false) === true;
}

export function seedDemoJourney(): number {
  if (isDemoJourneyLoaded()) return 0;
  const now = Date.now();
  let added = 0;
  for (const seed of seeds) {
    if (loadLearningSessions().some((session) => session.id === seed.id)) continue;
    const events = eventsFor(seed, now);
    const session: LearningSession = {
      id: seed.id,
      conceptKey: seed.conceptEn.toLowerCase().replace(/\s+/g, '-'),
      conceptAr: seed.conceptAr,
      conceptEn: seed.conceptEn,
      sourceTitle: seed.sourceTitle,
      sourceLocation: seed.sourceLocation,
      classification: 'verified_source',
      mastery: {
        concept: seed.scorePercent,
        explanation: Math.max(0, seed.scorePercent - 8),
        application: Math.min(100, seed.scorePercent + 6),
        recall: 0,
        sourceUse: 60,
      },
      status: 'evidence_ready',
      reviewDueAt: new Date(now + seed.dueInHours * 3_600_000).toISOString(),
      events,
      createdAt: new Date(now - 86_400_000).toISOString(),
      updatedAt: events[events.length - 1].occurredAt,
    };
    saveLearningSession(session);
    added += 1;
  }
  recordStudyAction('quiz', 'قانون نيوتن الثاني', { demo: true });
  recordStudyAction('explain', 'التأكسد والاختزال', { demo: true });
  recordStudyAction('session', 'مشتقات الدوال', { demo: true });
  writeScopedJson(FLAG_KEY, true);
  syncEvidenceToReviewCards();
  window.dispatchEvent(new Event('fahim-progress'));
  return added;
}

export function clearDemoJourney() {
  const sessions = loadLearningSessions().filter((session) => !session.id.startsWith(ID_PREFIX));
  writeScopedJson('fahim-learning-sessions-v1', sessions);
  persistReviewCards(loadReviewCards().filter((card) => !card.id.startsWith(CARD_PREFIX)));
  clearDemoStudyEvents();
  writeScopedJson(FLAG_KEY, false);
  window.dispatchEvent(new Event('fahim-evidence'));
  window.dispatchEvent(new Event('fahim-progress'));
}
