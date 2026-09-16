-- Fahim course completion, end to end.
--
-- `progress` and `quiz_results` are read by `my_certificate_eligibility_v2` and by the
-- `path_finisher` badge, but nothing in the product ever wrote a row to either table, and
-- no migration in this repository created `courses` or `lessons`. The flagship claim — a
-- completion credential backed by evidence — therefore could not fire for any learner, and
-- the final badge in the ladder was unreachable.
--
-- This migration makes completion a real, server-graded, server-persisted action:
--   1. creates the course tables for a fresh project (no-op where they already exist),
--   2. seeds one bilingual course with lessons and a published assessment, but only when
--      the project has no course content, so a live deployment is never touched,
--   3. exposes the assessment questions without their answers,
--   4. grades a submission inside the database and records the attempt itself.
--
-- Additive only.

-- ---------------------------------------------------------------------------
-- 1. Course tables for a fresh project
-- ---------------------------------------------------------------------------

-- These columns are the ones the deployed code already reads and writes
-- (see api/certificates.mjs createCredentialCourse, and verify_certificate_v2 which
-- coalesces `courses.title` with a text literal, so the live column is text rather
-- than localized JSON).
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  description text not null default '',
  teacher_id uuid references auth.users(id) on delete set null,
  category text not null default 'education',
  level text not null default 'beginner',
  duration_weeks integer not null default 1,
  price numeric(10,2) not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null default '',
  position integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lessons_course_position_idx on public.lessons(course_id, position);

alter table public.courses enable row level security;
alter table public.lessons enable row level security;

-- Published courses are readable by anyone; authoring stays with teachers and admins.
drop policy if exists "courses_read_published" on public.courses;
create policy "courses_read_published" on public.courses
  for select to anon, authenticated
  using (is_published or exists (
    select 1 from public.user_roles ur join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid() and r.key in ('admin', 'instructor')
  ));

drop policy if exists "lessons_read_published" on public.lessons;
create policy "lessons_read_published" on public.lessons
  for select to anon, authenticated
  using (exists (select 1 from public.courses c where c.id = lessons.course_id and c.is_published));

-- ---------------------------------------------------------------------------
-- 2. Seed one completable course, only when the project has no content
-- ---------------------------------------------------------------------------

do $$
declare
  seeded_course uuid := 'f1000000-0000-4000-8000-000000000001';
  seeded_quiz uuid := 'f1000000-0000-4000-8000-000000000201';
  course_row uuid;
  missing text;
