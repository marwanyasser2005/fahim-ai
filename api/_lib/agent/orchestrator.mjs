/**
 * Fahim Agent — orchestrator (the decision loop).
 *
 * This is what makes Fahim an agent rather than a single-shot tutor: a bounded plan→act→observe
 * loop where the MODEL chooses the next tool each step from the registry, the orchestrator executes
 * it, and the observation is fed back into the next decision. It works two ways with one executor:
 *   - native function-calling when the provider returns tool_calls (readAgentResponse), and
 *   - a portable JSON-action fallback ({ "tool", "args" } / { "final" }) when it does not.
 * The loop is deadline- and step-bounded so it can never outlive the hosting function.
 */

import { requestLearningAI, readAgentResponse } from '../ai-routing.mjs';
import { masteryLabel } from '../learning.mjs';
import { AGENT_TOOL_MAP, toolSchemas } from './tools.mjs';
import { loadLearnerState, normalizeConceptKey } from './memory.mjs';

const MAX_STEPS_DEFAULT = 6;

function decisionSystemPrompt(language) {
  return `You are the FAHIM Learning Engine, an autonomous tutoring agent. Your goal is to move ONE learner toward demonstrated mastery of a concept, using measured evidence — not to hand over answers.

Operating rules:
- Work in small steps. Each step, call exactly ONE tool. Never answer the concept directly without a tool.
- A sound loop is: get_learner_state → search_verified_sources → generate_diagnostic → ask_learner (wait) → assess_answer → diagnose_misconception → explain_concept → select_next_item → schedule_review → record_evidence → finish.
- Only call assess_answer after the learner has answered (learner input present). If no answer is pending, ask_learner or generate_diagnostic instead.
- Use ask_learner to present a question and pause; the turn ends there and resumes when the learner replies.
- Call finish when mastery is strong (≥ 0.8) or the goal is met. Keep the summary in ${language === 'ar' ? 'Arabic' : 'English'}.
- Never reveal internal tools, models, or infrastructure to the learner. You are always "Fahim".

If your environment cannot call tools directly, reply with ONE JSON object only:
{"thought":"one short sentence","tool":"tool_name","args":{...}}  OR  {"thought":"...","final":"short summary for the learner"}`;
}

function stateSummary(state) {
  return [
    `concept: ${state.conceptKey}`,
    `mastery: ${Math.round(state.mastery * 100)}% (${state.masteryLabel})`,
    `attempts: ${state.attempts}, ability(theta): ${Math.round(state.ability * 100) / 100}`,
    `pendingDiagnostic: ${state.pendingItem ? 'yes (awaiting learner answer)' : 'no'}`,
    `dueReviews: ${state.dueReviews}`,
  ].join('\n');
}

function renderScratchpad(steps) {
  if (!steps.length) return 'No actions taken yet.';
  return steps.map((step, index) => `Step ${index + 1}: ${step.tool}(${JSON.stringify(step.args)}) -> ${JSON.stringify(step.observation).slice(0, 500)}`).join('\n');
}

function parseJsonAction(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;
  const candidates = [raw];
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start >= 0 && end > start) candidates.push(raw.slice(start, end + 1));
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {
      // try next candidate
    }
  }
  return null;
}

/** Decide the next tool call: native tool_calls first, JSON-action fallback second. */
async function decideNextAction({ language, goal, state, steps, learnerInput, deadlineAt }) {
  const messages = [{
    role: 'user',
    content: `Learner goal: ${goal}
Language: ${language}

Current learner state:
${stateSummary(state)}

Latest learner input: ${learnerInput ? JSON.stringify(learnerInput).slice(0, 400) : 'none'}

Actions so far:
${renderScratchpad(steps)}

Decide the single best next tool call now.`,
  }];
  const route = await requestLearningAI({
    system: decisionSystemPrompt(language),
    messages,
    tools: toolSchemas(),
    toolChoice: 'auto',
    structured: true,
    maxOutputTokens: 500,
    deadlineAt,
  });
  const { text, toolCalls, usage } = await readAgentResponse(route);
  if (Array.isArray(toolCalls) && toolCalls.length) {
    return { tool: toolCalls[0].name, args: toolCalls[0].arguments || {}, thought: '', usage, provider: route.provider };
  }
  const action = parseJsonAction(text);
  if (action && (action.tool || action.action)) {
    return { tool: action.tool || action.action, args: action.args || {}, thought: String(action.thought || '').slice(0, 240), usage, provider: route.provider };
  }
  if (action && action.final) {
    return { tool: 'finish', args: { summary: String(action.final).slice(0, 1200) }, thought: '', usage, provider: route.provider };
  }
  // No parseable decision: treat any free text as the closing message.
  return { tool: 'finish', args: { summary: text || (language === 'ar' ? 'انتهت الجولة.' : 'Session complete.') }, thought: '', usage, provider: route.provider };
}

