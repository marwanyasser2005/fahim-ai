import { afterEach, describe, expect, it, vi } from 'vitest';
import { readAgentResponse, requestLearningAI } from '../api/_lib/ai-routing.mjs';
import {
  AGENT_TOOLS, AGENT_TOOL_MAP, buildTopicalSearchSeeds, citedSourceIds,
  classifyMisconception, rankTopicalPages, toolSchemas,
} from '../api/_lib/agent/tools.mjs';

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.AGENT_ROUTER_API_KEY;
  delete process.env.AI_PROVIDER_ORDER;
});

describe('agent tool registry', () => {
  it('exposes terminal tools and a valid function schema for every tool', () => {
    const schemas = toolSchemas();
    expect(schemas.length).toBe(AGENT_TOOLS.length);
    for (const schema of schemas) {
      expect(schema.type).toBe('function');
      expect(typeof schema.function.name).toBe('string');
      expect(schema.function.parameters.type).toBe('object');
    }
    expect(AGENT_TOOL_MAP.ask_learner.terminal).toBe(true);
    expect(AGENT_TOOL_MAP.finish.terminal).toBe(true);
    expect(AGENT_TOOL_MAP.get_learner_state.terminal).toBeFalsy();
    expect(AGENT_TOOL_MAP.assess_explanation.terminal).toBeFalsy();
  });

  it('classifies misconceptions into stable bilingual categories', () => {
    expect(classifyMisconception('confused the units of the answer').category).toBe('unit_confusion');
    expect(classifyMisconception('just memorized the قانون').category).toBe('formula_misuse');
    expect(classifyMisconception('نسي إشارة السالب').category).toBe('sign_or_direction');
    expect(classifyMisconception('something entirely new').category).toBe('conceptual_gap');
  });

  it('accepts only citations present in the server source ledger', () => {
    const sources = [{ citationId: 'E1' }, { citationId: 'R1' }];
    expect(citedSourceIds('Supported [E1] and [R1], invented [E9] and [R7].', sources)).toEqual(['E1', 'R1']);
  });

  it('builds focused topical searches from a natural-language learning goal', () => {
    const seeds = buildTopicalSearchSeeds(
      'أريد فهم الفرق بين المتوسط والوسيط وتطبيقه على بيانات متجر صغير',
      'الإحصاء وتحليل البيانات',
    );
    expect(seeds.length).toBeGreaterThan(1);
    expect(seeds.every((seed) => seed.includes('الاحصاء'))).toBe(true);
    expect(seeds.some((seed) => /المتوسط|الوسيط/.test(seed))).toBe(true);
    expect(seeds.join(' ')).not.toContain('اريد');
  });

  it('rejects unrelated open references and keeps only concept-relevant pages', () => {
    const ranked = rankTopicalPages([
      { key: 'Yemenite_Jews', title: 'يهود اليمن', description: 'مجموعة عرقية', excerpt: 'تاريخ جماعة في جنوب شبه الجزيرة العربية' },
      { key: 'Mediterranean_Sea', title: 'البحر الأبيض المتوسط', description: 'بحر بين قارات', excerpt: 'جغرافيا وملاحة' },
      { key: 'Mean_(statistics)', title: 'متوسط (إحصاء)', description: 'مقياس إحصائي', excerpt: 'قيمة مركزية تستخدم في تحليل البيانات' },
      { key: 'Median_(statistics)', title: 'وسيط (إحصاء)', description: 'الكمية المتوسطة لمجموعة البيانات', excerpt: 'مقياس للنزعة المركزية في الإحصاء' },
    ], {
      query: 'أريد فهم الفرق بين المتوسط والوسيط وتطبيقه على بيانات متجر صغير',
      subject: 'الإحصاء وتحليل البيانات',
    });
    expect(ranked.map((source) => source.title)).toEqual(['متوسط (إحصاء)', 'وسيط (إحصاء)']);
    expect(ranked.map((source) => source.citationId)).toEqual(['R1', 'R2']);
  });
});

describe('readAgentResponse tool-call normalization', () => {
  it('reads OpenAI tool_calls into a normalized shape', async () => {
    const route = {
      protocol: 'openai',
      response: new Response(JSON.stringify({
        choices: [{ message: { content: '', tool_calls: [{ id: 'call_1', type: 'function', function: { name: 'get_learner_state', arguments: '{"concept":"x"}' } }] } }],
        usage: { prompt_tokens: 3, completion_tokens: 2 },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    };
    const { toolCalls, usage } = await readAgentResponse(route);
    expect(toolCalls).toEqual([{ id: 'call_1', name: 'get_learner_state', arguments: { concept: 'x' } }]);
    expect(usage).toEqual({ inputTokens: 3, outputTokens: 2 });
  });

  it('reads Gemini functionCall parts into the same shape', async () => {
    const route = {
      protocol: 'gemini',
      response: new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ functionCall: { name: 'finish', args: { summary: 'ok' } } }] } }],
        usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    };
    const { toolCalls } = await readAgentResponse(route);
    expect(toolCalls).toEqual([{ id: 'gemini-0', name: 'finish', arguments: { summary: 'ok' } }]);
  });
});

describe('requestLearningAI tool payload', () => {
  it('sends tools and tool_choice, and drops JSON mode when tools are present', async () => {
    process.env.AGENT_ROUTER_API_KEY = 'secret';
    process.env.AI_PROVIDER_ORDER = 'agent-router';
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: '{}' } }] }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    await requestLearningAI({
      system: 's', messages: [{ role: 'user', content: 'hi' }], structured: true,
      tools: [{ type: 'function', function: { name: 't', description: 'd', parameters: { type: 'object', properties: {} } } }],
    });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(Array.isArray(body.tools)).toBe(true);
    expect(body.tool_choice).toBe('auto');
    expect(body.response_format).toBeUndefined();
  });
});
