-- Fahim evidence badges: durable motivation before a completion credential.
-- Badges record observable learning actions. They are not certificates or accreditation.

create table if not exists public.badge_definitions (
  key text primary key check (key ~ '^[a-z][a-z0-9_]{2,63}$'),
  stage_order smallint not null unique check (stage_order between 1 and 99),
  stage_key text not null check (stage_key in ('start','practice','insight','growth','evidence','memory','transfer','completion')),
  title_ar text not null check (char_length(title_ar) between 2 and 80),
  title_en text not null check (char_length(title_en) between 2 and 80),
  description_ar text not null check (char_length(description_ar) between 4 and 240),
  description_en text not null check (char_length(description_en) between 4 and 240),
  requirement_ar text not null check (char_length(requirement_ar) between 4 and 240),
  requirement_en text not null check (char_length(requirement_en) between 4 and 240),
  icon_key text not null check (icon_key in ('compass','attempt','lens','bridge','return','proof','memory','transfer','finish')),
  color_key text not null check (color_key in ('lapis','nile','saffron','vermilion')),
  criteria_kind text not null check (criteria_kind in ('learning_event','course_completion')),
  criteria_value text,
  criteria_threshold integer not null default 1 check (criteria_threshold between 1 and 10000),
  xp_reward integer not null default 0 check (xp_reward between 0 and 10000),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (criteria_kind = 'learning_event' and criteria_value in ('diagnostic_started','attempt_submitted','misconception_detected','intervention_completed','retry_submitted','evidence_created','review_recalled','transfer_applied'))
    or (criteria_kind = 'course_completion' and criteria_value is null)
  )
);

insert into public.badge_definitions (
  key, stage_order, stage_key, title_ar, title_en, description_ar, description_en,
  requirement_ar, requirement_en, icon_key, color_key, criteria_kind, criteria_value, criteria_threshold, xp_reward
) values
  ('starting_compass', 1, 'start', 'بوصلة البداية', 'Starting Compass', 'حوّلت هدفًا عامًا إلى نقطة بداية قابلة للقياس.', 'Turned a broad goal into a measurable starting point.', 'ابدأ أول تشخيص تعلّم.', 'Start your first learning diagnostic.', 'compass', 'lapis', 'learning_event', 'diagnostic_started', 1, 25),
  ('brave_attempt', 2, 'practice', 'جرأة المحاولة', 'Brave Attempt', 'أظهرت فهمك الحقيقي قبل رؤية الإجابة.', 'Showed your real thinking before seeing the answer.', 'قدّم أول محاولة أصلية.', 'Submit your first original attempt.', 'attempt', 'saffron', 'learning_event', 'attempt_submitted', 1, 35),
  ('gap_hunter', 3, 'insight', 'صيّاد الفجوات', 'Gap Hunter', 'حوّلت الخطأ إلى نمط يمكن فهمه ومعالجته.', 'Turned an error into an explainable, actionable pattern.', 'اكتشف أول نمط خطأ مفاهيمي.', 'Identify your first misconception pattern.', 'lens', 'vermilion', 'learning_event', 'misconception_detected', 1, 45),
  ('understanding_engineer', 4, 'growth', 'مهندس الفهم', 'Understanding Engineer', 'استخدمت تدخلًا تعليميًا موجّهًا بدل حفظ إجابة جاهزة.', 'Used a targeted intervention instead of memorizing a ready answer.', 'أكمل أول تدخل تعليمي موجّه.', 'Complete your first targeted intervention.', 'bridge', 'nile', 'learning_event', 'intervention_completed', 1, 55),
  ('smarter_return', 5, 'growth', 'عودة أذكى', 'Smarter Return', 'عدت للمسألة بنموذج ذهني أفضل وصححت محاولتك.', 'Returned with a stronger mental model and corrected your attempt.', 'قدّم أول إعادة محاولة بعد التدخل.', 'Submit your first retry after intervention.', 'return', 'saffron', 'learning_event', 'retry_submitted', 1, 65),
  ('evidence_builder', 6, 'evidence', 'باني الدليل', 'Evidence Builder', 'أنشأت أكثر من أثر يوضح كيف تغيّر فهمك.', 'Created multiple artifacts showing how your understanding changed.', 'أنشئ دليلي تعلّم مكتملين.', 'Create two completed learning-evidence records.', 'proof', 'nile', 'learning_event', 'evidence_created', 2, 90),
  ('memory_keeper', 7, 'memory', 'حارس الذاكرة', 'Memory Keeper', 'أثبت أن التعلم بقي بعد مرور الوقت، لا أثناء الجلسة فقط.', 'Proved learning remained after time—not only during the session.', 'أكمل 3 مراجعات استرجاعية.', 'Complete three spaced recall reviews.', 'memory', 'lapis', 'learning_event', 'review_recalled', 3, 120),
  ('connection_maker', 8, 'transfer', 'صانع الروابط', 'Connection Maker', 'نقلت الفهم إلى سياق جديد بدل تكرار المثال نفسه.', 'Transferred understanding to a new context instead of repeating the same example.', 'طبّق مفهومين في سياقات جديدة.', 'Apply two concepts in new contexts.', 'transfer', 'vermilion', 'learning_event', 'transfer_applied', 2, 150),
  ('path_finisher', 9, 'completion', 'متمّم المسار', 'Path Finisher', 'أكملت كل دروس مسار منشور وأصبحت على خطوة من الشهادة.', 'Completed every lesson in a published path and moved one step from the credential.', 'أكمل 100% من دروس مسار منشور.', 'Complete 100% of a published learning path.', 'finish', 'saffron', 'course_completion', null, 1, 200)
