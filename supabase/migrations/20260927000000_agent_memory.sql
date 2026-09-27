-- FAHIM 2026: durable agent memory.
-- The tutor agent needs state that survives across sessions and devices: per-concept mastery
-- (BKT posterior + IRT ability) and a full FSRS review card. This migration adds the one net-new
-- table the server owns (concept_mastery), completes the FSRS state on review_items, and lets the
-- agent record ai_generations rows. Writes come from the service role; reads are owner-scoped.

create table if not exists public.concept_mastery (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  concept_key text not null check (char_length(concept_key) between 1 and 160),
  subject text,
  mastery numeric(5,4) not null default 0.2 check (mastery between 0 and 1),
  attempts integer not null default 0 check (attempts >= 0),
  correct integer not null default 0 check (correct >= 0),
  ability numeric(6,3) not null default 0 check (ability between -6 and 6),
  params jsonb not null default '{"p0":0.2,"learn":0.15,"slip":0.1,"guess":0.2}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, concept_key)
);

create index if not exists concept_mastery_owner_idx on public.concept_mastery(user_id, updated_at desc);

alter table public.concept_mastery enable row level security;

drop policy if exists concept_mastery_owner_all on public.concept_mastery;
create policy concept_mastery_owner_all on public.concept_mastery
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke all on public.concept_mastery from anon;
grant select, insert, update, delete on public.concept_mastery to authenticated;

drop trigger if exists concept_mastery_set_updated_at on public.concept_mastery;
create trigger concept_mastery_set_updated_at before update on public.concept_mastery
for each row execute function public.set_updated_at();

-- Complete the FSRS state on the existing review schedule (previously SM-2 columns only).
alter table public.review_items add column if not exists stability numeric(8,3);
alter table public.review_items add column if not exists difficulty numeric(6,3);
alter table public.review_items add column if not exists last_review_at timestamptz;

-- The agent turn is a first-class generation task; allow it (and learning-paths) on the metering log.
alter table public.ai_generations drop constraint if exists ai_generations_task_type_check;
alter table public.ai_generations add constraint ai_generations_task_type_check
  check (task_type in ('explain','quiz','flashcards','plan','summary','project','teach','recall','agent','learning_paths'));

-- The learner's own mastery map, most-practised first. Powers the Agent Studio mastery panel.
create or replace function public.my_concept_mastery_v1()
returns table(concept_key text, subject text, mastery numeric, attempts integer, correct integer, ability numeric, updated_at timestamptz)
language sql
stable
security definer
set search_path = public, auth
as $$
  select concept_key, subject, mastery, attempts, correct, ability, updated_at
  from public.concept_mastery
  where user_id = auth.uid()
  order by updated_at desc
  limit 200;
$$;

revoke all on function public.my_concept_mastery_v1() from public, anon;
grant execute on function public.my_concept_mastery_v1() to authenticated;

comment on table public.concept_mastery is 'Durable per-learner BKT mastery and IRT ability, written by the Fahim tutor agent (service role).';
comment on function public.my_concept_mastery_v1 is 'Owner-scoped mastery map for the learner Agent Studio view.';
