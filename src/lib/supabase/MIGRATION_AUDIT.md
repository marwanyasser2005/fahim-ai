# FAHIM canonical migration audit

## Decision

`20260807000000_learning_os.sql` is the canonical Learning OS model. It owns these names:

- `conversations.user_id` and `chat_history`
- `progress`
- `subscriptions.user_id`
- `profiles`, roles, permissions, quizzes, notes, bookmarks, and certificates

`20260810000000_canonical_product_foundation.sql` extends the canonical model with onboarding, the 30-day trial, plan entitlements, provider-neutral payment records, source versioning, spaced review, evidence, misconceptions, organizations, classes, assignments, submissions, and project versions.

`20260810010000_operational_hardening.sql` is the operational follow-up. It adds atomic distributed rate-limit buckets and a service-role-only RPC used across Vercel instances.

`20260810020000_stripe_billing.sql` switches active checkout fulfillment to Stripe, preserves historical Paymob-compatible records, and adds atomic service-only subscription activation.

## Quarantined overlap

`legacy_migrations/20260807000100_fahim_learning_os.sql` is preserved for audit only and must not be applied. It attempted to create parallel names (`owner_id`, `chat_messages`, `learning_progress`) after the canonical tables already existed, so its RLS statements could fail against the real columns.

The file was moved, not deleted. No production row or applied database object is removed by this repository change.

## Deployment order

1. Back up the target Supabase project.
2. Confirm the migration history and schema match `20260807000000_learning_os.sql`.
3. If the quarantined migration is recorded as applied in a target environment, inspect that environment before proceeding; do not replay or roll it back automatically.
4. Apply the active 2026 migrations in order: Learning OS, canonical product foundation, then operational hardening. Do not apply the quarantined migration.
5. Generate `database.types.ts` from the staging database with the Supabase CLI; do not hand-author or claim generated types before the migration exists in a real project.
6. Run the RLS and onboarding checks in `tests/canonical-migration.test.mjs` and the role-by-role integration matrix against staging.
7. Exercise email verification, onboarding, trial creation, Free fallback, Stripe Test Checkout, valid/invalid raw-body signatures, duplicate delivery, and subscription activation.
8. Promote the same ordered migration set to production after a restore rehearsal.

## Non-destructive strategy

The forward migration uses additive tables and columns. It does not drop or rename live user tables. Existing `subscriptions.plan` values are mapped into `plan_code`; the original column remains available during the compatibility window.
