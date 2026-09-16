# Fahim vNext — production implementation audit

**Audit date:** 16 September 2026  
**Scope:** the attached Master Implementation Specification, the current repository, the production build, the AI gateway, and the release path to GitHub/Vercel.  
**Evidence rule:** this report distinguishes shipped code, locally verified code, production configuration, and work that still requires real data or an operational dependency.

## Executive outcome

Fahim is no longer only a polished tutoring UI. The current release contains a provider-neutral learning gateway, deterministic learning algorithms, protected generation endpoints, cited tutoring flows, course assessment contracts, evidence-driven badges and credentials, and a coherent bilingual design system.

The release is **code-ready and test-verified**, but the full vNext P0 milestone is **not yet operationally complete**. The remaining critical boundary is the production data plane: curriculum ingestion, stored multilingual embeddings, hybrid retrieval over approved curriculum versions, and remote application of the latest database migrations. Those cannot be truthfully marked complete until the Supabase production connection and representative curriculum corpus are available.

## Verified in this release

| Capability | Status | Evidence |
|---|---|---|
| Provider-neutral AI routing | Complete in code | Agent Router, Gemini, and Hugging Face are isolated behind one server interface with deadline-aware failover. |
| Free-first experimental route | Complete in code and Production config | `HF_FREE_FIRST=true`; provider order begins with the experimental HF route and falls back without exposing the vendor to learners. |
| Hugging Face chat path | Live-tested | A real authenticated chat-completion request returned HTTP 200 and non-empty content. |
| Multilingual embeddings | Live-tested and integrated | The HF feature-extraction route returned a normalized 1024-dimensional vector; the gateway now supports batch embedding and cosine reranking. |
| Gateway privacy | Complete in code | Public responses redact provider, model, and cost; operational records retain those fields server-side for observability. |
| Gateway abuse controls | Complete in code | Same-origin enforcement, rate limiting, bounded bodies, deadlines, and Supabase session validation protect provider-backed tasks. |
| BKT / IRT / FSRS ownership | Complete in code | Mastery, adaptive probability, and review scheduling run deterministically without an LLM. |
| Tutor evidence contract | Complete for current sources | Claim-level source IDs, uncertainty labels, uploaded-context boundaries, and no fabricated fallback response. |
| Generation metering | Complete in code | Chat and quiz generations create observable records with usage, status, latency/failure context, and estimated cost where configured. |
| Course and assessment contracts | Complete locally | Course/lesson persistence, authenticated assessment submission, grading, completion thresholds, and automatic credential eligibility are represented in migrations and tests. |
| Credential integrity | Complete locally | HMAC-backed signing, public verification, revocation state, QR/ID rendering, evidence criteria, and honest “Certificate of Completion” language. |
| Visual system | Complete for the audited routes | Semantic tokens, Arabic/English directions, light/dark modes, reduced-motion rules, consistent Lucide icon language, and responsive route-level splitting. |
| Automated quality gate | Passed | 32 test files, 150 tests, TypeScript, ESLint, production build, 12/12 learning-guard contracts, and security scan all pass. |

## P0 Definition of Done — honest status

| P0 requirement | Current status | What remains |
|---|---|---|
| Login and curriculum context | Working | Store a canonical curriculum selection against the new curriculum graph rather than profile text alone. |
| Curriculum question with grounded sources | Partial | Current tutor uses uploaded excerpts, verified registry sources, and open-reference search. It does not yet query a production corpus of ministry-approved chunks. |
| Verified curriculum RAG | Partial | Source registry/version/chunk tables exist and embeddings now work, but ingestion, vector persistence, hybrid BM25/vector retrieval, and reranker evaluation are not end-to-end in Production. |
| Practice question and mastery update | Partial | Quiz, learning events, evidence, BKT, and mastery UI exist. The canonical server transaction connecting a concept-tagged attempt to a persisted BKT state still needs the curriculum concept schema. |
| Mastery map | Working as local-first product surface | Requires server-backed concept IDs and longitudinal calibration for institutional use. |
| Next best action | Working as transparent rules | Requires curriculum prerequisites and persisted mastery to become a fully data-driven recommendation. |
| Smart study session | Working as a learner flow | Server-side session plan, completion contract, and cross-device state remain incomplete. |
| Review state | Working with FSRS/local-first sync layer | Remote migration and conflict tests must be proven against Production. |
| Multi-model routing | Complete | Continue monitoring real fallback rate and cost. |
| Safety and verification | Substantial | Local injection rules and tutor constraints are present; the optional dedicated guard model and a human-reviewed red-team set remain. |
| AI observability | Complete in code | Connect alerts/dashboard to real Production events and establish SLO baselines. |
| FahimEval | Contract suite complete, model benchmark pending | The 12/12 suite verifies product contracts, not model accuracy or learning gains. A teacher-reviewed Arabic curriculum set is still required. |

## Release verification

Executed from a clean production build path after the gateway changes:

- Brand assets rendered successfully.
- Learning guard evaluation: **12/12 passed**.
- TypeScript: passed with no emit.
- ESLint: passed.
- Vitest: **32 files / 150 tests passed**.
- Vite production build: passed; routes remain code-split.
- Security check: passed; **0 source maps**, no detected committed secret, **25 migrations**, **65 RLS-enabled tables**.
- Live Hugging Face chat probe: accepted and returned content.
- Live multilingual embedding probe: accepted, **1024 dimensions**.
- Vercel Hobby deployment budget: **12/12** serverless functions after consolidating the duplicate gateway and source-registry route into `/api/ai` and `/api/search?source=official`.

## Production dependency finding

The Vercel project is reachable and its Production environment now contains the Hugging Face token as a **Sensitive** variable. No token is stored in Git or a workspace env file.

The database migration audit could not complete because the `SUPABASE_DB_PASSWORD` currently stored in Vercel is rejected by the linked Supabase project. The temporary environment file used for that single check was deleted immediately. Consequently:

- the three latest migrations are reviewed and locally tested but cannot be claimed as applied remotely;
- no destructive SQL was attempted;
- remote RLS/advisor results cannot be claimed;
- code paths must continue to fail closed or degrade honestly when those RPCs are absent.

## Highest-value next gate

1. Replace the Vercel Production database password with the current Supabase database password.
2. Compare local and remote migration history, repair history only if required, then apply migrations in order.
3. Run Supabase security/performance advisors and authenticated RPC smoke tests.
4. Add the curriculum concept graph and a versioned Egyptian curriculum dataset.
5. Persist 1024-dimensional embeddings in pgvector and implement hybrid retrieval with claim-level chunk references.
6. Build a 100–300 item teacher-reviewed FahimEval set covering Arabic, English, STEM notation, misconceptions, citation fidelity, and refusal behavior.
7. Run a consented four-week pilot; report learning gain, retention, and weak-concept recovery without inventing results.

## Product assessment after this release

- **Product/UI maturity:** 9.0/10 for a competition prototype.
- **Engineering readiness:** 8.6/10 locally; remote database proof is the main deduction.
- **Hackathon demo readiness:** 9.1/10 when using the prepared deterministic judge path.
- **Operational P0 completion:** approximately 72%; curriculum RAG and remote data verification dominate the remaining work.

These scores are an engineering assessment, not user research, model accuracy, traction, accreditation, or measured educational impact.
