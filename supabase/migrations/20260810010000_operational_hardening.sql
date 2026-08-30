-- FAHIM operational hardening: distributed, atomic API rate limiting.

create table if not exists public.api_rate_limits (
  key_hash text primary key,
  namespace text not null,
  hit_count integer not null default 1 check (hit_count > 0),
  window_started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create index if not exists api_rate_limits_expires_at_idx
  on public.api_rate_limits (expires_at);

alter table public.api_rate_limits enable row level security;
revoke all on public.api_rate_limits from anon, authenticated;
grant select, insert, update, delete on public.api_rate_limits to service_role;

create or replace function public.consume_api_rate_limit(
  p_key_hash text,
  p_namespace text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, remaining integer, retry_after integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_hits integer;
  v_expires_at timestamptz;
  v_limit integer := greatest(1, least(p_limit, 10000));
  v_window_seconds integer := greatest(1, least(p_window_seconds, 86400));
begin
  if p_key_hash is null or length(p_key_hash) <> 64 or p_namespace is null or length(p_namespace) > 80 then
    raise exception 'Invalid rate limit bucket';
  end if;

  insert into public.api_rate_limits as bucket (
    key_hash,
    namespace,
    hit_count,
    window_started_at,
    expires_at,
    updated_at
  )
  values (
    p_key_hash,
    p_namespace,
    1,
    v_now,
    v_now + make_interval(secs => v_window_seconds),
    v_now
  )
  on conflict (key_hash) do update
  set namespace = excluded.namespace,
      hit_count = case when bucket.expires_at <= v_now then 1 else bucket.hit_count + 1 end,
      window_started_at = case when bucket.expires_at <= v_now then v_now else bucket.window_started_at end,
      expires_at = case when bucket.expires_at <= v_now then v_now + make_interval(secs => v_window_seconds) else bucket.expires_at end,
      updated_at = v_now
  returning bucket.hit_count, bucket.expires_at into v_hits, v_expires_at;

  delete from public.api_rate_limits
  where expires_at < v_now - interval '1 day';

  return query select
    v_hits <= v_limit,
    greatest(0, v_limit - v_hits),
    greatest(1, ceil(extract(epoch from (v_expires_at - v_now)))::integer);
end;
$$;

revoke all on function public.consume_api_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, text, integer, integer) to service_role;

