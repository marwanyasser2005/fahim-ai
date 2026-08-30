import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const trust = readFileSync(new URL('../src/pages/TrustCenter.tsx', import.meta.url), 'utf8');
const footer = readFileSync(new URL('../src/components/Footer.tsx', import.meta.url), 'utf8');

describe('public trust and credential boundaries', () => {
  it('publishes deep-linked policy routes', () => {
    for (const path of ['/trust', '/privacy', '/terms', '/ai-policy', '/credentials-policy']) {
      expect(app).toContain(`path="${path}"`);
      expect(footer).toContain(`"${path}"`);
    }
  });

  it('states local-file privacy and the OCR boundary precisely', () => {
    expect(trust).toContain('تُقرأ وتُفهرس في المتصفح');
    expect(trust).toContain('لا يُرسل تلقائيًا إلى OCR خارجي');
    expect(trust).toContain('أقل من ثلاثة طلاب');
  });

  it('does not misrepresent a completion credential as accreditation', () => {
    expect(trust).toContain('ليس توقيع جهة اعتماد أكاديمية');
    expect(trust).toContain('لا يظهر شعار جهة اعتماد أو شريك قبل اتفاق موثق');
    expect(trust).toContain('Certificate of Completion issued by Fahim');
  });
});

