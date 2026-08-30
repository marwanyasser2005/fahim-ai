import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createReviewCard, dueReviewCards, gradeReviewCard, loadReviewCards, reviewStats } from '../src/lib/spacedReview';

const memory = new Map<string, string>();

beforeEach(() => {
  memory.clear();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => memory.set(key, value),
  });
  vi.stubGlobal('window', { dispatchEvent: vi.fn() });
});

describe('spaced review scheduler', () => {
  it('creates a due card and schedules a good answer for tomorrow', () => {
    const card = createReviewCard('ما هي الخلية؟', 'وحدة بناء الكائن الحي', 'الأحياء');
    expect(dueReviewCards()).toHaveLength(1);

    const updated = gradeReviewCard(card.id, 'good');
    expect(updated?.intervalDays).toBe(1);
    expect(updated?.repetitions).toBe(1);
    expect(new Date(updated!.dueAt).getTime()).toBeGreaterThan(Date.now() + 23 * 60 * 60 * 1000);
    expect(reviewStats()).toMatchObject({ total: 1, due: 0, tomorrow: 1 });
  });

  it('records a lapse and returns a failed card after ten minutes', () => {
    const card = createReviewCard('OSI', 'Seven networking layers');
    const updated = gradeReviewCard(card.id, 'again');
    expect(updated?.lapses).toBe(1);
    expect(updated?.repetitions).toBe(0);
    expect(updated?.intervalDays).toBeCloseTo(0.01, 2);
    expect(loadReviewCards()[0].lastGrade).toBe('again');
  });
});
