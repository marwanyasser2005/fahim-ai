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
  it('recommends a matched measured gap without skipping the next required lesson', () => {
    const path = [{ id: 'a', title: 'Force and acceleration', duration_minutes: 60 }, { id: 'b', title: 'Momentum', duration_minutes: 60 }];
    const result = adaptPathSchedule(path, ['a'], 180, 0, [{ concept: 'force and acceleration', attempts: 3, mastery: .3 }]);
    expect(result.warmup.lessonId).toBe('a'); expect(result.nextLessonId).toBe('b'); expect(result.reviewMinutesPerWeek).toBe(30);
  });
  it('does not label an unrelated concept or an untested prior as a path gap', () => {
    const path = [{ id: 'a', title: 'Newton second law', duration_minutes: 60 }];
    expect(adaptPathSchedule(path, [], 180, 0, [{ concept: 'cell division', attempts: 3, mastery: .2 }]).warmup).toBeNull();
    expect(adaptPathSchedule(path, [], 180, 0, [{ concept: 'Newton second law', attempts: 0, mastery: .2 }]).warmup).toBeNull();
  });
});
