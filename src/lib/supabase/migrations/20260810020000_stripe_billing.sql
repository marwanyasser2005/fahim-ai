-- Replace active checkout fulfillment with Stripe while preserving legacy Paymob records.

alter table public.payment_orders
  drop constraint if exists payment_orders_provider_check;

alter table public.payment_orders
  alter column provider set default 'stripe',
  add constraint payment_orders_provider_check check (provider in ('stripe', 'paymob')),
  add column if not exists provider_customer_id text,
  add column if not exists provider_subscription_id text,
  add column if not exists provider_invoice_id text;

create unique index if not exists payment_orders_provider_session_unique_idx
  on public.payment_orders(provider, provider_order_id)
  where provider_order_id is not null;

create index if not exists payment_orders_provider_subscription_idx
  on public.payment_orders(provider_subscription_id)
  where provider_subscription_id is not null;

alter table public.payment_events alter column provider set default 'stripe';

insert into public.api_registry (
  key, provider, service, purpose, learning_task, data_sent, data_received,
  cost_model, rate_limit, fallback, security_controls, retention, status
) values (
  'stripe',
  'Stripe',
  'Hosted Checkout and Billing',
  'Collect recurring subscription payments where the merchant entity is eligible',
  'Unlock paid learning entitlements',
  'Plan, order identifier, billing contact, and minimum account metadata',
  'Hosted Checkout session and signed lifecycle events',
  'Merchant agreement and transaction fees',
  'Stripe account limits',
  'Keep Free plan and trial; never activate from a browser redirect',
  'Hosted Checkout, signature verification, replay tolerance, idempotent event log',
  'Transaction records required for accounting and disputes',
  'configured'
) on conflict (key) do update set
  provider = excluded.provider,
  service = excluded.service,
  purpose = excluded.purpose,
  learning_task = excluded.learning_task,
  data_sent = excluded.data_sent,
  data_received = excluded.data_received,
  cost_model = excluded.cost_model,
  rate_limit = excluded.rate_limit,
  fallback = excluded.fallback,
  security_controls = excluded.security_controls,
  retention = excluded.retention,
  status = excluded.status,
  updated_at = now();

update public.api_registry set status = 'disabled', updated_at = now() where key = 'paymob';

create or replace function public.activate_stripe_subscription_v1(
  p_order_id uuid,
  p_event_key text,
  p_session_id text,
  p_customer_id text,
  p_subscription_id text,
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_payment_method text default 'stripe_checkout'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_order public.payment_orders%rowtype;
  entitlement_reset timestamptz;
begin
  if p_period_start is null or p_period_end is null or p_period_end <= p_period_start then
    raise exception 'invalid_subscription_period';
  end if;
  if coalesce(length(p_session_id), 0) < 4 or coalesce(length(p_subscription_id), 0) < 4 then
    raise exception 'invalid_stripe_identifiers';
  end if;

  select * into target_order
  from public.payment_orders
  where id = p_order_id and provider = 'stripe'
  for update;
  if not found then raise exception 'payment_order_not_found'; end if;

  entitlement_reset := least(p_period_end, p_period_start + interval '30 days');

  update public.payment_orders set
    status = 'paid',
    provider_order_id = p_session_id,
    provider_customer_id = p_customer_id,
    provider_subscription_id = p_subscription_id,
    provider_transaction_id = coalesce(provider_transaction_id, p_session_id),
    paid_at = coalesce(paid_at, now()),
    error_code = null,
    updated_at = now()
  where id = target_order.id;

  insert into public.subscriptions (
    user_id, provider, provider_customer_id, provider_subscription_id,
    plan, plan_code, status, provider_mode, payment_method_type,
    current_period_start, current_period_end, cancel_at_period_end,
    canceled_at, updated_at
  ) values (
    target_order.user_id, 'stripe', p_customer_id, p_subscription_id,
    target_order.plan_code, target_order.plan_code, 'active', target_order.provider_mode,
    left(coalesce(p_payment_method, 'stripe_checkout'), 80),
    p_period_start, p_period_end, false, null, now()
  ) on conflict (user_id) do update set
    provider = 'stripe',
    provider_customer_id = excluded.provider_customer_id,
    provider_subscription_id = excluded.provider_subscription_id,
    plan = excluded.plan,
    plan_code = excluded.plan_code,
    status = 'active',
    provider_mode = excluded.provider_mode,
    payment_method_type = excluded.payment_method_type,
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end,
    cancel_at_period_end = false,
    canceled_at = null,
    updated_at = now();

  insert into public.product_entitlements (user_id, entitlement_key, limit_value, used_value, source, reset_at) values
    (target_order.user_id, 'ai_sessions_month', 300, 0, 'subscription', entitlement_reset),
    (target_order.user_id, 'rag_documents', 200, 0, 'subscription', entitlement_reset),
    (target_order.user_id, 'storage_mb', 5000, 0, 'subscription', p_period_end),
    (target_order.user_id, 'review_cards', 10000, 0, 'subscription', p_period_end)
  on conflict (user_id, entitlement_key) do update set
    limit_value = excluded.limit_value,
    used_value = 0,
    source = 'subscription',
    reset_at = excluded.reset_at,
    updated_at = now();

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    target_order.user_id,
    'billing.subscription_activated',
    'subscription',
    target_order.user_id::text,
    jsonb_build_object(
      'payment_order_id', target_order.id,
      'plan_code', target_order.plan_code,
      'provider', 'stripe',
      'provider_event_key', left(coalesce(p_event_key, ''), 255),
      'provider_subscription_id', left(p_subscription_id, 255)
    )
  );

  return jsonb_build_object(
    'activated', true,
    'user_id', target_order.user_id,
    'plan_code', target_order.plan_code,
    'current_period_end', p_period_end
  );
end;
$$;

revoke all on function public.activate_stripe_subscription_v1(uuid, text, text, text, text, timestamptz, timestamptz, text) from public, anon, authenticated;
grant execute on function public.activate_stripe_subscription_v1(uuid, text, text, text, text, timestamptz, timestamptz, text) to service_role;

