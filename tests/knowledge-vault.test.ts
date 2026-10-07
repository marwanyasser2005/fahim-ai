import { describe, expect, it } from 'vitest';
import { buildVaultChunks, normalizeVaultText, parseTranscriptText, searchVault, type VaultSource } from '../src/lib/knowledgeVault';

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
  it('stops at the end of short and long files without repeatedly indexing the tail', () => {
    const short = 'Net force determines acceleration at constant mass. '.repeat(4);
    expect(buildVaultChunks('file', 'physics.srt', short)).toHaveLength(1);
    const long = 'Scientific explanation with a worked example. '.repeat(60);
    const chunks = buildVaultChunks('file', 'physics.txt', long);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.length).toBeLessThan(6);
    expect(chunks.at(-1)?.text.endsWith('example.')).toBe(true);
  });
  it('imports SRT and VTT cue text with timestamps, not cue settings', () => {
    const srt = '1\n00:00:01,000 --> 00:00:04,000\nالقوة المحصلة بتحدد التسارع.\n\n2\n00:00:04,000 --> 00:00:07,000\nعند ثبات الكتلة، القوة المضاعفة بتضاعف التسارع.';
    expect(parseTranscriptText(srt)).toContain('[Time 00:00:01.000] القوة المحصلة');
    expect(parseTranscriptText('WEBVTT\n\n00:01.000 --> 00:04.000 align:start\n<v Teacher>Net force determines acceleration.</v>')).toContain('[Time 00:01.000] Net force');
  });
  it('rejects non-caption files and invalid cue durations', () => {
    expect(() => parseTranscriptText('No timestamps here')).toThrow('empty-transcript');
    expect(() => parseTranscriptText('00:00:04,000 --> 00:00:01,000\nWrong duration')).toThrow('empty-transcript');
    expect(() => parseTranscriptText('00:00:04,000 --> 00:00:99,000\nInvalid end')).toThrow('empty-transcript');
  });
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
