/*
  FAHIM canonical product foundation — 2026-08-10

  Canonical dependency: 20260807000000_learning_os.sql.
  The overlapping 20260807000100_fahim_learning_os.sql is preserved outside the
  active migration chain. This migration is additive and does not drop user data.
*/

create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists persona text check (persona is null or persona in ('student', 'teacher', 'parent', 'professional', 'other')),
  add column if not exists education_level text,
  add column if not exists primary_subject text,
  add column if not exists current_level text,
  add column if not exists learning_goal text,
  add column if not exists target_date date,
  add column if not exists preferred_language text not null default 'ar' check (preferred_language in ('ar', 'en', 'both')),
  add column if not exists learning_style text not null default 'mixed' check (learning_style in ('guided', 'practice', 'visual', 'mixed')),
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_ends_at timestamptz;

create table if not exists public.plans (
  code text primary key check (code in ('free', 'plus_monthly', 'plus_annual')),
  name_ar text not null,
  name_en text not null,
  price_egp integer not null check (price_egp >= 0),
  billing_period text not null check (billing_period in ('none', 'month', 'year')),
  trial_days integer not null default 0 check (trial_days between 0 and 90),
  is_public boolean not null default true,
  is_launch_price boolean not null default false,
  features jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.plans (code, name_ar, name_en, price_egp, billing_period, trial_days, is_launch_price, features) values
  ('free', 'فَهيم المجاني', 'Fahim Free', 0, 'none', 0, false, '["public_paths","limited_review","learning_search","basic_progress"]'::jsonb),
  ('plus_monthly', 'فَهيم بلس', 'Fahim Plus', 49, 'month', 30, true, '["ai_tutor","rag","spaced_review","projects","learning_evidence"]'::jsonb),
  ('plus_annual', 'فَهيم بلس سنوي', 'Fahim Plus Annual', 399, 'year', 30, true, '["ai_tutor","rag","spaced_review","projects","learning_evidence","beta_priority"]'::jsonb)
on conflict (code) do update set
  name_ar = excluded.name_ar,
  name_en = excluded.name_en,
  price_egp = excluded.price_egp,
  billing_period = excluded.billing_period,
  trial_days = excluded.trial_days,
  is_launch_price = excluded.is_launch_price,
  features = excluded.features,
  updated_at = now();

alter table public.subscriptions
  add column if not exists plan_code text,
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists current_period_start timestamptz,
  add column if not exists provider_mode text check (provider_mode is null or provider_mode in ('test', 'live')),
  add column if not exists payment_method_type text,
  add column if not exists canceled_at timestamptz;

update public.subscriptions
set plan_code = case
  when plan in ('plus', 'plus_monthly') then 'plus_monthly'
  when plan in ('annual', 'plus_annual') then 'plus_annual'
  else 'free'
end
where plan_code is null;

alter table public.subscriptions alter column plan_code set default 'free';
update public.subscriptions set plan_code = 'free' where plan_code is null;
alter table public.subscriptions alter column plan_code set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'subscriptions_plan_code_fkey') then
    alter table public.subscriptions add constraint subscriptions_plan_code_fkey foreign key (plan_code) references public.plans(code);
  end if;
end $$;

create table if not exists public.product_entitlements (
  user_id uuid not null references auth.users(id) on delete cascade,
  entitlement_key text not null,
  limit_value integer check (limit_value is null or limit_value >= 0),
  used_value integer not null default 0 check (used_value >= 0),
  reset_at timestamptz,
  source text not null check (source in ('free', 'trial', 'subscription', 'grant')),
  updated_at timestamptz not null default now(),
  primary key (user_id, entitlement_key)
);

create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_code text not null references public.plans(code),
  provider text not null default 'paymob' check (provider = 'paymob'),
  provider_mode text not null check (provider_mode in ('test', 'live')),
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'EGP' check (currency = 'EGP'),
  status text not null default 'created' check (status in ('created', 'intended', 'paid', 'declined', 'failed', 'canceled', 'refunded')),
  provider_intention_id text,
  provider_order_id text,
  provider_transaction_id text unique,
  billing_name text not null,
  billing_email text not null,
  billing_phone text not null,
  error_code text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_orders_user_created_idx on public.payment_orders(user_id, created_at desc);
create index if not exists payment_orders_provider_order_idx on public.payment_orders(provider_order_id) where provider_order_id is not null;

