import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestLearningAI } from '../api/_lib/ai-routing.mjs';

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.AGENT_ROUTER_API_KEY;
});

describe('AI request deadline', () => {
  it('stops provider attempts before the caller function deadline', async () => {
    process.env.AGENT_ROUTER_API_KEY = 'test-router-secret';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(requestLearningAI({
      system: 'Teach safely.',
      messages: [{ role: 'user', content: 'Explain.' }],
      deadlineAt: Date.now() - 1,
    })).rejects.toMatchObject({ name: 'AIProviderExhaustedError' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
