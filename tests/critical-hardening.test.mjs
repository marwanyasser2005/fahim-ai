import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (name) => readFileSync(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8');

const hardening = read('20260915000000_critical_hardening.sql');
const completion = read('20260915010000_course_completion_v1.sql');
const signing = read('20260915020000_credential_signing_v1.sql');
const catalog = readFileSync(new URL('../src/data/courseCatalog.ts', import.meta.url), 'utf8');
const rlsPolicySource = read('20250918005222_dusty_recipe.sql');

describe('critical hardening migration', () => {
  it('indexes the predicate the badge refresh actually filters on', () => {
    expect(hardening).toContain('learning_events_user_event_idx');
    expect(hardening).toContain('on public.learning_events(user_id, event_type)');
  });

  it('refreshes badges once per statement instead of once per row', () => {
    expect(hardening).toContain('for each statement execute function public.award_badges_after_learning_events_v2');
    expect(hardening).toContain('for each statement execute function public.award_badges_after_progress_v2');
    expect(hardening).not.toContain('for each row execute function public.award_badges_after_learning_events_v2');
  });

  it('stops learners writing their own xp and streak columns', () => {
    expect(hardening).toContain('revoke update on public.profiles from authenticated');
    expect(hardening).toContain('grant update (full_name, avatar_url, banner_url, bio, locale, timezone, daily_goal_minutes, is_public)');
  });

  it('forces the assignment author to be the caller', () => {
    expect(hardening).toContain('assignments.created_by = auth.uid()');
  });
});

describe('course completion migration', () => {
  it('never seeds into a project that already has course content', () => {
    expect(completion).toContain('perform 1 from public.courses limit 1');
    expect(completion).toContain('skipping the verified-course seed');
  });

  it('grades submissions inside the database rather than trusting the client', () => {
    expect(completion).toContain('submit_course_assessment_v1');
    expect(completion).toContain("(row_data.answer_key ->> 'correctIndex')::integer");
    expect(completion).toContain("insert into public.quiz_results");
  });

  it('keeps the answer key out of the client-facing question projection', () => {
    const projection = completion.slice(
      completion.indexOf('function public.course_assessment_v1'),
      completion.indexOf('function public.submit_course_assessment_v1'),
    );
    expect(projection).not.toContain('answer_key');
    expect(projection).toContain("'choices', qq.choices");
  });

  it('validates submission shape before casting', () => {
    expect(completion).toContain('invalid_response_shape');
  });

  it('seeds every lesson id the catalog links to', () => {
    const seeded = new Set([...completion.matchAll(/'(f1000000-0000-4000-8000-00000000\d{4})'/g)].map((match) => match[1]));
    const referenced = [...catalog.matchAll(/'(f1000000-0000-4000-8000-00000000\d{4})'/g)].map((match) => match[1]);
    expect(referenced.length).toBeGreaterThan(0);
    for (const id of referenced) expect(seeded.has(id)).toBe(true);
  });
});

describe('credential signing migration', () => {
  it('keeps the signing key inside the database, unreachable by clients', () => {
    expect(signing).toContain('create table if not exists public.credential_signing_keys');
    expect(signing).toContain('encode(gen_random_bytes(48)');
    expect(signing).toContain('revoke all on public.credential_signing_keys from public, anon, authenticated');
  });

  it('signs with HMAC instead of a keyless digest', () => {
    expect(signing).toContain("encode(hmac(payload, public.credential_signing_secret_v1(), 'sha256'), 'hex')");
  });

  it('signs every issuance path, including the admin one', () => {
    expect(signing).toContain('before insert or update');
    expect(signing).toContain('on public.certificates');
  });

  it('recomputes the signature at verification time', () => {
    expect(signing).toContain("'signature_valid'");
    expect(signing).toContain('public.credential_signature_v1(m.signing_payload)');
  });
});

describe('row level security policy trust root', () => {
  // Mirrors scripts/security-check.mjs: only policy bodies matter, so an explanatory
  // comment naming the old column is not treated as a violation.
  const policyBodies = rlsPolicySource
    .split(/create\s+policy/i)
    .slice(1)
    .map((block) => block.split(';')[0])
    .join('\n');

  it('never authorises from client-writable user_metadata', () => {
    expect(policyBodies).not.toMatch(/user_metadata/);
    expect(policyBodies).toContain("(auth.jwt() -> 'app_metadata' ->> 'role')");
    expect(policyBodies).toContain("r.key = 'admin'");
  });
});