create table if not exists public.payment_events (
  id bigint generated always as identity primary key,
  provider text not null default 'paymob',
  provider_event_key text not null unique,
  payment_order_id uuid references public.payment_orders(id) on delete set null,
  signature_valid boolean not null,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  processing_error text,
  received_at timestamptz not null default now()
);

create table if not exists public.api_registry (
  key text primary key,
  provider text not null,
  service text not null,
  purpose text not null,
  learning_task text not null,
  data_sent text not null,
  data_received text not null,
  cost_model text not null,
  rate_limit text not null,
  fallback text not null,
  security_controls text not null,
  retention text not null,
  status text not null check (status in ('active', 'configured', 'disabled', 'planned')),
  updated_at timestamptz not null default now()
);

insert into public.api_registry (key, provider, service, purpose, learning_task, data_sent, data_received, cost_model, rate_limit, fallback, security_controls, retention, status) values
  ('supabase', 'Supabase', 'Auth, Postgres, Storage', 'Identity and durable learning records', 'Secure account, sync, and RLS', 'Identity and user-authored learning records', 'Session and authorized rows', 'Project plan usage', 'Provider and application limits', 'Local-first queue for eligible learning data', 'PKCE, JWT, RLS, server authorization', 'According to account and deletion policy', 'configured'),
  ('paymob', 'Paymob', 'Unified Checkout', 'Collect EGP subscription payments', 'Unlock paid learning entitlements', 'Order total and minimum billing contact', 'Payment intention and signed transaction event', 'Merchant agreement', 'Merchant integration limits', 'Keep Free plan; retry checkout', 'Hosted checkout, 3DS, HMAC-SHA512 webhook', 'Transaction records required for accounting', 'configured'),
  ('youtube', 'Google', 'YouTube Data and IFrame APIs', 'Find and play learning videos in-platform', 'Video discovery and contextual study', 'Search terms and public video IDs', 'Public metadata and embedded playback', 'Quota units', 'Server quota budget and per-user throttling', 'Curated links and cached metadata', 'Restricted API key and server proxy', 'Cached public metadata only', 'configured'),
  ('ai_gateway', 'Configured model provider', 'FAHIM AI Gateway', 'Tutor, question, and explanation tasks', 'Contextual educational assistance', 'Necessary prompt, selected source excerpts, learner context', 'Structured educational output', 'Per-token or per-request', 'Provider quota plus per-user distributed throttle', 'Show unavailable state; never fabricate output', 'Server-only keys, schema validation, prompt-injection boundaries', 'Task logs without raw secrets', 'configured')
on conflict (key) do update set status = excluded.status, updated_at = now();

