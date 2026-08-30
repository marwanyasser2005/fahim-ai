-- Fahim branded recovery window and automatic completion credentials.
-- Password recovery remains usable for ten minutes from the most recent request.

create or replace function public.recovery_window_for_user_v1(target_user uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, auth
as $$
  select jsonb_build_object(
    'eligible', coalesce(u.recovery_sent_at >= now() - interval '10 minutes', false),
    'requestedAt', u.recovery_sent_at,
    'expiresAt', case when u.recovery_sent_at is null then null else u.recovery_sent_at + interval '10 minutes' end
  )
  from auth.users u
  where u.id = target_user;
$$;

revoke all on function public.recovery_window_for_user_v1(uuid) from public, anon, authenticated;
grant execute on function public.recovery_window_for_user_v1(uuid) to service_role;

create or replace function public.generate_certificate_number_v2()
returns text
language sql
volatile
set search_path = public
as $$
  select 'FAH-' || to_char(now(), 'YYYY') || '-' || upper(substr(encode(extensions.gen_random_bytes(8), 'hex'), 1, 12));
$$;

revoke all on function public.generate_certificate_number_v2() from public, anon, authenticated;
grant execute on function public.generate_certificate_number_v2() to service_role;

update public.certificates
set issuer_name = 'Marwan Abdelghaffar',
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'issuerTitle', 'Founder of Fahim AI',
      'publicLabel', 'Certificate of Completion',
      'nonAccredited', true
    )
where issuer_name is null or issuer_name in ('FAHIM', 'Fahim — فَهيم');

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
    where c.is_published = true
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
       where l.course_id = c.id
         and p.user_id = auth.uid()
         and (p.status = 'completed' or p.completion_percentage = 100)) as completed_lessons,
      coalesce((select max(qr.percentage)
        from public.quizzes q
        join public.quiz_results qr on qr.quiz_id = q.id
        where q.course_id = c.id
          and q.is_published = true
          and qr.user_id = auth.uid()
          and qr.submitted_at is not null), 0) as final_score,
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
  learner_id uuid := auth.uid();
  learner_name text;
  course_title text;
  total_lessons integer;
  completed_lessons integer;
  published_quizzes integer;
  final_score numeric;
  existing_record public.certificates%rowtype;
  created_record public.certificates%rowtype;
  public_number text;
  registry_fingerprint text;
begin
  if learner_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  select p.full_name into learner_name from public.profiles p where p.id = learner_id;
  if coalesce(length(trim(learner_name)), 0) < 2 then
    raise exception 'A verified learner name is required before certificate issuance.' using errcode = '23514';
  end if;

  select c.title into course_title
  from public.courses c
  where c.id = target_course and c.is_published = true
  for share;
  if course_title is null then
    raise exception 'The learning path is not available for certification.' using errcode = '23514';
  end if;

  select * into existing_record
  from public.certificates c
  where c.user_id = learner_id and c.course_id = target_course;
  if existing_record.id is not null then
    return jsonb_build_object(
      'id', existing_record.id,
      'certificateNumber', existing_record.certificate_number,
      'status', existing_record.status,
      'issuedAt', existing_record.issued_at,
      'alreadyIssued', true,
      'verifyPath', '/verify/' || existing_record.certificate_number
    );
  end if;

  select count(*) into total_lessons from public.lessons l where l.course_id = target_course;
  select count(distinct l.id) into completed_lessons
  from public.lessons l
  join public.progress p on p.lesson_id = l.id
  where l.course_id = target_course
    and p.user_id = learner_id
    and (p.status = 'completed' or p.completion_percentage = 100);
  select count(*) into published_quizzes from public.quizzes q where q.course_id = target_course and q.is_published = true;
  select coalesce(max(qr.percentage), 0) into final_score
  from public.quizzes q
  join public.quiz_results qr on qr.quiz_id = q.id
  where q.course_id = target_course
    and q.is_published = true
    and qr.user_id = learner_id
    and qr.submitted_at is not null;

  if total_lessons = 0 or completed_lessons <> total_lessons then
    raise exception 'Every lesson must be completed before certificate issuance.' using errcode = '23514';
  end if;
  if published_quizzes = 0 or final_score < 70 then
    raise exception 'A published final assessment score of at least 70%% is required.' using errcode = '23514';
  end if;

  public_number := public.generate_certificate_number_v2();
  registry_fingerprint := encode(digest(
    learner_id::text || ':' || target_course::text || ':' || public_number || ':' || final_score::text,
    'sha256'
  ), 'hex');

  insert into public.certificates (
    user_id,
    course_id,
    certificate_number,
    status,
    credential_type,
    issuer_name,
    evidence_snapshot,
    signature_algorithm,
    signature,
    metadata
  ) values (
    learner_id,
    target_course,
    public_number,
    'issued',
    'completion',
    'Marwan Abdelghaffar',
    jsonb_build_object(
      'completionPercent', 100,
      'completedLessons', completed_lessons,
      'totalLessons', total_lessons,
      'finalAssessmentScore', final_score,
      'reviewMode', 'automatic_database_evidence',
      'policy', 'fahim_completion_v2',
      'issuedBy', 'Marwan Abdelghaffar',
      'issuerTitle', 'Founder of Fahim AI',
      'accreditation', 'not_academically_accredited'
    ),
    'SHA-256 registry fingerprint',
    registry_fingerprint,
    jsonb_build_object(
      'publicLabel', 'Certificate of Completion',
      'issuerTitle', 'Founder of Fahim AI',
      'nonAccredited', true,
      'issuancePolicy', 'automatic_database_evidence_v2'
    )
  ) returning * into created_record;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    learner_id,
    'certificate.completion_auto_issued',
    'certificate',
    created_record.id,
    jsonb_build_object('course_id', target_course, 'completed_lessons', completed_lessons, 'final_score', final_score)
  );

  return jsonb_build_object(
    'id', created_record.id,
    'certificateNumber', created_record.certificate_number,
    'status', created_record.status,
    'issuedAt', created_record.issued_at,
    'alreadyIssued', false,
    'verifyPath', '/verify/' || created_record.certificate_number
  );
end;
$$;

revoke all on function public.issue_my_completion_certificate_v2(uuid) from public, anon;
grant execute on function public.issue_my_completion_certificate_v2(uuid) to authenticated;

create or replace function public.verify_certificate_v2(certificate_identifier text)
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
    'issuer_title', coalesce(c.metadata ->> 'issuerTitle', 'Founder of Fahim AI'),
    'issued_at', c.issued_at,
    'course_id', c.course_id,
    'course_title', coalesce(crs.title, ''),
    'learner_name', p.full_name,
    'status', case when c.revoked_at is not null or c.status = 'revoked' then 'revoked' else c.status end,
    'evidence', c.evidence_snapshot,
    'registry_fingerprint', c.signature,
    'fingerprint_algorithm', c.signature_algorithm,
    'verification_path', '/verify/' || c.certificate_number,
    'non_accredited', coalesce((c.metadata ->> 'nonAccredited')::boolean, true)
  )
  from public.certificates c
  join public.profiles p on p.id = c.user_id
  left join public.courses crs on crs.id = c.course_id
  where (lower(c.certificate_number) = lower(trim(certificate_identifier)) or c.id::text = trim(certificate_identifier))
    and c.status in ('issued', 'revoked');
$$;

revoke all on function public.verify_certificate_v2(text) from public;
grant execute on function public.verify_certificate_v2(text) to anon, authenticated;
