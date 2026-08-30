import Stripe from 'stripe';

let cachedClient;
let cachedSecret;

export function getStripeConfiguration() {
  const secretKey = String(process.env.STRIPE_SECRET_KEY || '').trim();
  const webhookSecret = String(process.env.STRIPE_WEBHOOK_SECRET || '').trim();
  if (!secretKey || !webhookSecret) return null;
  return {
    secretKey,
    webhookSecret,
    mode: secretKey.startsWith('sk_live_') ? 'live' : 'test',
  };
}

export function getStripeClient(secretKey = process.env.STRIPE_SECRET_KEY) {
  const key = String(secretKey || '').trim();
  if (!key) throw new StripeConfigurationError('Stripe is not configured on this deployment.');
  if (!cachedClient || cachedSecret !== key) {
    cachedClient = new Stripe(key, {
      maxNetworkRetries: 2,
      timeout: 15_000,
      appInfo: { name: 'FAHIM Learning OS', version: '6.1' },
    });
    cachedSecret = key;
  }
  return cachedClient;
}

export async function createStripeCheckoutSession({ orderId, plan, user, fullName, phone, successUrl, cancelUrl }) {
  const config = getStripeConfiguration();
  if (!config) throw new StripeConfigurationError('Stripe checkout is not configured on this deployment.');
  const stripe = getStripeClient(config.secretKey);
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    client_reference_id: orderId,
    customer_email: user.email,
    success_url: successUrl,
    cancel_url: cancelUrl,
    billing_address_collection: 'auto',
    allow_promotion_codes: false,
    locale: 'auto',
    line_items: [{
      quantity: 1,
      price_data: {
        currency: plan.currency.toLowerCase(),
        unit_amount: plan.amountCents,
        recurring: { interval: plan.code === 'plus_annual' ? 'year' : 'month' },
        product_data: {
          name: plan.label,
          description: 'Verified-learning access for FAHIM Learning OS',
          metadata: { fahim_plan_code: plan.code },
        },
      },
    }],
    metadata: {
      fahim_order_id: orderId,
      fahim_user_id: user.id,
      fahim_plan_code: plan.code,
    },
    subscription_data: {
      metadata: {
        fahim_order_id: orderId,
        fahim_user_id: user.id,
        fahim_plan_code: plan.code,
      },
    },
    custom_text: {
      submit: { message: `Account: ${fullName} · ${phone}` },
    },
  }, { idempotencyKey: `fahim_checkout_${orderId}` });
  if (!session.url) throw new StripeRequestError('Stripe did not return a Checkout URL.');
  return session;
}

export function constructStripeWebhookEvent(rawBody, signature, secret = process.env.STRIPE_WEBHOOK_SECRET) {
  const webhookSecret = String(secret || '').trim();
  if (!webhookSecret || !signature) throw new StripeConfigurationError('Stripe webhook verification is not configured.');
  return getStripeClient().webhooks.constructEvent(rawBody, signature, webhookSecret, 300);
}

export function sanitizeStripeEvent(event) {
  const object = event?.data?.object || {};
  return {
    event_id: String(event?.id || '').slice(0, 255),
    event_type: String(event?.type || '').slice(0, 120),
    object_id: String(object?.id || '').slice(0, 255),
    object_type: String(object?.object || '').slice(0, 80),
    livemode: Boolean(event?.livemode),
    created: Number(event?.created || 0),
    api_version: event?.api_version ? String(event.api_version).slice(0, 80) : null,
    fahim_order_id: object?.metadata?.fahim_order_id || object?.client_reference_id || null,
    payment_status: object?.payment_status || null,
    status: object?.status || null,
    currency: object?.currency || null,
    amount_total: Number.isFinite(object?.amount_total) ? object.amount_total : null,
  };
}

export class StripeConfigurationError extends Error {
  constructor(message) { super(message); this.name = 'StripeConfigurationError'; this.status = 503; }
}

export class StripeRequestError extends Error {
  constructor(message) { super(message); this.name = 'StripeRequestError'; this.status = 502; }
}

