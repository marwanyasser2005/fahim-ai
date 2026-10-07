/** Deterministic schedule adaptation; never awards mastery or a credential. */
const normalized = value => String(value || '').toLowerCase().normalize('NFKC').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[\u064b-\u065f]/g, '').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();

/** Conservative lexical review recommendation. Never inserts or skips required lessons. */
export function selectPathWarmup(lessons, concepts = []) {
  for (const evidence of [...concepts].filter(item => Number(item.attempts) >= 2 && Number(item.mastery) < .6 && Number(item.mastery) >= 0).sort((a, b) => a.mastery - b.mastery)) {
    const concept = normalized(evidence.concept);
    if (concept.length < 5) continue;
    const lesson = (lessons || []).find(item => {
      const text = normalized([item.title, ...Object.values(item.metadata?.title || {}), ...Object.values(item.metadata?.summary || {})].join(' '));
      return (` ${text} `).includes(` ${concept} `);
    });
    if (lesson) return { concept: String(evidence.concept).slice(0, 240), lessonId: lesson.id, attempts: Number(evidence.attempts), minutes: 10, reason: 'repeated-measured-gap-lexical-match', provisional: true };
  }
  return null;
}

export function adaptPathSchedule(lessons, completedIds, weeklyMinutes, dueReviews = 0, concepts = []) {
  const done = new Set(completedIds || []);
  const remaining = (lessons || []).filter((lesson) => !done.has(lesson.id));
  const minutes = remaining.reduce((total, lesson) => total + Math.max(0, Number(lesson.duration_minutes ?? lesson.durationMinutes) || 0), 0);
  const budget = Math.max(45, Math.min(600, Number(weeklyMinutes) || 180));
  const warmup = selectPathWarmup(lessons, concepts);
  const reviewReserve = dueReviews > 0 || warmup ? Math.min(30, Math.round(budget * .2)) : 0;
  return {
    nextLessonId: remaining[0]?.id || null,
    warmup,
    remainingLessons: remaining.length, remainingMinutes: minutes,
    weeklyMinutes: budget, reviewMinutesPerWeek: reviewReserve,
    estimatedWeeksRemaining: minutes ? Math.ceil(minutes / Math.max(15, budget - reviewReserve)) : 0,
    reason: dueReviews > 0 ? 'reserve-time-for-due-reviews' : remaining.length ? 'continue-prerequisite-order' : 'lessons-complete-check-assessment',
    policy: 'schedule-only-not-mastery',
  };
}
