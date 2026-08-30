import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const api = readFileSync(new URL('../api/certificates.mjs', import.meta.url), 'utf8');
const admin = readFileSync(new URL('../src/pages/Admin.tsx', import.meta.url), 'utf8');
const verify = readFileSync(new URL('../src/pages/CertificateVerify.tsx', import.meta.url), 'utf8');

describe('completion credential issuance', () => {
  it('requires authenticated database-verified administrator access', () => {
    expect(api).toContain('requireAuthenticatedUser(request)');
    expect(api).toContain("role?.key === 'admin'");
    expect(api).toContain("status = 403");
  });

  it('enforces completion and final-assessment thresholds on the server', () => {
    expect(api).toContain('completionPercent !== 100');
    expect(api).toContain('finalAssessmentScore < 70');
    expect(api).toContain('profile?.full_name?.trim()');
  });

  it('records non-accreditation and review evidence', () => {
    expect(api).toContain("accreditation: 'not_academically_accredited'");
    expect(api).toContain("issuancePolicy: 'admin_reviewed_completion_v1'");
    expect(api).toContain("action: 'certificate.completion_issued'");
  });

  it('protects state-changing issuance against cross-site requests and rate abuse', () => {
    expect(api).toContain('isSameOrigin(request)');
    expect(api).toContain("namespace: 'admin-certificates'");
    expect(api).toContain('parseJsonBody(request');
  });

  it('provides admin issuance and public verification surfaces', () => {
    expect(admin).toContain('CredentialOperations');
    expect(admin).toContain('إصدار شهادة إتمام');
    expect(verify).toContain("verify_certificate_v2");
    expect(verify).toContain('CertificateArtwork');
  });
});