begin
  -- Refuse to touch a project that already has course content.
  perform 1 from public.courses limit 1;
  if found then
    raise notice 'Fahim: courses already exist, skipping the verified-course seed.';
    return;
  end if;

  select string_agg(needed.column_name, ', ')
    into missing
  from (values ('id'), ('title'), ('is_published')) as needed(column_name)
  where not exists (
    select 1 from information_schema.columns c
    where c.table_schema = 'public' and c.table_name = 'courses' and c.column_name = needed.column_name
  );
  if missing is not null then
    raise notice 'Fahim: public.courses is missing %; skipping the verified-course seed.', missing;
    return;
  end if;

  insert into public.courses (id, title, description, category, level, duration_weeks, price, is_published)
  values (
    seeded_course,
    'أساسيات الفيزياء: القوة والحركة / Physics Foundations: Force and Motion',
    'مسار قصير يبني فهمًا حقيقيًا للعلاقة بين القوة والكتلة والتسارع، مع تقييم يُصحَّح على الخادم.',
    'education', 'beginner', 1, 0, true
  )
  on conflict (id) do nothing;
  course_row := seeded_course;

  -- Lessons need the columns the completion logic joins on.
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'lessons' and column_name = 'course_id')
     and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'lessons' and column_name = 'title') then
    insert into public.lessons (id, course_id, title, position) values
      ('f1000000-0000-4000-8000-000000000101', course_row, 'القوة ليست سرعة / Force is not velocity', 1),
      ('f1000000-0000-4000-8000-000000000102', course_row, 'الكتلة تغيّر الاستجابة / Mass changes the response', 2),
      ('f1000000-0000-4000-8000-000000000103', course_row, 'قراءة العلاقة F = ma / Reading the relation F = ma', 3),
      ('f1000000-0000-4000-8000-000000000104', course_row, 'تطبيق على موقف جديد / Applying it to a new situation', 4)
    on conflict (id) do nothing;
  else
    raise notice 'Fahim: public.lessons shape is unsupported; lessons were not seeded.';
  end if;

  -- One published assessment is required before a credential can be issued.
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'quizzes' and column_name = 'course_id') then
    insert into public.quizzes (id, course_id, title, description, difficulty, passing_score, is_published, metadata)
    values (
      seeded_quiz,
      course_row,
      'تقييم أساسيات القوة والحركة',
      'أربعة أسئلة تطبيقية تُصحَّح على الخادم. النجاح من 70%.',
      'medium', 70, true,
      jsonb_build_object('language', 'ar', 'policy', 'fahim_course_assessment_v1')
    )
    on conflict (id) do nothing;

    insert into public.quiz_questions (id, quiz_id, type, prompt, choices, answer_key, explanation, points, position) values
      ('f1000000-0000-4000-8000-000000000301', seeded_quiz, 'multiple_choice',
       'جسم يتحرك بسرعة ثابتة. ما مقدار القوة المحصلة عليه؟',
       '["صفر", "مساوية لسرعته", "مساوية لكتلته", "تزداد مع الزمن"]'::jsonb,
       '{"correctIndex": 0}'::jsonb,
       'السرعة الثابتة تعني تسارعًا صفريًا، ومن F = ma تكون القوة المحصلة صفرًا. السرعة ليست قوة.',
       1, 1),
      ('f1000000-0000-4000-8000-000000000302', seeded_quiz, 'multiple_choice',
       'نفس القوة تُطبَّق على جسمين، كتلة الثاني ضعف الأول. ماذا يحدث لتسارع الثاني؟',
       '["ينخفض إلى النصف", "يتضاعف", "لا يتغير", "يصبح صفرًا"]'::jsonb,
       '{"correctIndex": 0}'::jsonb,
       'من a = F/m، مضاعفة الكتلة مع ثبات القوة تنصّف التسارع.',
       1, 2),
      ('f1000000-0000-4000-8000-000000000303', seeded_quiz, 'multiple_choice',
       'ما وحدة قياس القوة في النظام الدولي؟',
       '["نيوتن", "جول", "واط", "كيلوجرام"]'::jsonb,
       '{"correctIndex": 0}'::jsonb,
       'النيوتن = كجم·م/ث². الجول طاقة والواط قدرة.',
       1, 3),
      ('f1000000-0000-4000-8000-000000000304', seeded_quiz, 'multiple_choice',
       'سيارة تتباطأ. ما اتجاه القوة المحصلة بالنسبة لحركتها؟',
       '["عكس اتجاه الحركة", "في اتجاه الحركة", "عمودية على الحركة", "لا توجد قوة"]'::jsonb,
       '{"correctIndex": 0}'::jsonb,
       'التباطؤ تسارع سالب، فتكون القوة المحصلة عكس اتجاه السرعة.',
       1, 4)
    on conflict (id) do nothing;
  else
    raise notice 'Fahim: public.quizzes shape is unsupported; the assessment was not seeded.';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Assessment questions without their answers
-- ---------------------------------------------------------------------------

create or replace function public.course_assessment_v1(target_course uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'quizId', q.id,
    'questionId', qq.id,
    'prompt', qq.prompt,
    'choices', qq.choices,
    'points', qq.points,
    'position', qq.position
  ) order by qq.position), '[]'::jsonb)
  from public.quizzes q
  join public.quiz_questions qq on qq.quiz_id = q.id
  where q.course_id = target_course
    and q.is_published = true;
$$;

