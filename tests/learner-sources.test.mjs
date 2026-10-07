import { describe, expect, it } from 'vitest';
import { normalizeLearnerSources } from '../api/_lib/learner-sources.mjs';
import { citedSourceIds } from '../api/_lib/agent/tools.mjs';
import { inspectAnswer } from '../api/_lib/ai-quality.mjs';

describe('shared learner excerpt contract', () => {
  it('bounds excerpts and allocates its own citation IDs and local reference URL', () => {
    const sources = normalizeLearnerSources(Array.from({ length: 9 }, () => ({ id: 'lesson-7', title: 'My physics notes', text: 'Net force equals mass multiplied by acceleration. '.repeat(40), citationId: 'other' })));
    expect(sources).toHaveLength(6);
    expect(sources[0].citationId).toBe('U1');
    expect(sources[0].excerpt.length).toBe(1200);
    expect(sources[0].url).toBe('/knowledge-vault?source=lesson-7');
    expect(sources[0].verifiedAt).toBeNull();
  });
  it('discards absent and insufficient excerpts instead of fabricating content', () => {
    expect(normalizeLearnerSources(null)).toEqual([]);
    expect(normalizeLearnerSources([null, { text: 'Too short' }])).toEqual([]);
  });
  it('allows uploaded passage citations in quality screening and evidence IDs', () => {
    const sources = normalizeLearnerSources([{ id: 'file', title: 'Physics', text: 'Net force equals mass multiplied by acceleration. At constant mass, doubling the force doubles the acceleration.' }], 'en');
    const text = 'At constant mass, doubling net force doubles acceleration, because net force equals mass multiplied by acceleration. [U1]';
    expect(inspectAnswer(text, sources).passed).toBe(true);
    expect(citedSourceIds(text, sources)).toEqual(['U1']);
  });
});
