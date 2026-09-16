/**
 * Fahim Learning Algorithms — BKT, IRT, FSRS.
 *
 * Deterministic, zero-token implementations of the three algorithms that own
 * learning decisions in the Fahim vNext specification:
 *  - BKT (§33–38): per-concept mastery probability.
 *  - IRT 2PL (§39–41): adaptive item selection.
 *  - FSRS (§45–47): spaced-review scheduling.
 *
 * LLMs never compute any of these; the numbers here flow straight from
 * structured attempt data. The TypeScript twins in src/lib/learning/ are the
 * canonical copies; this module mirrors them for the Node API runtime.
 */

export const BKT_DEFAULTS = Object.freeze({ p0: 0.2, learn: 0.15, slip: 0.1, guess: 0.2 });

const clamp01 = (value) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

/** Spec §35–36: one BKT observation. */
export function bktObserve(state, correct, parameters = {}) {
  const p = { ...BKT_DEFAULTS, ...parameters };
  const prior = state ? clamp01(state.mastery) : p.p0;
  const pCorrect = prior * (1 - p.slip) + (1 - prior) * p.guess;
  const pWrong = 1 - pCorrect;
  const posterior = correct
    ? (pCorrect > 0 ? (prior * (1 - p.slip)) / pCorrect : prior)
    : (pWrong > 0 ? (prior * p.slip) / pWrong : prior);
  const after = clamp01(posterior + (1 - posterior) * p.learn);
  return {
    before: prior,
    after,
    posterior,
    state: {
      mastery: after,
      attempts: (state?.attempts ?? 0) + 1,
      correct: (state?.correct ?? 0) + (correct ? 1 : 0),
      lastAttemptAt: new Date().toISOString(),
    },
  };
}

export function bktExpectedCorrect(state, parameters = {}) {
  const p = { ...BKT_DEFAULTS, ...parameters };
  const prior = state ? clamp01(state.mastery) : p.p0;
  return clamp01(prior * (1 - p.slip) + (1 - prior) * p.guess);
}

export function newBktState(parameters = {}) {
  return { mastery: parameters.p0 ?? BKT_DEFAULTS.p0, attempts: 0, correct: 0 };
}

/* Spec §38 — UI mapping stays configuration. */
export const MASTERY_LABELS = Object.freeze([
  { min: 0, max: 0.39, label: 'Needs Foundation', labelAr: 'يحتاج الأساسيات' },
  { min: 0.4, max: 0.59, label: 'Developing', labelAr: 'قيد التطور' },
  { min: 0.6, max: 0.79, label: 'Progressing', labelAr: 'في تقدم' },
  { min: 0.8, max: 0.89, label: 'Strong', labelAr: 'قوي' },
  { min: 0.9, max: 1, label: 'Mastered', labelAr: 'مُتقَن' },
]);

export function masteryLabel(mastery, ar = true) {
  const m = clamp01(mastery);
  const band = MASTERY_LABELS.find((item) => m >= item.min && m <= item.max) ?? MASTERY_LABELS[MASTERY_LABELS.length - 1];
  return ar ? band.labelAr : band.label;
}

/* ------------------------------------------------------------------ */
/* IRT 2PL                                                            */
/* ------------------------------------------------------------------ */

export function newIrtState() {
  return { ability: 0, se: 1, responses: 0 };
}

/** Spec §39 — P(correct) = 1 / (1 + e^(-a(θ - b))). */
export function irtProbability(ability, item) {
  const a = Number.isFinite(item?.discrimination) && item.discrimination > 0 ? item.discrimination : 1;
  const z = a * (ability - item.difficulty);
  return 1 / (1 + Math.exp(-z));
}

export function irtObserve(state, item, correct) {
  const prevAbility = state?.ability ?? 0;
  const p = Math.min(0.999, Math.max(0.001, irtProbability(prevAbility, item)));
  const a = Number.isFinite(item?.discrimination) && item.discrimination > 0 ? item.discrimination : 1;
  const surprise = correct ? 1 - p : p;
  const step = (correct ? 1 : -1) * (0.5 / a) * Math.max(0.35, surprise);
  const ability = Math.min(3, Math.max(-3, prevAbility + step));
  const responses = (state?.responses ?? 0) + 1;
  return { ability, se: Math.max(0.05, 1 / Math.sqrt(responses)), responses };
}

