# Fahim product roadmap

## Product vision

Become the trusted Arabic-first decision layer for learning in Egypt: every learner can move from “I am stuck” to a verified explanation, the right video, an active check and a visible next step in under ten minutes.

## North-star metric

**Completed verified learning loops per weekly active learner**

A completed loop requires at least three events: explanation or source review, learner attempt/quiz, and a completion or next-step decision. Page views and chatbot messages alone are not success.

## Phase 0 — foundation (completed now)

- modern responsive RTL/LTR design and dark mode;
- server-only Gemini integration with primary/fallback models and safety controls;
- multi-turn chat context and source-aware Wikipedia references;
- Egypt/Arabic YouTube search with SafeSearch and captions option;
- official Egyptian resource directory;
- unified smart workspace carrying grade, subject and topic between tools;
- local progress events with no signup;
- Vercel production deployment, CSP and secret separation.
- Atlas visual system, responsive editorial navigation and a custom original illustration;
- four-provider knowledge search (verified Egyptian registry, Wikimedia, OpenAlex and Crossref);
- local PDF/text knowledge vault with Arabic retrieval and cited tutor hand-off;
- adaptive spaced-review queue;
- local teacher/class/assignment and project-rubric pilot;
- health, Web Vitals telemetry and repeatable load-test tooling.

Exit criterion: production pages and APIs pass build, route and security checks.

## Phase 1 — activation and evidence (0–6 weeks)

### P0

1. Add restricted `GEMINI_API_KEY` and `YOUTUBE_API_KEY` to Production/Preview and create quota alerts.
2. Add Supabase authentication as optional—not mandatory—for progress sync across devices.
3. Build a verified Egyptian source registry: grade, subject, term, academic year, source owner, URL and review date.
4. Store AI sessions only with explicit consent; default to local history for minors.
5. Add answer feedback: useful/not useful, wrong source, too difficult, and report-safety issue.

### P1

- transparent video score: topic match, grade terms, Arabic relevance, captions, duration and trusted-channel signal;
- saved videos/sources and “continue session” queue;
- one-question-at-a-time quiz state with answer evaluation;
- low-bandwidth mode: no thumbnails, shorter responses, fewer search results;
- anonymous product analytics focused on completed loops.

Exit targets: ≥45% first-session loop completion; ≥25% week-one return; ≥70% useful-answer rating; <1% unsupported-source reports.

## Phase 2 — curriculum grounding (6–12 weeks)

- retrieval pipeline over licensed/open official material with academic-year versioning;
- citation spans that open the exact source section where permitted;
- curriculum map for Egyptian preparatory/secondary STEM first;
- misconception library and prerequisite graph;
- adaptive review queue based on attempts, not message count;
- human curation console for sources, channels and reported answers;
- automated evaluation set in Arabic for accuracy, pedagogy, citation validity and safety.

Current status: local file grounding and lexical retrieval are complete. OCR for scanned pages, embeddings, licensed curriculum versioning and server-side sync remain in this phase because they require storage, compute, rights and retention policies.

Exit targets: ≥85% citation validity on evaluation set; ≥80% curriculum-match rating; 30% improvement between first and repeated quiz attempt.

## Phase 3 — retention and multimodality (3–6 months)

- move the completed local notes/PDF vault to consented encrypted cloud sync; add OCR and copyright controls;
- extend the completed spaced-review scheduler with cited automatic card generation and cross-device sync;
- Feynman teach-back using speech-to-text, with delete-by-default audio handling;
- diagrams and interactive STEM visualizations;
- teacher-curated playlists and shareable study sessions;
- parent/teacher view showing goals, attempts and sources—not private chat content by default.

Exit targets: ≥3 completed loops per weekly active learner; ≥35% four-week retention; measurable improvement in delayed recall.

## Phase 4 — schools and sustainable business (6–12 months)

- school pilots with 3–5 Egyptian institutions;
- teacher roster and assignment integration, then LMS/LTI if demand is proven;
- institutional privacy controls, audit logs and data-processing agreements;
- freemium individual tier, affordable Plus tier and school licences;
- licensed content partnerships rather than unauthorized ingestion;
- Arabic regional expansion only after Egyptian curriculum quality is repeatable.

The in-product Studio is a local pilot, not an LMS claim. Verified certificate issuance remains “Soon” until identity verification, server-authoritative completion, proctored/reviewed assessment, signed credential records and a public verification endpoint are operational.

## Architecture roadmap

```text
React/Vite client
  ├─ local-first profile and progress
  ├─ optional Supabase auth/sync
  └─ Vercel server APIs
       ├─ AI provider adapter (Gemini primary + fallback)
       ├─ source retrieval and citation verifier
       ├─ YouTube search/ranking/cache
       ├─ moderation, quotas and audit events
       └─ evaluation and feedback pipeline
```

## Security and governance gates

- no production secret in `VITE_*`, browser bundles, chat or repository;
- separate Google keys for Gemini and YouTube with API restrictions;
- explicit data-retention policy before account sync or file uploads;
- age-appropriate privacy review before voice or school pilots;
- licensed or open material only; link to copyrighted sources by default;
- monthly prompt-injection, citation, abuse, quota and dependency review;
- provider budget caps and graceful local continuity mode.

## Prioritized backlog (RICE-style)

| Priority | Initiative | Why now |
|---|---|---|
| P0 | Production API secrets + quota alerts | Unlocks the core live experience safely |
| P0 | Verified source registry | Creates trust and a defensible Egypt-specific data asset |
| P0 | Feedback and evaluation harness | Prevents shipping impressive but wrong tutoring |
| P1 | Quiz state + mastery events | Converts chat consumption into measurable learning |
| P1 | Video quality score and caching | Makes the YouTube engine meaningfully better than YouTube search |
| P1 | Optional progress sync | Retention and multi-device use without blocking first visit |
| P2 | File grounding/OCR | Competitive parity after privacy and copyright controls |
| P2 | Voice teach-back | High learning value but higher safety/cost complexity |
| P3 | Teacher/parent dashboards | Valuable after individual outcomes are proven |
| P3 | Open community/live tutoring | Operationally expensive; avoid before moderation capacity exists |

## Release discipline

Every release must pass TypeScript, lint, production build, API syntax checks, route/MIME verification, secret scan, source-map check and a small Arabic/English evaluation set. Production is promoted only after the exact built assets are verified on the deployment URL.
