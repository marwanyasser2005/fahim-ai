import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const migration = readFileSync(new URL('../supabase/migrations/20260814000000_manual_commerce_support_content.sql', import.meta.url), 'utf8');
const checkout = readFileSync(new URL('../api/billing-checkout.mjs', import.meta.url), 'utf8');

describe('manual commerce operations', () => {
  it('derives the trusted amount server-side and isolates owner uploads', () => {
    expect(migration).toContain('select price_egp into expected_amount');
    expect(migration).toContain("split_part(new.proof_storage_path, '/', 1) <> auth.uid()::text");
    expect(migration).toContain("new.amount_egp := expected_amount");
  });

  it('keeps payment review decisions admin-only and audited', () => {
    expect(migration).toContain("if not public.has_permission('payments.review')");
    expect(migration).toContain("'manual_payment.' || decision");
    expect(migration).toContain("decision not in ('under_review', 'approved', 'rejected', 'resubmission_required')");
  });

  it('activates entitlement only after explicit approval', () => {
    expect(migration).toContain("if decision = 'approved' then");
    expect(migration).toContain("provider = 'manual_proof'");
    expect(migration).toContain("'ai_sessions_month', 300");
  });

  it('does not expose unpublished first-party files', () => {
    expect(migration).toContain("where v.is_published");
    expect(migration).toContain("where r.status = 'published'");
  });

  it('retires hosted checkout rather than leaving a second activation path', () => {
    expect(checkout).toContain('status(410)');
    expect(checkout).toContain('MANUAL_PAYMENT_REVIEW_ACTIVE');
  });
});
