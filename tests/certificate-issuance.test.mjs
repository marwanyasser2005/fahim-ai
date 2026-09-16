import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const api = readFileSync(new URL('../api/certificates.mjs', import.meta.url), 'utf8');
const admin = readFileSync(new URL('../src/pages/Admin.tsx', import.meta.url), 'utf8');
const verify = readFileSync(new URL('../src/pages/CertificateVerify.tsx', import.meta.url), 'utf8');
const hardening = readFileSync(new URL('../supabase/migrations/20260915000000_critical_hardening.sql', import.meta.url), 'utf8');
const verificationFunction = hardening.slice(hardening.indexOf('function public.verify_certificate_v3'));

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
    expect(verify).toContain('verify_certificate_v3');
    expect(verify).toContain('CertificateArtwork');
  });

  it('keeps internal reviewer notes out of the anonymous verification payload', () => {
    // v2 returned the whole evidence snapshot, which carries reviewNote/reviewedBy for
    // admin-issued credentials. v3 rebuilds it from an explicit allowlist.
    expect(verificationFunction).toContain("'completionPercent'");
    expect(verificationFunction).not.toContain('evidence_snapshot,\n');
    expect(verificationFunction).toContain('revoke all on function public.verify_certificate_v2(text) from public, anon');
  });

  it('allows an administrator to revoke an issued credential', () => {
    expect(hardening).toContain('function public.revoke_certificate_v1(target_certificate uuid, reason text)');
    expect(hardening).toContain("if not public.has_role('admin')");
    expect(hardening).toContain("set status = 'revoked'");
    expect(hardening).toContain("action,");
  });
});
