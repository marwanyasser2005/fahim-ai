import { describe, expect, it } from 'vitest';
import { adaptPathSchedule } from '../api/_lib/path-adaptation.mjs';
describe('schedule adaptation without changing evidence', () => {
  const lessons = [{ id: 'a', duration_minutes: 60 }, { id: 'b', duration_minutes: 120 }, { id: 'c', duration_minutes: 90 }];
  it('preserves prerequisite order and excludes completed lessons', () => {
    const result = adaptPathSchedule(lessons, ['a'], 180);
    expect(result.nextLessonId).toBe('b'); expect(result.remainingMinutes).toBe(210); expect(result.estimatedWeeksRemaining).toBe(2);
  });
  it('adapts remaining weeks when available time changes and reserves review time', () => {
    const result = adaptPathSchedule(lessons, [], 60, 3);
    expect(result.reviewMinutesPerWeek).toBe(12); expect(result.estimatedWeeksRemaining).toBe(6);
  });
  it('does not infer mastery from completion', () => {
    const result = adaptPathSchedule(lessons, ['a', 'b', 'c'], 180);
    expect(result.nextLessonId).toBeNull(); expect(result.reason).toBe('lessons-complete-check-assessment'); expect(result.mastery).toBeUndefined();
  });
});