on conflict (key) do update set
  stage_order = excluded.stage_order,
  stage_key = excluded.stage_key,
  title_ar = excluded.title_ar,
  title_en = excluded.title_en,
  description_ar = excluded.description_ar,
  description_en = excluded.description_en,
  requirement_ar = excluded.requirement_ar,
  requirement_en = excluded.requirement_en,
  icon_key = excluded.icon_key,
  color_key = excluded.color_key,
  criteria_kind = excluded.criteria_kind,
  criteria_value = excluded.criteria_value,
  criteria_threshold = excluded.criteria_threshold,
  xp_reward = excluded.xp_reward,
  is_active = true,
  updated_at = now();

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_key text not null references public.badge_definitions(key) on delete restrict,
  earned_at timestamptz not null default now(),
  evidence_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, badge_key)
);

create index if not exists user_badges_user_earned_idx on public.user_badges(user_id, earned_at desc);

alter table public.badge_definitions enable row level security;
alter table public.user_badges enable row level security;

drop policy if exists badge_definitions_read_active on public.badge_definitions;
create policy badge_definitions_read_active on public.badge_definitions
  for select to anon, authenticated using (is_active = true);

drop policy if exists user_badges_owner_read on public.user_badges;
create policy user_badges_owner_read on public.user_badges
  for select to authenticated using (user_id = auth.uid());

revoke all on public.badge_definitions, public.user_badges from anon, authenticated;
grant select on public.badge_definitions to anon, authenticated;
grant select on public.user_badges to authenticated;