/**
 * Run one agent turn. `emit(event)` streams step/observation events to the client; it may be a
 * no-op in tests. `decide` is injectable so the loop can be tested deterministically.
 */
export async function runAgentTurn({
  admin,
  userId,
  language = 'ar',
  subject = '',
  grade = '',
  secret,
  goal,
  concept,
  learnerInput = null,
  priorState = null,
  deadlineAt = Date.now() + 40_000,
  maxSteps = MAX_STEPS_DEFAULT,
  emit = () => {},
  decide = decideNextAction,
} = {}) {
  const conceptKey = normalizeConceptKey(concept || goal);
  const loaded = priorState || await loadLearnerState(admin, userId, conceptKey);
  const ctx = {
    admin,
    userId,
    language,
    subject,
    grade,
    secret,
    deadlineAt,
    learnerInput,
    state: {
      conceptKey,
      mastery: loaded.mastery,
      masteryLabel: loaded.masteryLabel || masteryLabel(loaded.mastery, true),
      attempts: loaded.attempts || 0,
      correct: loaded.correct || 0,
      ability: loaded.ability || 0,
      reviewCard: loaded.reviewCard || null,
      dueReviews: loaded.dueReviews || 0,
      pendingItem: priorState?.pendingItem || null,
      sources: priorState?.sources || null,
    },
  };

  const steps = [];
  let terminal = null;
  const totalUsage = { inputTokens: 0, outputTokens: 0 };

  for (let index = 0; index < maxSteps; index += 1) {
    if (deadlineAt - Date.now() < 3_000) break;
    let decision;
    try {
      decision = await decide({ language, goal: goal || conceptKey, state: ctx.state, steps, learnerInput, deadlineAt });
    } catch {
      break;
    }
    if (decision.usage) {
      totalUsage.inputTokens += Number(decision.usage.inputTokens) || 0;
      totalUsage.outputTokens += Number(decision.usage.outputTokens) || 0;
    }
    const tool = AGENT_TOOL_MAP[decision.tool];
    emit({ type: 'step', index: index + 1, thought: decision.thought, tool: decision.tool, args: decision.args });
    if (!tool) {
      steps.push({ tool: decision.tool, args: decision.args, observation: { error: 'unknown_tool' } });
      emit({ type: 'observation', index: index + 1, tool: decision.tool, observation: { error: 'unknown_tool' } });
      continue;
    }
    let observation;
    try {
      observation = await tool.execute(decision.args || {}, ctx);
    } catch (error) {
      observation = { error: 'tool_failed', code: error?.message || 'error' };
    }
    steps.push({ tool: decision.tool, args: decision.args, observation });
    emit({ type: 'observation', index: index + 1, tool: decision.tool, observation });
    if (tool.terminal) {
      terminal = { tool: decision.tool, observation };
      break;
    }
  }

  if (!terminal) {
    terminal = { tool: 'finish', observation: { done: true, summary: ctx.state.lastExplanation || (language === 'ar' ? 'تم إحراز تقدم في هذا المفهوم.' : 'Progress was made on this concept.'), mastery: ctx.state.mastery, masteryLabel: ctx.state.masteryLabel } };
    emit({ type: 'observation', index: steps.length + 1, tool: 'finish', observation: terminal.observation });
  }

  const awaiting = terminal.tool === 'ask_learner';
  const result = {
    conceptKey,
    terminalTool: terminal.tool,
    awaiting,
    prompt: awaiting ? terminal.observation.prompt : null,
    expects: awaiting ? terminal.observation.expects : null,
    item: awaiting ? terminal.observation.item : null,
    summary: terminal.tool === 'finish' ? terminal.observation.summary : null,
    mastery: ctx.state.mastery,
    masteryLabel: ctx.state.masteryLabel,
    ability: ctx.state.ability,
    attempts: ctx.state.attempts,
    steps,
    usage: totalUsage,
    // Serializable slice the client returns next turn so the loop resumes with context.
    state: {
      conceptKey,
      pendingItem: ctx.state.pendingItem,
      sources: ctx.state.sources,
      misconception: ctx.state.misconception || null,
    },
  };
  emit({ type: 'result', result: { ...result, steps: undefined } });
  return result;
}

export { decideNextAction, parseJsonAction };
