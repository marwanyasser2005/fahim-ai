# Judge Evidence Index

This index gives the shortest verifiable path through Fahim. It separates working product evidence from planned validation.

| Judge question | Product evidence | Reproducible evidence | Honest boundary |
|---|---|---|---|
| Is the problem specific? | `/showcase`: one learner, one misconception, one consequence | `docs/DEMO_RUNBOOK.md` | Scenario data is illustrative |
| Is GenAI necessary? | Diagnosis, intervention selection, teach-back, and retrieval cycle | `api/chat.mjs` learning contract | Model accuracy is not yet published |
| Is assessment better than multiple choice? | Reasoning-first quiz and retry evidence | signed grading tests and guard suite | Human-reviewed golden set remains |
| Can teachers act without reading chats? | Teacher Cockpit cohort signals | RLS and minimum-cohort SQL | Real teacher adoption is not claimed |
| Does the product measure impact? | Pilot pre/post/delayed/transfer workflow | reporting threshold and suppression tests | No real outcome result exists yet |
| Is it safe and reliable? | trust center, protected routes, fallback UX | `/evidence`, CI, production smoke, security scan | Sustained field load evidence remains |
| Are certificates credible? | eligibility, signed completion record, public verification | credential migrations and contract tests | No institutional accreditation claim |
| Can it scale in Egypt/MENA? | Arabic-first UI, PWA, low-data mode, bilingual bridge | production deployment and build artifacts | Unit economics require production usage |

## Four links for a judge

1. Product: `https://fahim-ai-egypt.vercel.app`
2. 90-second learning story: `https://fahim-ai-egypt.vercel.app/showcase`
3. Evidence and boundaries: `https://fahim-ai-egypt.vercel.app/evidence`
4. Trust contract: `https://fahim-ai-egypt.vercel.app/trust`

## Reproduce locally

```bash
npm ci
npm run check
npm run audit:production
npm run smoke:production
```

The `evaluation:check` stage runs inside `npm run check` and regenerates the evidence report rendered by `/evidence`.
