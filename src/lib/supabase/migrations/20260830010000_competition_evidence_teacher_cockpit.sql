-- Fahim competition evidence and teacher cockpit.
-- This migration creates operating infrastructure for real pilots. It never seeds,
-- estimates, or fabricates learner outcomes.

create table if not exists public.impact_pilots (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 160),
  concept_key text not null check (char_length(concept_key) between 2 and 160),
  outcome_statement text not null check (char_length(outcome_statement) between 12 and 500),
  primary_metric text not null default 'assessment_score' check (primary_metric in ('assessment_score','recall_score','transfer_score')),
  status text not null default 'draft' check (status in ('draft','recruiting','active','analysis','complete','archived')),
  minimum_sample_size smallint not null default 3 check (minimum_sample_size between 3 and 500),
  created_by uuid not null references auth.users(id) on delete restrict,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table if not exists public.impact_measurements (
  id uuid primary key default gen_random_uuid(),
  pilot_id uuid not null references public.impact_pilots(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  phase text not null check (phase in ('pre','post','delayed')),
  score numeric(8,2) not null check (score >= 0),
  max_score numeric(8,2) not null check (max_score > 0 and score <= max_score),
  evidence_note text not null check (char_length(evidence_note) between 5 and 500),
  assessed_at timestamptz not null default now(),
  recorded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pilot_id, student_id, phase)
);

create table if not exists public.class_join_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  attempted_at timestamptz not null default now()
);

create index if not exists impact_pilots_class_status_idx on public.impact_pilots(class_id, status, created_at desc);
create index if not exists impact_measurements_pilot_phase_idx on public.impact_measurements(pilot_id, phase, assessed_at desc);
create index if not exists class_join_attempts_user_time_idx on public.class_join_attempts(user_id, attempted_at desc);

alter table public.impact_pilots enable row level security;
alter table public.impact_measurements enable row level security;
alter table public.class_join_attempts enable row level security;

drop policy if exists impact_pilots_class_read on public.impact_pilots;
create policy impact_pilots_class_read on public.impact_pilots
  for select to authenticated using (
    exists (
      select 1 from public.classes class
      where class.id = impact_pilots.class_id
        and (
          public.is_org_member(class.organization_id, array['owner','admin','teacher'])
          or exists (select 1 from public.class_members member where member.class_id = class.id and member.user_id = auth.uid())
        )
    )
  );

drop policy if exists impact_pilots_teacher_manage on public.impact_pilots;
drop policy if exists impact_pilots_teacher_insert on public.impact_pilots;
create policy impact_pilots_teacher_insert on public.impact_pilots
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.classes class
      where class.id = impact_pilots.class_id
        and public.is_org_member(class.organization_id, array['owner','admin','teacher'])
    )
  );

drop policy if exists impact_pilots_teacher_update on public.impact_pilots;
create policy impact_pilots_teacher_update on public.impact_pilots
  for update to authenticated
  using (exists (
    select 1 from public.classes class
    where class.id = impact_pilots.class_id
      and public.is_org_member(class.organization_id, array['owner','admin','teacher'])
  ))
  with check (
    exists (
      select 1 from public.classes class
      where class.id = impact_pilots.class_id
        and public.is_org_member(class.organization_id, array['owner','admin','teacher'])
    )
  );

drop policy if exists impact_pilots_teacher_delete on public.impact_pilots;
create policy impact_pilots_teacher_delete on public.impact_pilots
  for delete to authenticated
  using (exists (
    select 1 from public.classes class
    where class.id = impact_pilots.class_id
      and public.is_org_member(class.organization_id, array['owner','admin','teacher'])
  ));

drop policy if exists impact_measurements_student_read on public.impact_measurements;
create policy impact_measurements_student_read on public.impact_measurements
  for select to authenticated using (
    student_id = auth.uid()
    or exists (
      select 1
      from public.impact_pilots pilot
      join public.classes class on class.id = pilot.class_id
      where pilot.id = impact_measurements.pilot_id
        and public.is_org_member(class.organization_id, array['owner','admin','teacher'])
    )
  );

drop policy if exists impact_measurements_teacher_manage on public.impact_measurements;
create policy impact_measurements_teacher_manage on public.impact_measurements
  for all to authenticated
  using (exists (
    select 1
    from public.impact_pilots pilot
    join public.classes class on class.id = pilot.class_id
    where pilot.id = impact_measurements.pilot_id
      and public.is_org_member(class.organization_id, array['owner','admin','teacher'])
  ))
  with check (
    recorded_by = auth.uid()
    and exists (
      select 1
      from public.impact_pilots pilot
      join public.classes class on class.id = pilot.class_id
      join public.class_members member on member.class_id = class.id and member.user_id = impact_measurements.student_id and member.role = 'student'
      where pilot.id = impact_measurements.pilot_id
        and public.is_org_member(class.organization_id, array['owner','admin','teacher'])
    )
  );

