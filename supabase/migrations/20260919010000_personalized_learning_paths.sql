-- Private, AI-generated learning paths with server-backed progress and credentials.
-- The AI may propose content, but the database remains the authority for completion,
-- assessment grading, and certificate issuance.

alter table public.courses add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.courses add column if not exists source text not null default 'catalog';
alter table public.courses add column if not exists language text not null default 'ar';
alter table public.courses add column if not exists thumbnail_url text;

alter table public.lessons add column if not exists content text not null default '';
alter table public.lessons add column if not exists position integer not null default 1;
alter table public.lessons add column if not exists order_index integer not null default 0;
alter table public.lessons add column if not exists duration_minutes integer not null default 30;
alter table public.lessons add column if not exists media_type text not null default 'interactive';
alter table public.lessons add column if not exists is_published boolean not null default false;
alter table public.lessons add column if not exists metadata jsonb not null default '{}'::jsonb;

update public.lessons
set position = greatest(1, order_index + 1)
where position = 1 and order_index > 0;

create index if not exists courses_personalized_owner_idx
  on public.courses(teacher_id, created_at desc)
  where source = 'genai';

drop policy if exists "courses_read_published" on public.courses;
drop policy if exists "courses_read_published_or_owned" on public.courses;
create policy "courses_read_published_or_owned" on public.courses
  for select to anon, authenticated
  using (
    is_published
    or teacher_id = auth.uid()
    or exists (
      select 1 from public.user_roles ur join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid() and r.key in ('admin', 'instructor')
    )
  );

drop policy if exists "lessons_read_published" on public.lessons;
drop policy if exists "lessons_read_published_or_owned" on public.lessons;
create policy "lessons_read_published_or_owned" on public.lessons
  for select to authenticated
  using (exists (
    select 1 from public.courses c
    where c.id = lessons.course_id and (c.is_published or c.teacher_id = auth.uid())
  ));

-- Never expose answer keys from a private course merely because its final quiz is
-- available. Learners receive questions through this function without answer_key.
create or replace function public.course_assessment_v1(target_course uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case
    when not exists (
      select 1 from public.courses c
      where c.id = target_course and (c.is_published or c.teacher_id = auth.uid())
    ) then '[]'::jsonb
    else coalesce((
      select jsonb_agg(jsonb_build_object(
        'quizId', q.id,
        'questionId', qq.id,
        'prompt', qq.prompt,
        'choices', qq.choices,
        'points', qq.points,
        'position', qq.position
      ) order by qq.position)
      from public.quizzes q
      join public.quiz_questions qq on qq.quiz_id = q.id
      where q.course_id = target_course and q.is_published = true
    ), '[]'::jsonb)
  end;
$$;

revoke all on function public.course_assessment_v1(uuid) from public, anon;
grant execute on function public.course_assessment_v1(uuid) to authenticated;

create or replace function public.my_certificate_eligibility_v2()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with candidate_courses as (
    select c.id, c.title
    from public.courses c
    where (c.is_published or c.teacher_id = auth.uid())
      and (
        exists (select 1 from public.progress p where p.user_id = auth.uid() and p.course_id = c.id)
        or exists (select 1 from public.certificates cert where cert.user_id = auth.uid() and cert.course_id = c.id)
      )
  ), course_evidence as (
    select
      c.id,
      c.title,
      (select count(*) from public.lessons l where l.course_id = c.id) as total_lessons,
      (select count(distinct l.id)
       from public.lessons l
       join public.progress p on p.lesson_id = l.id
       where l.course_id = c.id and p.user_id = auth.uid()
         and (p.status = 'completed' or p.completion_percentage = 100)) as completed_lessons,
      coalesce((select max(qr.percentage)
        from public.quizzes q join public.quiz_results qr on qr.quiz_id = q.id
        where q.course_id = c.id and q.is_published = true
          and qr.user_id = auth.uid() and qr.submitted_at is not null), 0) as final_score,
      (select count(*) from public.quizzes q where q.course_id = c.id and q.is_published = true) as published_quizzes
    from candidate_courses c
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'courseId', e.id,
    'courseTitle', e.title,
    'totalLessons', e.total_lessons,
    'completedLessons', e.completed_lessons,
    'completionPercent', case when e.total_lessons = 0 then 0 else round((e.completed_lessons::numeric / e.total_lessons::numeric) * 100) end,
    'finalAssessmentScore', e.final_score,
    'eligible', e.total_lessons > 0 and e.completed_lessons = e.total_lessons and e.published_quizzes > 0 and e.final_score >= 70,
    'certificateId', cert.id,
    'certificateNumber', cert.certificate_number,
    'certificateStatus', cert.status,
    'issuedAt', cert.issued_at
  ) order by e.title), '[]'::jsonb)
  from course_evidence e
  left join public.certificates cert on cert.user_id = auth.uid() and cert.course_id = e.id;
