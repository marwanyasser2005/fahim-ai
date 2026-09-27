-- FAHIM 2026: temporary launch policy — unlimited top-tier ("Pro") access for everyone.
-- Billing/payment is being finalized, so every authenticated learner gets permanent Plus access
-- with no session metering. This is intentionally reversible: restore the metered function bodies
-- (see migrations 20260810000000 and 20260814010000) when paid plans go live.
-- The server also honours FAHIM_UNLIMITED_ACCESS (default on); set it to 'false' to re-meter.

-- Backend gate: never block an AI session while the launch policy is active.
create or replace function public.consume_entitlement_v1(target_key text, amount integer default 1)
returns boolean
language sql
security definer
set search_path = public
as $$
  -- Unlimited launch access: allow any authenticated caller. (Restore metered body to re-enable.)
  select auth.uid() is not null;
$$;

-- UI/access: report permanent top-tier plan so the product unlocks fully and shows no trial nag.
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
begin
  if uid is null then raise exception 'authentication_required'; end if;
  select * into p from public.profiles where id = uid;
  return jsonb_build_object(
    'onboarding_complete', p.onboarding_completed_at is not null,
    'status', 'active',
    'plan_code', 'plus_annual',
    'trial_started_at', p.trial_started_at,
    'trial_ends_at', p.trial_ends_at,
    'trial_days_remaining', 0,
    'ai_sessions_remaining', 999999,
    'can_use_core', p.onboarding_completed_at is not null
  );
end;
$$;

comment on function public.consume_entitlement_v1 is 'LAUNCH POLICY: unlimited access (always allow). Restore metered body when paid billing is live.';
comment on function public.current_access_v1 is 'LAUNCH POLICY: reports permanent top-tier (plus_annual/active). Restore metered body when paid billing is live.';
