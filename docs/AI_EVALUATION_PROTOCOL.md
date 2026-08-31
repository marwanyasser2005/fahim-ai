# Fahim AI Evaluation Protocol

## Purpose

Fahim evaluates two different things and never combines them into one misleading number:

1. **Deterministic product-contract coverage** — whether required access, privacy, evidence, grading, and reporting controls exist in the shipped implementation.
2. **Model and educational performance** — whether AI responses are accurate and pedagogically useful, and whether learners improve and retain knowledge.

Only the first layer is currently published as a passing score. The second requires human reviewers and real participants.

## Layer 1 — deterministic guard suite (implemented)

Run:

```bash
npm run evaluation:check
```

The command inspects repository artifacts and regenerates `src/data/evaluationReport.json`. It fails the quality gate if any required contract is missing. The public `/evidence` route renders the same report.

Current control areas:

- authenticated AI and quiz access;
- same-origin and distributed rate controls;
- provider failover;
- evidence labels and prompt-injection boundaries;
- server-signed grading and reasoning-first assessment;
- answer-withholding before a new attempt;
- owner-scoped RLS and cohort privacy suppression;
- evidence-based completion credential boundaries.

This score is **not** model accuracy, learning gain, retention improvement, traction, or accreditation.

## Layer 2 — human-reviewed golden set (protocol ready, results pending)

Build a versioned 30-case Arabic/English evaluation set across six categories:

| Category | Minimum cases | Human review criteria |
|---|---:|---|
| Claim grounding | 6 | Citation supports the exact claim; unsupported certainty is labelled |
| Misconception reasoning | 6 | Hypothesis matches the learner reasoning and avoids shaming |
| Assessment integrity | 5 | No answer leakage; one defensible answer; level is appropriate |
| Bilingual pedagogy | 5 | Arabic is natural; English STEM bridge is useful, not clutter |
| Safety and privacy | 4 | No secret/model disclosure, sensitive-trait inference, or cheating help |
| Recovery and uncertainty | 4 | Missing/conflicting evidence produces a useful `NEEDS_REVIEW` response |

Two reviewers score each response independently on a 0–2 rubric. Disagreement is adjudicated and failure examples are retained. Report category distributions and confidence intervals—not one unqualified “accuracy” number.

## Layer 3 — real learning impact (infrastructure implemented, results pending)

Use the Teacher Cockpit pilot workflow with explicit consent:

1. pre-test and open explanation;
2. traceable Fahim learning cycle;
3. immediate post-test;
4. delayed recall;
5. transfer question in a different context.

The database suppresses averages below the configured minimum sample size. Publish sample, attrition, instrument, time interval, and limitations alongside every result.

## Release gate

A release may claim:

- a product control only when the deterministic suite passes;
- AI quality only after the golden-set run is versioned and human-reviewed;
- educational impact only after the pilot protocol is completed with real participants;
- accreditation only after a documented institutional agreement.
