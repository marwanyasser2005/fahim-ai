/*
  Fahim Learning OS production schema
  - User-owned learning data
  - Role and permission model
  - Conversations, notes, bookmarks, quizzes, certificates and notifications
  - Row Level Security on every user-data table
*/

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  banner_url text,
  bio text not null default '',
  locale text not null default 'ar' check (locale in ('ar', 'en')),
  role text not null default 'student' check (role in ('student', 'instructor', 'moderator', 'admin')),
  xp integer not null default 0 check (xp >= 0),
  level integer not null default 1 check (level >= 1),
  streak integer not null default 0 check (streak >= 0),
  daily_goal_minutes integer not null default 30 check (daily_goal_minutes between 5 and 480),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  description text not null default ''
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  folder text not null default '',
  subject text not null default '',
  grade text not null default '',
  mode text not null default 'explain' check (mode in ('explain', 'plan', 'quiz', 'flashcards', 'summary', 'project')),
  pinned boolean not null default false,
  archived boolean not null default false,
  shared_token uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 30000),
  model text,
  sources jsonb not null default '[]'::jsonb,
  favorite boolean not null default false,
  feedback text check (feedback in ('up', 'down')),
  created_at timestamptz not null default now()
);

create table if not exists public.videos (
  id text primary key,
  title text not null,
  channel_id text,
  channel_title text not null default '',
  thumbnail_url text,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  captions boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  cached_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  body text not null default '',
  video_id text references public.videos(id) on delete set null,
  lesson_id uuid references public.lessons(id) on delete set null,
  timestamp_seconds integer check (timestamp_seconds is null or timestamp_seconds >= 0),
  color text not null default 'violet',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  resource_type text not null check (resource_type in ('video', 'conversation', 'message', 'lesson', 'note', 'search')),
  resource_id text not null,
  label text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (owner_id, resource_type, resource_id)
);

create table if not exists public.learning_progress (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  video_id text references public.videos(id) on delete set null,
  status text not null default 'started' check (status in ('started', 'in_progress', 'completed')),
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  position_seconds integer not null default 0 check (position_seconds >= 0),
  time_spent_seconds integer not null default 0 check (time_spent_seconds >= 0),
  last_activity_at timestamptz not null default now(),
  unique nulls not distinct (owner_id, course_id, lesson_id, video_id)
);

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references auth.users(id) on delete set null,
  course_id uuid references public.courses(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  title text not null,
  description text not null default '',
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  passing_score integer not null default 60 check (passing_score between 0 and 100),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question_type text not null check (question_type in ('multiple_choice', 'true_false', 'fill_blank', 'code', 'essay')),
  prompt text not null,
  options jsonb not null default '[]'::jsonb,
  answer jsonb not null default '{}'::jsonb,
  explanation text not null default '',
  points integer not null default 1 check (points > 0),
  position integer not null default 0
);

create table if not exists public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  score numeric(5,2) not null check (score between 0 and 100),
  answers jsonb not null default '{}'::jsonb,
  feedback jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  quiz_id uuid references public.quizzes(id) on delete set null,
  title text not null,
  verification_code text not null unique default encode(gen_random_bytes(12), 'hex'),
  issued_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  provider_customer_id text unique,
  provider_subscription_id text unique,
  plan text not null default 'free',
  status text not null default 'active' check (status in ('active', 'trialing', 'past_due', 'canceled', 'paused')),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null default '',
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  audience jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists conversations_owner_updated_idx on public.conversations(owner_id, updated_at desc);
create index if not exists chat_messages_conversation_idx on public.chat_messages(conversation_id, created_at);
create index if not exists notes_owner_updated_idx on public.notes(owner_id, updated_at desc);
create index if not exists bookmarks_owner_type_idx on public.bookmarks(owner_id, resource_type);
create index if not exists learning_progress_owner_activity_idx on public.learning_progress(owner_id, last_activity_at desc);
create index if not exists quiz_results_owner_idx on public.quiz_results(owner_id, completed_at desc);
create index if not exists notifications_owner_unread_idx on public.notifications(owner_id, created_at desc) where read_at is null;

create or replace function public.handle_fahim_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'avatar_url',
    case when new.raw_user_meta_data ->> 'role' in ('student', 'instructor', 'moderator', 'admin')
      then new.raw_user_meta_data ->> 'role' else 'student' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_fahim_auth_user_created on auth.users;
create trigger on_fahim_auth_user_created after insert on auth.users
for each row execute procedure public.handle_fahim_profile();

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.videos enable row level security;
alter table public.notes enable row level security;
alter table public.bookmarks enable row level security;
alter table public.learning_progress enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_results enable row level security;
alter table public.certificates enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.feature_flags enable row level security;

create or replace function public.is_fahim_staff()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('instructor', 'moderator', 'admin') $$;

create policy "profiles_read_own" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "roles_authenticated_read" on public.roles for select to authenticated using (true);
create policy "permissions_authenticated_read" on public.permissions for select to authenticated using (true);
create policy "role_permissions_authenticated_read" on public.role_permissions for select to authenticated using (true);
create policy "conversations_owner_all" on public.conversations for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "chat_messages_owner_all" on public.chat_messages for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "videos_authenticated_read" on public.videos for select to authenticated using (true);
create policy "videos_staff_write" on public.videos for all to authenticated using (public.is_fahim_staff()) with check (public.is_fahim_staff());
create policy "notes_owner_all" on public.notes for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "bookmarks_owner_all" on public.bookmarks for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "learning_progress_owner_all" on public.learning_progress for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "quizzes_published_or_staff_read" on public.quizzes for select using (published or public.is_fahim_staff());
create policy "quizzes_staff_write" on public.quizzes for all to authenticated using (public.is_fahim_staff()) with check (public.is_fahim_staff());
create policy "quiz_questions_published_read" on public.quiz_questions for select using (exists (select 1 from public.quizzes q where q.id = quiz_id and q.published));
create policy "quiz_questions_staff_write" on public.quiz_questions for all to authenticated using (public.is_fahim_staff()) with check (public.is_fahim_staff());
create policy "quiz_results_owner_all" on public.quiz_results for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "certificates_owner_read" on public.certificates for select to authenticated using (owner_id = auth.uid());
create policy "subscriptions_owner_read" on public.subscriptions for select to authenticated using (owner_id = auth.uid());
create policy "notifications_owner_all" on public.notifications for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "audit_logs_admin_read" on public.audit_logs for select to authenticated using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');
create policy "feature_flags_authenticated_read" on public.feature_flags for select to authenticated using (true);
create policy "feature_flags_admin_write" on public.feature_flags for all to authenticated using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin') with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');

insert into public.roles (slug, name, description) values
  ('student', 'Student', 'Learns, saves progress and takes quizzes'),
  ('instructor', 'Instructor', 'Creates and manages learning content'),
  ('moderator', 'Moderator', 'Reviews community and reported content'),
  ('admin', 'Administrator', 'Manages the platform and access')
on conflict (slug) do nothing;
