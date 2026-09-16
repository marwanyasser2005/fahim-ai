-- Fahim critical hardening.
--
-- Three problems this closes:
--   1. Badge refresh ran once per row on the hottest write path, multiplying aggregate
--      queries by the size of every synced learning-event batch.
--   2. Self-service columns on `profiles` (xp, level, streaks) were writable by any
--      learner, so gamification totals were forgeable.
--   3. The anonymous certificate verification endpoint returned the full evidence
--      snapshot, which includes the internal reviewer note and reviewer id.
--
-- Additive only: no table, column or row is dropped.

-- ---------------------------------------------------------------------------
-- 1. Cheaper badge refresh
-- ---------------------------------------------------------------------------

-- refresh_badges_for_user_v1 filters learning_events by (user_id, event_type); neither
-- existing index serves that predicate, so each of the event badges scanned and filtered.
create index if not exists learning_events_user_event_idx
  on public.learning_events(user_id, event_type);

-- Statement-level rewrite: one refresh per synced batch instead of one per row.
-- Transition tables cannot be combined with a column list, so the new trigger watches
-- all updates on the table. That is a superset of the previous `update of event_type`,
-- so no badge can be missed.
create or replace function public.award_badges_after_learning_events_v2()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  learner uuid;
begin
  for learner in select distinct user_id from inserted_events loop
    perform public.refresh_badges_for_user_v1(learner);
  end loop;
  return null;
end;
$$;

revoke all on function public.award_badges_after_learning_events_v2() from public, anon, authenticated;

drop trigger if exists award_badges_after_learning_event_v1 on public.learning_events;
drop function if exists public.award_badges_after_learning_event_v1();

create trigger award_badges_after_learning_event_v1
after insert or update on public.learning_events
referencing new table as inserted_events
for each statement execute function public.award_badges_after_learning_events_v2();

create or replace function public.award_badges_after_progress_v2()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  learner uuid;
begin
  for learner in select distinct user_id from changed_progress loop
    perform public.refresh_badges_for_user_v1(learner);
  end loop;
  return null;
end;
$$;

revoke all on function public.award_badges_after_progress_v2() from public, anon, authenticated;

drop trigger if exists award_badges_after_progress_v1 on public.progress;
drop function if exists public.award_badges_after_progress_v1();

create trigger award_badges_after_progress_v1
after insert or update on public.progress
referencing new table as changed_progress
for each statement execute function public.award_badges_after_progress_v2();

-- ---------------------------------------------------------------------------
-- 2. Profiles: keep row-level read, restrict writes to presentation columns
-- ---------------------------------------------------------------------------

-- xp, level, current_streak, longest_streak and last_learning_date are learning
-- outcomes. RLS is row-level, so without a column grant any learner could write them.
revoke update on public.profiles from authenticated;
grant update (full_name, avatar_url, banner_url, bio, locale, timezone, daily_goal_minutes, is_public)
  on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Assignments: the author of an assignment is the caller
-- ---------------------------------------------------------------------------

drop policy if exists "assignments_teacher_write" on public.assignments;
create policy "assignments_teacher_write" on public.assignments
  for all to authenticated
  using (exists (
    select 1 from public.classes c
    where c.id = assignments.class_id
      and public.is_org_member(c.organization_id, array['owner','admin','teacher'])
  ))
  with check (
    exists (
      select 1 from public.classes c
      where c.id = assignments.class_id
        and public.is_org_member(c.organization_id, array['owner','admin','teacher'])
    )
    and assignments.created_by = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- 4. Certificate verification: a public projection for anonymous callers
-- ---------------------------------------------------------------------------

-- v2 returned learner name plus the raw evidence snapshot. For credentials issued
-- through the admin API that snapshot carries `reviewNote` and `reviewedBy`, so internal
-- reviewer notes were published to anyone holding a certificate number. v3 rebuilds the
-- evidence object from an explicit allowlist of displayable credential facts.
create or replace function public.verify_certificate_v3(certificate_identifier text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', c.id,
    'certificate_number', c.certificate_number,
    'credential_type', c.credential_type,
    'issuer_name', c.issuer_name,
    'issuer_title', coalesce(c.metadata ->> 'issuerTitle', 'Founder of Fahim AI'),
    'issued_at', c.issued_at,
    'course_title', coalesce(crs.title, ''),
    'learner_name', p.full_name,
    'status', case when c.revoked_at is not null or c.status = 'revoked' then 'revoked' else c.status end,
    'evidence', jsonb_strip_nulls(jsonb_build_object(
      'completionPercent', nullif(c.evidence_snapshot ->> 'completionPercent', '')::numeric,
      'completedLessons', nullif(c.evidence_snapshot ->> 'completedLessons', '')::numeric,
      'totalLessons', nullif(c.evidence_snapshot ->> 'totalLessons', '')::numeric,
      'finalAssessmentScore', nullif(c.evidence_snapshot ->> 'finalAssessmentScore', '')::numeric,
      'achievementTier', c.evidence_snapshot ->> 'achievementTier',
      'policy', c.evidence_snapshot ->> 'policy'
    )),
    'registrar_fingerprint', c.signature,
    'fingerprint_algorithm', c.signature_algorithm,
    'verification_path', '/verify/' || c.certificate_number,
    'non_accredited', coalesce((c.metadata ->> 'nonAccredited')::boolean, true)
  )
  from public.certificates c
  join public.profiles p on p.id = c.user_id
  left join public.courses crs on crs.id = c.course_id
  where (lower(c.certificate_number) = lower(trim(certificate_identifier)) or c.id::text = trim(certificate_identifier))
    and c.status in ('issued', 'revoked');
$$;

revoke all on function public.verify_certificate_v3(text) from public;
grant execute on function public.verify_certificate_v3(text) to anon, authenticated;

-- The full-snapshot variants stay available to signed-in operators only. v1 is kept
-- (not dropped) so no deployed client breaks; it is simply no longer anonymous.
revoke all on function public.verify_certificate_v2(text) from public, anon;
grant execute on function public.verify_certificate_v2(text) to authenticated;
revoke all on function public.verify_certificate_v1(uuid) from public, anon;
grant execute on function public.verify_certificate_v1(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Certificate revocation (previously documented but unimplemented)
-- ---------------------------------------------------------------------------

create or replace function public.revoke_certificate_v1(target_certificate uuid, reason text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  updated public.certificates;
begin
  if not public.has_role('admin') then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  if char_length(coalesce(trim(reason), '')) < 8 then
    raise exception 'reason_too_short' using errcode = '22023';
  end if;

  update public.certificates
     set status = 'revoked',
         revoked_at = now(),
         metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
           'revocationReason', trim(reason),
           'revokedBy', auth.uid(),
           'revokedAt', now()
         )
   where id = target_certificate
     and status = 'issued'
  returning * into updated;

  if updated.id is null then
    return jsonb_build_object('revoked', false);
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(), 'certificate.revoked', 'certificate', updated.id::text,
    jsonb_build_object('reason', trim(reason), 'certificateNumber', updated.certificate_number)
  );

  return jsonb_build_object('revoked', true, 'certificateNumber', updated.certificate_number);
end;
$$;

revoke all on function public.revoke_certificate_v1(uuid, text) from public, anon;
grant execute on function public.revoke_certificate_v1(uuid, text) to authenticated;

notify pgrst, 'reload schema';