create or replace function public.refresh_badges_for_user_v1(target_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if target_user is null then return; end if;

  insert into public.user_badges (user_id, badge_key, evidence_snapshot)
  select
    target_user,
    definition.key,
    jsonb_build_object(
      'criteriaKind', definition.criteria_kind,
      'eventType', definition.criteria_value,
      'observedCount', observed.event_count,
      'threshold', definition.criteria_threshold,
      'policy', 'fahim_evidence_badges_v1'
    )
  from public.badge_definitions definition
  cross join lateral (
    select count(*)::integer as event_count
    from public.learning_events event
    where event.user_id = target_user and event.event_type = definition.criteria_value
  ) observed
  where definition.is_active
    and definition.criteria_kind = 'learning_event'
    and observed.event_count >= definition.criteria_threshold
  on conflict (user_id, badge_key) do nothing;

  insert into public.user_badges (user_id, badge_key, evidence_snapshot)
  select
    target_user,
    'path_finisher',
    jsonb_build_object(
      'criteriaKind', 'course_completion',
      'courseId', course.id,
      'courseTitle', course.title,
      'completedLessons', course.total_lessons,
      'totalLessons', course.total_lessons,
      'policy', 'fahim_evidence_badges_v1'
    )
  from (
    select
      c.id,
      c.title,
      count(distinct lesson.id)::integer as total_lessons,
      count(distinct case when progress.status = 'completed' or progress.completion_percentage = 100 then lesson.id end)::integer as completed_lessons
    from public.courses c
    join public.lessons lesson on lesson.course_id = c.id
    left join public.progress progress on progress.lesson_id = lesson.id and progress.user_id = target_user
    where c.is_published = true
    group by c.id, c.title
    having count(distinct lesson.id) > 0
       and count(distinct lesson.id) = count(distinct case when progress.status = 'completed' or progress.completion_percentage = 100 then lesson.id end)
    order by c.id
    limit 1
  ) course
  on conflict (user_id, badge_key) do nothing;
end;
$$;

revoke all on function public.refresh_badges_for_user_v1(uuid) from public, anon, authenticated;

create or replace function public.my_badge_progress_v1()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  learner_id uuid := auth.uid();
  result jsonb;
begin
  if learner_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  perform public.refresh_badges_for_user_v1(learner_id);

  select jsonb_build_object(
    'earnedCount', (select count(*) from public.user_badges badge where badge.user_id = learner_id),
    'totalCount', (select count(*) from public.badge_definitions definition where definition.is_active),
    'certificateCount', (select count(*) from public.certificates certificate where certificate.user_id = learner_id and certificate.status = 'issued' and certificate.revoked_at is null),
    'badgeXp', coalesce((select sum(definition.xp_reward) from public.user_badges badge join public.badge_definitions definition on definition.key = badge.badge_key where badge.user_id = learner_id), 0),
    'badges', coalesce((
      select jsonb_agg(jsonb_build_object(
        'key', definition.key,
        'stageOrder', definition.stage_order,
        'stageKey', definition.stage_key,
        'titleAr', definition.title_ar,
        'titleEn', definition.title_en,
        'descriptionAr', definition.description_ar,
        'descriptionEn', definition.description_en,
        'requirementAr', definition.requirement_ar,
        'requirementEn', definition.requirement_en,
        'iconKey', definition.icon_key,
        'colorKey', definition.color_key,
        'threshold', definition.criteria_threshold,
        'xpReward', definition.xp_reward,
        'earnedAt', earned.earned_at,
        'evidence', earned.evidence_snapshot
      ) order by definition.stage_order)
      from public.badge_definitions definition
      left join public.user_badges earned on earned.badge_key = definition.key and earned.user_id = learner_id
      where definition.is_active
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.my_badge_progress_v1() from public, anon;
grant execute on function public.my_badge_progress_v1() to authenticated;

create or replace function public.award_badges_after_learning_event_v1()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_badges_for_user_v1(new.user_id);
  return new;
end;
$$;

revoke all on function public.award_badges_after_learning_event_v1() from public, anon, authenticated;

drop trigger if exists award_badges_after_learning_event_v1 on public.learning_events;
create trigger award_badges_after_learning_event_v1
after insert or update of event_type on public.learning_events
for each row execute function public.award_badges_after_learning_event_v1();

create or replace function public.award_badges_after_progress_v1()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_badges_for_user_v1(new.user_id);
  return new;
end;
$$;

revoke all on function public.award_badges_after_progress_v1() from public, anon, authenticated;

drop trigger if exists award_badges_after_progress_v1 on public.progress;
create trigger award_badges_after_progress_v1
after insert or update of status, completion_percentage on public.progress
for each row execute function public.award_badges_after_progress_v1();

-- Backfill safely for existing learners without inventing activity.
do $$
declare learner record;
begin
  for learner in
    select distinct user_id from public.learning_events
    union
    select distinct user_id from public.progress
  loop
    perform public.refresh_badges_for_user_v1(learner.user_id);
  end loop;
end;
$$;

notify pgrst, 'reload schema';
