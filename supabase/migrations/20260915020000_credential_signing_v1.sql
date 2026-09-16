-- Fahim credential signing.
--
-- The previous "signature" was `sha256(learner || course || number || score)` with no key.
-- It is a deterministic fingerprint of public-ish inputs, not a signature: anyone can
-- recompute it, `verify_certificate_v2` merely echoed the stored value without checking it,
-- and the admin issuance path wrote no signature at all. Calling that "verifiable" would
-- not survive a technical review.
--
-- This migration makes the credential genuinely verifiable:
--   1. a signing key generated inside the database, readable only by the owner/service role,
--   2. a BEFORE INSERT/UPDATE trigger that signs every credential, including admin-issued
--      ones, so no issuance path can produce an unsigned record,
--   3. recomputation at verification time, so the public endpoint reports whether the
--      signature actually matches the row.
--
-- The key never appears in the repository. Rotating it invalidates every existing
-- signature, which is why rotation is a deliberate manual operation, not an automatic one.

-- ---------------------------------------------------------------------------
-- 1. Signing key, held inside the database
-- ---------------------------------------------------------------------------

create table if not exists public.credential_signing_keys (
  id uuid primary key default gen_random_uuid(),
  secret text not null check (char_length(secret) >= 32),
  created_at timestamptz not null default now(),
  retired_at timestamptz
);

alter table public.credential_signing_keys enable row level security;
-- No policies by design: the table is reachable only by the owner and service role.
revoke all on public.credential_signing_keys from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from public.credential_signing_keys where retired_at is null) then
    insert into public.credential_signing_keys (secret) values (encode(gen_random_bytes(48), 'hex'));
  end if;
end;
$$;

create or replace function public.credential_signing_secret_v1()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select secret from public.credential_signing_keys where retired_at is null order by created_at desc limit 1;
$$;

revoke all on function public.credential_signing_secret_v1() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Canonical signing payload and signature
-- ---------------------------------------------------------------------------

create or replace function public.credential_signature_payload_v1(
  target_certificate_number text,
  target_user uuid,
  target_course uuid,
  target_credential_type text,
  target_score numeric,
  target_tier text
)
returns text
language sql
immutable
as $$
  select concat_ws('|',
    'fahim-credential-v2',
    coalesce(target_certificate_number, ''),
    coalesce(target_user::text, ''),
    coalesce(target_course::text, ''),
    coalesce(target_credential_type, ''),
    coalesce(round(target_score, 2)::text, ''),
    coalesce(target_tier, '')
  );
$$;

revoke all on function public.credential_signature_payload_v1(text, uuid, uuid, text, numeric, text) from public, anon, authenticated;

create or replace function public.credential_signature_v1(payload text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select encode(hmac(payload, public.credential_signing_secret_v1(), 'sha256'), 'hex');
$$;

revoke all on function public.credential_signature_v1(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Sign every credential on write, from any issuance path
-- ---------------------------------------------------------------------------

create or replace function public.attach_credential_signature_v1()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  payload text;
begin
  payload := public.credential_signature_payload_v1(
    new.certificate_number,
    new.user_id,
    new.course_id,
    new.credential_type,
    nullif(new.evidence_snapshot ->> 'finalAssessmentScore', '')::numeric,
    new.evidence_snapshot ->> 'achievementTier'
  );
  new.signature := public.credential_signature_v1(payload);
  new.signature_algorithm := 'HMAC-SHA256';
  return new;
end;
$$;

revoke all on function public.attach_credential_signature_v1() from public, anon, authenticated;

drop trigger if exists attach_credential_signature_v1 on public.certificates;
create trigger attach_credential_signature_v1
before insert or update
on public.certificates
for each row execute function public.attach_credential_signature_v1();

-- Backfill: re-sign every existing row, including admin-issued ones that had no signature.
update public.certificates set signature = signature where signature is null or signature_algorithm is distinct from 'HMAC-SHA256';

-- ---------------------------------------------------------------------------
-- 4. Verification recomputes instead of echoing
-- ---------------------------------------------------------------------------

create or replace function public.verify_certificate_v3(certificate_identifier text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with matched as (
    select
      c.*,
      coalesce(crs.title, '') as resolved_course_title,
      p.full_name as resolved_learner_name,
      public.credential_signature_payload_v1(
        c.certificate_number,
        c.user_id,
        c.course_id,
        c.credential_type,
        nullif(c.evidence_snapshot ->> 'finalAssessmentScore', '')::numeric,
        c.evidence_snapshot ->> 'achievementTier'
      ) as signing_payload
    from public.certificates c
    join public.profiles p on p.id = c.user_id
    left join public.courses crs on crs.id = c.course_id
    where (lower(c.certificate_number) = lower(trim(certificate_identifier)) or c.id::text = trim(certificate_identifier))
      and c.status in ('issued', 'revoked')
  )
  select jsonb_build_object(
    'id', m.id,
    'certificate_number', m.certificate_number,
    'credential_type', m.credential_type,
    'issuer_name', m.issuer_name,
    'issuer_title', coalesce(m.metadata ->> 'issuerTitle', 'Founder of Fahim AI'),
    'issued_at', m.issued_at,
    'course_title', m.resolved_course_title,
    'learner_name', m.resolved_learner_name,
    'status', case when m.revoked_at is not null or m.status = 'revoked' then 'revoked' else m.status end,
    'evidence', jsonb_strip_nulls(jsonb_build_object(
      'completionPercent', nullif(m.evidence_snapshot ->> 'completionPercent', '')::numeric,
      'completedLessons', nullif(m.evidence_snapshot ->> 'completedLessons', '')::numeric,
      'totalLessons', nullif(m.evidence_snapshot ->> 'totalLessons', '')::numeric,
      'finalAssessmentScore', nullif(m.evidence_snapshot ->> 'finalAssessmentScore', '')::numeric,
      'achievementTier', m.evidence_snapshot ->> 'achievementTier',
      'policy', m.evidence_snapshot ->> 'policy'
    )),
    'registrar_fingerprint', m.signature,
    'fingerprint_algorithm', m.signature_algorithm,
    'signature_valid', m.signature is not null
      and m.signature_algorithm = 'HMAC-SHA256'
      and m.signature = public.credential_signature_v1(m.signing_payload),
    'verification_path', '/verify/' || m.certificate_number,
    'non_accredited', coalesce((m.metadata ->> 'nonAccredited')::boolean, true)
  )
  from matched m;
$$;

revoke all on function public.verify_certificate_v3(text) from public;
grant execute on function public.verify_certificate_v3(text) to anon, authenticated;

notify pgrst, 'reload schema';
