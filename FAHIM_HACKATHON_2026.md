> **متجاوَز — Superseded 2026-09-15.** هذا المستند يصف حالة أقدم ولا يعكس المنتج الحالي. المصادر المعتمدة الآن: [README.md](README.md)، [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)، [docs/HACKATHON_READINESS_REPORT_2026.md](docs/HACKATHON_READINESS_REPORT_2026.md)، و[UPDATED_PRODUCT_REVIEW_2026-09-10.md](UPDATED_PRODUCT_REVIEW_2026-09-10.md). أبرز ما تغيّر بعد تاريخ هذا المستند: توقيع الشهادات صار HMAC-SHA256 مع تحقق يُعيد الحساب وإلغاء إداري؛ حلقة التعلّم أُغلقت (إصدار `review_recalled` و`transfer_applied`)؛ الاختبار يُصحَّح ويُسجَّل على الخادم لمسار كامل قابل للإنجاز؛ استهلاك توليد الاختبارات يُقاس ويُقيَّد؛ شجرة الإضافات صارت واحدة تحت `supabase/migrations/`؛ ولا توجد طبقة اختبارات مكوّنات أو E2E بعد.
>
> **Superseded — 2026-09-15.** This document describes an earlier state and no longer
> reflects the product. Authoritative sources today: [README.md](README.md),
> [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md),
> [docs/HACKATHON_READINESS_REPORT_2026.md](docs/HACKATHON_READINESS_REPORT_2026.md), and
> [UPDATED_PRODUCT_REVIEW_2026-09-10.md](UPDATED_PRODUCT_REVIEW_2026-09-10.md). Since this
> document was written: credentials are signed with HMAC-SHA256 and verification recomputes
> the signature, with admin revocation; the learning loop is closed (`review_recalled` and
> `transfer_applied` are emitted); one course is graded and recorded server-side end to end;
> quiz generation spend is metered; there is a single migration tree under
> `supabase/migrations/`; and there is still no component or E2E test layer.

# FAHIM — GenAI for Education Hackathon 2026

## One-line product definition

FAHIM is an Arabic-first, evidence-based AI learning system that turns a learning interaction into an inspectable chain:

> Source → diagnostic → attempt → misconception → intervention → retry → evidence → memory.

It is not positioned as another content catalogue or answer chatbot. Its core unit is a change in understanding supported by a traceable learning artifact.

## Exact competition demo

1. Open `/showcase`; no account is required.
2. Confirm the visible “Prepared demo / illustrative data” label. The scenario is deterministic and contains no real student data.
3. Follow Mariam learning Newton’s Second Law through the seven-step Evidence Graph.
4. On step 1, inspect the source title, version context, and location.
5. On steps 2–3, compare the original attempt with the detected misconception. The confidence is described as a revisable hypothesis.
6. On steps 4–5, inspect the bilingual intervention and corrected mental model.
7. On step 6, inspect the five evidence dimensions. The displayed score is computed from those dimensions.
8. On step 7, inspect the Memory Queue decision and privacy-preserving teacher signal.
9. Open `/register` only if the jury wants to test the real authenticated product. Completing a real Quiz Lab assessment creates an Evidence Session in the learner’s private Learning Passport.

The prepared demo is isolated from production learner records. It does not create progress, certificates, subscriptions, or success metrics.

## Implementation status

Status vocabulary is deliberately explicit:

- **IMPLEMENTED:** running application behavior backed by code and tests.
- **PROTOTYPE:** functional foundation or limited path that still needs operating data, partner workflow, or broader UI coverage.
- **DEMO DATA:** deterministic illustrative data, labelled in-product.
- **PLANNED:** documented direction with no claim of current availability.

