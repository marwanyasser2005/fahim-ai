import { describe, expect, it } from 'vitest';
import { rankCrossrefWorks } from '../api/_lib/agent/tools.mjs';

const work = { DOI: '10.1234/example', title: ['Force and acceleration in classical mechanics'], abstract: '<jats:p>When mass stays constant, net force determines acceleration. The vector sum of all forces is needed, rather than an individual force considered in isolation.</jats:p>' };
describe('Crossref deposited abstract retrieval', () => {
  it('uses a meaningful abstract, removes markup and explicitly limits access claims', () => {
    const [source] = rankCrossrefWorks([work], 'force acceleration physics');
    expect(source.excerpt).not.toContain('<jats');
    expect(source.description).toContain('full-text access not checked');
    expect(source.url).toBe('https://doi.org/10.1234%2Fexample');
    expect(source.verifiedAt).toBeNull();
  });
  it('rejects title-only, unrelated, malformed-DOI and retraction records', () => {
    expect(rankCrossrefWorks([
      { ...work, abstract: undefined },
      { ...work, title: ['Credit scoring in banking'] },
      { ...work, DOI: 'invalid' },
      { ...work, 'update-to': [{ type: 'retraction' }] },
    ], 'force acceleration physics')).toEqual([]);
  });
  it('deduplicates identical DOI records before allocating citation IDs', () => {
    expect(rankCrossrefWorks([work, work], 'force acceleration physics', 2)).toHaveLength(1);
  });
});