grant select, insert, update, delete on public.impact_pilots, public.impact_measurements to authenticated;
revoke all on public.class_join_attempts from public, anon, authenticated;

drop trigger if exists impact_pilots_set_updated_at on public.impact_pilots;
create trigger impact_pilots_set_updated_at before update on public.impact_pilots
for each row execute function public.set_updated_at();

drop trigger if exists impact_measurements_set_updated_at on public.impact_measurements;
create trigger impact_measurements_set_updated_at before update on public.impact_measurements
for each row execute function public.set_updated_at();

create or replace function public.create_organization_v1(p_name text, p_type text default 'school')
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  actor uuid := auth.uid();
  organization_id uuid;
  generated_slug text;
begin
  if actor is null then raise exception 'Authentication required.' using errcode = '42501'; end if;
  if char_length(trim(coalesce(p_name, ''))) not between 3 and 120 then raise exception 'Organization name must contain 3 to 120 characters.'; end if;
  if p_type not in ('school','university','academy','company','community') then raise exception 'Invalid organization type.'; end if;

  generated_slug := 'fahim-' || lower(encode(extensions.gen_random_bytes(8), 'hex'));
  insert into public.organizations (name, slug, type, created_by)
  values (trim(p_name), generated_slug, p_type, actor)
  returning id into organization_id;

  insert into public.organization_members (organization_id, user_id, role, status)
  values (organization_id, actor, 'owner', 'active');

  return organization_id;
end;
$$;

revoke all on function public.create_organization_v1(text, text) from public, anon;
grant execute on function public.create_organization_v1(text, text) to authenticated;

