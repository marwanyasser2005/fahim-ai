import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getGatewayStatus } from '../api/_lib/hf-gateway.mjs';
import { requestHFEmbeddings, requestLearningAI } from '../api/_lib/ai-routing.mjs';

const health = readFileSync(new URL('../api/health.mjs', import.meta.url), 'utf8');
const security = readFileSync(new URL('../api/_lib/security.mjs', import.meta.url), 'utf8');
const chat = readFileSync(new URL('../api/chat.mjs', import.meta.url), 'utf8');
const aiGateway = readFileSync(new URL('../api/ai.mjs', import.meta.url), 'utf8');

describe('AI gateway health', () => {
  it('counts Hugging Face exactly once', () => {
    const previous = {
      hf: process.env.HF_TOKEN,
      agentRouter: process.env.AGENT_ROUTER_API_KEY,
      agentRouterLegacy: process.env.AGENTROUTER_API_KEY,
      gemini: process.env.GEMINI_API_KEY,
    };
    process.env.HF_TOKEN = 'test-token';
    delete process.env.AGENT_ROUTER_API_KEY;
    delete process.env.AGENTROUTER_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      expect(getGatewayStatus().providerCount).toBe(1);
      expect(getGatewayStatus().redundancyConfigured).toBe(false);
    } finally {
      for (const [key, value] of Object.entries({
        HF_TOKEN: previous.hf,
        AGENT_ROUTER_API_KEY: previous.agentRouter,
        AGENTROUTER_API_KEY: previous.agentRouterLegacy,
        GEMINI_API_KEY: previous.gemini,
      })) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });

  it('uses the free HF route first when the flag is enabled', async () => {
    const previous = {
      hf: process.env.HF_TOKEN,
      freeFirst: process.env.HF_FREE_FIRST,
      order: process.env.AI_PROVIDER_ORDER,
      agent: process.env.AGENT_ROUTER_API_KEY,
      gemini: process.env.GEMINI_API_KEY,
    };
    const originalFetch = globalThis.fetch;
    process.env.HF_TOKEN = 'test-hf-token';
    process.env.HF_FREE_FIRST = 'true';
    delete process.env.AI_PROVIDER_ORDER;
    process.env.AGENT_ROUTER_API_KEY = 'test-agent-token';
    process.env.GEMINI_API_KEY = 'test-gemini-token';
    let calledUrl = '';
    globalThis.fetch = async (url) => {
      calledUrl = String(url);
      return new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }], usage: {} }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    };
    try {
      const route = await requestLearningAI({ messages: [{ role: 'user', content: 'test' }], maxOutputTokens: 8 });
      expect(route.provider).toBe('hf');
      expect(calledUrl).toBe('https://router.huggingface.co/v1/chat/completions');
      expect(getGatewayStatus().freeFirst).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
      for (const [key, value] of Object.entries({
        HF_TOKEN: previous.hf,
        HF_FREE_FIRST: previous.freeFirst,
        AI_PROVIDER_ORDER: previous.order,
        AGENT_ROUTER_API_KEY: previous.agent,
        GEMINI_API_KEY: previous.gemini,
      })) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });

  it('redacts provider, model, and cost from client-visible gateway responses', () => {
    expect(aiGateway).toContain('const { provider: _provider, model: _model, cost: _cost, ...safe } = result');
    expect(aiGateway).toContain("engine: isLocal ? 'deterministic-learning' : 'managed-learning-ai'");
  });

  it('normalizes a batched multilingual embedding response', async () => {
    const previousToken = process.env.HF_TOKEN;
    const originalFetch = globalThis.fetch;
    process.env.HF_TOKEN = 'test-hf-token';
    let payload;
    globalThis.fetch = async (_url, options) => {
      payload = JSON.parse(String(options.body));
      return new Response(JSON.stringify([[0.1, 0.2], [0.3, 0.4]]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    };
    try {
      const result = await requestHFEmbeddings(['query: الجاذبية', 'passage: قوة جذب'], { deadlineAt: Date.now() + 5_000 });
      expect(result.vectors).toHaveLength(2);
      expect(result.vectors[0]).toHaveLength(2);
      expect(payload).toMatchObject({ normalize: true, truncate: true });
    } finally {
      globalThis.fetch = originalFetch;
      if (previousToken === undefined) delete process.env.HF_TOKEN;
      else process.env.HF_TOKEN = previousToken;
    }
  });
});

describe('health probes', () => {
  it('separates liveness from readiness', () => {
    expect(health).toContain("url.searchParams.get('mode') === 'ready' ? 'ready' : 'live'");
    expect(health).toContain("status: 'live'");
    expect(health).toContain("status: ready ? 'ready' : 'not_ready'");
  });

  it('reports 503 when a dependency is not ready', () => {
    expect(health).toContain('response.status(ready ? 200 : 503)');
  });

  it('actually probes the database instead of asserting readiness', () => {
    expect(health).toContain('probeDatabase');
    expect(health).toContain('/rest/v1/plans?select=code&limit=1');
    expect(health).toContain('AbortSignal.timeout(2_500)');
  });

  it('keeps deployment configuration out of anonymous responses', () => {
    expect(health).toContain('const authorized = isSameOrigin(request)');
    expect(health).toContain(': {};');
  });

  it('logs when it is not ready so the probe can drive an alert', () => {
    expect(health).toContain("logEvent('health_not_ready'");
  });
});

describe('structured request logging', () => {
  it('emits one line per finished request with the correlation id', () => {
    expect(security).toContain('export function logEvent');
    expect(security).toContain("logEvent('api_request'");
    expect(security).toContain('response.once(\'finish\'');
    expect(security).toContain('durationMs');
  });

  it('never logs request bodies, tokens, or learner content', () => {
    const logger = security.slice(security.indexOf('export function logEvent'), security.indexOf('export function clientIp'));
    expect(logger).not.toContain('body');
    expect(logger).not.toContain('authorization');
    expect(logger).not.toContain('prompt');
  });

  it('surfaces the silent rate-limit degradation', () => {
    expect(security).toContain("logEvent('rate_limit_memory_fallback'");
  });

  it('logs AI provider exhaustion with its attempts', () => {
    expect(chat).toContain("logEvent('ai_generation_failed'");
    expect(chat).toContain('attempts:');
  });
});
