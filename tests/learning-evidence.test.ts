import { describe, expect, it } from 'vitest';
import {
  appendLearningEvent,
  buildEvidenceGraph,
  calculateEvidenceScore,
  normalizeMisconception,
  scheduleReviewFromScore,
  type LearningSession,
} from '../src/lib/learningEvidence';

const base: LearningSession = {
  id: 'session', conceptKey: 'physics.force', conceptAr: 'القوة', conceptEn: 'Force', classification: 'needs_review',
  mastery: { concept: 80, explanation: 70, application: 60, recall: 50, sourceUse: 40 }, status: 'active', events: [],
  createdAt: '2026-08-25T09:00:00.000Z', updatedAt: '2026-08-25T09:00:00.000Z',
};

describe('learning evidence engine', () => {
  it('calculates a bounded weighted evidence score', () => {
    expect(calculateEvidenceScore(base.mastery)).toBe(63);
    expect(calculateEvidenceScore({ concept: 500, explanation: 500, application: 500, recall: 500, sourceUse: 500 })).toBe(100);
  });

  it('normalizes free-form misconceptions into stable categories', () => {
    expect(normalizeMisconception('Confused speed and units')).toBe('unit_reasoning');
    expect(normalizeMisconception('حفظ القانون بلا معنى')).toBe('formula_without_meaning');
    expect(normalizeMisconception('unknown wording')).toBe('concept_confusion');
  });

  it('uses mastery to choose a review interval', () => {
    const from = new Date('2026-08-25T09:00:00.000Z');
    expect(scheduleReviewFromScore(90, from)).toBe('2026-09-01T09:00:00.000Z');
    expect(scheduleReviewFromScore(75, from)).toBe('2026-08-28T09:00:00.000Z');
    expect(scheduleReviewFromScore(55, from)).toBe('2026-08-26T09:00:00.000Z');
    expect(new Date(scheduleReviewFromScore(20, from)).getTime()).toBe(from.getTime() + 600_000);
  });

  it('is idempotent by event id and exposes the next graph action', () => {
    const event = { id: 'diagnostic', sessionId: base.id, type: 'diagnostic_started' as const, conceptKey: base.conceptKey, title: 'Diagnostic', summary: 'Started', occurredAt: '2026-08-25T09:01:00.000Z' };
    const once = appendLearningEvent(base, event);
    const twice = appendLearningEvent(once, event);
    expect(twice.events).toHaveLength(1);
    expect(buildEvidenceGraph(twice).map((node) => node.state).slice(0, 3)).toEqual(['complete', 'current', 'pending']);
  });
});
