import { describe, expect, it } from 'vitest';
import { benchmarkCases } from './fixtures/ai-benchmark.mjs';
import { inspectAnswer, inspectCitations, selectIntervention } from '../api/_lib/ai-quality.mjs';
import { reconstructAbstract } from '../api/_lib/agent/tools.mjs';

describe('bilingual synthetic AI contract benchmark', () => {
  it.each(benchmarkCases)('$id', (entry) => expect(inspectAnswer(entry.text, entry.sources).passed).toBe(entry.expectedPass));
  it('reconstructs abstracts in position order, not object key order', () => {
    expect(reconstructAbstract({ acceleration: [2], force: [0], causes: [1] })).toBe('force causes acceleration');
  });
  it('never labels lexical screening as semantic verification', () => {
    const result = inspectCitations('A scientific claim about force [R1]', [{ citationId: 'R1', excerpt: 'force', url: 'https://example.org' }]);
    expect(result.method).toBe('lexical-screening-not-entailment');
    expect(result.citations[0].status).toBe('metadata-only');
  });
  it('changes intervention on a repeated gap', () => {
    expect(selectIntervention({ misconception: { category: 'unit_confusion' } }).id).toBe('worked-example');
    expect(selectIntervention({ remediationCount: 1 }).id).toBe('guided-practice');
  });
});