create table if not exists public.source_registry (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  organization_id uuid,
  source_type text not null check (source_type in ('official_curriculum', 'teacher_material', 'user_upload', 'web', 'youtube', 'research')),
  title text not null,
  canonical_url text,
  subject text,
  education_level text,
  language text not null default 'ar',
  authority text,
  license text,
  status text not null default 'processing' check (status in ('processing', 'ready', 'failed', 'archived', 'needs_review')),
  is_published boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.source_versions (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.source_registry(id) on delete cascade,
  version_label text not null,
  academic_year text,
  checksum_sha256 text not null,
  storage_path text,
  extracted_text_path text,
  ocr_status text not null default 'not_required' check (ocr_status in ('not_required', 'pending', 'running', 'complete', 'failed')),
  indexed_at timestamptz,
  valid_from date,
  valid_to date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (source_id, checksum_sha256)
);

create table if not exists public.source_chunks (
  id uuid primary key default gen_random_uuid(),
  source_version_id uuid not null references public.source_versions(id) on delete cascade,
  chunk_index integer not null check (chunk_index >= 0),
  content text not null,
  page_start integer,
  page_end integer,
  heading_path text[] not null default '{}',
  embedding_model text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (source_version_id, chunk_index)
);

create table if not exists public.review_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  concept_key text not null,
  prompt text not null,
  answer text not null,
  source_version_id uuid references public.source_versions(id) on delete set null,
  interval_days numeric(8,2) not null default 0,
  ease_factor numeric(4,2) not null default 2.5,
  repetitions integer not null default 0,
  due_at timestamptz not null default now(),
  last_rating smallint check (last_rating is null or last_rating between 0 and 4),
  sync_state text not null default 'synced' check (sync_state in ('pending', 'synced', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists review_items_due_idx on public.review_items(user_id, due_at);

create table if not exists public.misconceptions (
  id uuid primary key default gen_random_uuid(),
  concept_key text not null,
  locale text not null default 'ar-EG',
  title text not null,
  description text not null,
  diagnostic_signals jsonb not null default '[]'::jsonb,
  recommended_interventions jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'reviewed', 'published', 'retired')),
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (concept_key, locale, title)
);

create table if not exists public.misconception_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  misconception_id uuid not null references public.misconceptions(id) on delete restrict,
  quiz_result_id uuid references public.quiz_results(id) on delete set null,
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  evidence jsonb not null default '{}'::jsonb,
  intervention_status text not null default 'recommended' check (intervention_status in ('recommended', 'started', 'completed', 'dismissed')),
  detected_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.learning_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  lesson_id uuid references public.lessons(id) on delete set null,
  concept_key text not null,
  evidence_type text not null check (evidence_type in ('attempt', 'correction', 'explanation', 'review', 'project', 'assessment')),
  summary text not null,
  artifact jsonb not null default '{}'::jsonb,
  mastery_version text not null default 'fahim-mastery-v1',
  mastery_score numeric(5,2) check (mastery_score is null or mastery_score between 0 and 100),
  generated_by text not null check (generated_by in ('learner', 'system', 'instructor', 'ai_assisted')),
  verified_at timestamptz,
  verified_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.evidence_claims (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid not null references public.learning_evidence(id) on delete cascade,
  claim_text text not null,
  classification text not null check (classification in ('VERIFIED_SOURCE', 'INFERRED', 'TEACHING_EXPLANATION', 'GENERAL_KNOWLEDGE', 'NEEDS_REVIEW')),
  source_version_id uuid references public.source_versions(id) on delete set null,
  source_location jsonb,
  confidence numeric(4,3) check (confidence is null or confidence between 0 and 1),
  created_at timestamptz not null default now()
);

create table if not exists public.mistake_portfolio (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  concept_key text not null,
  original_attempt jsonb not null,
  misconception_event_id uuid references public.misconception_events(id) on delete set null,
  intervention jsonb not null default '{}'::jsonb,
  corrected_attempt jsonb,
  evidence_id uuid references public.learning_evidence(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'practicing', 'resolved', 'reopened')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.ai_generations (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  client_message_id uuid,
  task_type text not null check (task_type in ('explain', 'quiz', 'flashcards', 'plan', 'summary', 'project')),
  provider text not null,
  model text not null,
  prompt_text text not null check (char_length(prompt_text) <= 12000),
  prompt_hash text not null,
  result_text text,
  sources jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'streaming', 'complete', 'error', 'canceled')),
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  estimated_cost_microusd bigint check (estimated_cost_microusd is null or estimated_cost_microusd >= 0),
  cache_hit boolean not null default false,
  error_code text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists ai_generations_user_created_idx on public.ai_generations(user_id, created_at desc);
create index if not exists ai_generations_prompt_hash_idx on public.ai_generations(user_id, prompt_hash, created_at desc);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null check (slug ~ '^[a-z0-9-]{3,80}$'),
  type text not null check (type in ('school', 'university', 'academy', 'company', 'community')),
  created_by uuid not null references auth.users(id) on delete restrict,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.source_registry
  drop constraint if exists source_registry_organization_id_fkey,
  add constraint source_registry_organization_id_fkey foreign key (organization_id) references public.organizations(id) on delete cascade;

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'teacher', 'reviewer', 'student', 'parent')),
  status text not null default 'active' check (status in ('invited', 'active', 'suspended')),
  joined_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create or replace function public.is_org_member(target_org uuid, allowed_roles text[] default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members om
    where om.organization_id = target_org
      and om.user_id = auth.uid()
      and om.status = 'active'
      and (allowed_roles is null or om.role = any(allowed_roles))
  ) or public.has_role('admin');
