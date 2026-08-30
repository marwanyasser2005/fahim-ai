import { createHmac, timingSafeEqual } from 'node:crypto';

const TRANSACTION_HMAC_FIELDS = [
  'amount_cents', 'created_at', 'currency', 'error_occured', 'has_parent_transaction',
  'id', 'integration_id', 'is_3d_secure', 'is_auth', 'is_capture', 'is_refunded',
  'is_standalone_payment', 'is_voided', 'order.id', 'owner', 'pending',
  'source_data.pan', 'source_data.sub_type', 'source_data.type', 'success',
];

function valueAtPath(value, path) {
  return path.split('.').reduce((current, key) => current?.[key], value);
}

function hmacValue(value) {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return value === null || value === undefined ? '' : String(value);
}

export function verifyPaymobTransactionHmac(object, receivedHmac, secret = process.env.PAYMOB_HMAC_SECRET) {
  if (!object || !receivedHmac || !secret) return false;
  const concatenated = TRANSACTION_HMAC_FIELDS.map((field) => hmacValue(valueAtPath(object, field))).join('');
  const expected = createHmac('sha512', secret).update(concatenated).digest('hex');
  const actualBuffer = Buffer.from(String(receivedHmac).toLowerCase(), 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function integrationIds() {
  return String(process.env.PAYMOB_INTEGRATION_IDS || process.env.PAYMOB_INTEGRATION_ID_CARD || '')
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isSafeInteger(value) && value > 0);
}

export function getPaymobConfiguration() {
  const baseUrl = String(process.env.PAYMOB_BASE_URL || 'https://accept.paymob.com').replace(/\/$/, '');
  const secretKey = String(process.env.PAYMOB_SECRET_KEY || '').trim();
  const publicKey = String(process.env.PAYMOB_PUBLIC_KEY || '').trim();
  const methods = integrationIds();
  if (!secretKey || !publicKey || methods.length === 0 || !process.env.PAYMOB_HMAC_SECRET) return null;
  return { baseUrl, secretKey, publicKey, methods, mode: secretKey.includes('_test_') ? 'test' : 'live' };
}

export async function createPaymobIntention({ orderId, plan, user, fullName, phone, returnUrl, webhookUrl }) {
  const config = getPaymobConfiguration();
  if (!config) throw new PaymobConfigurationError('Paymob checkout is not configured on this deployment.');
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() || 'FAHIM';
  const lastName = parts.join(' ') || 'Learner';
  const response = await fetch(`${config.baseUrl}/v1/intention/`, {
    method: 'POST',
    headers: { Authorization: `Token ${config.secretKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: plan.amountCents,
      currency: plan.currency,
      payment_methods: config.methods,
      items: [{ name: plan.label, amount: plan.amountCents, description: `FAHIM plan ${plan.code}`, quantity: 1 }],
      billing_data: { first_name: firstName, last_name: lastName, email: user.email, phone_number: phone },
      customer: { first_name: firstName, last_name: lastName, email: user.email },
      extras: { fahim_order_id: orderId, plan_code: plan.code },
      special_reference: orderId,
      notification_url: webhookUrl,
      redirection_url: returnUrl,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const raw = await response.text();
  let payload;
  try { payload = JSON.parse(raw); } catch { payload = {}; }
  if (!response.ok || typeof payload.client_secret !== 'string') {
    const providerMessage = typeof payload.detail === 'string' ? payload.detail : `Paymob returned HTTP ${response.status}.`;
    throw new PaymobRequestError(providerMessage, response.status);
  }
  return {
    id: String(payload.id || payload.intention_id || ''),
    providerOrderId: String(payload.intention_order_id || payload.order?.id || ''),
    checkoutUrl: `${config.baseUrl}/unifiedcheckout/?publicKey=${encodeURIComponent(config.publicKey)}&clientSecret=${encodeURIComponent(payload.client_secret)}`,
    mode: config.mode,
  };
}

export function sanitizePaymobPayload(object) {
  return {
    id: object?.id ?? null,
    amount_cents: object?.amount_cents ?? null,
    currency: object?.currency ?? null,
    success: object?.success ?? null,
    pending: object?.pending ?? null,
    error_occured: object?.error_occured ?? null,
    integration_id: object?.integration_id ?? null,
    order_id: object?.order?.id ?? null,
    merchant_order_id: object?.order?.merchant_order_id ?? object?.order?.special_reference ?? null,
    source_type: object?.source_data?.type ?? null,
    source_sub_type: object?.source_data?.sub_type ?? null,
    created_at: object?.created_at ?? null,
  };
}

export class PaymobConfigurationError extends Error {
  constructor(message) { super(message); this.name = 'PaymobConfigurationError'; this.status = 503; }
}

export class PaymobRequestError extends Error {
  constructor(message, providerStatus) { super(message); this.name = 'PaymobRequestError'; this.status = 502; this.providerStatus = providerStatus; }
}
