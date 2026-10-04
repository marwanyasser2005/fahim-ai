-- Anonymous Auth users have no email identity. Keep the legacy public.users
-- mirror compatible without collecting PII by assigning a unique, internal,
-- non-deliverable address. Authorization continues to come from user_roles,
-- never from this table's user-editable fields.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  internal_email text := coalesce(
    new.email,
    'anonymous+' || replace(new.id::text, '-', '') || '@session.fahim.invalid'
  );
begin
  insert into public.users (id, email, full_name, role, avatar_url)
  values (
    new.id,
    internal_email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email, 'Fahim Explorer'),
    'student',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

comment on function public.handle_new_user is
  'Creates the legacy user mirror for permanent and anonymous Auth users without requiring PII.';
