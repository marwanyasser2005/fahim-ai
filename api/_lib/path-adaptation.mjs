/** Deterministic schedule adaptation; never awards mastery or a credential. */
export function adaptPathSchedule(lessons, completedIds, weeklyMinutes, dueReviews = 0) {
  const done = new Set(completedIds || []);
  const remaining = (lessons || []).filter((lesson) => !done.has(lesson.id));
  const minutes = remaining.reduce((total, lesson) => total + Math.max(0, Number(lesson.duration_minutes ?? lesson.durationMinutes) || 0), 0);
  const budget = Math.max(45, Math.min(600, Number(weeklyMinutes) || 180));
  const reviewReserve = dueReviews > 0 ? Math.min(30, Math.round(budget * .2)) : 0;
  return {
    nextLessonId: remaining[0]?.id || null,
    remainingLessons: remaining.length, remainingMinutes: minutes,
    weeklyMinutes: budget, reviewMinutesPerWeek: reviewReserve,
    estimatedWeeksRemaining: minutes ? Math.ceil(minutes / Math.max(15, budget - reviewReserve)) : 0,
    reason: dueReviews > 0 ? 'reserve-time-for-due-reviews' : remaining.length ? 'continue-prerequisite-order' : 'lessons-complete-check-assessment',
    policy: 'schedule-only-not-mastery',
  };
}
