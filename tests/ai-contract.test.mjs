import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { systemPrompt } from '../api/chat.mjs';

describe('FAHIM AI teaching and persistence contract', () => {
  it('contains the learning-session and evidence contracts', () => {
    const prompt = systemPrompt('ar', 'secondary', 'physics', 'explain');
    for (const term of ['SESSION CONTRACT', 'VERIFIED_SOURCE', 'INFERRED', 'TEACHING_EXPLANATION', 'GENERAL_KNOWLEDGE', 'NEEDS_REVIEW']) expect(prompt).toContain(term);
    expect(prompt).toContain('Source → Understand → Explain → Attempt');
    expect(prompt).toContain('Never fabricate an AI response');
  });

  it('never substitutes a canned educational answer when AI fails', () => {
    const tutorClient = readFileSync('src/lib/aiTutor.ts', 'utf8');
    expect(tutorClient).toContain("mode: 'unavailable'");
    expect(tutorClient).toContain('No answer was generated or replaced with canned content.');
    expect(tutorClient).not.toContain("mode: 'local'");
  });

  it('persists a generation before requesting the provider', () => {
    const chat = readFileSync('api/chat.mjs', 'utf8');
    const insertAt = chat.indexOf("from('ai_generations').insert");
    const providerAt = chat.lastIndexOf('requestLearningAI({ ...aiRequest');
    expect(insertAt).toBeGreaterThan(0);
    expect(providerAt).toBeGreaterThan(insertAt);
    expect(chat).toContain('estimated_cost_microusd');
    expect(chat).toContain('promptHash');
  });

  it('does not expose provider or model identifiers in public chat events', () => {
    const chat = readFileSync('api/chat.mjs', 'utf8');
    const client = readFileSync('src/lib/aiTutor.ts', 'utf8');
    expect(chat).toContain("{ type: 'meta', sources:");
    expect(chat).not.toContain("{ type: 'meta', model:");
    expect(client).not.toContain('model?: string');
  });
});
