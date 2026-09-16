# Security and deployment

## Secrets

- Never place `GEMINI_API_KEY` or `YOUTUBE_API_KEY` in React code, `VITE_*` variables, screenshots, commits, or chat messages.
- The key previously pasted into chat must be revoked/rotated. Add the replacement directly in Vercel Project Settings → Environment Variables.
- Prefer a Google API key restricted to only the required API and production deployment where supported. Use a separate restricted key for YouTube Data API.

## Implemented controls

- Gemini and YouTube requests run in Vercel server functions.
- A shared API boundary enforces exact-origin POSTs, JSON content types, byte limits, request IDs and generic provider errors. Production rate limits use an atomic Supabase bucket shared across Vercel instances; a bounded in-memory bucket is used only as a short availability fallback if that RPC cannot respond.
- AI and external lookup requests have hard timeouts; Gemini harm filters and prompt-injection/data-isolation rules remain enabled.
- Quiz answers are sealed with AES-256-GCM under a dedicated 32+ byte secret; the model API key is never accepted as a signing-key fallback.
- CSP, HSTS, frame denial, MIME sniffing protection, COOP/CORP, restrictive permissions policy and referrer policy.
- YouTube frames/scripts and Supabase HTTPS/WebSocket origins are explicitly allow-listed; microphone access is limited to the same origin for opt-in speech recognition.
- Supabase Auth uses PKCE, persistent secure refresh handling, and provider discovery so disabled OAuth providers are never shown as working.
- Wikipedia returns short search excerpts and original links; it does not copy full articles.
- Production source maps are disabled by Vite.
- The production security gate scans `dist` for source maps, TypeScript/source files, environment files, private-key markers and common server-secret formats.
- Client builds are minified and drop console/debugger statements. Hashed assets receive immutable caching.

## Supabase database gate

The canonical base model is `supabase/migrations/20260807000000_learning_os.sql`; product, billing, evidence, organizations, source registry, review, misconception, and AI-generation tables are added by `20260810000000_canonical_product_foundation.sql`. Distributed rate-limit storage and its service-only RPC are added by `20260810010000_operational_hardening.sql`. The conflicting `owner_id` / `chat_messages` model is preserved for audit under `supabase/legacy_migrations` and must not be applied. Conversation sync now uses the canonical `user_id` / `chat_history` model.

There is exactly **one** migration tree, `supabase/migrations/`. The former duplicate under `src/lib/supabase/migrations/` has been deleted, and `scripts/security-check.mjs` fails the build if a second tree or a second deploy configuration reappears. The same check fails on an RLS policy that authorises from the client-writable `user_metadata` claim, and on any `public` table created without row level security.

Apply these migrations first in a staging branch, generate database types from that deployed schema, run the RLS test matrix as student/instructor/admin/anonymous, take a backup, and only then promote to production. OAuth providers still require real provider credentials and exact redirect URLs in Supabase Auth settings.

Trial activation is a security-definer RPC and is one-time per account. Payment cannot be activated from the browser. Hosted card checkout is **retired**: `/api/billing-checkout`, `/api/stripe-webhook`, and `/api/paymob-webhook` are static `410` endpoints, and the provider helpers in `api/_lib/stripe.mjs` and `api/_lib/paymob.mjs` have no live caller, so `STRIPE_*` credentials are not required to run this repository. The only live billing path is manual transfer review: a learner uploads proof of a Vodafone Cash, InstaPay, or bank transfer, and `review_manual_payment_v1` — gated on `has_permission('payments.review')` or `has_role('admin')` — records the decision, writes the subscription and entitlements, and appends an immutable event. The transfer amount is derived server-side by trigger, never accepted from the client.

Because no payment destination is invented, `manual_payment_methods` ships empty. Nothing can be purchased until an administrator publishes a real account using the admin form; the admin payment panel states this explicitly, and the pricing page refuses to render a placeholder account number.

## Dependency audit

The production dependency audit on 9 August 2026 reports zero known vulnerabilities. Keep `npm audit --omit=dev --audit-level=high` in the release gate and review lockfile changes before deployment.

## Honest limitation

No public website can make its shipped HTML, CSS, JavaScript, or network behaviour impossible to inspect or copy. Minification and source-map removal raise friction only. The real protection is to keep secrets and proprietary logic on the server, enforce licences and attribution, rate-limit APIs, monitor abuse, and retain evidence of authorship.

## Vercel operations

- An earlier production deployment exists at `https://fahim-ai-egypt.vercel.app`; the current canonical-foundation changes in this workspace are not represented as deployed until a new release is built, migrated in staging, promoted, and smoke-tested.
- A WAF rule named `Observe abusive API POST bursts` is staged, not published. It observes requests above 180 POST `/api` requests per minute per IP and takes `log` action only.
- Publish the draft only after reviewing `vercel firewall diff` and confirming the threshold against real traffic. Move from log to enforcement only through preview and production observation stages.
- The production smoke test covers 12 routes, CSS/JS MIME types, health/configuration, AI streaming, YouTube, verified sources, multi-provider search, sealed quiz grading, cross-origin rejection, JSON enforcement and security headers.
- Two production load samples returned zero HTTP failures, but exceeded the internal 2.5s p95 target from the current test runner. Treat multi-region load testing and Vercel observability as an open operational gate; do not represent global latency as certified.

## Required Vercel environment variables

```text
GEMINI_API_KEY=<new rotated server-only key>
GEMINI_MODEL=gemini-3.6-flash
GEMINI_FALLBACK_MODEL=gemini-3.5-flash-lite
YOUTUBE_API_KEY=<restricted YouTube Data API key>
VITE_SUPABASE_URL=<public Supabase project URL>
VITE_SUPABASE_ANON_KEY=<public, RLS-protected anon key>
SUPABASE_URL=<server-side Supabase project URL>
SUPABASE_ANON_KEY=<server-side public anon key used to validate sessions>
SUPABASE_SERVICE_ROLE_KEY=<server-only service key>
PUBLIC_SITE_URL=<canonical HTTPS origin>
FAHIM_ALLOWED_ORIGINS=<comma-separated production and preview origins>
```

`STRIPE_*` and `PAYMOB_*` credentials are not part of this list because hosted checkout is retired.

After setting them for Production and Preview, redeploy and verify `/api/health?mode=ready` returns `200` with `checks.database` reachable. `mode=live` is a liveness probe that performs no I/O; `mode=ready` additionally probes PostgREST and reports `503` with `status: not_ready` when a dependency is down. Deployment configuration booleans are returned only to same-origin callers or a caller presenting the service-role secret.

The credential signing key is generated inside the database and stored in `credential_signing_keys`, which has row level security enabled, no policies, and revoked grants for `anon` and `authenticated`, so it is reachable only by the owner and the service role. Rotating it invalidates every existing signature, so rotation is a deliberate manual operation.
