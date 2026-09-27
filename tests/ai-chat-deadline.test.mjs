import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestLearningAI } from '../api/_lib/ai-routing.mjs';

const CHAT_SOURCE = readFileSync(new URL('../api/chat.mjs', import.meta.url), 'utf8');

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.AGENT_ROUTER_API_KEY;
  delete process.env.GEMINI_API_KEY;
});

/** A provider that accepts the request and never answers. */
function hangingFetch() {
  return vi.fn((_url, init) => new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(init.signal.reason));
  }));
}

describe('chat endpoint AI budget', () => {
  it('bounds the whole failover chain by the deadline instead of the per-attempt timeout', async () => {
    process.env.AGENT_ROUTER_API_KEY = 'test-router-secret';
    process.env.GEMINI_API_KEY = 'test-gemini-secret';
    const fetchMock = hangingFetch();
    vi.stubGlobal('fetch', fetchMock);

    const startedAt = Date.now();
    await expect(requestLearningAI({
      system: 'Teach safely.',
      messages: [{ role: 'user', content: 'Explain.' }],
      deadlineAt: Date.now() + 1_500,
    })).rejects.toMatchObject({ name: 'AIProviderExhaustedError' });

    // Four unbounded attempts at the 30s streaming ceiling would be ~120s; the deadline must cap it.
    const elapsed = Date.now() - startedAt;
    expect(elapsed).toBeLessThan(5_000);
    expect(fetchMock).not.toHaveBeenCalledTimes(0);
  });

  it('refuses to start a provider attempt once the deadline is inside the guard window', async () => {
    process.env.AGENT_ROUTER_API_KEY = 'test-router-secret';
    process.env.GEMINI_API_KEY = 'test-gemini-secret';
    const fetchMock = hangingFetch();
    vi.stubGlobal('fetch', fetchMock);

    await expect(requestLearningAI({
      system: 'Teach safely.',
      messages: [{ role: 'user', content: 'Explain.' }],
      deadlineAt: Date.now() + 500,
    })).rejects.toMatchObject({ name: 'AIProviderExhaustedError' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('chat endpoint deadline wiring', () => {
  // The router can only respect a budget it is given, and this endpoint previously omitted it,
  // so the failover chain could outlive the 60s function limit and truncate a paid answer.
  // Asserting the wiring needs a full Supabase/auth harness that does not exist yet, so this
  // stays a source contract until then.
  it('passes a deadline budget to the AI router', () => {
    expect(CHAT_SOURCE).toMatch(/const deadlineAt = Date\.now\(\) \+ \d[\d_]*\d;/);
    expect(CHAT_SOURCE).toMatch(/requestLearningAI\(\{[^}]*deadlineAt[^}]*\}\)/);
  });

  it('keeps the budget under the platform function limit', () => {
    const seconds = Number(/const deadlineAt = Date\.now\(\) \+ ([\d_]+)/.exec(CHAT_SOURCE)[1].replaceAll('_', '')) / 1_000;
    const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
    const maxDuration = vercel.functions?.['api/*.mjs']?.maxDuration;
    expect(seconds).toBeGreaterThan(0);
    expect(seconds).toBeLessThan(maxDuration);
  });

  it('does not bill the learner for an answer that produced no text', () => {
    expect(CHAT_SOURCE).toMatch(/if \(!streamedText\) await refundAiSession\(admin, auth\.user\.id, gate\.metered\)/);
  });
});
