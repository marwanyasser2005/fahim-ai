do $verify$
declare
  test_user uuid;
  access_result jsonb;
begin
  select id into test_user from auth.users order by created_at desc limit 1;
  if test_user is null then
    raise exception 'FAHIM_ONBOARDING_VERIFY_NO_USER';
  end if;

  perform set_config('request.jwt.claim.sub', test_user::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  access_result := public.complete_onboarding_v1(
    jsonb_build_object(
      'persona', 'student',
      'education_level', 'secondary',
      'primary_subject', 'Mathematics',
      'current_level', 'Foundation',
      'learning_goal', 'Verify the complete onboarding transaction safely',
      'target_date', null,
      'preferred_language', 'both',
      'learning_style', 'mixed'
    )
  );

  if not coalesce((access_result ->> 'onboarding_complete')::boolean, false)
    or access_result ->> 'status' not in ('trialing', 'active')
    or access_result ->> 'plan_code' not in ('plus_monthly', 'plus_annual')
    or not coalesce((access_result ->> 'can_use_core')::boolean, false)
  then
    raise exception 'FAHIM_ONBOARDING_VERIFY_FAILED';
  end if;

  -- This expected exception rolls back every write performed by this statement.
  raise exception 'FAHIM_ONBOARDING_VERIFIED_ROLLBACK';
end
$verify$;
