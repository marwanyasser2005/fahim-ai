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

`supabase/legacy_migrations/20260807000100_fahim_learning_os.sql` is preserved for audit only and must not be applied. It attempted to create parallel names (`owner_id`, `chat_messages`, `learning_progress`) after the canonical tables already existed, so its RLS statements could fail against the real columns.

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

## 2026-09-15 — single tree and three new migrations

The duplicate migration tree that used to live under `src/lib/supabase/migrations/` has been
**deleted**; `supabase/migrations/` is the only source of truth, and
`scripts/security-check.mjs` now fails the build if a second tree reappears. The quarantined
file moved with it and now lives at `supabase/legacy_migrations/20260807000100_fahim_learning_os.sql`.

New migrations applied in order after `20260830010000`:

1. `20260915000000_critical_hardening.sql` — indexes `learning_events(user_id, event_type)`,
   converts the badge-refresh triggers to statement-level, restricts `profiles` updates to
   presentation columns, forces `assignments.created_by` to the caller, replaces the anonymous
   certificate verification with an allowlist projection (`verify_certificate_v3`), and adds
   admin-only revocation (`revoke_certificate_v1`). It also hardens the historical
   `dusty_recipe` admin policy, which authorised from the client-writable `user_metadata` claim.
2. `20260915010000_course_completion_v1.sql` — creates `courses`/`lessons` for fresh projects
   with RLS, seeds one completable bilingual course **only when the project has no course
   content**, exposes assessment questions without answer keys (`course_assessment_v1`), and
   grades submissions inside the database, recording every attempt in `quiz_results`
   (`submit_course_assessment_v1`). These tables are what `my_certificate_eligibility_v2` and
   the `path_finisher` badge read.
3. `20260915020000_credential_signing_v1.sql` — generates the HMAC-SHA256 credential signing
   key inside `credential_signing_keys` (RLS enabled, no policies, grants revoked), signs every
   certificate on write through a trigger so no issuance path — including the admin API — can
   produce an unsigned record, recomputes the signature at verification time, and returns
   `signature_valid` from the public endpoint. Replaces the earlier keyless SHA-256 digest.

All three are additive: no table, column or row is dropped, and the course seed refuses to run
against a project that already has course content.
