# Fahim Tutor Agent & SME Business Impact

This document is the reviewer's guide to the agentic layer added for **Agents at Work**, built on top of Fahim's existing verified-learning engine (**GenAI for Education**). One product, two hackathons. The October 2026 implementation audit is in `docs/FAHIM_AGENT_AUDIT_2026.md`.

## 1. Why this is an agent, not a chatbot

A chatbot maps one prompt to one completion. The Fahim Tutor Agent runs a bounded **plan → act → observe** loop in which the **model chooses the next tool** each step, the orchestrator executes it, and the observation is fed back into the next decision. It has tools, durable memory, and autonomy — the three properties the hackathon webinars call out.

```
loadLearnerState(concept)            # durable memory in
  └─ loop (≤ 6 steps, deadline-bounded):
       decideNextAction()            # model picks ONE tool (native tool_calls OR JSON action)
         → execute(tool, args)       # deterministic or provider-backed
         → observation → scratchpad  # fed back into the next decision
  └─ persist mastery + review + evidence   # durable memory out
```

- Entry: `POST /api/agent` (a sub-route of `/api/ai` — **zero new Vercel functions**).
- Core: `api/_lib/agent/orchestrator.mjs`, `tools.mjs`, `memory.mjs`, `handler.mjs`.
- UI: `src/pages/AgentStudio.tsx` at `/agent`, streaming the live trace over NDJSON via `src/lib/agentClient.ts`.

## 2. Tools (single source of truth: `AGENT_TOOLS`)

| Tool | Kind | What it does |
|---|---|---|
| `get_learner_state` | deterministic | Reads BKT mastery, IRT ability, due reviews for the concept |
| `search_verified_sources` | deterministic | Verified Egyptian registry ranking for grounding |
| `generate_diagnostic` | provider | One MCQ with a **sealed AES-GCM answer key** (the model never sees the key) |
| `assess_answer` | deterministic | Grades the sealed item, updates mastery via **BKT**, updates ability via **IRT** |
| `diagnose_misconception` | deterministic | Classifies the error into a bilingual category |
| `select_next_item` | deterministic | **IRT** difficulty selection so the next item stays informative |
| `explain_concept` | provider | The grounded teaching intervention, targeted at the misconception |
| `schedule_review` | deterministic | **FSRS** next-review scheduling, persisted |
| `record_evidence` | deterministic | Writes a measured change-in-understanding record |
| `ask_learner` / `finish` | terminal | Pause for learner input, or end the session |

Both decision protocols share the same executor: **native function-calling** (`tool_calls` on the OpenAI contract, `functionCall` parts on Gemini — normalized by `readAgentResponse`) with a **JSON-action fallback** (`{"tool","args"}` / `{"final"}`) parsed by `parseJsonAction`, so any provider works.

## 3. Durable memory (Supabase)

Migrations `supabase/migrations/20260927000000_agent_memory.sql` and `supabase/migrations/20261002185911_agent_session_integrity.sql`:
- `concept_mastery` — server-owned per-learner BKT mastery + IRT ability (unique on `user_id, concept_key`), owner RLS, reader RPC `my_concept_mastery_v1()`.
- `review_items` gains `stability`, `difficulty`, `last_review_at` so the **full FSRS card** round-trips.
- `ai_generations.task_type` now allows `'agent'` for metering.
- `agent_sessions` keeps pending diagnostics and controller checkpoints authoritative on the server; browser roles have no direct table grants.

The server writes these with the service-role client (same pattern as `ai_generations`); learners read their own rows under RLS.

## 4. SME business impact

Migration `supabase/migrations/20260927010000_sme_impact.sql` + Teacher Cockpit **Business Impact** tab.

Framing: the agent is an **AI teaching assistant** employed by a tutoring centre (an Egyptian SME). `sme_impact_summary_v1(org_id)` counts **real activity** for the centre's enrolled learners and multiplies by **editable centre assumptions**:

```
hours_saved     = (agent_sessions·min_per_diagnosis + assessments·min_per_grading + reviews·min_per_followup) / 60
cost_saved      = hours_saved · teacher_hourly_cost
extra_capacity  = floor(hours_saved / hours_per_extra_student)
revenue_enabled = extra_capacity · revenue_per_student
```

The RPC returns the raw activity counts, the assumptions, and the projection together, so the UI shows every number's formula. **Every figure is a projection = real activity × assumptions, explicitly not a measured financial outcome.** No outcomes are seeded.

## 5. Honesty boundaries (unchanged policy)

- Mastery is a revisable **BKT probability**, never a final verdict; misconception categories are unvalidated model labels.
- The diagnostic answer key is sealed server-side; grading is deterministic and local.
- Business-impact numbers are transparent projections with editable assumptions, never fabricated results or pilot outcomes.
- The agent never reveals chain-of-thought, models, providers, or infrastructure to the learner. It exposes a short pedagogical reason code instead.
- A multiple-choice response is not sufficient proof of mastery: the learner must explain and apply the concept, and that explanation is assessed before evidence is recorded.

## 6. Run & test

```bash
npm run dev                 # /agent (learner) and /teacher → Business Impact (staff)
npx vitest run tests/agent-orchestrator.test.mjs tests/agent-tools.test.mjs tests/agent-system.test.mjs
npm run check               # full gate: types + lint + tests + build + secret scan
```

Environment: same as the base product (`AI_PROVIDER_ORDER` / provider keys, `QUIZ_TOKEN_SECRET` ≥ 32 chars for sealed diagnostics, Supabase URL + service-role key for durable memory). A configured server-side session store is required so the browser can never become the authority for pending answers or learning checkpoints.
