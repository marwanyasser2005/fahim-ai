# Fahim Agent — implementation audit (October 2026)

This audit evaluates the product contract and implementation. It does **not** claim measured learning outcomes, model accuracy, institutional accreditation, or competition results.

## Executive assessment

The original Agent already had a credible foundation: tool calling, a bounded loop, durable concept mastery, BKT/IRT/FSRS learning logic, authenticated metering, and provider fallback. Its main weakness was not a lack of AI; it was that too much control was delegated to an LLM and too much active-session state was round-tripped through the browser.

The upgraded Agent uses a hybrid architecture: a deterministic pedagogical controller owns the high-stakes sequence, while GenAI is used only where generation or semantic assessment adds value. It now requires an explanation proof after a multiple-choice attempt, keeps pending answers and checkpoints on the server, resumes securely, grounds interventions in an inspectable source ledger, and exposes learner-friendly reasons instead of internal model reasoning.

## Rubric

| Dimension | Before | After | Evidence |
|---|---:|---:|---|
| Pedagogical integrity | 6.0/10 | 9.0/10 | Choice → explanation proof → review → evidence |
| Agent reliability | 5.5/10 | 9.0/10 | Deterministic state policy, seven-step/deadline bounds, graceful diagnostic fallback |
| Grounding and trust | 5.5/10 | 8.5/10 | Source snippets, citation allowlist, confidence surface, explicit partial-source labels |
| Persistence and security | 5.0/10 | 9.0/10 | Server-authoritative owner-scoped sessions; browser cannot supply prior state |
| UX and accessibility | 6.5/10 | 9.0/10 | Compact responsive studio, stage rail, cancel/retry/resume, 44px targets, light/dark tokens |
| Evaluation and observability | 6.0/10 | 8.5/10 | Deterministic guard suite, generation ledger, visible evidence confidence, trace reasons |

Scores are an engineering review of implemented controls, not an efficacy result. The remaining gap to 10/10 requires external evidence: subject-matter-expert review, adversarial multilingual evaluations, and a preregistered learner pilot.

## Implemented architecture

1. `selectPolicyAction` enforces the learning graph and removes an unnecessary planner-model call from normal steps.
2. GenAI generates a diagnostic, evaluates open reasoning, and writes a targeted intervention. Deterministic code grades sealed choices, updates BKT/IRT, schedules FSRS recall, and records evidence.
3. `agent_sessions` stores the opaque checkpoint behind the authenticated server endpoint. Browser roles have no table grants, and the endpoint never accepts `priorState`.
4. The public stream removes answer tokens and answer keys. The interface receives only a reason code, a public observation, and the evidence summary it needs to render.
5. A learner must explain and apply the idea after choosing an answer. Weak reasoning triggers a targeted repair and another proof attempt rather than an unjustified mastery award.
6. The source ledger combines registry/reference destinations with topical snippets. Citations are accepted only when their IDs exist in the server ledger.

## Honest competition boundary

Fahim can demonstrate the complete technical and pedagogical loop today. It must continue to describe learning gain, retention lift, model accuracy, and business outcomes as pending measurement until a real pilot produces those results. The repository evaluation report measures contract coverage only and lists those exclusions explicitly.

## Verification commands

```text
npm run evaluation:check
npx vitest run tests/agent-orchestrator.test.mjs tests/agent-tools.test.mjs tests/agent-system.test.mjs tests/agent-memory.test.mjs
npm run check
```