| Capability | Status | Evidence / boundary |
|---|---|---|
| Public seven-step judging experience | IMPLEMENTED + DEMO DATA | `/showcase`; deterministic scenario, explicit label, no account writes |
| Verified Learning Loop | IMPLEMENTED | Shared event types and Evidence Graph component; Quiz Lab writes real learner sessions |
| Misconception normalization | IMPLEMENTED | Stable taxonomy with pure tests; AI wording remains a revisable hypothesis |
| Learning Evidence Graph | IMPLEMENTED | Ordered event spine, graph component, protected Learning Passport |
| Adaptive assessment | IMPLEMENTED | Server-signed quiz grading; correct answers remain off the client until grading |
| Memory Queue | IMPLEMENTED / limited | Score-based recall scheduling plus existing SM-2 card scheduler; multi-signal prioritization is the next iteration |
| Source-backed explanations | IMPLEMENTED | Claim classifications, source registry, uploaded local excerpts, citations, `NEEDS_REVIEW` fallback |
| Arabic / English UX | IMPLEMENTED | Runtime language and direction, bilingual concept bridge, localized evidence labels |
| Teach FAHIM mode | IMPLEMENTED | Learner teaches first; tutor evaluates central idea, links, application, and gaps |
| Retrieval mode | IMPLEMENTED | Hint-free recall first; retention is not inferred from one answer |
| Learning Passport | IMPLEMENTED | Protected page built from real sessions only; truthful empty state |
| Cross-device event sync | IMPLEMENTED | Owner-scoped Supabase session/event tables and local-first sync client |
| Low-bandwidth mode | IMPLEMENTED | Persisted toggle suppresses decorative rendering and nonessential motion |
| Teacher misconception insight | PROTOTYPE + DEMO DATA | Privacy-preserving aggregate SQL requires ≥3 learners; showcase teacher card is labelled demo data |
| Knowledge Vault / RAG | IMPLEMENTED / limited | Private local extraction, chunking and retrieval; scanned-document OCR is not claimed |
| AI evaluation dashboard | PLANNED | Prompt/version telemetry exists; formal quality dataset and reviewer dashboard remain |
| Verified external credentials | PLANNED | Existing verification foundation does not claim institutional accreditation without a real issuer |
| Production monitoring and load evidence | PROTOTYPE | Health, telemetry, security and smoke scripts exist; sustained SLO/load evidence needs live operating history |

## Architecture

### Client

- React 18 + TypeScript + Vite.
- Route-level code splitting and protected routes.
- Arabic-first editorial design system with light, dark, system, reduced-motion, and low-bandwidth modes.
- Local-first stores provide instant interaction and offline resilience for non-sensitive learning state.

### Server APIs

- Vercel serverless API routes for AI streaming, quiz generation/grading, search, YouTube, billing evidence, support, and health.
- AI routing is provider-neutral and does not reveal a model/vendor in learner-facing output.
- Quiz answers are signed and graded on the server.

### Data and identity

- Supabase Auth with persistent PKCE sessions and expired-JWT recovery.
- PostgreSQL canonical schema, Row Level Security, role/organization policies, and privacy-preserving aggregate functions.
- `learning_sessions` owns the current concept/evidence state.
- `learning_events` preserves the ordered learning trail.
- `learning_evidence`, `evidence_claims`, `misconception_events`, `review_items`, and `mistake_portfolio` remain specialized authoritative artifacts.

### Trust boundary

- A learner can read and write only their own learning sessions/events.
- Anonymous users cannot read or write learning records.
- Teachers receive aggregate misconception counts only for classes they teach; counts below three learners are suppressed.
- Demo data is static, visible, and cannot be confused with a live cohort metric.
- Provider secrets, service-role keys, prompt internals, and model identifiers remain server-side.

## Judging map

| Judging question | Where to inspect |
|---|---|
| Is the educational problem clear? | Showcase hero and misconception step |
| Is AI necessary rather than decorative? | Diagnosis, adaptive intervention, teach-back, and retrieval modes |
| Is progress meaningful? | Evidence Ledger, five mastery dimensions, Learning Passport |
| Is the experience differentiated? | Learning Evidence Graph + Misconception Atlas + Memory Queue |
| Is it useful in Egypt and the Arabic-speaking region? | Arabic-first flow, bilingual concept bridge, low-bandwidth mode |
| Is it responsible? | Source classification, revisable confidence, privacy boundary, no fake accreditation |
| Can it scale beyond a demo? | Normalized event schema, RLS, idempotent client IDs, server APIs, local-first sync |
| Is the demo reliable? | Public deterministic route, no auth/API dependency, contract tests |

## Environment variables

Names only—never commit values:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AGENT_ROUTER_API_KEY`
- `AGENT_ROUTER_BASE_URL`
- `AGENT_ROUTER_MODEL`
- `AGENT_ROUTER_FALLBACK_MODEL`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `GEMINI_FALLBACK_MODEL`
- `AI_PROVIDER_ORDER`
- `YOUTUBE_API_KEY`
- `QUIZ_TOKEN_SECRET`
- `FAHIM_ALLOWED_ORIGINS`
- `PUBLIC_SITE_URL`

## Verification commands

```bash
npm run check
npm run audit:production
npm run smoke:production
```

`npm run check` runs TypeScript, ESLint, unit/contract tests, production build, and the repository security check. Production smoke must be run after deployment against the production origin.

## Honest next steps

1. Expand the Memory Queue from score-only scheduling to a validated multi-signal retention policy.
2. Connect the real teacher UI to the privacy-preserving class misconception RPC and validate it with actual school workflows.
3. Add an expert-reviewed AI evaluation set for Arabic curriculum explanations, citations, misconception diagnosis, and refusal behavior.
4. Add OCR and server-side hybrid retrieval only after consent, retention, deletion, and cost policies are finalized.
5. Establish production SLOs, alerting, load tests, incident ownership, and at least one full operating cycle.
6. Issue signed credentials only after an authorized assessment partner, issuer identity, revocation process, and evidence standard are operational.

