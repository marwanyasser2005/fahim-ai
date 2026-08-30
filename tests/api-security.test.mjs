import { beforeEach, describe, expect, it } from 'vitest';
import {
  consumeRateLimit,
  isSameOrigin,
  parseJsonBody,
  requestSearchParams,
  resetRateLimitsForTests,
} from '../api/_lib/security.mjs';

const request = (overrides = {}) => ({
  headers: {
    host: 'fahim.example',
    origin: 'https://fahim.example',
    'content-type': 'application/json',
    'x-forwarded-for': '203.0.113.4',
    ...overrides.headers,
  },
  body: overrides.body ?? { question: 'test' },
  socket: {},
});

beforeEach(() => resetRateLimitsForTests());

describe('API security boundary', () => {
  it('accepts an exact same-origin request and rejects cross-site traffic', () => {
    expect(isSameOrigin(request())).toBe(true);
    expect(isSameOrigin(request({ headers: { origin: 'https://evil.example' } }))).toBe(false);
    expect(isSameOrigin(request({ headers: { 'sec-fetch-site': 'cross-site' } }))).toBe(false);
  });

  it('requires JSON and enforces the body limit after parsing', () => {
    expect(parseJsonBody(request())).toEqual({ question: 'test' });
    expect(() => parseJsonBody(request({ headers: { 'content-type': 'text/plain' } }))).toThrow(/application\/json/);
    expect(() => parseJsonBody(request({ body: { value: 'x'.repeat(200) } }), { maxBytes: 100 })).toThrow(/too large/i);
  });

  it('isolates rate-limit buckets by namespace and returns a retry time', () => {
    expect(consumeRateLimit(request(), { namespace: 'chat', limit: 1, windowMs: 10_000 }).allowed).toBe(true);
    const blocked = consumeRateLimit(request(), { namespace: 'chat', limit: 1, windowMs: 10_000 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
    expect(consumeRateLimit(request(), { namespace: 'quiz', limit: 1, windowMs: 10_000 }).allowed).toBe(true);
  });

  it('parses query parameters without the legacy request.query getter', () => {
    const securedRequest = request();
    securedRequest.url = '/api/search?q=%D8%A7%D9%84%D8%AE%D9%84%D9%8A%D8%A9&language=ar';
    Object.defineProperty(securedRequest, 'query', { get: () => { throw new Error('legacy query getter used'); } });
    const params = requestSearchParams(securedRequest);
    expect(params.get('q')).toBe('الخلية');
    expect(params.get('language')).toBe('ar');
  });
});
