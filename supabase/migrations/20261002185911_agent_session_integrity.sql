-- FAHIM 2026: server-authoritative Agent Studio sessions.
--
-- A pending diagnostic contains security-sensitive state and the learning controller's
-- progress.  It must never be accepted back from a browser as authoritative JSON.  The
-- service-role agent writes this private table; browser roles have no table grants.  RLS is
-- still enabled as defence in depth and for safe dashboard/editor inspection.

create table if not exists public.agent_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  concept_key text not null check (char_length(concept_key) between 1 and 160),
  goal text not null check (char_length(goal) between 3 and 400),
  subject text,
  grade text,
  language text not null default 'ar' check (language in ('ar', 'en')),
  status text not null default 'active' check (status in ('active', 'awaiting', 'completed', 'abandoned')),
  stage text not null default 'discover' check (stage in ('discover', 'diagnose', 'teach', 'prove', 'remember', 'complete')),
  state jsonb not null default '{}'::jsonb,
  mastery numeric(5,4) not null default 0.2 check (mastery between 0 and 1),
  turn_count integer not null default 0 check (turn_count >= 0),
  last_generation_id uuid references public.ai_generations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists agent_sessions_owner_updated_idx
  on public.agent_sessions(user_id, updated_at desc);
create index if not exists agent_sessions_owner_active_idx
  on public.agent_sessions(user_id, concept_key)
  where status in ('active', 'awaiting');

alter table public.agent_sessions enable row level security;

drop policy if exists agent_sessions_owner_select on public.agent_sessions;
create policy agent_sessions_owner_select on public.agent_sessions
  for select to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists agent_sessions_owner_update on public.agent_sessions;
create policy agent_sessions_owner_update on public.agent_sessions
  for update to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()))
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

-- The browser does not need the opaque state (which can include an encrypted answer token).
-- All reads/writes are performed by the authenticated server endpoint through service_role.
revoke all on public.agent_sessions from anon, authenticated;

drop trigger if exists agent_sessions_set_updated_at on public.agent_sessions;
create trigger agent_sessions_set_updated_at before update on public.agent_sessions
for each row execute function public.set_updated_at();

comment on table public.agent_sessions is
  'Private, server-authoritative tutor-agent checkpoints. Browser roles have no direct grants.';

-- Tighten the existing learner mastery reader: it does not need creator privileges.
-- SECURITY INVOKER lets the table RLS remain the authority and an empty search_path prevents
-- object-shadowing surprises.
create or replace function public.my_concept_mastery_v1()
returns table(concept_key text, subject text, mastery numeric, attempts integer, correct integer, ability numeric, updated_at timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  select cm.concept_key, cm.subject, cm.mastery, cm.attempts, cm.correct, cm.ability, cm.updated_at
  from public.concept_mastery as cm
  where cm.user_id = (select auth.uid())
  order by cm.updated_at desc
  limit 200;
$$;

revoke all on function public.my_concept_mastery_v1() from public, anon;
grant execute on function public.my_concept_mastery_v1() to authenticated;
