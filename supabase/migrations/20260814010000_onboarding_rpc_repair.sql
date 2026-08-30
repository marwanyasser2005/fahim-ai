/*
  FAHIM onboarding RPC repair — 2026-08-14

  Runs after the canonical product migrations. It deliberately recreates the
  public onboarding contract so a partially refreshed PostgREST schema cannot
  leave newly registered learners stranded. No user data is removed.
*/

begin;

create or replace function public.current_access_v1()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
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

  trial_active := coalesce(s.status = 'trialing' and s.trial_ends_at > now(), false);
  paid_active := coalesce(
    s.status = 'active'
    and s.plan_code in ('plus_monthly', 'plus_annual')
    and (s.current_period_end is null or s.current_period_end > now()),
    false
  );

  if paid_active then
    effective_plan := s.plan_code;
    effective_status := 'active';
  elsif trial_active then
    effective_plan := 'plus_monthly';
    effective_status := 'trialing';
  end if;

  select greatest(0, limit_value - used_value)
  into ai_remaining
  from public.product_entitlements
  where user_id = uid
    and entitlement_key = 'ai_sessions_month'
    and (reset_at is null or reset_at > now());

  return jsonb_build_object(
    'onboarding_complete', p.onboarding_completed_at is not null,
    'status', effective_status,
    'plan_code', effective_plan,
    'trial_started_at', p.trial_started_at,
    'trial_ends_at', p.trial_ends_at,
    'trial_days_remaining', case
      when trial_active then greatest(1, ceil(extract(epoch from (p.trial_ends_at - now())) / 86400.0)::integer)
      else 0
    end,
    'ai_sessions_remaining', ai_remaining,
    'can_use_core', p.onboarding_completed_at is not null
  );
end;
$$;

create or replace function public.complete_onboarding_v1(profile_input jsonb)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  uid uuid := auth.uid();
  selected_persona text := coalesce(profile_input, '{}'::jsonb) ->> 'persona';
  start_at timestamptz;
  end_at timestamptz;
  student_role_id uuid;
begin
  if uid is null then raise exception 'authentication_required'; end if;
  if selected_persona not in ('student', 'teacher', 'parent', 'professional', 'other') then raise exception 'invalid_persona'; end if;
  if char_length(trim(coalesce(profile_input ->> 'learning_goal', ''))) < 8 then raise exception 'learning_goal_too_short'; end if;
  if char_length(trim(coalesce(profile_input ->> 'primary_subject', ''))) < 2 then raise exception 'primary_subject_required'; end if;

  -- Repair accounts created before the Learning OS auth trigger was installed.
  insert into public.profiles (id, full_name, avatar_url)
  select
    account.id,
    coalesce(account.raw_user_meta_data ->> 'full_name', account.email, ''),
    account.raw_user_meta_data ->> 'avatar_url'
  from auth.users account
  where account.id = uid
  on conflict (id) do nothing;

  -- Serialize repeated submissions so the thirty-day trial can only start once.
  select trial_started_at, trial_ends_at
  into start_at, end_at
  from public.profiles
  where id = uid
  for update;

  if not found then raise exception 'profile_missing'; end if;
  if start_at is null then
    start_at := now();
    end_at := start_at + interval '30 days';
  end if;

  update public.profiles set
    persona = selected_persona,
    education_level = nullif(trim(profile_input ->> 'education_level'), ''),
    primary_subject = left(trim(profile_input ->> 'primary_subject'), 120),
    current_level = left(trim(profile_input ->> 'current_level'), 120),
    learning_goal = left(trim(profile_input ->> 'learning_goal'), 500),
    target_date = case
      when coalesce(profile_input ->> 'target_date', '') ~ '^\d{4}-\d{2}-\d{2}$'
        then (profile_input ->> 'target_date')::date
      else null
    end,
    preferred_language = case
      when profile_input ->> 'preferred_language' in ('ar', 'en', 'both') then profile_input ->> 'preferred_language'
      else 'ar'
    end,
    learning_style = case
      when profile_input ->> 'learning_style' in ('guided', 'practice', 'visual', 'mixed') then profile_input ->> 'learning_style'
      else 'mixed'
    end,
    onboarding_completed_at = coalesce(onboarding_completed_at, now()),
    trial_started_at = start_at,
    trial_ends_at = end_at,
    updated_at = now()
  where id = uid;

  select id into student_role_id from public.roles where key = 'student';
  if student_role_id is not null then
    insert into public.user_roles (user_id, role_id)
    values (uid, student_role_id)
    on conflict do nothing;
  end if;

  insert into public.subscriptions (
    user_id, provider, plan, plan_code, status, trial_started_at,
    trial_ends_at, current_period_start, current_period_end
  ) values (
    uid, 'internal', 'plus_monthly', 'plus_monthly', 'trialing', start_at,
    end_at, start_at, end_at
  )
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
  values (
    uid,
    'onboarding.completed',
    'profile',
    uid::text,
    jsonb_build_object('persona', selected_persona, 'trial_ends_at', end_at)
  );

  return public.current_access_v1();
end;
$$;

revoke all on function public.current_access_v1() from public, anon;
grant execute on function public.current_access_v1() to authenticated;
revoke all on function public.complete_onboarding_v1(jsonb) from public, anon;
grant execute on function public.complete_onboarding_v1(jsonb) to authenticated;

comment on function public.complete_onboarding_v1(jsonb) is
  'Completes learner onboarding atomically and starts the one-time 30-day trial.';

-- Ask PostgREST to expose the repaired signatures without waiting for cache TTL.
notify pgrst, 'reload schema';

commit;
