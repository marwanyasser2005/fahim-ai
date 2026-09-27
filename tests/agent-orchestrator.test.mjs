import { describe, expect, it } from 'vitest';
import { runAgentTurn, parseJsonAction } from '../api/_lib/agent/orchestrator.mjs';
import { encodeToken } from '../api/quiz.mjs';

const SECRET = 'test-secret-key-that-is-long-enough-32';

/** Build an injectable decision function that replays a fixed tool script. */
function scriptedDecide(script) {
  let index = 0;
  return async () => {
    const step = script[Math.min(index, script.length - 1)];
    index += 1;
    return { tool: step.tool, args: step.args || {}, thought: step.thought || '', usage: { inputTokens: 1, outputTokens: 1 } };
  };
}

describe('agent orchestrator loop', () => {
  it('runs a bounded plan→act→observe loop and ends on a terminal tool', async () => {
    const result = await runAgentTurn({
      admin: null,
      userId: 'user-1',
      language: 'ar',
      secret: SECRET,
      goal: 'قانون نيوتن الثاني',
      concept: 'قانون نيوتن الثاني',
      decide: scriptedDecide([
        { tool: 'get_learner_state', args: { concept: 'قانون نيوتن الثاني' } },
        { tool: 'finish', args: { summary: 'خلاصة' } },
      ]),
      emit: () => {},
    });
    expect(result.terminalTool).toBe('finish');
    expect(result.steps).toHaveLength(2);
    expect(result.mastery).toBeCloseTo(0.2, 5);
    expect(result.awaiting).toBe(false);
    expect(result.usage.inputTokens).toBeGreaterThan(0);
  });

  it('pauses the turn when the agent asks the learner', async () => {
    const events = [];
    const result = await runAgentTurn({
      admin: null, userId: 'user-1', language: 'en', secret: SECRET, goal: 'Newton second law',
      decide: scriptedDecide([{ tool: 'ask_learner', args: { prompt: 'What is F?', expects: 'text' } }]),
      emit: (event) => events.push(event.type),
    });
    expect(result.awaiting).toBe(true);
    expect(result.prompt).toBe('What is F?');
    expect(events).toContain('step');
    expect(events).toContain('observation');
    expect(events).toContain('result');
  });

  it('grades a correct answer and raises BKT mastery above the prior', async () => {
    const token = encodeToken({ v: 1, exp: Date.now() + 3_600_000, options: ['a', 'b', 'c', 'd'], correctIndex: 1, explanation: 'because', misconception: 'wrong model', skill: 'newton', difficulty: 'medium' }, SECRET);
    const result = await runAgentTurn({
      admin: null, userId: 'user-1', language: 'ar', secret: SECRET, goal: 'newton',
      learnerInput: { itemToken: token, answerIndex: 1 },
      decide: scriptedDecide([
        { tool: 'assess_answer', args: {} },
        { tool: 'schedule_review', args: {} },
        { tool: 'finish', args: { summary: 'done' } },
      ]),
      emit: () => {},
    });
    expect(result.mastery).toBeGreaterThan(0.5);
    expect(result.attempts).toBe(1);
    const assess = result.steps.find((step) => step.tool === 'assess_answer');
    expect(assess.observation.correct).toBe(true);
    const schedule = result.steps.find((step) => step.tool === 'schedule_review');
    expect(schedule.observation.nextReviewAt).toBeTruthy();
  });

  it('synthesizes a finish when the step budget is exhausted without a terminal tool', async () => {
    const result = await runAgentTurn({
      admin: null, userId: 'user-1', language: 'en', secret: SECRET, goal: 'loops', maxSteps: 3,
      decide: scriptedDecide([{ tool: 'get_learner_state', args: { concept: 'loops' } }]),
      emit: () => {},
    });
    expect(result.terminalTool).toBe('finish');
    expect(result.steps.length).toBe(3);
  });
});

describe('parseJsonAction', () => {
  it('extracts a JSON action embedded in prose', () => {
    expect(parseJsonAction('Sure. {"tool":"finish","args":{"summary":"x"}}')).toEqual({ tool: 'finish', args: { summary: 'x' } });
  });
  it('returns null for non-JSON', () => {
    expect(parseJsonAction('no json here')).toBeNull();
  });
});