$$;

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  subject text,
  academic_year text,
  join_code_hash text unique,
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'active' check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.class_members (
  class_id uuid not null references public.classes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('teacher', 'assistant', 'student')),
  joined_at timestamptz not null default now(),
  primary key (class_id, user_id)
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  title text not null,
  instructions text not null,
  rubric jsonb not null default '[]'::jsonb,
  due_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'published', 'closed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  content jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'returned', 'graded')),
  submitted_at timestamptz,
  feedback jsonb not null default '{}'::jsonb,
  score numeric(8,2),
  graded_by uuid references auth.users(id) on delete set null,
  graded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  assignment_id uuid references public.assignments(id) on delete set null,
  title text not null,
  brief text not null,
  success_criteria jsonb not null default '[]'::jsonb,
  status text not null default 'planning' check (status in ('planning', 'building', 'review', 'complete', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Upgrade the original 2025 student-project table in place. The legacy table
-- used student_id/description and a different status vocabulary. Preserve every
-- row while exposing one canonical ownership contract to the application.
alter table public.projects
  add column if not exists user_id uuid,
  add column if not exists assignment_id uuid references public.assignments(id) on delete set null,
  add column if not exists brief text not null default '',
  add column if not exists success_criteria jsonb not null default '[]'::jsonb;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'projects' and column_name = 'student_id'
  ) then
    execute $upgrade$
      update public.projects project
      set user_id = project.student_id
      where project.user_id is null
        and project.student_id is not null
        and exists (select 1 from auth.users account where account.id = project.student_id)
    $upgrade$;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'projects' and column_name = 'description'
  ) then
    execute $upgrade$
      update public.projects
      set brief = coalesce(nullif(brief, ''), description, '')
    $upgrade$;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'projects_user_id_fkey') then
    alter table public.projects
      add constraint projects_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
  end if;

  if not exists (select 1 from public.projects where user_id is null) then
    alter table public.projects alter column user_id set not null;
  end if;
end $$;

alter table public.projects drop constraint if exists projects_status_check;
update public.projects set status = case status
  when 'draft' then 'planning'
  when 'submitted' then 'review'
  when 'reviewed' then 'review'
  when 'approved' then 'complete'
  else coalesce(status, 'planning')
end;
alter table public.projects alter column status set default 'planning';
alter table public.projects alter column status set not null;
alter table public.projects add constraint projects_status_check
  check (status in ('planning', 'building', 'review', 'complete', 'archived'));
create index if not exists projects_user_created_idx on public.projects(user_id, created_at desc);

create table if not exists public.project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  artifact jsonb not null,
  reflection text not null default '',
  review jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (project_id, version_number)
);

alter table public.certificates
  add column if not exists status text not null default 'issued' check (status in ('draft', 'issued', 'revoked')),
  add column if not exists credential_type text not null default 'completion' check (credential_type = 'completion'),
  add column if not exists issuer_name text not null default 'FAHIM',
  add column if not exists evidence_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists signature_algorithm text,
  add column if not exists signature text;

