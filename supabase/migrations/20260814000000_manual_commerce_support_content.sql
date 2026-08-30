/*
  FAHIM manual commerce, support, and first-party content operations.
  Canonical dependencies:
    20260807000000_learning_os.sql
    20260810000000_canonical_product_foundation.sql

  This replaces hosted checkout as the active subscription workflow with an
  auditable proof-of-payment review queue. Provider tables remain untouched for
  historical accounting compatibility, but no client write path depends on them.
*/

create extension if not exists pgcrypto;

insert into public.permissions (key, description) values
  ('payments.review', 'Review manual subscription payment evidence'),
  ('support.manage', 'Manage customer support conversations'),
  ('content.manage', 'Create and publish first-party learning content')
on conflict (key) do update set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r cross join public.permissions p
where r.key = 'admin' and p.key in ('payments.review', 'support.manage', 'content.manage')
on conflict do nothing;

create table if not exists public.manual_payment_methods (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('vodafone_cash', 'instapay', 'bank_transfer', 'cash_deposit', 'other')),
  label_ar text not null check (char_length(label_ar) between 2 and 80),
  label_en text not null check (char_length(label_en) between 2 and 80),
  account_reference text not null check (char_length(account_reference) between 3 and 160),
  account_holder text not null check (char_length(account_holder) between 2 and 120),
  instructions_ar text not null default '' check (char_length(instructions_ar) <= 1200),
  instructions_en text not null default '' check (char_length(instructions_en) <= 1200),
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.manual_payment_proofs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_code text not null references public.plans(code) check (plan_code in ('plus_monthly', 'plus_annual')),
  payment_method_id uuid not null references public.manual_payment_methods(id),
  amount_egp integer not null check (amount_egp > 0),
  currency text not null default 'EGP' check (currency = 'EGP'),
  payer_name text not null check (char_length(payer_name) between 2 and 120),
  payer_phone text not null check (payer_phone ~ '^01[0125][0-9]{8}$'),
  transfer_reference text not null check (char_length(transfer_reference) between 3 and 120),
  proof_storage_path text not null check (char_length(proof_storage_path) between 8 and 500),
  user_note text not null default '' check (char_length(user_note) <= 1200),
  status text not null default 'pending' check (status in ('pending', 'under_review', 'approved', 'rejected', 'resubmission_required', 'canceled')),
  revision integer not null default 1 check (revision between 1 and 20),
  review_note text not null default '' check (char_length(review_note) <= 2000),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  approved_period_start timestamptz,
  approved_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists manual_payment_reference_unique_idx
  on public.manual_payment_proofs(payment_method_id, lower(transfer_reference));
create index if not exists manual_payment_proofs_queue_idx
  on public.manual_payment_proofs(status, created_at desc);
create index if not exists manual_payment_proofs_user_idx
  on public.manual_payment_proofs(user_id, created_at desc);

