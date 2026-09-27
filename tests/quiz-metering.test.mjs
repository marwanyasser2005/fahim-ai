import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('../api/quiz.mjs', import.meta.url), 'utf8');

// Quiz generation spends real model budget: up to 6000 output tokens across an initial
// call plus a repair retry. Before this change it consumed no entitlement and wrote no
// ai_generations row, so it was the cheapest way to burn the AI budget and it left no
// cost telemetry. These are source contracts because the handler needs Supabase and a
// provider to exercise end to end.
describe('quiz generation metering', () => {
  it('consumes the shared AI entitlement for generation', () => {
    expect(source).toMatch(/gate = await consumeAiSession\(auth\.client\)/);
  });

  it('records a generation row so spend is observable', () => {
    expect(source).toMatch(/from\('ai_generations'\)\.insert\(\{/);
    expect(source).toMatch(/task_type: 'quiz'/);
    expect(source).toMatch(/prompt_hash: promptHash/);
  });

  it('returns the entitlement when no usable quiz was produced', () => {
    expect(source).toMatch(/if \(!succeeded\) \{[\s\S]*?refundAiSession/);
  });

  it('rolls back the entitlement when the generation row cannot be written', () => {
    expect(source).toMatch(/if \(generationError\) \{[\s\S]*?refundAiSession/);
  });

  it('records token usage and an estimated cost for both model calls', () => {
    const recordUsageCalls = source.match(/recordUsage\(meter, usage\);/g) || [];
    expect(recordUsageCalls.length).toBe(2);
    expect(source).toMatch(/estimated_cost_microusd: estimateAICostMicrousd\(/);
  });

  it('leaves grading unmetered because it is computed locally', () => {
    expect(source).toMatch(/if \(!isGrade\) \{[\s\S]*?createAdminClient\(\)/);
    expect(source).toMatch(/const succeeded = result\.status === 200/);
  });

  it('rejects an invalid topic before spending an entitlement', () => {
    const guardIndex = source.indexOf('Topic must be at least 3 characters.');
    const meterIndex = source.indexOf('gate = await consumeAiSession');
    expect(guardIndex).toBeGreaterThan(-1);
    expect(guardIndex).toBeLessThan(meterIndex);
  });
});
