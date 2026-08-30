select jsonb_build_object(
  'complete_onboarding', to_regprocedure('public.complete_onboarding_v1(jsonb)') is not null,
  'current_access', to_regprocedure('public.current_access_v1()') is not null,
  'authenticated_can_execute', has_function_privilege('authenticated', 'public.complete_onboarding_v1(jsonb)', 'execute'),
  'anon_can_execute', has_function_privilege('anon', 'public.complete_onboarding_v1(jsonb)', 'execute'),
  'project_columns', (
    select jsonb_agg(column_name order by column_name)
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'projects'
      and column_name in ('user_id', 'student_id', 'assignment_id', 'brief', 'success_criteria')
  ),
  'rls_enabled', (
    select bool_and(table_state.relrowsecurity)
    from pg_class table_state
    join pg_namespace table_schema on table_schema.oid = table_state.relnamespace
    where table_schema.nspname = 'public'
      and table_state.relname in (
        'profiles', 'subscriptions', 'projects', 'manual_payment_proofs',
        'support_tickets', 'content_items'
      )
  ),
  'policy_count', (
    select count(*) from pg_policies where schemaname = 'public'
  ),
  'latest_migration', (
    select max(version) from supabase_migrations.schema_migrations
  )
) as verification;