create table if not exists public.manual_payment_events (
  id bigint generated always as identity primary key,
  proof_id uuid not null references public.manual_payment_proofs(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in ('submitted', 'review_started', 'approved', 'rejected', 'resubmission_requested', 'resubmitted', 'canceled')),
  from_status text,
  to_status text not null,
  note text not null default '' check (char_length(note) <= 2000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.prepare_manual_payment_proof_v1()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  expected_amount integer;
  method_active boolean;
begin
  if auth.uid() is null or new.user_id <> auth.uid() then
    raise exception 'payment_proof_owner_mismatch' using errcode = '42501';
  end if;
  select price_egp into expected_amount from public.plans where code = new.plan_code and is_public;
  if expected_amount is null or expected_amount <= 0 then
    raise exception 'invalid_paid_plan' using errcode = '22023';
  end if;
  select is_active into method_active from public.manual_payment_methods where id = new.payment_method_id;
  if method_active is not true then
    raise exception 'payment_method_unavailable' using errcode = '22023';
  end if;
  if split_part(new.proof_storage_path, '/', 1) <> auth.uid()::text then
    raise exception 'invalid_payment_proof_path' using errcode = '42501';
  end if;
  new.amount_egp := expected_amount;
  new.currency := 'EGP';
  new.status := 'pending';
  new.revision := 1;
  new.review_note := '';
  new.reviewed_by := null;
  new.reviewed_at := null;
  return new;
end;
$$;

drop trigger if exists manual_payment_proof_prepare on public.manual_payment_proofs;
create trigger manual_payment_proof_prepare
before insert on public.manual_payment_proofs
for each row execute function public.prepare_manual_payment_proof_v1();

create or replace function public.log_manual_payment_submission_v1()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.manual_payment_events (proof_id, actor_id, event_type, to_status)
  values (new.id, new.user_id, 'submitted', 'pending');
  return new;
end;
$$;

drop trigger if exists manual_payment_proof_log_submission on public.manual_payment_proofs;
create trigger manual_payment_proof_log_submission
after insert on public.manual_payment_proofs
for each row execute function public.log_manual_payment_submission_v1();

create or replace function public.resubmit_manual_payment_v1(
  target_proof uuid,
  new_storage_path text,
  new_reference text,
  new_user_note text default ''
)
returns public.manual_payment_proofs
language plpgsql
security definer
set search_path = public
as $$
declare
  current_proof public.manual_payment_proofs;
  previous_status text;
begin
  select * into current_proof from public.manual_payment_proofs
  where id = target_proof and user_id = auth.uid() for update;
  if not found then raise exception 'payment_proof_not_found' using errcode = 'P0002'; end if;
  if current_proof.status not in ('rejected', 'resubmission_required') then
    raise exception 'payment_proof_not_resubmittable' using errcode = '22023';
  end if;
  previous_status := current_proof.status;
  if split_part(new_storage_path, '/', 1) <> auth.uid()::text then
    raise exception 'invalid_payment_proof_path' using errcode = '42501';
  end if;

  update public.manual_payment_proofs set
    proof_storage_path = left(new_storage_path, 500),
    transfer_reference = left(trim(new_reference), 120),
    user_note = left(coalesce(new_user_note, ''), 1200),
    status = 'pending',
    revision = revision + 1,
    review_note = '',
    reviewed_by = null,
    reviewed_at = null,
    updated_at = now()
  where id = target_proof
  returning * into current_proof;

  insert into public.manual_payment_events (proof_id, actor_id, event_type, from_status, to_status)
  values (target_proof, auth.uid(), 'resubmitted', previous_status, 'pending');
  return current_proof;
end;
$$;

create or replace function public.review_manual_payment_v1(
  target_proof uuid,
  decision text,
  decision_note text default ''
)
returns public.manual_payment_proofs
language plpgsql
security definer
set search_path = public
as $$
declare
  current_proof public.manual_payment_proofs;
  next_status text;
  event_name text;
  period_start timestamptz;
  period_end timestamptz;
  previous_status text;
begin
  if not public.has_permission('payments.review') and not public.has_role('admin') then
    raise exception 'admin_required' using errcode = '42501';
  end if;
  if decision not in ('under_review', 'approved', 'rejected', 'resubmission_required') then
    raise exception 'invalid_payment_decision' using errcode = '22023';
  end if;
  select * into current_proof from public.manual_payment_proofs where id = target_proof for update;
  if not found then raise exception 'payment_proof_not_found' using errcode = 'P0002'; end if;
  if current_proof.status = 'approved' then raise exception 'approved_payment_is_final' using errcode = '22023'; end if;
  previous_status := current_proof.status;
  if decision in ('rejected', 'resubmission_required') and char_length(trim(coalesce(decision_note, ''))) < 5 then
    raise exception 'review_reason_required' using errcode = '22023';
  end if;

  next_status := decision;
  event_name := case decision
    when 'under_review' then 'review_started'
    when 'approved' then 'approved'
    when 'rejected' then 'rejected'
    else 'resubmission_requested'
  end;
  period_start := now();
  period_end := case current_proof.plan_code when 'plus_annual' then period_start + interval '1 year' else period_start + interval '30 days' end;

  update public.manual_payment_proofs set
    status = next_status,
    review_note = left(coalesce(decision_note, ''), 2000),
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    approved_period_start = case when decision = 'approved' then period_start else null end,
    approved_period_end = case when decision = 'approved' then period_end else null end,
    updated_at = now()
  where id = target_proof
  returning * into current_proof;

  insert into public.manual_payment_events (proof_id, actor_id, event_type, from_status, to_status, note)
  values (target_proof, auth.uid(), event_name, previous_status, next_status, left(coalesce(decision_note, ''), 2000));

  if decision = 'approved' then
    insert into public.subscriptions (
      user_id, provider, plan, plan_code, status, provider_mode, payment_method_type,
      current_period_start, current_period_end, cancel_at_period_end, updated_at
    ) values (
      current_proof.user_id, 'manual_proof', current_proof.plan_code, current_proof.plan_code, 'active', 'live', 'payment_proof',
      period_start, period_end, false, now()
    )
    on conflict (user_id) do update set
      provider = 'manual_proof',
      plan = excluded.plan,
      plan_code = excluded.plan_code,
      status = 'active',
      provider_mode = 'live',
      payment_method_type = 'payment_proof',
      current_period_start = excluded.current_period_start,
      current_period_end = excluded.current_period_end,
      cancel_at_period_end = false,
      canceled_at = null,
      updated_at = now();

    insert into public.product_entitlements (user_id, entitlement_key, limit_value, used_value, reset_at, source) values
      (current_proof.user_id, 'ai_sessions_month', 300, 0, least(period_end, period_start + interval '30 days'), 'subscription'),
      (current_proof.user_id, 'rag_documents', 100, 0, period_end, 'subscription'),
      (current_proof.user_id, 'storage_mb', 2048, 0, period_end, 'subscription'),
      (current_proof.user_id, 'review_cards', 5000, 0, period_end, 'subscription')
    on conflict (user_id, entitlement_key) do update set
      limit_value = excluded.limit_value,
      used_value = 0,
      reset_at = excluded.reset_at,
      source = 'subscription',
      updated_at = now();
  end if;

  insert into public.notifications (user_id, type, title, body, data)
  values (
    current_proof.user_id,
    'payment_review',
    case decision when 'approved' then 'تم تفعيل اشتراك فَهيم' when 'under_review' then 'بدأت مراجعة إثبات الدفع' else 'تحديث على إثبات الدفع' end,
    left(coalesce(decision_note, ''), 1000),
    jsonb_build_object('proof_id', target_proof, 'status', decision, 'plan_code', current_proof.plan_code)
  );
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'manual_payment.' || decision, 'manual_payment_proof', target_proof::text, jsonb_build_object('user_id', current_proof.user_id, 'plan_code', current_proof.plan_code));
  return current_proof;
end;
$$;

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null check (char_length(subject) between 4 and 160),
  category text not null default 'general' check (category in ('general', 'billing', 'technical', 'learning', 'content', 'privacy')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'open' check (status in ('open', 'pending_admin', 'pending_user', 'resolved', 'closed')),
  assigned_to uuid references auth.users(id) on delete set null,
  last_message_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_role text not null check (sender_role in ('customer', 'admin')),
  body text not null check (char_length(body) between 1 and 8000),
  attachment_storage_path text,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create index if not exists support_ticket_queue_idx on public.support_tickets(status, priority, last_message_at desc);
create index if not exists support_messages_ticket_idx on public.support_messages(ticket_id, created_at);

create or replace function public.prepare_support_message_v1()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ticket_owner uuid;
  admin_sender boolean;
begin
  if auth.uid() is null or new.sender_id <> auth.uid() then raise exception 'sender_mismatch' using errcode = '42501'; end if;
  select user_id into ticket_owner from public.support_tickets where id = new.ticket_id;
  if ticket_owner is null then raise exception 'ticket_not_found' using errcode = 'P0002'; end if;
  admin_sender := public.has_permission('support.manage') or public.has_role('admin');
  if not admin_sender and ticket_owner <> auth.uid() then raise exception 'ticket_access_denied' using errcode = '42501'; end if;
  new.sender_role := case when admin_sender then 'admin' else 'customer' end;
  update public.support_tickets set
    last_message_at = now(),
    status = case when admin_sender then 'pending_user' else 'pending_admin' end,
    updated_at = now()
  where id = new.ticket_id and status not in ('resolved', 'closed');
  return new;
end;
$$;

drop trigger if exists support_message_prepare on public.support_messages;
create trigger support_message_prepare
before insert on public.support_messages
for each row execute function public.prepare_support_message_v1();

create table if not exists public.exclusive_videos (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null check (char_length(title_ar) between 3 and 180),
  title_en text not null check (char_length(title_en) between 3 and 180),
  description_ar text not null default '' check (char_length(description_ar) <= 4000),
  description_en text not null default '' check (char_length(description_en) <= 4000),
  storage_path text not null check (char_length(storage_path) between 5 and 500),
  poster_path text,
  subject text not null default '',
  education_level text not null default '',
  language text not null default 'ar' check (language in ('ar', 'en', 'both')),
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  is_published boolean not null default false,
  published_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.managed_learning_resources (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null check (char_length(title_ar) between 3 and 180),
  title_en text not null check (char_length(title_en) between 3 and 180),
  description_ar text not null default '' check (char_length(description_ar) <= 3000),
  description_en text not null default '' check (char_length(description_en) <= 3000),
  resource_type text not null check (resource_type in ('official_source', 'article', 'worksheet', 'book', 'dataset', 'link', 'file')),
  canonical_url text,
  storage_path text,
  subject text not null default '',
  education_level text not null default '',
  academic_year text,
  authority text not null default '',
  license text not null default '',
  status text not null default 'draft' check (status in ('draft', 'review', 'published', 'archived')),
  created_by uuid not null references auth.users(id) on delete restrict,
  reviewed_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (canonical_url is not null or storage_path is not null)
);

drop trigger if exists manual_payment_methods_set_updated_at on public.manual_payment_methods;
create trigger manual_payment_methods_set_updated_at before update on public.manual_payment_methods for each row execute function public.set_updated_at();
drop trigger if exists manual_payment_proofs_set_updated_at on public.manual_payment_proofs;
create trigger manual_payment_proofs_set_updated_at before update on public.manual_payment_proofs for each row execute function public.set_updated_at();
drop trigger if exists support_tickets_set_updated_at on public.support_tickets;
create trigger support_tickets_set_updated_at before update on public.support_tickets for each row execute function public.set_updated_at();
drop trigger if exists exclusive_videos_set_updated_at on public.exclusive_videos;
create trigger exclusive_videos_set_updated_at before update on public.exclusive_videos for each row execute function public.set_updated_at();
drop trigger if exists managed_learning_resources_set_updated_at on public.managed_learning_resources;
create trigger managed_learning_resources_set_updated_at before update on public.managed_learning_resources for each row execute function public.set_updated_at();

alter table public.manual_payment_methods enable row level security;
alter table public.manual_payment_proofs enable row level security;
alter table public.manual_payment_events enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.exclusive_videos enable row level security;
alter table public.managed_learning_resources enable row level security;

create policy "manual_payment_methods_read_active" on public.manual_payment_methods for select to authenticated using (is_active or public.has_role('admin'));
create policy "manual_payment_methods_admin_manage" on public.manual_payment_methods for all to authenticated using (public.has_permission('payments.review') or public.has_role('admin')) with check (public.has_permission('payments.review') or public.has_role('admin'));
create policy "manual_payment_proofs_owner_read" on public.manual_payment_proofs for select to authenticated using (user_id = auth.uid() or public.has_permission('payments.review') or public.has_role('admin'));
create policy "manual_payment_proofs_owner_submit" on public.manual_payment_proofs for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
create policy "manual_payment_events_owner_read" on public.manual_payment_events for select to authenticated using (exists (select 1 from public.manual_payment_proofs p where p.id = proof_id and (p.user_id = auth.uid() or public.has_permission('payments.review') or public.has_role('admin'))));

create policy "support_tickets_participant_read" on public.support_tickets for select to authenticated using (user_id = auth.uid() or public.has_permission('support.manage') or public.has_role('admin'));
create policy "support_tickets_owner_create" on public.support_tickets for insert to authenticated with check (user_id = auth.uid() and assigned_to is null);
create policy "support_tickets_admin_update" on public.support_tickets for update to authenticated using (public.has_permission('support.manage') or public.has_role('admin')) with check (public.has_permission('support.manage') or public.has_role('admin'));
create policy "support_messages_participant_read" on public.support_messages for select to authenticated using (exists (select 1 from public.support_tickets t where t.id = ticket_id and (t.user_id = auth.uid() or public.has_permission('support.manage') or public.has_role('admin'))));
create policy "support_messages_participant_create" on public.support_messages for insert to authenticated with check (sender_id = auth.uid() and exists (select 1 from public.support_tickets t where t.id = ticket_id and (t.user_id = auth.uid() or public.has_permission('support.manage') or public.has_role('admin'))));

create policy "exclusive_videos_authenticated_read" on public.exclusive_videos for select to authenticated using (is_published or public.has_permission('content.manage') or public.has_role('admin'));
create policy "exclusive_videos_admin_manage" on public.exclusive_videos for all to authenticated using (public.has_permission('content.manage') or public.has_role('admin')) with check (public.has_permission('content.manage') or public.has_role('admin'));
create policy "managed_resources_authenticated_read" on public.managed_learning_resources for select to authenticated using (status = 'published' or public.has_permission('content.manage') or public.has_role('admin'));
create policy "managed_resources_admin_manage" on public.managed_learning_resources for all to authenticated using (public.has_permission('content.manage') or public.has_role('admin')) with check (public.has_permission('content.manage') or public.has_role('admin'));
create policy "source_registry_admin_manage" on public.source_registry for all to authenticated using (public.has_permission('content.manage') or public.has_role('admin')) with check (public.has_permission('content.manage') or public.has_role('admin'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('payment-proofs', 'payment-proofs', false, 8388608, array['image/jpeg','image/png','image/webp','application/pdf']),
  ('exclusive-videos', 'exclusive-videos', false, 1073741824, array['video/mp4','video/webm','image/jpeg','image/png','image/webp']),
  ('learning-sources', 'learning-sources', false, 52428800, array['application/pdf','text/plain','text/markdown','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "payment_proofs_owner_upload" on storage.objects for insert to authenticated with check (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "payment_proofs_owner_or_admin_read" on storage.objects for select to authenticated using (bucket_id = 'payment-proofs' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_permission('payments.review') or public.has_role('admin')));
create policy "exclusive_videos_admin_upload" on storage.objects for insert to authenticated with check (bucket_id = 'exclusive-videos' and (public.has_permission('content.manage') or public.has_role('admin')));
create policy "exclusive_videos_authenticated_read" on storage.objects for select to authenticated using (
  bucket_id = 'exclusive-videos' and (
    public.has_permission('content.manage') or public.has_role('admin') or
    exists (select 1 from public.exclusive_videos v where v.is_published and (v.storage_path = name or v.poster_path = name))
  )
);
create policy "exclusive_videos_admin_update" on storage.objects for update to authenticated using (bucket_id = 'exclusive-videos' and (public.has_permission('content.manage') or public.has_role('admin'))) with check (bucket_id = 'exclusive-videos' and (public.has_permission('content.manage') or public.has_role('admin')));
create policy "exclusive_videos_admin_delete" on storage.objects for delete to authenticated using (bucket_id = 'exclusive-videos' and (public.has_permission('content.manage') or public.has_role('admin')));
create policy "learning_sources_admin_upload" on storage.objects for insert to authenticated with check (bucket_id = 'learning-sources' and (public.has_permission('content.manage') or public.has_role('admin')));
create policy "learning_sources_authenticated_read" on storage.objects for select to authenticated using (
  bucket_id = 'learning-sources' and (
    public.has_permission('content.manage') or public.has_role('admin') or
    exists (select 1 from public.managed_learning_resources r where r.status = 'published' and r.storage_path = name)
  )
);
create policy "learning_sources_admin_update" on storage.objects for update to authenticated using (bucket_id = 'learning-sources' and (public.has_permission('content.manage') or public.has_role('admin'))) with check (bucket_id = 'learning-sources' and (public.has_permission('content.manage') or public.has_role('admin')));
create policy "learning_sources_admin_delete" on storage.objects for delete to authenticated using (bucket_id = 'learning-sources' and (public.has_permission('content.manage') or public.has_role('admin')));

revoke all on function public.resubmit_manual_payment_v1(uuid, text, text, text) from public, anon;
grant execute on function public.resubmit_manual_payment_v1(uuid, text, text, text) to authenticated;
revoke all on function public.review_manual_payment_v1(uuid, text, text) from public, anon;
grant execute on function public.review_manual_payment_v1(uuid, text, text) to authenticated;

grant select on public.manual_payment_methods, public.manual_payment_proofs, public.manual_payment_events to authenticated;
grant insert on public.manual_payment_proofs to authenticated;
grant select, insert on public.support_tickets, public.support_messages to authenticated;
grant update on public.support_tickets to authenticated;
grant select, insert, update, delete on public.exclusive_videos, public.managed_learning_resources to authenticated;
grant insert, update, delete on public.manual_payment_methods to authenticated;

insert into public.api_registry (
  key, provider, service, purpose, learning_task, data_sent, data_received,
  cost_model, rate_limit, fallback, security_controls, retention, status
) values (
  'manual_payment_review', 'FAHIM operations', 'Payment proof review', 'Activate subscriptions after human verification', 'Unlock paid learning access', 'Plan, transfer reference, payer contact, and private proof file', 'Human decision, review reason, and entitlement period', 'Manual operations', 'One active submission per transfer reference', 'Free plan and resubmission flow', 'Private bucket, owner isolation, admin-only decision RPC, immutable audit events', 'Accounting and dispute retention policy', 'active'
)
on conflict (key) do update set status = 'active', updated_at = now();

update public.api_registry set status = 'disabled', updated_at = now() where key in ('paymob', 'stripe_billing');
