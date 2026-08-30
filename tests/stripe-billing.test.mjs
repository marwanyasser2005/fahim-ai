import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const checkout = readFileSync(new URL('../api/billing-checkout.mjs', import.meta.url), 'utf8');
const webhook = readFileSync(new URL('../api/stripe-webhook.mjs', import.meta.url), 'utf8');

describe('retired Stripe surface', () => {
  it('cannot create hosted checkouts', () => {
    expect(checkout).toContain('status(410)');
    expect(checkout).toContain('MANUAL_PAYMENT_REVIEW_ACTIVE');
  });
  it('cannot activate subscriptions through legacy webhooks', () => {
    expect(webhook).toContain('status(410)');
    expect(webhook).toContain('PROVIDER_BILLING_RETIRED');
    expect(webhook).not.toContain('activate_stripe_subscription_v1');
  });
});