$$;

revoke all on function public.my_certificate_eligibility_v2() from public, anon;
grant execute on function public.my_certificate_eligibility_v2() to authenticated;

create or replace function public.issue_my_completion_certificate_v2(target_course uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  learner_id uuid := auth.uid(); learner_name text; course_title text;
  total_lessons integer; completed_lessons integer; published_quizzes integer;
  final_score numeric; existing_record public.certificates%rowtype;
  created_record public.certificates%rowtype; public_number text; registry_fingerprint text;
begin
  if learner_id is null then raise exception 'Authentication required.' using errcode = '42501'; end if;
  select p.full_name into learner_name from public.profiles p where p.id = learner_id;
  if coalesce(length(trim(learner_name)), 0) < 2 then
    raise exception 'A verified learner name is required before certificate issuance.' using errcode = '23514';
  end if;

  select c.title into course_title from public.courses c
  where c.id = target_course and (c.is_published or c.teacher_id = learner_id) for share;
  if course_title is null then
    raise exception 'The learning path is not available for certification.' using errcode = '23514';
  end if;

  select * into existing_record from public.certificates c
  where c.user_id = learner_id and c.course_id = target_course;
  if existing_record.id is not null then
    return jsonb_build_object('id', existing_record.id, 'certificateNumber', existing_record.certificate_number,
      'status', existing_record.status, 'issuedAt', existing_record.issued_at, 'alreadyIssued', true,
      'verifyPath', '/verify/' || existing_record.certificate_number);
  end if;

  select count(*) into total_lessons from public.lessons l where l.course_id = target_course;
  select count(distinct l.id) into completed_lessons
  from public.lessons l join public.progress p on p.lesson_id = l.id
  where l.course_id = target_course and p.user_id = learner_id
    and (p.status = 'completed' or p.completion_percentage = 100);
  select count(*) into published_quizzes from public.quizzes q where q.course_id = target_course and q.is_published = true;
  select coalesce(max(qr.percentage), 0) into final_score
  from public.quizzes q join public.quiz_results qr on qr.quiz_id = q.id
  where q.course_id = target_course and q.is_published = true
    and qr.user_id = learner_id and qr.submitted_at is not null;

  if total_lessons = 0 or completed_lessons <> total_lessons then
    raise exception 'Every lesson must be completed before certificate issuance.' using errcode = '23514';
  end if;
  if published_quizzes = 0 or final_score < 70 then
    raise exception 'A published final assessment score of at least 70%% is required.' using errcode = '23514';
  end if;

  public_number := public.generate_certificate_number_v2();
  registry_fingerprint := encode(digest(learner_id::text || ':' || target_course::text || ':' || public_number || ':' || final_score::text, 'sha256'), 'hex');
  insert into public.certificates (user_id, course_id, certificate_number, status, credential_type,
    issuer_name, evidence_snapshot, signature_algorithm, signature, metadata)
  values (learner_id, target_course, public_number, 'issued', 'completion', 'Marwan Abdelghaffar',
    jsonb_build_object('completionPercent', 100, 'completedLessons', completed_lessons,
      'totalLessons', total_lessons, 'finalAssessmentScore', final_score,
      'reviewMode', 'automatic_database_evidence', 'policy', 'fahim_completion_v2',
      'issuedBy', 'Marwan Abdelghaffar', 'issuerTitle', 'Founder of Fahim AI',
      'accreditation', 'not_academically_accredited'),
    'SHA-256 registry fingerprint', registry_fingerprint,
    jsonb_build_object('publicLabel', 'Certificate of Completion', 'issuerTitle', 'Founder of Fahim AI',
      'nonAccredited', true, 'issuancePolicy', 'automatic_database_evidence_v2'))
  returning * into created_record;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (learner_id, 'certificate.completion_auto_issued', 'certificate', created_record.id,
    jsonb_build_object('course_id', target_course, 'completed_lessons', completed_lessons, 'final_score', final_score));
  return jsonb_build_object('id', created_record.id, 'certificateNumber', created_record.certificate_number,
    'status', created_record.status, 'issuedAt', created_record.issued_at, 'alreadyIssued', false,
    'verifyPath', '/verify/' || created_record.certificate_number);
end;
$$;

revoke all on function public.issue_my_completion_certificate_v2(uuid) from public, anon;
grant execute on function public.issue_my_completion_certificate_v2(uuid) to authenticated;

notify pgrst, 'reload schema';
