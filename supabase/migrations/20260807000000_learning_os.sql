/*
  Fahim Learning OS — production data model
  Adds the user, learning, conversation, assessment, commerce, notification,
  authorization, and audit primitives required by the application.
*/

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique check (username is null or username ~ '^[a-zA-Z0-9_]{3,30}$'),
  full_name text not null default '',
  avatar_url text,
  banner_url text,
  bio text not null default '' check (char_length(bio) <= 500),
  locale text not null default 'ar-EG',
  timezone text not null default 'Africa/Cairo',
  xp integer not null default 0 check (xp >= 0),
  level integer not null default 1 check (level >= 1),
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  daily_goal_minutes integer not null default 30 check (daily_goal_minutes between 5 and 480),
  last_learning_date date,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  key text unique not null check (key in ('student', 'instructor', 'moderator', 'admin')),
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

insert into public.roles (key, name, description) values
  ('student', 'Student', 'Learns, takes notes, and completes assessments'),
  ('instructor', 'Instructor', 'Creates and manages learning content'),
  ('moderator', 'Moderator', 'Reviews community content and reports'),
  ('admin', 'Administrator', 'Manages the platform and authorization')
on conflict (key) do update set name = excluded.name, description = excluded.description;

insert into public.permissions (key, description) values
  ('courses.read', 'Read published courses'),
  ('courses.create', 'Create courses'),
  ('courses.manage_own', 'Manage owned courses'),
  ('courses.manage_all', 'Manage every course'),
  ('users.moderate', 'Moderate user generated content'),
  ('users.manage', 'Manage user access'),
  ('analytics.read', 'Read platform analytics'),
  ('prompts.manage', 'Manage AI prompts'),
  ('features.manage', 'Manage feature flags'),
  ('audit.read', 'Read security audit events')
on conflict (key) do update set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r cross join public.permissions p
where
  (r.key = 'student' and p.key = 'courses.read') or
  (r.key = 'instructor' and p.key in ('courses.read', 'courses.create', 'courses.manage_own', 'analytics.read')) or
  (r.key = 'moderator' and p.key in ('courses.read', 'users.moderate', 'analytics.read')) or
  (r.key = 'admin')
on conflict do nothing;

create or replace function public.has_role(role_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid() and r.key = role_key
  );
$$;

create or replace function public.has_permission(permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.id = rp.permission_id
    where ur.user_id = auth.uid() and p.key = permission_key
  );
$$;

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  youtube_id text unique not null check (youtube_id ~ '^[A-Za-z0-9_-]{6,20}$'),
  course_id uuid references public.courses(id) on delete set null,
  lesson_id uuid references public.lessons(id) on delete set null,
  title text not null,
  description text not null default '',
  channel_id text,
  channel_title text,
  thumbnail_url text,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  language text,
  captions_available boolean not null default false,
  learning_score numeric(5,2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation' check (char_length(title) <= 160),
  folder text not null default '' check (char_length(folder) <= 80),
  subject text not null default '' check (char_length(subject) <= 80),
  learner_level text not null default '' check (char_length(learner_level) <= 80),
  mode text not null default 'explain' check (mode in ('explain', 'quiz', 'flashcards', 'plan', 'summary', 'project')),
  is_pinned boolean not null default false,
  is_archived boolean not null default false,
  share_token_hash text,
  shared_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_history (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null check (char_length(content) <= 50000),
  model text,
  citations jsonb not null default '[]'::jsonb,
  attachments jsonb not null default '[]'::jsonb,
  feedback smallint check (feedback in (-1, 1)),
  is_favorite boolean not null default false,
  parent_message_id uuid references public.chat_history(id) on delete set null,
  token_count integer check (token_count is null or token_count >= 0),
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null check (entity_type in ('video', 'conversation', 'message', 'course', 'lesson', 'note', 'search')),
  entity_id text not null,
  title text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, entity_type, entity_id)
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  video_id uuid references public.videos(id) on delete cascade,
  title text not null default '',
  content text not null default '' check (char_length(content) <= 100000),
  content_format text not null default 'markdown' check (content_format in ('plain', 'markdown', 'html')),
  timestamp_seconds integer check (timestamp_seconds is null or timestamp_seconds >= 0),
  highlights jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  ai_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  video_id uuid references public.videos(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('not_started', 'in_progress', 'completed')),
  completion_percentage numeric(5,2) not null default 0 check (completion_percentage between 0 and 100),
  position_seconds integer not null default 0 check (position_seconds >= 0),
  time_spent_seconds integer not null default 0 check (time_spent_seconds >= 0),
  completed_at timestamptz,
  last_accessed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(course_id, lesson_id, video_id) >= 1)
);