create or replace function public.complete_onboarding_v1(profile_input jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  selected_persona text := profile_input ->> 'persona';
  start_at timestamptz;
  end_at timestamptz;
  student_role_id uuid;
begin
  if uid is null then raise exception 'authentication_required'; end if;
  if selected_persona not in ('student', 'teacher', 'parent', 'professional', 'other') then raise exception 'invalid_persona'; end if;
  if char_length(trim(coalesce(profile_input ->> 'learning_goal', ''))) < 8 then raise exception 'learning_goal_too_short'; end if;
  if char_length(trim(coalesce(profile_input ->> 'primary_subject', ''))) < 2 then raise exception 'primary_subject_required'; end if;

  select trial_started_at, trial_ends_at into start_at, end_at from public.profiles where id = uid;
  if start_at is null then
    start_at := now();
    end_at := now() + interval '30 days';
  end if;

  update public.profiles set
    persona = selected_persona,
    education_level = nullif(trim(profile_input ->> 'education_level'), ''),
    primary_subject = left(trim(profile_input ->> 'primary_subject'), 120),
    current_level = left(trim(profile_input ->> 'current_level'), 120),
    learning_goal = left(trim(profile_input ->> 'learning_goal'), 500),
    target_date = case when coalesce(profile_input ->> 'target_date', '') ~ '^\d{4}-\d{2}-\d{2}$' then (profile_input ->> 'target_date')::date else null end,
    preferred_language = case when profile_input ->> 'preferred_language' in ('ar', 'en', 'both') then profile_input ->> 'preferred_language' else 'ar' end,
    learning_style = case when profile_input ->> 'learning_style' in ('guided', 'practice', 'visual', 'mixed') then profile_input ->> 'learning_style' else 'mixed' end,
    onboarding_completed_at = coalesce(onboarding_completed_at, now()),
    trial_started_at = start_at,
    trial_ends_at = end_at,
    updated_at = now()
  where id = uid;

  if not found then raise exception 'profile_missing'; end if;

  select id into student_role_id from public.roles where key = 'student';
  insert into public.user_roles (user_id, role_id) values (uid, student_role_id) on conflict do nothing;

  insert into public.subscriptions (user_id, provider, plan, plan_code, status, trial_started_at, trial_ends_at, current_period_start, current_period_end)
  values (uid, 'internal', 'plus_monthly', 'plus_monthly', 'trialing', start_at, end_at, start_at, end_at)
  on conflict (user_id) do update set
    plan = case when public.subscriptions.plan_code = 'free' and public.subscriptions.trial_started_at is null then 'plus_monthly' else public.subscriptions.plan end,
    plan_code = case when public.subscriptions.plan_code = 'free' and public.subscriptions.trial_started_at is null then 'plus_monthly' else public.subscriptions.plan_code end,
    status = case when public.subscriptions.plan_code = 'free' and public.subscriptions.trial_started_at is null then 'trialing' else public.subscriptions.status end,
    trial_started_at = coalesce(public.subscriptions.trial_started_at, start_at),
    trial_ends_at = coalesce(public.subscriptions.trial_ends_at, end_at),
    current_period_start = coalesce(public.subscriptions.current_period_start, start_at),
    current_period_end = coalesce(public.subscriptions.current_period_end, end_at),
    updated_at = now();

  insert into public.product_entitlements (user_id, entitlement_key, limit_value, source, reset_at) values
    (uid, 'ai_sessions_month', 150, 'trial', end_at),
    (uid, 'rag_documents', 50, 'trial', end_at),
    (uid, 'storage_mb', 1000, 'trial', end_at),
    (uid, 'review_cards', 2000, 'trial', end_at)
  on conflict (user_id, entitlement_key) do nothing;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (uid, 'onboarding.completed', 'profile', uid::text, jsonb_build_object('persona', selected_persona, 'trial_ends_at', end_at));

  return public.current_access_v1();
end;
$$;

create or replace function public.current_access_v1()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  p public.profiles%rowtype;
  s public.subscriptions%rowtype;
  trial_active boolean := false;
  paid_active boolean := false;
  effective_plan text := 'free';
  effective_status text := 'free';
  ai_remaining integer;
begin
  if uid is null then raise exception 'authentication_required'; end if;
  select * into p from public.profiles where id = uid;
  select * into s from public.subscriptions where user_id = uid;
  trial_active := s.status = 'trialing' and s.trial_ends_at > now();
  paid_active := s.status = 'active' and s.plan_code in ('plus_monthly', 'plus_annual') and (s.current_period_end is null or s.current_period_end > now());

  if paid_active then effective_plan := s.plan_code; effective_status := 'active';
  elsif trial_active then effective_plan := 'plus_monthly'; effective_status := 'trialing';
  end if;

  select greatest(0, limit_value - used_value) into ai_remaining
  from public.product_entitlements
  where user_id = uid and entitlement_key = 'ai_sessions_month' and (reset_at is null or reset_at > now());

  return jsonb_build_object(
    'onboarding_complete', p.onboarding_completed_at is not null,
    'status', effective_status,
    'plan_code', effective_plan,
    'trial_started_at', p.trial_started_at,
    'trial_ends_at', p.trial_ends_at,
    'trial_days_remaining', case when trial_active then greatest(1, ceil(extract(epoch from (p.trial_ends_at - now())) / 86400.0)::integer) else 0 end,
    'ai_sessions_remaining', ai_remaining,
    'can_use_core', p.onboarding_completed_at is not null
  );
end;
$$;

create or replace function public.consume_entitlement_v1(target_key text, amount integer default 1)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  changed integer;
begin
  if uid is null or amount < 1 or amount > 100 then return false; end if;
  update public.product_entitlements
  set used_value = used_value + amount, updated_at = now()
  where user_id = uid
    and entitlement_key = target_key
    and (reset_at is null or reset_at > now())
    and (limit_value is null or used_value + amount <= limit_value);
  get diagnostics changed = row_count;
  return changed = 1;
end;
$$;

create or replace function public.refund_entitlement_v1(target_user uuid, target_key text, amount integer default 1)
returns void
language sql
security definer
set search_path = public
as $$
  update public.product_entitlements
  set used_value = greatest(0, used_value - greatest(1, amount)), updated_at = now()
  where user_id = target_user and entitlement_key = target_key;
$$;

create or replace function public.verify_certificate_v1(certificate_id uuid)
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
    'issued_at', c.issued_at,
    'course_title', coalesce(crs.title, ''),
    'learner_name', p.full_name,
    'status', case when c.revoked_at is not null or c.status = 'revoked' then 'revoked' else c.status end,
    'evidence', c.evidence_snapshot
  )
  from public.certificates c
  join public.profiles p on p.id = c.user_id
  left join public.courses crs on crs.id = c.course_id
  where c.id = certificate_id and c.status in ('issued', 'revoked');
