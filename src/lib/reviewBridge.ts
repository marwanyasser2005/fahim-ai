import { appendLearningEvent, applyReviewOutcome, loadLearningSessions, saveLearningSession, type LearningSession, type MisconceptionCategory } from '@/lib/learningEvidence';
import { gradeReviewCard, loadReviewCards, persistReviewCards, type ReviewCard, type ReviewGrade } from '@/lib/spacedReview';
import { readScopedJson, writeScopedJson } from '@/lib/userScope';

/**
 * Evidence → memory bridge, both directions.
 *
 * Forward: QuizLab schedules a review date on the learning session, but the review page
 * reads the card store, so this sync turns every scheduled session into a real review card.
 *
 * Backward: grading that card updates the learning session it came from. Without this leg
 * the loop was a one-way street — `recall` stayed at zero and the `review_recalled` events
 * that the memory badges depend on were never emitted.
 */

const LINK_KEY = 'fahim-evidence-review-links-v1';

type LinkIndex = Record<string, string>; // sessionId -> cardId

const links = (): LinkIndex => readScopedJson<LinkIndex>(LINK_KEY, {});

function conceptLabel(session: LearningSession) {
  return session.conceptAr || session.conceptEn;
}

/**
 * The prompt targets the recorded misconception rather than the bare concept name, so the
 * learner retrieves the specific idea that was incomplete. The answer side stays the
 * teaching explanation. Cards that carry no misconception fall back to the concept name.
 */
function evidenceFront(session: LearningSession) {
  const misconception = session.events.find((event) => event.type === 'misconception_detected')?.misconception;
  if (!misconception) return conceptLabel(session);
  const prompts: Record<MisconceptionCategory, { ar: string; en: string }> = {
    concept_confusion: { ar: 'ما التصور الصحيح الذي يصحّح الخلط في', en: 'What is the corrected understanding of' },
    formula_without_meaning: { ar: 'ما معنى القانون ومن أين يأتي في', en: 'What does the rule mean and where does it come from in' },
    unit_reasoning: { ar: 'ما الوحدات الصحيحة وكيف تتحقق منها في', en: 'What are the correct units and how do you check them in' },
    causal_reversal: { ar: 'ما اتجاه السبب والنتيجة الصحيح في', en: 'What is the correct cause-and-effect direction in' },
    procedure_gap: { ar: 'ما الخطوة الناقصة في إجراء حل', en: 'Which step is missing in the procedure for' },
    language_bridge: { ar: 'ما المصطلح العربي المقابل وكيف يغيّر الفهم في', en: 'What is the Arabic term, and how does it change the meaning of' },
  };
  return `${prompts[misconception].ar} ${conceptLabel(session)}؟\n${prompts[misconception].en} ${session.conceptEn}?`;
}

function evidenceBack(session: LearningSession) {
  const attempt = session.events.find((event) => event.type === 'attempt_submitted');
  const intervention = session.events.find((event) => event.type === 'intervention_completed');
  const parts = [intervention?.summary || '', attempt?.summary || ''].filter(Boolean);
  return parts.length ? parts.join('\n\n') : conceptLabel(session);
}

/** Ensure every scheduled evidence session has a matching review card. */
export function syncEvidenceToReviewCards(): ReviewCard[] {
  const sessions = loadLearningSessions().filter((session) => session.reviewDueAt);
  if (!sessions.length) return loadReviewCards();
  const index = links();
  const cards = loadReviewCards();
  let changed = false;
  for (const session of sessions) {
    const existingId = index[session.id];
    if (existingId && cards.some((card) => card.id === existingId)) continue;
    const now = new Date().toISOString();
    const card: ReviewCard = {
      id: existingId || `ev-${session.id}`,
      front: evidenceFront(session),
      back: evidenceBack(session),
      subject: session.sourceTitle || '',
      sessionId: session.id,
      misconception: session.events.find((event) => event.type === 'misconception_detected')?.misconception,
      createdAt: now,
      updatedAt: now,
      dueAt: session.reviewDueAt!,
      intervalDays: 0,
      ease: 2.5,
      repetitions: 0,
      lapses: 0,
    };
    index[session.id] = card.id;
    cards.unshift(card);
    changed = true;
  }
  if (changed) {
    writeScopedJson(LINK_KEY, index);
    persistReviewCards(cards);
  }
  return loadReviewCards();
}

/** Finds the learning session a review card belongs to, if any. */
export function sessionIdForCard(cardId: string) {
  const card = loadReviewCards().find((item) => item.id === cardId);
  if (card?.sessionId) return card.sessionId;
  const index = links();
  return Object.keys(index).find((sessionId) => index[sessionId] === cardId) || null;
}

/**
 * Locates the learning record a new-context application should be attached to. Returns null
 * rather than inventing a session, because a transfer only means something if there is an
 * original learning record to transfer from.
 */
export function findSessionForConcept(hint: string): LearningSession | null {
  const needle = hint.trim().toLowerCase();
  if (needle.length < 3) return null;
  const sessions = loadLearningSessions();
  const direct = sessions.find((session) => [session.conceptAr, session.conceptEn, session.conceptKey]
    .some((value) => value && (value.toLowerCase().includes(needle) || needle.includes(value.toLowerCase()))));
  if (direct) return direct;
  return sessions.find((session) => session.sourceTitle?.toLowerCase().includes(needle)) || null;
}

/**
 * Grades a card and closes the loop: the measured recall is written back to the learning
 * session, so the evidence record reflects what actually survived the gap.
 */
export function recordReviewOutcome(cardId: string, grade: ReviewGrade) {
  const before = loadReviewCards().find((item) => item.id === cardId);
  const graded = gradeReviewCard(cardId, grade);
  if (!graded || !before) return graded;

  const sessionId = sessionIdForCard(cardId);
  if (!sessionId) return graded;
  const session = loadLearningSessions().find((item) => item.id === sessionId);
  if (!session) return graded;

  applyReviewOutcome(session, {
    grade,
    elapsedDays: before.intervalDays,
    nextIntervalDays: graded.intervalDays,
    repetitions: graded.repetitions,
  });
  return graded;
}

/**
 * Records a transfer of understanding to a new context. `transfer_applied` had no emitter,
 * which made the `connection_maker` badge impossible to earn.
 */
export function recordTransferApplied(session: LearningSession, detail: { title: string; summary: string; conceptKey?: string }) {
  const occurredAt = new Date().toISOString();
  const recallCount = session.events.filter((event) => event.type === 'transfer_applied').length;
  const next = appendLearningEvent(
    { ...session, updatedAt: occurredAt },
    {
      id: `transfer-${session.id}-${recallCount + 1}`,
      sessionId: session.id,
      type: 'transfer_applied',
      conceptKey: detail.conceptKey || session.conceptKey,
      title: detail.title.slice(0, 200),
      summary: detail.summary.slice(0, 1500),
      occurredAt,
      payload: { source: 'fahim_tutor_teach_back' },
    },
  );
  return saveLearningSession(next);
}
