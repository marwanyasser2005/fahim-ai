import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const webhook = readFileSync(new URL('../api/paymob-webhook.mjs', import.meta.url), 'utf8');

describe('retired Paymob surface', () => {
  it('does not accept provider callbacks', () => {
    expect(webhook).toContain('status(410)');
    expect(webhook).toContain('PROVIDER_BILLING_RETIRED');
    expect(webhook).not.toContain('verifyPaymobTransactionHmac');
  });
});
