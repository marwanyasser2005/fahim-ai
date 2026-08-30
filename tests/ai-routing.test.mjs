import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getAIStatus,
  pipeLearningAIStream,
  readLearningAIResponse,
  requestLearningAI,
} from '../api/_lib/ai-routing.mjs';

const trackedNames = [
  'AI_PROVIDER_ORDER',
  'AGENT_ROUTER_API_KEY',
  'AGENTROUTER_API_KEY',
  'AGENT_ROUTER_BASE_URL',
  'AGENT_ROUTER_MODEL',
  'AGENT_ROUTER_FALLBACK_MODEL',
  'GEMINI_API_KEY',
  'GEMINI_MODEL',
  'GEMINI_FALLBACK_MODEL',
];
let previous = {};

beforeEach(() => {
  previous = Object.fromEntries(trackedNames.map((name) => [name, process.env[name]]));
  trackedNames.forEach((name) => delete process.env[name]);
});

afterEach(() => {
  vi.unstubAllGlobals();
  trackedNames.forEach((name) => {
    if (previous[name] === undefined) delete process.env[name];
    else process.env[name] = previous[name];
  });
});

describe('provider-neutral FAHIM routing', () => {
  it('reports redundancy without returning provider or model names', () => {
    process.env.AGENT_ROUTER_API_KEY = 'test-router-secret';
    process.env.GEMINI_API_KEY = 'test-gemini-secret';
    expect(getAIStatus()).toEqual({ configured: true, providerCount: 2, redundancyConfigured: true });
    expect(JSON.stringify(getAIStatus())).not.toMatch(/gemini|agent|model/i);
  });

  it('falls back from an unavailable gateway route to Gemini', async () => {
    process.env.AGENT_ROUTER_API_KEY = 'test-router-secret';
    process.env.GEMINI_API_KEY = 'test-gemini-secret';
    process.env.AI_PROVIDER_ORDER = 'agent-router,gemini';
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: 'تعليم موثّق' }] } }],
        usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 5 },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    const route = await requestLearningAI({
      system: 'Teach safely.',
      messages: [{ role: 'user', content: 'Explain.' }],
    });
    const result = await readLearningAIResponse(route);

    expect(route.provider).toBe('gemini');
    expect(result).toEqual({ text: 'تعليم موثّق', usage: { inputTokens: 12, outputTokens: 5 } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toBe('https://co.agentrouter.org/v1/chat/completions');
  });

  it('normalizes OpenAI-compatible streaming into text and usage', async () => {
    const stream = [
      'data: {"choices":[{"delta":{"content":"خطوة "}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"واضحة"}}],"usage":{"prompt_tokens":8,"completion_tokens":2}}\n\n',
      'data: [DONE]\n\n',
    ].join('');
    const route = {
      protocol: 'openai',
      response: new Response(stream, { status: 200, headers: { 'Content-Type': 'text/event-stream' } }),
    };
    const deltas = [];
    const result = await pipeLearningAIStream(route, (delta) => deltas.push(delta));
    expect(result).toEqual({ text: 'خطوة واضحة', usage: { inputTokens: 8, outputTokens: 2 } });
    expect(deltas).toEqual(['خطوة ', 'واضحة']);
  });
});
