-- FAHIM 2026: admin oversight for the tutor agent + SME layer.
-- Owner-scoped RLS means an admin's normal client query only sees their own rows, so
-- platform-wide oversight goes through a SECURITY DEFINER RPC guarded by has_role('admin').
-- It returns AGGREGATES and run metadata only — never a learner's private prompt/answer text.

create or replace function public.admin_agent_overview_v1()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  result jsonb;
begin
  if not public.has_role('admin') then
    raise exception 'Administrator role required.' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'generatedAt', now(),
    'totals', jsonb_build_object(
      'agentSessions', (select count(*) from public.ai_generations where task_type = 'agent'),
      'agentSessions7d', (select count(*) from public.ai_generations where task_type = 'agent' and created_at >= now() - interval '7 days'),
      'agentLearners', (select count(distinct user_id) from public.ai_generations where task_type = 'agent'),
      'conceptsTracked', (select count(*) from public.concept_mastery),
      'learnersWithMastery', (select count(distinct user_id) from public.concept_mastery),
      'reviewsScheduled', (select count(*) from public.review_items),
      'reviewsDue', (select count(*) from public.review_items where due_at <= now()),
      'avgMastery', coalesce((select round(avg(mastery), 3) from public.concept_mastery), 0),
      'masteredConcepts', (select count(*) from public.concept_mastery where mastery >= 0.8),
      'smeOrganizations', (select count(*) from public.sme_impact_assumptions)
    ),
    'masteryBands', coalesce((
      select jsonb_agg(row order by row->>'ord')
      from (
        select jsonb_build_object('ord', ord, 'band', band, 'count', c) as row
        from (
          select 1 ord, 'Needs Foundation' band, count(*) c from public.concept_mastery where mastery < 0.4
          union all select 2, 'Developing', count(*) from public.concept_mastery where mastery >= 0.4 and mastery < 0.6
          union all select 3, 'Progressing', count(*) from public.concept_mastery where mastery >= 0.6 and mastery < 0.8
          union all select 4, 'Strong', count(*) from public.concept_mastery where mastery >= 0.8 and mastery < 0.9
          union all select 5, 'Mastered', count(*) from public.concept_mastery where mastery >= 0.9
        ) bands
      ) ordered
    ), '[]'::jsonb),
    'topConcepts', coalesce((
      select jsonb_agg(jsonb_build_object('conceptKey', concept_key, 'learners', learners, 'avgMastery', avg_m) order by learners desc, avg_m desc)
      from (
        select concept_key, count(distinct user_id) learners, round(avg(mastery), 3) avg_m
        from public.concept_mastery
        group by concept_key
        order by count(distinct user_id) desc, avg(mastery) desc
        limit 10
      ) t
    ), '[]'::jsonb),
    'recentRuns', coalesce((
      select jsonb_agg(jsonb_build_object('id', id, 'status', status, 'model', model, 'createdAt', created_at, 'tokens', coalesce(input_tokens, 0) + coalesce(output_tokens, 0)) order by created_at desc)
      from (
        select id, status, model, created_at, input_tokens, output_tokens
        from public.ai_generations
        where task_type = 'agent'
        order by created_at desc
        limit 12
      ) r
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_agent_overview_v1() from public, anon;
grant execute on function public.admin_agent_overview_v1() to authenticated;

comment on function public.admin_agent_overview_v1 is 'Admin-only, privacy-safe platform overview of tutor-agent usage and mastery. Aggregates + run metadata only, never learner content.';
