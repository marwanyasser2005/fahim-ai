import { describe, expect, it } from 'vitest';
import { polishGeneratedText } from '@/lib/editorialText';

describe('polishGeneratedText', () => {
  it('replaces long dashes in Arabic prose with Arabic punctuation', () => {
    expect(polishGeneratedText('افهم الفكرة—ثم جرّبها.')).toBe('افهم الفكرة، ثم جرّبها.');
  });

  it('keeps code fences unchanged', () => {
    const value = 'اشرح—بوضوح\n\n```ts\nconst label = "a—b";\n```';
    expect(polishGeneratedText(value)).toContain('اشرح، بوضوح');
    expect(polishGeneratedText(value)).toContain('const label = "a—b";');
  });

  it('removes decorative markdown separators', () => {
    expect(polishGeneratedText('فقرة أولى\n\n---\n\nفقرة ثانية')).toBe('فقرة أولى\n\nفقرة ثانية');
  });
});