create or replace function public.create_class_v1(p_organization_id uuid, p_title text, p_subject text default null, p_academic_year text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  actor uuid := auth.uid();
  class_id uuid;
  join_code text;
begin
  if actor is null then raise exception 'Authentication required.' using errcode = '42501'; end if;
  if not public.is_org_member(p_organization_id, array['owner','admin','teacher']) then raise exception 'Teacher access required.' using errcode = '42501'; end if;
  if char_length(trim(coalesce(p_title, ''))) not between 3 and 120 then raise exception 'Class title must contain 3 to 120 characters.'; end if;

  join_code := upper(encode(extensions.gen_random_bytes(5), 'hex'));
  insert into public.classes (organization_id, title, subject, academic_year, join_code_hash, created_by, status)
  values (
    p_organization_id,
    trim(p_title),
    nullif(trim(coalesce(p_subject, '')), ''),
    nullif(trim(coalesce(p_academic_year, '')), ''),
    encode(extensions.digest(lower(join_code), 'sha256'), 'hex'),
    actor,
    'active'
  ) returning id into class_id;

  insert into public.class_members (class_id, user_id, role)
  values (class_id, actor, 'teacher')
  on conflict (class_id, user_id) do update set role = 'teacher';

  return jsonb_build_object('classId', class_id, 'joinCode', join_code);
end;
$$;

revoke all on function public.create_class_v1(uuid, text, text, text) from public, anon;
grant execute on function public.create_class_v1(uuid, text, text, text) to authenticated;

create or replace function public.join_class_v1(p_join_code text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  actor uuid := auth.uid();
  selected_class uuid;
begin
  if actor is null then raise exception 'Authentication required.' using errcode = '42501'; end if;
  if char_length(trim(coalesce(p_join_code, ''))) <> 10 then raise exception 'Invalid class code.'; end if;

  delete from public.class_join_attempts
  where user_id = actor and attempted_at < now() - interval '1 day';
  if (select count(*) from public.class_join_attempts where user_id = actor and attempted_at >= now() - interval '10 minutes') >= 5 then
    raise exception 'Too many class-code attempts. Try again in 10 minutes.' using errcode = 'P0001';
  end if;
  insert into public.class_join_attempts (user_id) values (actor);

  select class.id into selected_class
  from public.classes class
  where class.join_code_hash = encode(extensions.digest(lower(trim(p_join_code)), 'sha256'), 'hex')
    and class.status = 'active'
  limit 1;

  if selected_class is null then raise exception 'Class code was not found or is inactive.'; end if;
  insert into public.class_members (class_id, user_id, role)
  values (selected_class, actor, 'student')
  on conflict (class_id, user_id) do nothing;
  return selected_class;
end;
$$;

revoke all on function public.join_class_v1(text) from public, anon;
grant execute on function public.join_class_v1(text) to authenticated;

create or replace function public.my_teacher_cockpit_v1()
returns jsonb
language sql
stable
security definer
set search_path = public, auth
as $$
  select jsonb_build_object(
    'organizations', coalesce((
      select jsonb_agg(jsonb_build_object('id', organization.id, 'name', organization.name, 'type', organization.type) order by organization.created_at)
      from public.organizations organization
      where public.is_org_member(organization.id, array['owner','admin','teacher'])
    ), '[]'::jsonb),
    'classes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', class.id,
        'organizationId', class.organization_id,
        'title', class.title,
        'subject', class.subject,
        'academicYear', class.academic_year,
        'status', class.status,
        'memberCount', (select count(*) from public.class_members member where member.class_id = class.id and member.role = 'student'),
        'assignmentCount', (select count(*) from public.assignments assignment where assignment.class_id = class.id),
        'submissionCount', (select count(*) from public.submissions submission join public.assignments assignment on assignment.id = submission.assignment_id where assignment.class_id = class.id and submission.status in ('submitted','returned','graded')),
        'activeLearners30d', (select count(distinct event.user_id) from public.learning_events event join public.class_members member on member.user_id = event.user_id and member.class_id = class.id where event.occurred_at >= now() - interval '30 days'),
        'misconceptions', coalesce((
          select jsonb_agg(jsonb_build_object('conceptKey', signal.concept_key, 'category', signal.misconception_category, 'learnerCount', signal.learner_count, 'eventCount', signal.event_count) order by signal.event_count desc)
          from (
            select event.concept_key, event.misconception_category, count(distinct event.user_id) learner_count, count(*) event_count
            from public.learning_events event
            join public.class_members member on member.user_id = event.user_id and member.class_id = class.id
            where event.event_type = 'misconception_detected'
              and event.misconception_category is not null
              and event.occurred_at >= now() - interval '30 days'
            group by event.concept_key, event.misconception_category
            having count(distinct event.user_id) >= 3
          ) signal
        ), '[]'::jsonb)
      ) order by class.updated_at desc)
      from public.classes class
      where public.is_org_member(class.organization_id, array['owner','admin','teacher'])
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.my_teacher_cockpit_v1() from public, anon;
grant execute on function public.my_teacher_cockpit_v1() to authenticated;

create or replace function public.pilot_impact_summary_v1(p_pilot_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  selected_pilot public.impact_pilots%rowtype;
  result jsonb;
begin
  select pilot.* into selected_pilot
  from public.impact_pilots pilot
  join public.classes class on class.id = pilot.class_id
  where pilot.id = p_pilot_id
    and public.is_org_member(class.organization_id, array['owner','admin','teacher']);

  if selected_pilot.id is null then raise exception 'Teacher access required.' using errcode = '42501'; end if;

  with normalized as (
    select measurement.phase, measurement.student_id, round((measurement.score / measurement.max_score) * 100, 2) percentage
    from public.impact_measurements measurement
    where measurement.pilot_id = p_pilot_id
  ), phase_stats as (
    select phase, count(distinct student_id)::integer participant_count, round(avg(percentage), 2) average_score
    from normalized group by phase
  ), paired as (
    select pre.student_id, pre.percentage pre_score, post.percentage post_score, delayed.percentage delayed_score
    from normalized pre
    join normalized post on post.student_id = pre.student_id and post.phase = 'post'
    left join normalized delayed on delayed.student_id = pre.student_id and delayed.phase = 'delayed'
    where pre.phase = 'pre'
  )
  select jsonb_build_object(
    'pilotId', selected_pilot.id,
    'minimumSampleSize', selected_pilot.minimum_sample_size,
    'measurementCount', (select count(*) from normalized),
    'uniqueLearners', (select count(distinct student_id) from normalized),
    'phaseStats', coalesce((select jsonb_object_agg(phase, jsonb_build_object(
      'participantCount', participant_count,
      'averageScore', case when participant_count >= selected_pilot.minimum_sample_size then average_score else null end,
      'suppressed', participant_count < selected_pilot.minimum_sample_size
    )) from phase_stats), '{}'::jsonb),
    'pairedLearners', (select count(*) from paired),
    'averageChange', case when (select count(*) from paired) >= selected_pilot.minimum_sample_size then (select round(avg(post_score - pre_score), 2) from paired) else null end,
    'delayedRetention', case when (select count(delayed_score) from paired) >= selected_pilot.minimum_sample_size then (select round(avg(delayed_score), 2) from paired where delayed_score is not null) else null end,
    'isReportable', (select count(*) from paired) >= selected_pilot.minimum_sample_size,
    'disclaimer', 'Calculated only from recorded assessments. Suppressed below the configured sample threshold.'
  ) into result;

  return result;
end;
$$;

revoke all on function public.pilot_impact_summary_v1(uuid) from public, anon;
grant execute on function public.pilot_impact_summary_v1(uuid) to authenticated;

comment on table public.impact_pilots is 'Real pilot protocols. No seeded outcomes are permitted.';
comment on function public.pilot_impact_summary_v1 is 'Privacy-aware pilot outcome summary; averages are suppressed below the configured sample threshold.';

notify pgrst, 'reload schema';