$$;

alter table public.plans enable row level security;
alter table public.product_entitlements enable row level security;
alter table public.payment_orders enable row level security;
alter table public.payment_events enable row level security;
alter table public.api_registry enable row level security;
alter table public.source_registry enable row level security;
alter table public.source_versions enable row level security;
alter table public.source_chunks enable row level security;
alter table public.review_items enable row level security;
alter table public.misconceptions enable row level security;
alter table public.misconception_events enable row level security;
alter table public.learning_evidence enable row level security;
alter table public.evidence_claims enable row level security;
alter table public.mistake_portfolio enable row level security;
alter table public.ai_generations enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.projects enable row level security;
alter table public.project_versions enable row level security;

create policy "plans_public_read" on public.plans for select using (is_public);
create policy "entitlements_owner_read" on public.product_entitlements for select to authenticated using (user_id = auth.uid());
create policy "payment_orders_owner_read" on public.payment_orders for select to authenticated using (user_id = auth.uid());
create policy "api_registry_authenticated_read" on public.api_registry for select to authenticated using (true);
create policy "source_registry_read" on public.source_registry for select to authenticated using (owner_id = auth.uid() or is_published or (organization_id is not null and public.is_org_member(organization_id)) or public.has_role('admin'));
create policy "source_registry_owner_write" on public.source_registry for all to authenticated using (owner_id = auth.uid() or (organization_id is not null and public.is_org_member(organization_id, array['owner','admin','teacher','reviewer']))) with check (owner_id = auth.uid() or (organization_id is not null and public.is_org_member(organization_id, array['owner','admin','teacher','reviewer'])));
create policy "source_versions_read" on public.source_versions for select to authenticated using (exists (select 1 from public.source_registry sr where sr.id = source_id));
create policy "source_versions_write" on public.source_versions for all to authenticated using (exists (select 1 from public.source_registry sr where sr.id = source_id and (sr.owner_id = auth.uid() or (sr.organization_id is not null and public.is_org_member(sr.organization_id, array['owner','admin','teacher','reviewer']))))) with check (exists (select 1 from public.source_registry sr where sr.id = source_id and (sr.owner_id = auth.uid() or (sr.organization_id is not null and public.is_org_member(sr.organization_id, array['owner','admin','teacher','reviewer'])))));
create policy "source_chunks_read" on public.source_chunks for select to authenticated using (exists (select 1 from public.source_versions sv join public.source_registry sr on sr.id = sv.source_id where sv.id = source_version_id));
create policy "review_items_owner_all" on public.review_items for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "misconceptions_published_read" on public.misconceptions for select to authenticated using (status = 'published' or public.has_role('instructor') or public.has_role('admin'));
create policy "misconception_events_owner_read" on public.misconception_events for select to authenticated using (user_id = auth.uid() or public.has_role('admin'));
create policy "learning_evidence_owner_read" on public.learning_evidence for select to authenticated using (user_id = auth.uid() or public.has_role('admin'));
create policy "evidence_claims_owner_read" on public.evidence_claims for select to authenticated using (exists (select 1 from public.learning_evidence e where e.id = evidence_id and (e.user_id = auth.uid() or public.has_role('admin'))));
create policy "mistake_portfolio_owner_read" on public.mistake_portfolio for select to authenticated using (user_id = auth.uid() or public.has_role('admin'));
create policy "ai_generations_owner_read" on public.ai_generations for select to authenticated using (user_id = auth.uid() or public.has_role('admin'));
create policy "organizations_member_read" on public.organizations for select to authenticated using (public.is_org_member(id));
create policy "organizations_owner_update" on public.organizations for update to authenticated using (public.is_org_member(id, array['owner','admin'])) with check (public.is_org_member(id, array['owner','admin']));
create policy "organization_members_read" on public.organization_members for select to authenticated using (user_id = auth.uid() or public.is_org_member(organization_id, array['owner','admin','teacher']));
create policy "classes_member_read" on public.classes for select to authenticated using (public.is_org_member(organization_id));
create policy "classes_teacher_write" on public.classes for all to authenticated using (public.is_org_member(organization_id, array['owner','admin','teacher'])) with check (public.is_org_member(organization_id, array['owner','admin','teacher']));
create policy "class_members_read" on public.class_members for select to authenticated using (user_id = auth.uid() or exists (select 1 from public.classes c where c.id = class_id and public.is_org_member(c.organization_id, array['owner','admin','teacher'])));
create policy "assignments_class_read" on public.assignments for select to authenticated using (exists (select 1 from public.class_members cm where cm.class_id = assignments.class_id and cm.user_id = auth.uid()) or exists (select 1 from public.classes c where c.id = assignments.class_id and public.is_org_member(c.organization_id, array['owner','admin','teacher'])));
create policy "assignments_teacher_write" on public.assignments for all to authenticated using (exists (select 1 from public.classes c where c.id = assignments.class_id and public.is_org_member(c.organization_id, array['owner','admin','teacher']))) with check (exists (select 1 from public.classes c where c.id = assignments.class_id and public.is_org_member(c.organization_id, array['owner','admin','teacher'])));
create policy "submissions_owner_or_teacher_read" on public.submissions for select to authenticated using (student_id = auth.uid() or exists (select 1 from public.assignments a join public.classes c on c.id = a.class_id where a.id = assignment_id and public.is_org_member(c.organization_id, array['owner','admin','teacher'])));
create policy "submissions_student_insert" on public.submissions for insert to authenticated with check (student_id = auth.uid() and exists (select 1 from public.assignments a join public.class_members cm on cm.class_id = a.class_id where a.id = assignment_id and cm.user_id = auth.uid() and cm.role = 'student'));
create policy "submissions_student_update_draft" on public.submissions for update to authenticated using (student_id = auth.uid() and status in ('draft','returned')) with check (student_id = auth.uid());
create policy "projects_owner_all" on public.projects for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "project_versions_owner_all" on public.project_versions for all to authenticated using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())) with check (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));

