import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));

const csp = vercel.headers
  .flatMap((entry) => entry.headers)
  .find((header) => header.key === 'Content-Security-Policy').value;

describe('pre-paint theme and language bootstrap', () => {
  it('runs before the app bundle so dark-mode visitors never see a light flash', () => {
    const scriptIndex = html.indexOf('<script>');
    const moduleIndex = html.indexOf('type="module"');
    expect(scriptIndex).toBeGreaterThan(-1);
    expect(scriptIndex).toBeLessThan(moduleIndex);
  });

  it('declares colour-scheme and a theme-color per scheme', () => {
    expect(html).toContain('<meta name="color-scheme" content="light dark" />');
    expect(html).toContain('media="(prefers-color-scheme: light)"');
    expect(html).toContain('media="(prefers-color-scheme: dark)"');
  });

  it('is allowed by the strict script-src policy through its sha256 hash', () => {
    const inline = /<script>([\s\S]*?)<\/script>/.exec(html);
    expect(inline).not.toBeNull();
    const expected = `sha256-${createHash('sha256').update(inline[1], 'utf8').digest('base64')}`;
    expect(csp).toContain(`'${expected}'`);
  });

  it('keeps script-src free of unsafe-inline', () => {
    const scriptSrc = /script-src ([^;]+);/.exec(csp)[1];
    expect(scriptSrc).not.toContain('unsafe-inline');
    expect(scriptSrc).not.toContain('unsafe-eval');
  });

  it('reads the same storage keys the application uses', () => {
    for (const key of ['fahim-theme', 'fahim-language', 'fahim-low-bandwidth']) {
      expect(html).toContain(key);
    }
  });
});
