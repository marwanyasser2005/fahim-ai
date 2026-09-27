-- FAHIM 2026 (Agents at Work): SME business-impact layer.
-- Reframes the Fahim tutor agent as an "AI teaching assistant" employed by an educational SME
-- (a tutoring centre). This layer turns REAL agent activity for a centre's learners into a
-- transparent, assumption-driven projection of hours saved, cost saved, and revenue enabled.
-- Nothing here is a measured outcome: it is (real activity counts) x (editable centre assumptions),
-- and the RPC returns both so the UI can show every number's formula.

create table if not exists public.sme_impact_assumptions (
  org_id uuid primary key references public.organizations(id) on delete cascade,
  teacher_hourly_cost numeric(10,2) not null default 75 check (teacher_hourly_cost >= 0),
  minutes_per_diagnosis numeric(6,2) not null default 8 check (minutes_per_diagnosis >= 0),
  minutes_per_grading numeric(6,2) not null default 5 check (minutes_per_grading >= 0),
  minutes_per_followup numeric(6,2) not null default 6 check (minutes_per_followup >= 0),
  revenue_per_student numeric(10,2) not null default 400 check (revenue_per_student >= 0),
  hours_per_extra_student numeric(6,2) not null default 6 check (hours_per_extra_student > 0),
  currency text not null default 'EGP',
  updated_at timestamptz not null default now()
);

alter table public.sme_impact_assumptions enable row level security;

drop policy if exists sme_impact_assumptions_member on public.sme_impact_assumptions;
create policy sme_impact_assumptions_member on public.sme_impact_assumptions
  for all to authenticated
  using (public.is_org_member(org_id, array['owner','admin','teacher']))
  with check (public.is_org_member(org_id, array['owner','admin','teacher']));

revoke all on public.sme_impact_assumptions from anon;
grant select, insert, update, delete on public.sme_impact_assumptions to authenticated;

drop trigger if exists sme_impact_assumptions_set_updated_at on public.sme_impact_assumptions;
create trigger sme_impact_assumptions_set_updated_at before update on public.sme_impact_assumptions
for each row execute function public.set_updated_at();

comment on table public.sme_impact_assumptions is 'Editable per-centre cost/revenue assumptions for the SME agent business-impact projection.';

-- SME_IMPACT_RPC_PLACEHOLDER
create or replace function public.sme_impact_summary_v1(p_org_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  a public.sme_impact_assumptions%rowtype;
  agent_actions bigint;
  assessments bigint;
  reviews bigint;
  active_learners bigint;
  hours_saved numeric;
  cost_saved numeric;
  extra_students integer;
  revenue_enabled numeric;
begin
  if not public.is_org_member(p_org_id, array['owner','admin','teacher']) then
    raise exception 'Not authorized for this organization.';
  end if;

  select * into a from public.sme_impact_assumptions where org_id = p_org_id;
  if not found then
    a.teacher_hourly_cost := 75; a.minutes_per_diagnosis := 8; a.minutes_per_grading := 5;
    a.minutes_per_followup := 6; a.revenue_per_student := 400; a.hours_per_extra_student := 6; a.currency := 'EGP';
  end if;

  -- Real activity for learners enrolled in this centre's classes.
  with learners as (
    select distinct m.user_id
    from public.class_members m
    join public.classes c on c.id = m.class_id
    where c.organization_id = p_org_id and m.role = 'student'
  )
  select
    (select count(*) from public.ai_generations g where g.task_type = 'agent' and g.user_id in (select user_id from learners)),
    (select coalesce(sum(cm.attempts), 0) from public.concept_mastery cm where cm.user_id in (select user_id from learners)),
    (select count(*) from public.review_items r where r.user_id in (select user_id from learners)),
    (select count(*) from learners)
  into agent_actions, assessments, reviews, active_learners;

  hours_saved := (agent_actions * a.minutes_per_diagnosis + assessments * a.minutes_per_grading + reviews * a.minutes_per_followup) / 60.0;
  cost_saved := hours_saved * a.teacher_hourly_cost;
  extra_students := floor(hours_saved / a.hours_per_extra_student);
  revenue_enabled := extra_students * a.revenue_per_student;

  return jsonb_build_object(
    'currency', a.currency,
    'activity', jsonb_build_object('agentSessions', agent_actions, 'assessmentsGraded', assessments, 'reviewsScheduled', reviews, 'activeLearners', active_learners),
    'assumptions', jsonb_build_object('teacherHourlyCost', a.teacher_hourly_cost, 'minutesPerDiagnosis', a.minutes_per_diagnosis, 'minutesPerGrading', a.minutes_per_grading, 'minutesPerFollowup', a.minutes_per_followup, 'revenuePerStudent', a.revenue_per_student, 'hoursPerExtraStudent', a.hours_per_extra_student),
    'projection', jsonb_build_object('hoursSaved', round(hours_saved, 1), 'costSaved', round(cost_saved, 0), 'extraStudentCapacity', extra_students, 'revenueEnabled', round(revenue_enabled, 0)),
    'disclaimer', 'Projection = real agent activity x editable centre assumptions. Not a measured financial outcome.'
  );
end;
$$;

revoke all on function public.sme_impact_summary_v1(uuid) from public, anon;
grant execute on function public.sme_impact_summary_v1(uuid) to authenticated;

comment on function public.sme_impact_summary_v1 is 'Transparent SME impact projection: real agent activity counts multiplied by editable centre assumptions.';