revoke all on function public.complete_onboarding_v1(jsonb) from public;
grant execute on function public.complete_onboarding_v1(jsonb) to authenticated;
revoke all on function public.current_access_v1() from public;
grant execute on function public.current_access_v1() to authenticated;
revoke all on function public.verify_certificate_v1(uuid) from public;
grant execute on function public.verify_certificate_v1(uuid) to anon, authenticated;
revoke all on function public.consume_entitlement_v1(text, integer) from public;
grant execute on function public.consume_entitlement_v1(text, integer) to authenticated;
revoke all on function public.refund_entitlement_v1(uuid, text, integer) from public;
grant execute on function public.refund_entitlement_v1(uuid, text, integer) to service_role;

grant select on public.plans to anon, authenticated;
grant select on public.product_entitlements, public.payment_orders, public.api_registry to authenticated;
grant select, insert, update, delete on public.review_items, public.projects, public.project_versions to authenticated;
grant select on public.source_registry, public.source_versions, public.source_chunks, public.misconceptions, public.misconception_events, public.learning_evidence, public.evidence_claims, public.mistake_portfolio to authenticated;
grant select on public.ai_generations to authenticated;
grant select, insert, update, delete on public.organizations, public.organization_members, public.classes, public.class_members, public.assignments, public.submissions to authenticated;

create trigger plans_set_updated_at before update on public.plans for each row execute function public.set_updated_at();
create trigger payment_orders_set_updated_at before update on public.payment_orders for each row execute function public.set_updated_at();
create trigger source_registry_set_updated_at before update on public.source_registry for each row execute function public.set_updated_at();
create trigger review_items_set_updated_at before update on public.review_items for each row execute function public.set_updated_at();
create trigger misconceptions_set_updated_at before update on public.misconceptions for each row execute function public.set_updated_at();
create trigger organizations_set_updated_at before update on public.organizations for each row execute function public.set_updated_at();
create trigger classes_set_updated_at before update on public.classes for each row execute function public.set_updated_at();
create trigger assignments_set_updated_at before update on public.assignments for each row execute function public.set_updated_at();
create trigger submissions_set_updated_at before update on public.submissions for each row execute function public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects for each row execute function public.set_updated_at();
