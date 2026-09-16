import { readScopedJson, writeScopedJson } from '@/lib/userScope';

export type LearningEventType =
  | 'diagnostic_started'
  | 'attempt_submitted'
  | 'misconception_detected'
  | 'intervention_completed'
  | 'retry_submitted'
  | 'evidence_created'
  | 'review_scheduled'
  | 'review_recalled'
  | 'transfer_applied';

export type MisconceptionCategory =
  | 'concept_confusion'
  | 'formula_without_meaning'
  | 'unit_reasoning'
  | 'causal_reversal'
  | 'procedure_gap'
  | 'language_bridge';

export type EvidenceClassification =
  | 'verified_source'
  | 'inferred'
  | 'teaching_explanation'
  | 'general_knowledge'
  | 'needs_review';

export type MasteryDimensions = {
  concept: number;
  explanation: number;
  application: number;
  recall: number;
  sourceUse: number;
};

export type LearningEvent = {
  id: string;
  sessionId: string;
  sequence: number;
  type: LearningEventType;
  conceptKey: string;
  title: string;
  summary: string;
  occurredAt: string;
  misconception?: MisconceptionCategory;
  confidence?: number;
  payload?: Record<string, unknown>;
};

export type LearningSession = {
  id: string;
  conceptKey: string;
  conceptAr: string;
  conceptEn: string;
  sourceTitle?: string;
  sourceLocation?: string;
  sourceVersion?: string;
  classification: EvidenceClassification;
  mastery: MasteryDimensions;
  status: 'active' | 'evidence_ready' | 'review_due' | 'retained';
  reviewDueAt?: string;
  events: LearningEvent[];
  createdAt: string;
  updatedAt: string;
};

export type EvidenceGraphNode = {
  id: string;
  label: string;
  type: LearningEventType;
  state: 'complete' | 'current' | 'pending';
};

const STORE_KEY = 'fahim-learning-sessions-v1';
const MAX_SESSIONS = 250;

const bounded = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function calculateEvidenceScore(dimensions: MasteryDimensions) {
  return bounded(
    dimensions.concept * 0.25 +
      dimensions.explanation * 0.2 +
      dimensions.application * 0.25 +
      dimensions.recall * 0.2 +
      dimensions.sourceUse * 0.1,
  );
}
export function normalizeMisconception(value: string): MisconceptionCategory {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (/unit|وحد/.test(normalized)) return 'unit_reasoning';
  if (/cause|reverse|سبب|عكس/.test(normalized)) return 'causal_reversal';
  if (/formula|memor|قانون|حفظ/.test(normalized)) return 'formula_without_meaning';
  if (/step|procedure|خطو|إجراء/.test(normalized)) return 'procedure_gap';
  if (/language|term|ترجم|مصطلح/.test(normalized)) return 'language_bridge';
  return 'concept_confusion';
}

/**
 * How much a misconception type should compress the next review interval. Gaps in the
 * underlying model (confusion, reversed causality) need to be revisited sooner than
 * surface issues such as a unit slip or a terminology gap, which recover faster.
 */
const misconceptionUrgency: Record<MisconceptionCategory, number> = {
  concept_confusion: 0.6,
  causal_reversal: 0.6,
  formula_without_meaning: 0.75,
  procedure_gap: 0.85,
  unit_reasoning: 1,
  language_bridge: 1,
};

export function scheduleReviewFromScore(score: number, from = new Date(), misconception?: MisconceptionCategory | null) {
  const days = score >= 90 ? 7 : score >= 75 ? 3 : score >= 55 ? 1 : 10 / 1_440;
  const urgency = misconception ? misconceptionUrgency[misconception] : 1;
  // Never schedule sooner than ten minutes; a misconception compresses but does not erase spacing.
  const adjusted = Math.max(10 / 1_440, days * urgency);
  return new Date(from.getTime() + adjusted * 86_400_000).toISOString();
}

export type ReviewOutcome = {
  grade: 'again' | 'hard' | 'good' | 'easy';
  /** The gap that was just tested, in days — the card's interval before this rating. */
  elapsedDays: number;
  /** The interval the card is scheduled for next. */
  nextIntervalDays: number;
  repetitions: number;
  occurredAt?: string;
};

/**
 * A successful spaced retrieval is the only evidence that learning survived the gap, so it
 * is what writes `recall` back onto the session. Before this, the review page graded cards
 * that were never linked back to the learning record, so `recall` stayed at zero forever
 * and the `review_recalled` events the badge ladder depends on were never emitted.
 */
