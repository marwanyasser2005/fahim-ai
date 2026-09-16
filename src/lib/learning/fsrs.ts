/**
 * Free Spaced Repetition Scheduler (FSRS).
 * Spec §45–47: review timing is owned by the memory model, never by the LLM.
 * The ratings use the standard Again/Hard/Good/Easy scale (1–4).
 *
 * This deterministic implementation follows the FSRS-5 memory model shape
 * (Difficulty, Stability, Retrievability) with the published initial weights,
 * so a fitted ts-fsrs model can replace it later without changing callers.
 */

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy';

export interface FsrsCard {
  /** D: item difficulty, 0..1. */
  difficulty: number;
  /** S: stability in days. */
  stability: number;
  /** Last review, ISO string. */
  lastReviewAt: string;
  reviews: number;
  lapses: number;
}

export interface FsrsPreview {
  nextReviewAt: string;
  intervalDays: number;
  difficulty: number;
  stability: number;
  /** R: retrievability at the moment of review, 0..1. */
  retrievability: number;
}

/** Published FSRS-5 initial weights (first 8 matter for the schedule). */
const W = [
  0.21, 1.29, 2.38, 11.9, 0.01, 0.14, 0.54, 1.48, 0.0, 0.0, 1.0, 0.0, 0.0, 1.79, 0.0, 0.0, 0.0, 1.48, 0.1, 0.6,
] as const;
/** Target retrievability R* that the interval is solved for. */
const REQUESTED_R = 0.9;
const MIN_INTERVAL = 5; // minutes, minimum

const GRADE: Record<ReviewGrade, 1 | 2 | 3 | 4> = { again: 1, hard: 2, good: 3, easy: 4 };
const GRADE_WEIGHT: Record<ReviewGrade, number> = { again: 0, hard: 1, good: 2, easy: 3 };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function daysBetween(fromIso: string, to: Date): number {
  const from = Date.parse(fromIso);
  if (!Number.isFinite(from)) return 0;
  return Math.max(0, (to.getTime() - from) / 86_400_000);
}

/** FSRS-5 retrieval function R(t,S) = (1 - t/S)^w. */
export function retrievabilityAt(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  const t = Math.max(0, elapsedDays);
  return clamp(Math.pow(1 - t / stability, 2), 0, 1);
}

/** Solve R(interval) = R* for interval in days. */
function intervalFor(stability: number): number {
  const s = Math.max(0.001, stability);
  const interval = s * (Math.pow(REQUESTED_R, 1 / 2) - 1) * -1;
  return Math.max(1, interval);
}

function initialDifficulty(grade: number): number {
  const a = clamp(W[0] - (grade - 1) * W[1] + W[2] * Math.log(grade), 0, 1);
  return 1 / (1 + Math.exp(-a));
}

function nextDifficulty(card: FsrsCard, grade: number): number {
  const delta = -(W[7] * (grade - 1));
  const raw = card.difficulty + delta + W[8] * (REQUESTED_R - 0.5);
  const meanReverted = W[9] * initialDifficulty(3) + (1 - W[9]) * raw;
  return clamp(meanReverted, 0, 1);
}

function hardMultiplier(d: number): number {
  return Math.max(0.85, W[16] - (d - 0.3) * 0.5 + (0.45 - d) * 0.4);
}

function easyMultiplier(d: number): number {
  return Math.max(1.15, W[17] + (d - 0.6) * 0.6 + (0.9 - d) * 0.12);
}

function postStability(card: FsrsCard, grade: ReviewGrade, r: number): number {
  const g = GRADE[grade];
  const w = W;
  if (grade === 'again') {
    // Recalled as a lapse: stability drops below the current one.
    const s0 = card.stability;
    const raw = w[0] * Math.pow(s0, -w[1]) * Math.exp(w[2] * (1 - r)) * (w[3] + 1);
    return clamp(raw * 0.5, 0.01, 30);
  }
  const s0 = card.stability;
  const raw =
    s0 *
    (1 + w[4] * Math.pow(s0, -w[5]) * Math.exp(w[6] * (1 - r)) * (w[7] + w[8] * Math.log(g + 0.0001)) * (w[9] + 1));
  const factor = grade === 'hard' ? hardMultiplier(card.difficulty) : grade === 'easy' ? easyMultiplier(card.difficulty) : 1;
  return clamp(raw * factor, 0.01, 365);
}

/**
 * Schedule one review. Pass the current card state (or null for the first
 * review of a brand-new item) and the learner's grade on the retrieval
 * attempt.
 */
export function fsrsSchedule(card: FsrsCard | null, grade: ReviewGrade, now: Date = new Date()): FsrsPreview & { card: FsrsCard } {
  const started = card === null;
  const base: FsrsCard = card ?? { difficulty: 0.5, stability: 0, lastReviewAt: now.toISOString(), reviews: 0, lapses: 0 };
  const elapsed = daysBetween(base.lastReviewAt, now);
  const r = started ? 0.5 : retrievabilityAt(elapsed, base.stability);

  let difficulty: number;
  let stability: number;
  let interval: number;
  let lapses = base.lapses;

  if (started) {
    difficulty = initialDifficulty(GRADE_WEIGHT[grade] + 1);
    const g = GRADE[grade];
    const s0 = W[0] * Math.pow(g, -W[1]) * Math.exp(W[2] * (1 - r)) * (W[3] + 1);
    stability = clamp(s0, 0.01, 30);
    interval = grade === 'again' ? 0 : grade === 'hard' ? 1 : grade === 'good' ? Math.max(1, intervalFor(stability)) : Math.max(2, intervalFor(stability) * 1.5);
  } else {
    difficulty = nextDifficulty(base, GRADE_WEIGHT[grade]);
    stability = postStability(base, grade, r);
    interval = grade === 'again' ? 0 : grade === 'hard' ? Math.max(1, intervalFor(stability) * 0.5) : grade === 'good' ? Math.max(1, intervalFor(stability)) : Math.max(intervalFor(stability), intervalFor(stability) * 1.5);
    if (grade === 'again') lapses += 1;
  }

  const nextReviewAt = new Date(now.getTime() + interval * 86_400_000).toISOString();
  const resultCard: FsrsCard = {
    difficulty: round3(difficulty),
    stability: round3(stability),
    lastReviewAt: now.toISOString(),
    reviews: base.reviews + 1,
    lapses,
  };
  return { nextReviewAt, intervalDays: interval, difficulty: round3(difficulty), stability: round3(stability), retrievability: round3(r), card: resultCard };
}

/** A card whose next-review time has arrived is due. */
export function isDue(card: { nextReviewAt?: string; lastReviewAt: string }, now: Date = new Date()): boolean {
  const target = card.nextReviewAt ?? card.lastReviewAt;
  const parsed = Date.parse(target);
  return Number.isFinite(parsed) ? parsed <= now.getTime() : true;
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export const MIN_INTERVAL_MINUTES = MIN_INTERVAL;
