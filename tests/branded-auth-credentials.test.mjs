import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('branded authentication and verifiable credentials', () => {
  it('ships branded confirmation, recovery, magic-link, and security templates', () => {
    const confirmation = read('supabase/templates/confirmation.html');
    const recovery = read('supabase/templates/recovery.html');
    const magic = read('supabase/templates/magic_link.html');
    const changed = read('supabase/templates/password_changed.html');
    expect(confirmation).toContain('Fahim AI');
    expect(confirmation).toContain('{{ .ConfirmationURL }}');
    expect(recovery).toContain('token_hash={{ .TokenHash }}&type=recovery');
    expect(recovery).toContain('10');
    expect(magic).toContain('{{ .ConfirmationURL }}');
    expect(changed).toContain('تم تغيير كلمة المرور');
  });

  it('enforces the ten-minute product recovery window on the server', () => {
    const migration = read('src/lib/supabase/migrations/20260827010000_branded_auth_and_auto_credentials.sql');
    const endpoint = read('api/auth-recovery.mjs');
    expect(migration).toContain("interval '10 minutes'");
    expect(migration).toContain('auth.users');
    expect(endpoint).toContain("recovery_window_for_user_v1");
    expect(endpoint).toContain('admin.auth.admin.updateUserById');
  });

  it('issues completion credentials only from real completion and assessment evidence', () => {
    const migration = read('src/lib/supabase/migrations/20260827010000_branded_auth_and_auto_credentials.sql');
    expect(migration).toContain('issue_my_completion_certificate_v2');
    expect(migration).toContain('completed_lessons <> total_lessons');
    expect(migration).toContain('final_score < 70');
    expect(migration).toContain('extensions.gen_random_bytes');
    expect(migration).toContain('verify_certificate_v2');
  });

  it('prints the founder signature, public registry link, and non-accreditation disclosure', () => {
    const artwork = read('src/components/certificates/CertificateArtwork.tsx');
    expect(artwork).toContain('Marwan Abdelghaffar');
    expect(artwork).toContain('Founder of Fahim AI');
    expect(artwork).toContain('QRCode.toDataURL');
    expect(artwork).toContain('not academic or government accreditation');
  });

  it('attaches evidence-based achievement levels without claiming accreditation', () => {
    const migration = read('src/lib/supabase/migrations/20260829000000_credential_achievement_levels.sql');
    const center = read('src/pages/CertificateCenter.tsx');
    expect(migration).toContain("when coalesce(score, 0) >= 90 then 'mastery'");
    expect(migration).toContain("'levelIsAccreditation', false");
    expect(center).toContain('credentialLevelFromScore');
    expect(center).toContain('المستوى لا يُشترى');
  });
});