export function applyReviewOutcome(session: LearningSession, outcome: ReviewOutcome): LearningSession {
  const occurredAt = outcome.occurredAt || new Date().toISOString();
  const measuredRecall =
    outcome.grade === 'easy' ? 100 : outcome.grade === 'good' ? 85 : outcome.grade === 'hard' ? 55 : 20;
  const recalled = outcome.grade === 'good' || outcome.grade === 'easy';
  const gap = Math.round(outcome.elapsedDays * 10) / 10;
  const retained = recalled && outcome.repetitions >= 3 && gap >= 7;

  let next: LearningSession = {
    ...session,
    mastery: { ...session.mastery, recall: measuredRecall },
    status: retained ? 'retained' : 'review_due',
    updatedAt: occurredAt,
  };

  if (recalled) {
    const recallCount = session.events.filter((event) => event.type === 'review_recalled').length;
    next = appendLearningEvent(next, {
      id: `recall-${session.id}-${recallCount + 1}`,
      sessionId: session.id,
      type: 'review_recalled',
      conceptKey: session.conceptKey,
      title: session.conceptAr || session.conceptEn,
      summary:
        `استُرجِع من الذاكرة بعد ${gap} يوم بتقييم «${outcome.grade}»، والمراجعة القادمة بعد ${Math.round(outcome.nextIntervalDays)} يوم.` +
        ` Recalled from memory after ${gap} days with a "${outcome.grade}" rating; next review in ${Math.round(outcome.nextIntervalDays)} days.`,
      occurredAt,
      payload: { grade: outcome.grade, elapsedDays: gap, nextIntervalDays: outcome.nextIntervalDays, repetitions: outcome.repetitions },
    });
  }

  return saveLearningSession(next);
}

export function appendLearningEvent(session: LearningSession, input: Omit<LearningEvent, 'sequence'>) {
  if (session.events.some((event) => event.id === input.id)) return session;
  const events = [...session.events, { ...input, sequence: session.events.length + 1 }];
  return { ...session, events, updatedAt: input.occurredAt };
}

export function buildEvidenceGraph(session: LearningSession, totalNodes = 9): EvidenceGraphNode[] {
  const preferred: LearningEventType[] = [
    'diagnostic_started',
    'attempt_submitted',
    'misconception_detected',
    'intervention_completed',
    'retry_submitted',
    'evidence_created',
    'review_scheduled',
    'review_recalled',
    'transfer_applied',
  ];
  const labels: Record<LearningEventType, string> = {
    diagnostic_started: 'Diagnostic',
    attempt_submitted: 'Attempt',
    misconception_detected: 'Misconception',
    intervention_completed: 'Intervention',
    retry_submitted: 'Retry',
    evidence_created: 'Evidence',
    review_scheduled: 'Memory',
    review_recalled: 'Recall',
    transfer_applied: 'Transfer',
  };
  const existing = new Set(session.events.map((event) => event.type));
  const firstPending = preferred.findIndex((type) => !existing.has(type));
  return preferred.slice(0, totalNodes).map((type, index) => ({
    id: type,
    type,
    label: labels[type],
    state: existing.has(type) ? 'complete' : index === firstPending ? 'current' : 'pending',
  }));
}

export function loadLearningSessions(): LearningSession[] {
  const parsed = readScopedJson<LearningSession[]>(STORE_KEY, []);
  return Array.isArray(parsed) ? parsed.filter((item) => item?.id && Array.isArray(item.events)).slice(0, MAX_SESSIONS) : [];
}

export function saveLearningSession(session: LearningSession) {
  const sessions = loadLearningSessions();
  const next = [session, ...sessions.filter((item) => item.id !== session.id)].slice(0, MAX_SESSIONS);
  writeScopedJson(STORE_KEY, next);
  window.dispatchEvent?.(new CustomEvent('fahim-evidence', { detail: { sessionId: session.id } }));
  return session;
}

export function learningEvidenceStats(sessions = loadLearningSessions()) {
  const scores = sessions.map((session) => calculateEvidenceScore(session.mastery));
  const misconceptionCounts = new Map<MisconceptionCategory, number>();
  sessions.flatMap((session) => session.events).forEach((event) => {
    if (event.misconception) misconceptionCounts.set(event.misconception, (misconceptionCounts.get(event.misconception) || 0) + 1);
  });
  const strongestMisconception = [...misconceptionCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  return {
    sessions: sessions.length,
    evidenceReady: sessions.filter((session) => session.status !== 'active').length,
    averageScore: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0,
    dueReviews: sessions.filter((session) => session.reviewDueAt && new Date(session.reviewDueAt) <= new Date()).length,
    recurringMisconception: strongestMisconception?.[0] ?? null,
    recurringMisconceptionCount: strongestMisconception?.[1] ?? 0,
  };
}

export function createLearningSession(input: Pick<LearningSession, 'conceptKey' | 'conceptAr' | 'conceptEn'> & Partial<Pick<LearningSession, 'sourceTitle' | 'sourceLocation' | 'sourceVersion'>>) {
  const now = new Date().toISOString();
  const session: LearningSession = {
    id: crypto.randomUUID(),
    ...input,
    classification: input.sourceTitle ? 'verified_source' : 'needs_review',
    mastery: { concept: 0, explanation: 0, application: 0, recall: 0, sourceUse: input.sourceTitle ? 40 : 0 },
    status: 'active',
    events: [],
    createdAt: now,
    updatedAt: now,
  };
  return saveLearningSession(session);
}
