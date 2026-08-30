import { describe, expect, it } from 'vitest';
import { normalizeVaultText, searchVault, type VaultSource } from '../src/lib/knowledgeVault';

const source: VaultSource = {
  id: 'biology-book',
  name: 'biology.md',
  mimeType: 'text/markdown',
  size: 220,
  createdAt: '2026-08-09T00:00:00.000Z',
  characterCount: 220,
  chunks: [
    { id: 'biology-0', sourceId: 'biology-book', sourceName: 'biology.md', index: 0, text: 'الخلية هي الوحدة الأساسية لبناء الكائن الحي ووظائفه.', tokens: ['الخليه', 'هي', 'الوحده', 'الاساسيه', 'لبناء', 'الكائن', 'الحي', 'ووظائفه'] },
    { id: 'biology-1', sourceId: 'biology-book', sourceName: 'biology.md', index: 1, text: 'يتكون النظام الشمسي من الشمس والكواكب.', tokens: ['يتكون', 'النظام', 'الشمسي', 'من', 'الشمس', 'والكواكب'] },
  ],
};

describe('local knowledge retrieval', () => {
  it('normalizes common Arabic spelling and diacritics consistently', () => {
    expect(normalizeVaultText('إِجَابَة إلى مُشكلة')).toBe('اجابه الي مشكله');
  });

  it('ranks the relevant Arabic evidence chunk first', () => {
    const hits = searchVault([source], 'ما هي الخلية الأساسية؟');
    expect(hits[0]?.chunk.id).toBe('biology-0');
    expect(hits[0]?.score).toBeGreaterThan(1);
    expect(hits[0]?.matchedTerms.length).toBeGreaterThan(0);
    expect(hits[0]?.coverage).toBeGreaterThan(0);
    expect(['high', 'medium', 'exploratory']).toContain(hits[0]?.confidence);
  });

  it('bridges common English concepts to Arabic source terms explainably', () => {
    const bridgeSource: VaultSource = {
      ...source,
      chunks: [{
        id: 'physics-0', sourceId: source.id, sourceName: 'physics.pdf', index: 0,
        text: '[Page 7]\nالقوة تساوي حاصل ضرب الكتلة في التسارع وفق قانون نيوتن الثاني.',
        tokens: ['page', '7', 'القوه', 'تساوي', 'حاصل', 'ضرب', 'الكتله', 'في', 'التسارع', 'وفق', 'قانون', 'نيوتن', 'الثاني'],
      }],
    };
    const hits = searchVault([bridgeSource], 'How does force relate to acceleration?');
    expect(hits[0]?.chunk.id).toBe('physics-0');
    expect(hits[0]?.reasons).toContain('bilingual_bridge');
    expect(hits[0]?.location).toBe('Page 7');
  });
});