/** Spec §40 — the item closest to current ability is the informative one. */
export function selectNextItem(ability, items) {
  if (!Array.isArray(items) || !items.length) return null;
  let best = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const item of items) {
    const distance = Math.abs(Number(item?.difficulty ?? 0) - ability);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = item;
    }
  }
  return best;
}

/* ------------------------------------------------------------------ */
/* FSRS                                                                 */
/* ------------------------------------------------------------------ */

const FSRS_W = Object.freeze([
  0.21, 1.29, 2.38, 11.9, 0.01, 0.14, 0.54, 1.48, 0.0, 0.0, 1.0, 0.0, 0.0, 1.79, 0.0, 0.0, 0.0, 1.48, 0.1, 0.6,
]);
const REQUESTED_R = 0.9;
const GRADE = Object.freeze({ again: 1, hard: 2, good: 3, easy: 4 });

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function daysBetween(fromIso, to) {
  const from = Date.parse(fromIso);
  if (!Number.isFinite(from)) return 0;
  return Math.max(0, (to.getTime() - from) / 86_400_000);
}

export function fsrsRetrievability(elapsedDays, stability) {
  if (stability <= 0) return 0;
  return clamp(Math.pow(1 - Math.max(0, elapsedDays) / stability, 2), 0, 1);
}

function intervalFor(stability) {
  return Math.max(1, Math.max(0.001, stability) * (1 - Math.pow(REQUESTED_R, 0.5)));
}

function initialDifficulty(grade) {
  const a = clamp(FSRS_W[0] - (grade - 1) * FSRS_W[1] + FSRS_W[2] * Math.log(grade), 0, 1);
  return 1 / (1 + Math.exp(-a));
}

export function fsrsSchedule(card, grade, now = new Date()) {
  const g = GRADE[grade] ?? 3;
  const started = card === null || card === undefined;
  const base = card ?? { difficulty: 0.5, stability: 0, lastReviewAt: now.toISOString(), reviews: 0, lapses: 0 };
  const elapsed = daysBetween(base.lastReviewAt, now);
  const r = started ? 0.5 : fsrsRetrievability(elapsed, base.stability);
  const w = FSRS_W;

  let difficulty;
  let stability;
  let intervalDays;
  let lapses = base.lapses;

  if (started) {
    difficulty = initialDifficulty(g);
    stability = clamp(w[0] * Math.pow(g, -w[1]) * Math.exp(w[2] * (1 - r)) * (w[3] + 1), 0.01, 30);
    intervalDays = g === 1 ? 0 : g === 2 ? 1 : g === 3 ? Math.max(1, intervalFor(stability)) : Math.max(2, intervalFor(stability) * 1.5);
  } else {
    difficulty = clamp(initialDifficulty(3) * w[9] + (1 - w[9]) * clamp(base.difficulty + -(w[7] * (g - 1)) + w[8] * (REQUESTED_R - 0.5), 0, 1), 0, 1);
    if (g === 1) {
      stability = clamp(w[0] * Math.pow(Math.max(0.01, base.stability), -w[1]) * Math.exp(w[2] * (1 - r)) * 0.5, 0.01, 30);
      lapses += 1;
    } else {
      const growth = 1 + w[4] * Math.pow(Math.max(0.01, base.stability), -w[5]) * Math.exp(w[6] * (1 - r)) * (g === 4 ? w[17] : g === 2 ? Math.max(0.85, 1 - 0.3 * base.difficulty) : 1);
      stability = clamp(base.stability * growth, 0.01, 365);
    }
    intervalDays = g === 1 ? 0 : g === 2 ? Math.max(1, intervalFor(stability) * 0.5) : g === 3 ? Math.max(1, intervalFor(stability)) : Math.max(intervalFor(stability), intervalFor(stability) * 1.5);
  }

  const round3 = (value) => Math.round(value * 1000) / 1000;
  return {
    nextReviewAt: new Date(now.getTime() + intervalDays * 86_400_000).toISOString(),
    intervalDays: round3(intervalDays),
    difficulty: round3(difficulty),
    stability: round3(stability),
    retrievability: round3(r),
    card: { difficulty: round3(difficulty), stability: round3(stability), lastReviewAt: now.toISOString(), reviews: base.reviews + 1, lapses },
  };
}

export function fsrsIsDue(target, now = new Date()) {
  const parsed = Date.parse(String(target || ''));
  return Number.isFinite(parsed) ? parsed <= now.getTime() : true;
}
