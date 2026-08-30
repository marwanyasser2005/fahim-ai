-- Deterministic achievement levels for completion credentials.
-- These are Fahim product levels, not academic or government accreditation.

create or replace function public.credential_achievement_tier_v1(score numeric)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when coalesce(score, 0) >= 90 then 'mastery'
    when coalesce(score, 0) >= 80 then 'proficiency'
    else 'completion'
  end;
$$;

revoke all on function public.credential_achievement_tier_v1(numeric) from public, anon, authenticated;
grant execute on function public.credential_achievement_tier_v1(numeric) to service_role;

create or replace function public.attach_credential_achievement_tier_v1()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  assessment_score numeric;
begin
  if new.credential_type = 'completion' then
    assessment_score := nullif(new.evidence_snapshot ->> 'finalAssessmentScore', '')::numeric;
    new.evidence_snapshot := coalesce(new.evidence_snapshot, '{}'::jsonb) || jsonb_build_object(
      'achievementTier', public.credential_achievement_tier_v1(assessment_score),
      'tierPolicy', 'fahim_completion_tiers_v1'
    );
    new.metadata := coalesce(new.metadata, '{}'::jsonb) || jsonb_build_object(
      'credentialLevel', public.credential_achievement_tier_v1(assessment_score),
      'levelIsAccreditation', false
    );
  end if;
  return new;
end;
$$;

drop trigger if exists attach_credential_achievement_tier_v1 on public.certificates;
create trigger attach_credential_achievement_tier_v1
before insert or update of evidence_snapshot, credential_type
on public.certificates
for each row execute function public.attach_credential_achievement_tier_v1();

update public.certificates
set evidence_snapshot = evidence_snapshot
where credential_type = 'completion';
