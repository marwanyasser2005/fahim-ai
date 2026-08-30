import { describe, expect, it } from 'vitest';
import { inferSubject, normalizeSearchText, rankVerifiedSources } from '../api/_lib/source-ranking.mjs';

describe('Egyptian source ranking', () => {
  it('normalizes Arabic diacritics and letter variants', () => {
    expect(normalizeSearchText('إِحْصَاء')).toBe(normalizeSearchText('احصاء'));
  });

  it('infers STEM subjects in Arabic and English', () => {
    expect(inferSubject('شرح قوانين الفيزياء')).toBe('physics');
    expect(inferSubject('machine learning roadmap')).toBe('artificial-intelligence');
  });

  it('prioritizes Egyptian curriculum sources for a secondary-school query', () => {
    const results = rankVerifiedSources({
      question: 'شرح الفيزياء',
      subject: 'فيزياء',
      grade: 'الصف الثالث الثانوي',
      language: 'ar',
      limit: 4,
    });
    expect(results).toHaveLength(4);
    expect(results[0].subjects).toContain('physics');
    expect(results.some((source) => source.authority === 'official')).toBe(true);
    expect(results.every((source) => /^E\d+$/.test(source.citationId))).toBe(true);
  });

  it('routes career technology questions toward job-learning providers', () => {
    const results = rankVerifiedSources({
      question: 'مسار برمجة وذكاء اصطناعي للعمل',
      grade: 'university',
      language: 'ar',
      limit: 3,
    });
    expect(results.map((source) => source.id)).toContain('maharatech');
  });
});
