/**
 * Bayesian Knowledge Tracing — the P0 mastery model.
 *
 * Deterministic, zero-token algorithm: mastery is never computed by an LLM.
 * Parameters follow the Fahim vNext specification §34–37; the defaults are
 * starting points to be re-estimated per concept once real data exists.
 */

export interface BktParameters {
  /** P(L0): prior probability of knowing the concept. */
  p0: number;
  /** P(T): probability of learning from an opportunity. */
  learn: number;
  /** P(S): slip — wrong despite knowing. */
  slip: number;
  /** P(G): guess — right despite not knowing. */
  guess: number;
}

export const BKT_DEFAULTS: Readonly<BktParameters> = {
  p0: 0.2,
  learn: 0.15,
  slip: 0.1,
  guess: 0.2,
};

export interface BktState {
  /** P(L): current mastery probability. */
  mastery: number;
  attempts: number;
  correct: number;
  lastAttemptAt?: string;
}

export interface BktUpdateResult {
  before: number;
  after: number;
  /** Posterior after observing the response, before the learning transition. */
  posterior: number;
  state: BktState;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

/** Spec §35–36: observe one response, update mastery. */
export function bktObserve(
  state: BktState | null,
  correct: boolean,
  parameters: Partial<BktParameters> = {},
  now: Date = new Date(),
): BktUpdateResult {
  const p: BktParameters = { ...BKT_DEFAULTS, ...parameters };
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
      lastAttemptAt: now.toISOString(),
    },
  };
}

/** Expected probability of answering a new item correctly under the current mastery. */
export function bktExpectedCorrect(state: BktState | null, parameters: Partial<BktParameters> = {}): number {
  const p: BktParameters = { ...BKT_DEFAULTS, ...parameters };
  const prior = state ? clamp01(state.mastery) : p.p0;
  return clamp01(prior * (1 - p.slip) + (1 - prior) * p.guess);
}

/* Spec §38 — UI mapping, thresholds stay configuration. */
export const MASTERY_LABELS = [
  { min: 0, max: 0.39, label: 'Needs Foundation', labelAr: 'يحتاج الأساسيات' },
  { min: 0.4, max: 0.59, label: 'Developing', labelAr: 'قيد التطور' },
  { min: 0.6, max: 0.79, label: 'Progressing', labelAr: 'في تقدم' },
  { min: 0.8, max: 0.89, label: 'Strong', labelAr: 'قوي' },
  { min: 0.9, max: 1, label: 'Mastered', labelAr: 'مُتقَن' },
] as const;

export function masteryLabel(mastery: number, ar = true) {
  const m = clamp01(mastery);
  const band = MASTERY_LABELS.find((band) => m >= band.min && m <= band.max) ?? MASTERY_LABELS[MASTERY_LABELS.length - 1];
  return ar ? band.labelAr : band.label;
}

export function newBktState(parameters: Partial<BktParameters> = {}): BktState {
  return { mastery: parameters.p0 ?? BKT_DEFAULTS.p0, attempts: 0, correct: 0 };
}