create unique index if not exists progress_user_lesson_unique on public.progress(user_id, lesson_id) where lesson_id is not null;
create unique index if not exists progress_user_video_unique on public.progress(user_id, video_id) where video_id is not null;

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  title text not null,
  description text not null default '',
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard', 'adaptive')),
  passing_score numeric(5,2) not null default 70 check (passing_score between 0 and 100),
  time_limit_minutes integer check (time_limit_minutes is null or time_limit_minutes > 0),
  is_published boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  type text not null check (type in ('multiple_choice', 'true_false', 'fill_blank', 'code', 'essay')),
  prompt text not null,
  choices jsonb not null default '[]'::jsonb,
  answer_key jsonb not null default '{}'::jsonb,
  explanation text not null default '',
  points numeric(8,2) not null default 1 check (points > 0),
  position integer not null default 0,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt integer not null default 1 check (attempt > 0),
  answers jsonb not null default '{}'::jsonb,
  score numeric(8,2) not null default 0,
  percentage numeric(5,2) not null default 0 check (percentage between 0 and 100),
  passed boolean not null default false,
  grading_feedback jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  unique (quiz_id, user_id, attempt)
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  certificate_number text unique not null default encode(gen_random_bytes(12), 'hex'),
  verification_hash text unique not null default encode(digest(gen_random_uuid()::text, 'sha256'), 'hex'),
  issued_at timestamptz not null default now(),
  revoked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  unique (user_id, course_id)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  provider text not null default 'stripe',
  provider_customer_id text unique,
  provider_subscription_id text unique,
  plan text not null default 'free',
  status text not null default 'active' check (status in ('active', 'trialing', 'past_due', 'paused', 'canceled', 'incomplete')),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.feature_flags (
  key text primary key,
  description text not null default '',
  enabled boolean not null default false,
  rollout_percentage smallint not null default 0 check (rollout_percentage between 0 and 100),
  rules jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  ip_hash text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists conversations_user_updated_idx on public.conversations(user_id, updated_at desc);
create index if not exists chat_history_conversation_created_idx on public.chat_history(conversation_id, created_at);
create index if not exists bookmarks_user_created_idx on public.bookmarks(user_id, created_at desc);
create index if not exists notes_user_updated_idx on public.notes(user_id, updated_at desc);
create index if not exists quiz_results_user_idx on public.quiz_results(user_id, submitted_at desc);
create index if not exists notifications_user_unread_idx on public.notifications(user_id, created_at desc) where read_at is null;
create index if not exists audit_logs_created_idx on public.audit_logs(created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array['profiles', 'videos', 'conversations', 'notes', 'progress', 'quizzes', 'subscriptions']
  loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', table_name, table_name);
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end $$;

create or replace function public.handle_learning_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare student_role_id uuid;
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  select id into student_role_id from public.roles where key = 'student';
  insert into public.user_roles (user_id, role_id) values (new.id, student_role_id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_learning_os on auth.users;
create trigger on_auth_user_created_learning_os
after insert on auth.users
for each row execute function public.handle_learning_user();

-- Backfill accounts created before the Learning OS trigger existed.
insert into public.profiles (id, full_name, avatar_url)
select
  account.id,
  coalesce(account.raw_user_meta_data->>'full_name', account.email, ''),
  account.raw_user_meta_data->>'avatar_url'
from auth.users account
on conflict (id) do nothing;

insert into public.user_roles (user_id, role_id)
select account.id, role_record.id
from auth.users account
cross join public.roles role_record
where role_record.key = 'student'
on conflict do nothing;

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.videos enable row level security;
alter table public.conversations enable row level security;
alter table public.chat_history enable row level security;
alter table public.bookmarks enable row level security;
alter table public.notes enable row level security;
alter table public.progress enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_results enable row level security;
alter table public.certificates enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notifications enable row level security;
alter table public.feature_flags enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles_select_self_or_public" on public.profiles for select using (id = auth.uid() or is_public);
create policy "profiles_update_self" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "roles_read_authenticated" on public.roles for select to authenticated using (true);
create policy "permissions_read_authenticated" on public.permissions for select to authenticated using (true);
create policy "user_roles_read_self" on public.user_roles for select using (user_id = auth.uid() or public.has_role('admin'));
create policy "user_roles_manage_admin" on public.user_roles for all using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "role_permissions_read_authenticated" on public.role_permissions for select to authenticated using (true);
create policy "role_permissions_manage_admin" on public.role_permissions for all using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "videos_read_authenticated" on public.videos for select to authenticated using (true);
create policy "videos_manage_content_team" on public.videos for all using (public.has_role('instructor') or public.has_role('admin')) with check (public.has_role('instructor') or public.has_role('admin'));
create policy "conversations_owner_all" on public.conversations for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "chat_history_owner_all" on public.chat_history for all using (user_id = auth.uid() and exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid())) with check (user_id = auth.uid() and exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid()));
create policy "bookmarks_owner_all" on public.bookmarks for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notes_owner_all" on public.notes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "progress_owner_all" on public.progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "quizzes_read_published" on public.quizzes for select using (is_published or created_by = auth.uid() or public.has_role('admin'));
create policy "quizzes_manage_creator" on public.quizzes for all using (created_by = auth.uid() or public.has_role('admin')) with check (created_by = auth.uid() or public.has_role('admin'));
create policy "quiz_questions_read_published" on public.quiz_questions for select using (exists (select 1 from public.quizzes q where q.id = quiz_id and (q.is_published or q.created_by = auth.uid() or public.has_role('admin'))));
create policy "quiz_questions_manage_creator" on public.quiz_questions for all using (exists (select 1 from public.quizzes q where q.id = quiz_id and (q.created_by = auth.uid() or public.has_role('admin')))) with check (exists (select 1 from public.quizzes q where q.id = quiz_id and (q.created_by = auth.uid() or public.has_role('admin'))));
create policy "quiz_results_owner_read_write" on public.quiz_results for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "quiz_results_instructor_read" on public.quiz_results for select using (exists (select 1 from public.quizzes q where q.id = quiz_id and q.created_by = auth.uid()) or public.has_role('admin'));
create policy "certificates_owner_read" on public.certificates for select using (user_id = auth.uid() or public.has_role('admin'));
create policy "subscriptions_owner_read" on public.subscriptions for select using (user_id = auth.uid() or public.has_role('admin'));
create policy "notifications_owner_all" on public.notifications for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "feature_flags_read_authenticated" on public.feature_flags for select to authenticated using (true);
create policy "feature_flags_manage_admin" on public.feature_flags for all using (public.has_permission('features.manage')) with check (public.has_permission('features.manage'));
create policy "audit_logs_admin_read" on public.audit_logs for select using (public.has_permission('audit.read'));

revoke all on public.audit_logs from anon, authenticated;
grant select on public.audit_logs to authenticated;
revoke all on public.subscriptions from anon, authenticated;
grant select on public.subscriptions to authenticated;
grant execute on function public.has_role(text) to authenticated;
grant execute on function public.has_permission(text) to authenticated;

-- Harden legacy tables created by the original migrations. User-editable auth
-- metadata and self-updatable role columns must never grant authorization.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, role, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email, ''),
    'student',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop policy if exists "Admins can manage all users" on public.users;
