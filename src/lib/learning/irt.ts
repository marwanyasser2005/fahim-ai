/**
 * Item Response Theory (2PL) — adaptive difficulty selection.
 * Spec §39–41: the question that fits a student is chosen by mathematics,
 * never by the LLM. Initial item parameters may be expert-assigned; they are
 * later re-fit from interaction data.
 */

export interface IrtItem {
  id: string;
  /** b: difficulty on the latent ability scale. */
  difficulty: number;
  /** a: discrimination. Defaults to 1 when unset. */
  discrimination?: number;
}

export interface IrtState {
  /** θ: current ability estimate. */
  ability: number;
  /** Standard error of the ability estimate, updated as evidence accrues. */
  se: number;
  responses: number;
}

/** Spec §39 — P(correct) = 1 / (1 + e^(-a(θ - b))). */
export function irtProbability(ability: number, item: Pick<IrtItem, 'difficulty' | 'discrimination'>): number {
  const a = Number.isFinite(item.discrimination) && item.discrimination > 0 ? item.discrimination : 1;
  const z = a * (ability - item.difficulty);
  return 1 / (1 + Math.exp(-z));
}

/**
 * Maximum-likelihood-ish ability update after one response.
 * A standard EASE-like step scaled by item discrimination keeps single items
 * from dragging θ off the scale.
 */
export function irtObserve(state: IrtState | null, item: Pick<IrtItem, 'difficulty' | 'discrimination'>, correct: boolean): IrtState {
  const prevAbility = state?.ability ?? 0;
  const p = irtProbability(prevAbility, item);
  const pSafe = Math.min(0.999, Math.max(0.001, p));
  const a = Number.isFinite(item.discrimination) && item.discrimination > 0 ? item.discrimination : 1;

  const surprise = correct ? 1 - pSafe : pSafe;
  const step = (correct ? 1 : -1) * (0.5 / a) * Math.max(0.35, surprise);
  const ability = Math.min(3, Math.max(-3, prevAbility + step));

  const responses = (state?.responses ?? 0) + 1;
  const se = Math.max(0.05, 1 / Math.sqrt(responses));

  return { ability, se, responses };
}

/**
 * Spec §40 — pick the item closest to the student's ability: informative
 * enough to move the estimate, not so far that it only produces boredom or
 * frustration.
 */
export function selectNextItem(ability: number, items: readonly IrtItem[]): IrtItem | null {
  if (!items.length) return null;
  let best: IrtItem | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const item of items) {
    const distance = Math.abs(item.difficulty - ability);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = item;
    }
  }
  return best;
}

export function newIrtState(): IrtState {
  return { ability: 0, se: 1, responses: 0 };
}
