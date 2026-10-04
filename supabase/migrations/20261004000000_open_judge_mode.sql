-- FAHIM 2026 competition mode: full learner access without visible account UI.
-- Visitors still authenticate as isolated Supabase anonymous users, so every
-- existing owner-scoped RLS policy remains effective. Staff/admin permissions
-- continue to require explicit roles and are not granted here.

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
    'onboarding_complete', true,
    'status', 'active',
    'plan_code', 'plus_annual',
    'trial_started_at', p.trial_started_at,
    'trial_ends_at', null,
    'trial_days_remaining', 0,
    'ai_sessions_remaining', 999999,
    'can_use_core', true,
    'access_mode', 'open_judge'
  );
end;
$$;

revoke all on function public.current_access_v1() from public, anon;
grant execute on function public.current_access_v1() to authenticated;

comment on function public.current_access_v1 is
  'OPEN JUDGE MODE: full learner access for isolated authenticated identities; staff roles remain separately enforced.';