create policy "Admins can manage all users"
  on public.users
  for all
  to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

revoke update on public.users from authenticated;
grant update (full_name, avatar_url) on public.users to authenticated;

drop policy if exists "Teachers can manage their own courses" on public.courses;
create policy "Instructors manage owned courses"
  on public.courses
  for all
  to authenticated
  using (teacher_id = auth.uid() or public.has_role('admin'))
  with check (teacher_id = auth.uid() or public.has_role('admin'));

drop policy if exists "Admins can manage all courses" on public.courses;
create policy "Admins manage all courses"
  on public.courses
  for all
  to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

create or replace function public.set_user_role(target_user_id uuid, new_role_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare selected_role_id uuid;
begin
  if not public.has_role('admin') then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;
  if target_user_id = auth.uid() then
    raise exception 'administrators_cannot_change_own_role' using errcode = '42501';
  end if;
  select id into selected_role_id from public.roles where key = new_role_key;
  if selected_role_id is null then
    raise exception 'invalid_role' using errcode = '22023';
  end if;
  delete from public.user_roles where user_id = target_user_id;
  insert into public.user_roles (user_id, role_id, granted_by)
  values (target_user_id, selected_role_id, auth.uid());
  update public.users
    set role = case new_role_key when 'instructor' then 'teacher' when 'moderator' then 'student' else new_role_key end
    where id = target_user_id;
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'role.changed', 'user', target_user_id::text, jsonb_build_object('role', new_role_key));
end;
$$;

revoke all on function public.set_user_role(uuid, text) from public, anon;
grant execute on function public.set_user_role(uuid, text) to authenticated;
