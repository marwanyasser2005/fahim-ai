-- FAHIM Hackathon 2026: canonical event spine for the verified learning loop.
-- Existing evidence, misconception and review tables remain authoritative artifacts.
-- These two tables preserve the ordered causal trail that connects them.

create table if not exists public.learning_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  concept_key text not null check (char_length(concept_key) between 2 and 160),
  concept_ar text not null check (char_length(concept_ar) between 1 and 240),
  concept_en text not null check (char_length(concept_en) between 1 and 240),
  source_title text,
  source_location text,
  source_version text,
  evidence_classification text not null default 'NEEDS_REVIEW' check (evidence_classification in ('VERIFIED_SOURCE','INFERRED','TEACHING_EXPLANATION','GENERAL_KNOWLEDGE','NEEDS_REVIEW')),
  mastery_dimensions jsonb not null default '{"concept":0,"explanation":0,"application":0,"recall":0,"sourceUse":0}'::jsonb,
  status text not null default 'active' check (status in ('active','evidence_ready','review_due','retained')),
  review_due_at timestamptz,
  client_updated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists learning_sessions_owner_updated_idx on public.learning_sessions(user_id, client_updated_at desc);
create index if not exists learning_sessions_review_due_idx on public.learning_sessions(user_id, review_due_at) where review_due_at is not null;

create table if not exists public.learning_events (
  id uuid primary key,
  session_id uuid not null references public.learning_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  sequence integer not null check (sequence between 1 and 1000),
  event_type text not null check (event_type in ('diagnostic_started','attempt_submitted','misconception_detected','intervention_completed','retry_submitted','evidence_created','review_scheduled','review_recalled','transfer_applied')),
  concept_key text not null check (char_length(concept_key) between 2 and 160),
  title text not null check (char_length(title) between 1 and 240),
  summary text not null check (char_length(summary) between 1 and 2000),
  misconception_category text check (misconception_category is null or misconception_category in ('concept_confusion','formula_without_meaning','unit_reasoning','causal_reversal','procedure_gap','language_bridge')),
  confidence numeric(4,3) check (confidence is null or confidence between 0 and 1),
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (session_id, sequence)
);

create index if not exists learning_events_owner_time_idx on public.learning_events(user_id, occurred_at desc);
create index if not exists learning_events_concept_type_idx on public.learning_events(concept_key, event_type, occurred_at desc);

alter table public.learning_sessions enable row level security;
alter table public.learning_events enable row level security;

drop policy if exists learning_sessions_owner_all on public.learning_sessions;
create policy learning_sessions_owner_all on public.learning_sessions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists learning_events_owner_all on public.learning_events;
create policy learning_events_owner_all on public.learning_events
  for all to authenticated
  using (user_id = auth.uid() and exists (
    select 1 from public.learning_sessions session
    where session.id = learning_events.session_id and session.user_id = auth.uid()
  ))
  with check (user_id = auth.uid() and exists (
    select 1 from public.learning_sessions session
    where session.id = learning_events.session_id and session.user_id = auth.uid()
  ));

revoke all on public.learning_sessions, public.learning_events from anon;
grant select, insert, update, delete on public.learning_sessions, public.learning_events to authenticated;

drop trigger if exists learning_sessions_set_updated_at on public.learning_sessions;
create trigger learning_sessions_set_updated_at before update on public.learning_sessions
for each row execute function public.set_updated_at();

-- Teachers receive only aggregate misconception signals for members of a class.
-- Attempts, prompts and private conversation content never leave the learner boundary.
create or replace function public.class_misconception_summary_v1(p_class_id uuid, p_since timestamptz default now() - interval '30 days')
returns table(concept_key text, misconception_category text, learner_count bigint, event_count bigint)
language sql
stable
security definer
set search_path = public, auth
as $$
  select event.concept_key, event.misconception_category, count(distinct event.user_id), count(*)
  from public.learning_events event
  join public.class_members member on member.user_id = event.user_id and member.class_id = p_class_id
  join public.classes cls on cls.id = p_class_id
  where event.event_type = 'misconception_detected'
    and event.occurred_at >= p_since
    and event.misconception_category is not null
    and public.is_org_member(cls.organization_id, array['owner','admin','teacher'])
  group by event.concept_key, event.misconception_category
  having count(distinct event.user_id) >= 3
  order by count(*) desc;
$$;

revoke all on function public.class_misconception_summary_v1(uuid, timestamptz) from public, anon;
grant execute on function public.class_misconception_summary_v1(uuid, timestamptz) to authenticated;

comment on function public.class_misconception_summary_v1 is 'Privacy-preserving class signal: aggregate only and suppressed below three learners.';

alter table public.ai_generations drop constraint if exists ai_generations_task_type_check;
alter table public.ai_generations add constraint ai_generations_task_type_check
  check (task_type in ('explain','quiz','flashcards','plan','summary','project','teach','recall'));
