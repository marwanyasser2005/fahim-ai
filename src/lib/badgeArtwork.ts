function stageToken(stageOrder: number) {
  return String(Math.min(9, Math.max(1, stageOrder))).padStart(2, '0');
}

export function badgeArtworkPath(stageOrder: number, earned: boolean) {
  const stage = stageToken(stageOrder);
  return earned
    ? `/brand/badges/completed-${stage}.webp`
    : `/brand/badges/progress-${stage}.webp`;
}

export function badgeDownloadPath(stageOrder: number) {
  return `/brand/badges/fahim-badge-${stageToken(stageOrder)}.png`;
}
