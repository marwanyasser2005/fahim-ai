import { createHash, randomUUID } from 'node:crypto';

const buckets = new Map();
const MAX_BUCKETS = 5_000;

export function applyApiHeaders(request, response, { cacheControl = 'no-store' } = {}) {
  const requestId = String(request.headers?.['x-vercel-id'] || request.headers?.['x-request-id'] || randomUUID()).slice(0, 160);
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', cacheControl);
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
  response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  response.setHeader('X-Request-Id', requestId);
  return requestId;
}

export function clientIp(request) {
  return String(request.headers?.['x-forwarded-for'] || request.socket?.remoteAddress || 'unknown')
    .split(',')[0]
    .trim()
    .slice(0, 80);
}

export function requestSearchParams(request) {
  const host = String(request.headers?.['x-forwarded-host'] || request.headers?.host || 'localhost')
    .split(',')[0]
    .trim();
  return new URL(String(request.url || '/'), `https://${host}`).searchParams;
}

function consumeMemoryRateLimit(request, { namespace, limit, windowMs }) {
  const now = Date.now();
  const key = `${namespace}:${clientIp(request)}`;
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: Math.max(0, limit - 1), retryAfter: 0 };
  }
  current.count += 1;
  if (buckets.size > MAX_BUCKETS) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
      if (buckets.size <= MAX_BUCKETS) break;
    }
  }
  return {
    allowed: current.count <= limit,
    remaining: Math.max(0, limit - current.count),
    retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

async function consumeDistributedRateLimit(request, { namespace, limit, windowMs }) {
  const url = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!url || !key) return consumeMemoryRateLimit(request, { namespace, limit, windowMs });

  const keyHash = createHash('sha256').update(`${namespace}:${clientIp(request)}`).digest('hex');
  try {
    const result = await fetch(`${url}/rest/v1/rpc/consume_api_rate_limit`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_key_hash: keyHash,
        p_namespace: String(namespace).slice(0, 80),
        p_limit: limit,
        p_window_seconds: Math.max(1, Math.ceil(windowMs / 1000)),
      }),
      signal: AbortSignal.timeout(1_800),
    });
    if (!result.ok) throw new Error(`Distributed rate limit returned ${result.status}`);
    const [bucket] = await result.json();
    if (!bucket || typeof bucket.allowed !== 'boolean') throw new Error('Invalid distributed rate-limit response');
    return {
      allowed: bucket.allowed,
      remaining: Math.max(0, Number(bucket.remaining) || 0),
      retryAfter: Math.max(1, Number(bucket.retry_after) || 1),
      source: 'distributed',
    };
  } catch {
    return { ...consumeMemoryRateLimit(request, { namespace, limit, windowMs }), source: 'memory-fallback' };
  }
}

export function consumeRateLimit(request, options) {
  if (process.env.NODE_ENV === 'test') return consumeMemoryRateLimit(request, options);
  return consumeDistributedRateLimit(request, options);
}

function expectedHosts(request) {
  return new Set([
    request.headers?.['x-forwarded-host'],
    request.headers?.host,
    process.env.VERCEL_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ].filter(Boolean).map((value) => String(value).toLowerCase().split(',')[0].trim()));
}

export function isSameOrigin(request) {
  const fetchSite = String(request.headers?.['sec-fetch-site'] || '').toLowerCase();
  if (fetchSite === 'cross-site') return false;
  const origin = request.headers?.origin;
  if (!origin) return process.env.NODE_ENV !== 'production' && fetchSite !== 'cross-site';
  try {
    const parsed = new URL(String(origin));
    return ['https:', 'http:'].includes(parsed.protocol) && expectedHosts(request).has(parsed.host.toLowerCase());
  } catch {
    return false;
  }
}

export function parseJsonBody(request, { maxBytes = 32_000 } = {}) {
  const contentType = String(request.headers?.['content-type'] || '').toLowerCase();
  if (!contentType.startsWith('application/json')) throw new RequestBodyError(415, 'Content-Type must be application/json.');
  const declaredLength = Number(request.headers?.['content-length'] || 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) throw new RequestBodyError(413, 'Request body is too large.');
  let body = request.body ?? {};
  try {
    if (Buffer.isBuffer(body)) body = JSON.parse(body.toString('utf8') || '{}');
    else if (typeof body === 'string') body = JSON.parse(body || '{}');
  } catch {
    throw new RequestBodyError(400, 'Invalid JSON body.');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new RequestBodyError(400, 'JSON body must be an object.');
  if (Buffer.byteLength(JSON.stringify(body), 'utf8') > maxBytes) throw new RequestBodyError(413, 'Request body is too large.');
  return body;
}

export class RequestBodyError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'RequestBodyError';
    this.status = status;
  }
}

export function rejectRateLimit(response, result, send, message = 'Too many requests. Try again later.') {
  response.setHeader('Retry-After', String(result.retryAfter));
  response.setHeader('X-RateLimit-Remaining', '0');
  return send(response, 429, { error: message });
}

export function resetRateLimitsForTests() {
  buckets.clear();
}
