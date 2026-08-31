<div align="center">
  <img src="public/brand/fahim-logo.svg" alt="Fahim — Verified Learning OS" width="440" />
  <h1>Fahim · فَهيم</h1>
  <p><strong>Arabic-first Verified Learning OS</strong></p>
  <p>تعلّم. حاول. افهم خطأك. وأثبت تقدّمك.</p>
  <p>
    <a href="https://fahim-ai-egypt.vercel.app">Live product</a> ·
    <a href="https://fahim-ai-egypt.vercel.app/showcase">90-second judge path</a> ·
    <a href="https://fahim-ai-egypt.vercel.app/evidence">Evidence room</a> ·
    <a href="docs/HACKATHON_READINESS_REPORT_2026.md">Hackathon readiness</a> ·
    <a href="docs/ARCHITECTURE.md">Architecture</a>
  </p>
</div>

![CI](https://img.shields.io/badge/quality%20gate-98%20tests-0f766e)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-173f5f)
![Supabase](https://img.shields.io/badge/Supabase-RLS-3ecf8e)
![Arabic first](https://img.shields.io/badge/UX-Arabic--first-f2b84b)
![License](https://img.shields.io/badge/license-proprietary-d95d39)

Fahim turns a learning interaction into an inspectable chain of evidence:

```text
Source → First attempt → Misconception → Intervention → Retry → Evidence → Memory
```

It is not another answer chatbot or course catalogue. Its core product unit is a measurable change in understanding: what the learner believed, why it was incomplete, which intervention helped, what evidence now supports mastery, and when the concept should be recalled again.

## Why this exists

Arabic-speaking learners can access more content than ever, yet most products still optimize for completion, watch time, or answer delivery. Those signals do not prove understanding. Fahim is designed around a harder question:

> Can the learner explain, retrieve, transfer, and defend the concept using trustworthy sources?

The product combines an Arabic-first AI tutor, adaptive assessment, misconception diagnosis, claim-level source labels, spaced review, teacher insight, and a private Learning Passport. The distinctive system is the **Learning Evidence Graph**—a traceable learning record instead of a vanity progress bar.

## Competition demo

Open [`/showcase`](https://fahim-ai-egypt.vercel.app/showcase). It is deterministic, needs no account, and is designed for a four-minute judging slot.

1. Meet one learner in one high-stakes moment.
2. Inspect the trusted source and first attempt.
3. See the misconception represented as a revisable AI hypothesis.
4. Follow the bilingual intervention and retry.
5. Inspect five evidence dimensions and the next review decision.
6. See the privacy-preserving teacher signal.

All showcase outcomes are visibly labelled **illustrative demo data** and never enter a learner account. Fahim does not claim pilot outcomes, institutional accreditation, or partnerships that do not yet exist.

Open [`/evidence`](https://fahim-ai-egypt.vercel.app/evidence) to inspect the weighted readiness estimate, the reproducible 12-control guard suite, the evidence ladder, and every boundary that still requires real learners or partners.

## Product capabilities

| Learning system | What is implemented |
|---|---|
| Verified Learning Loop | Source, attempt, diagnosis, intervention, retry, evidence, scheduled recall |
| AI tutor | Streaming Arabic/English instruction, teach-back, retrieval mode, source-aware explanations, provider failover |
| Assessment | Adaptive quiz generation, server-signed grading, explanations, difficulty, evidence events |
| Misconception Atlas | Normalized misconception events, learner patterns, teacher aggregates with privacy suppression |
| Knowledge Vault | Private uploads, local extraction/chunking/retrieval, cited context; scanned OCR is explicitly limited |
| Learning Passport | Evidence sessions, mistake portfolio, badges, completion credentials, public verification code |
| Teacher Cockpit | Organizations, classes, join codes, assignments, pilot measurements, cohort signals |
| Discovery | Verified Egypt source registry, Wikimedia, OpenAlex, Crossref, YouTube Data API and embedded learning player |
| Retention | SM-2 flashcards, memory queue, due reviews, continuity across devices |
| Trust | Supabase RLS, server authorization, CSP, rate controls, audit trail, claim labels and honest fallback states |
| Access | Arabic/English, RTL/LTR, light/dark/system, reduced motion, low-bandwidth mode, responsive PWA |

## Architecture

```mermaid
flowchart LR
  L[Learner / Teacher] --> UI[React + TypeScript PWA]
  UI --> API[Vercel server APIs]
  API --> AR[Provider-neutral AI router]
  AR --> G[Gemini]
  AR --> R[Agent Router]
  API --> Y[YouTube / Open knowledge APIs]
  UI --> S[Supabase Auth + Postgres + Storage]
  API --> S
  S --> RLS[Row Level Security]
  S --> EG[Evidence & misconception graph]
  EG --> P[Learning Passport]
  EG --> T[Privacy-safe Teacher Cockpit]
```

See [Architecture](docs/ARCHITECTURE.md) for trust boundaries, data ownership, AI routing, and runtime topology.

## Technology

- React 18, TypeScript, Vite, React Router, Framer Motion and Tailwind CSS.
- Supabase Auth, PostgreSQL, Storage, Realtime, SQL RPCs and Row Level Security.
- Vercel serverless APIs with streaming, health checks, security headers and production smoke tests.
- Provider-neutral AI routing with failover and no model/vendor disclosure in learner-facing copy.
- Vitest, ESLint, TypeScript checks, contract tests, security scanning and deterministic builds.

## Local development

Prerequisites: Node.js 20+ and a Supabase project.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Never put server secrets behind a `VITE_` prefix. The browser receives only the Supabase URL and anonymous key. Configure production values in Vercel and Supabase—not in Git.

### Environment variable groups

| Group | Names |
|---|---|
| Browser-safe | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| Server data | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| AI routing | `AI_PROVIDER_ORDER`, `AGENT_ROUTER_*`, `GEMINI_*` |
| External search | `YOUTUBE_API_KEY` |
| Integrity | `QUIZ_TOKEN_SECRET`, `FAHIM_ALLOWED_ORIGINS`, `PUBLIC_SITE_URL` |

The complete names-only template is [.env.example](.env.example).

## Quality gates

```bash
npm run check              # brand render + types + lint + tests + build + secret scan
npm run evaluation:check   # regenerate and verify deterministic learning guards
npm run audit:production   # production dependency audit
npm run smoke:production   # public route/API smoke test
npm run load:test          # controlled API load probe
```

The repository currently contains 98 automated tests across 26 files, 22 Supabase migrations, 38 routed screens, and 12 top-level server API modules. Counts are implementation inventory—not claims of user impact.

## Repository map

```text
api/                 Vercel API routes and server-only integrations
public/brand/        Source SVG identity and reproducible PNG exports
scripts/             Quality, security, load and production smoke tooling
src/components/      Shared product and evidence UI
src/pages/           Public, learner, teacher, admin and trust journeys
src/services/        Supabase, learning sync and domain services
supabase/functions/  Edge functions and email templates
supabase/migrations/ Canonical relational schema, RPCs and RLS
docs/                Architecture, pilot, demo and hackathon evidence
```

## Hackathon positioning

**Primary theme:** Assessment Revolution.  
**Secondary strength:** Best Arabic-Language Solution.

The recommended narrative is not “chat + videos + quizzes.” It is:

> Fahim is the Arabic-first operating system that converts learning into evidence a learner, teacher, and parent can inspect—without exposing private conversations or pretending that completion equals mastery.

Current evidence-backed readiness is scored internally at **85/100** against the supplied judging weights. This is not a jury result. The product can reach a competitive 90+ range only after real pilot evidence, human-reviewed AI evaluation, and operational performance proof. See the full [Hackathon Readiness Report](docs/HACKATHON_READINESS_REPORT_2026.md).

## Evidence policy

- AI confidence is a revisable hypothesis, never a diagnosis presented as fact.
- Every answer is classified as verified source, reasoned inference, educational explanation, or needs review.
- Demo data is visually labelled and isolated from production learner records.
- Completion credentials are verifiable product records, not claims of external accreditation.
- Parent and teacher views expose progress signals—not private learner chat by default.
- No traction, learning gain, accuracy, partnership, or accreditation metric is published without a reproducible source.

## Documentation

- [Hackathon Readiness Report](docs/HACKATHON_READINESS_REPORT_2026.md)
- [AI evaluation protocol](docs/AI_EVALUATION_PROTOCOL.md)
- [Judge evidence index](docs/JUDGE_EVIDENCE_INDEX.md)
- [Architecture and trust boundaries](docs/ARCHITECTURE.md)
- [Four-minute demo runbook](docs/DEMO_RUNBOOK.md)
- [Pilot and measurement protocol](docs/PILOT_PROTOCOL.md)
- [Competition implementation map](FAHIM_HACKATHON_2026.md)
- [Product and business master plan](FAHIM_MASTER_PLAN_2026.md)
- [Canonical implementation specification](NEXT_IMPLEMENTATION_SPEC.md)

## Contribution and ownership

This is a private, proprietary competition and product repository. Read [CONTRIBUTING.md](CONTRIBUTING.md) before making changes. Security issues must be reported privately and must not include learner data in tickets.

Copyright © 2026 Marwan Abdelghaffar and Fahim AI. All rights reserved.