revoke all on function public.course_assessment_v1(uuid) from public;
grant execute on function public.course_assessment_v1(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Server-graded submission that records the attempt
-- ---------------------------------------------------------------------------

create or replace function public.submit_course_assessment_v1(target_quiz uuid, responses jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  learner uuid := auth.uid();
  total_points numeric := 0;
  earned_points numeric := 0;
  answered integer := 0;
  expected integer := 0;
  percentage numeric := 0;
  next_attempt integer := 1;
  passed boolean := false;
  feedback jsonb := '[]'::jsonb;
  row_data record;
  selected integer;
begin
  if learner is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if not exists (select 1 from public.quizzes q where q.id = target_quiz and q.is_published = true) then
    raise exception 'quiz_not_available' using errcode = '22023';
  end if;
  if jsonb_typeof(coalesce(responses, '[]'::jsonb)) <> 'array' then
    raise exception 'responses_must_be_an_array' using errcode = '22023';
  end if;
  -- Validate the shape before any cast, so a malformed payload is a clean 400-style error
  -- rather than an invalid-text-representation failure deep inside the loop.
  if exists (
    select 1 from jsonb_array_elements(coalesce(responses, '[]'::jsonb)) item
    where item ->> 'questionId' !~ '^[0-9a-fA-F-]{36}$'
       or (item ->> 'selectedIndex') !~ '^[0-3]$'
  ) then
    raise exception 'invalid_response_shape' using errcode = '22023';
  end if;

  for row_data in
    select qq.id, qq.answer_key, qq.explanation, qq.points, qq.position
    from public.quiz_questions qq
    where qq.quiz_id = target_quiz
    order by qq.position
  loop
    expected := expected + 1;
    total_points := total_points + row_data.points;

    -- Answers arrive as [{ "questionId": uuid, "selectedIndex": 0..3 }, ...]
    select nullif(item ->> 'selectedIndex', '')::integer
      into selected
    from jsonb_array_elements(responses) item
    where (item ->> 'questionId')::uuid = row_data.id
    limit 1;

    if selected is not null and selected = (row_data.answer_key ->> 'correctIndex')::integer then
      earned_points := earned_points + row_data.points;
      answered := answered + 1;
      feedback := feedback || jsonb_build_array(jsonb_build_object(
        'questionId', row_data.id, 'correct', true,
        'correctIndex', (row_data.answer_key ->> 'correctIndex')::integer,
        'explanation', row_data.explanation
      ));
    else
      feedback := feedback || jsonb_build_array(jsonb_build_object(
        'questionId', row_data.id, 'correct', false,
        'correctIndex', (row_data.answer_key ->> 'correctIndex')::integer,
        'explanation', row_data.explanation
      ));
    end if;
  end loop;

  if total_points <= 0 then
    raise exception 'quiz_has_no_questions' using errcode = '22023';
  end if;

  percentage := round((earned_points / total_points) * 100);
  passed := percentage >= coalesce((select passing_score from public.quizzes where id = target_quiz), 70);

  select coalesce(max(attempt), 0) + 1 into next_attempt
  from public.quiz_results where quiz_id = target_quiz and user_id = learner;

  insert into public.quiz_results (quiz_id, user_id, attempt, answers, score, percentage, passed, grading_feedback, submitted_at)
  values (target_quiz, learner, next_attempt, responses, earned_points, percentage, passed, jsonb_build_object('perQuestion', feedback, 'policy', 'server_graded_course_assessment_v1'), now())
  on conflict (quiz_id, user_id, attempt) do nothing;

  return jsonb_build_object(
    'attempt', next_attempt,
    'correctCount', answered,
    'questionCount', expected,
    'percentage', percentage,
    'passed', passed,
    'feedback', feedback
  );
end;
$$;

revoke all on function public.submit_course_assessment_v1(uuid, jsonb) from public, anon;
grant execute on function public.submit_course_assessment_v1(uuid, jsonb) to authenticated;

notify pgrst, 'reload schema';
