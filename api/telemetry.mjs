import {
  applyApiHeaders,
  consumeRateLimit,
  isSameOrigin,
  parseJsonBody,
  RequestBodyError,
} from './_lib/security.mjs';

const allowedMetrics = new Set(['LCP', 'CLS', 'INP', 'FCP', 'TTFB']);
export default async function handler(request, response) {
  const requestId = applyApiHeaders(request, response);
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }
  if (!isSameOrigin(request)) return response.status(403).json({ error: 'Origin not allowed' });
  const rate = await consumeRateLimit(request, { namespace: 'telemetry', limit: 120, windowMs: 10 * 60 * 1000 });
  if (!rate.allowed) {
    response.setHeader('Retry-After', String(rate.retryAfter));
    return response.status(429).json({ error: 'Too many telemetry events.' });
  }
  let body;
  try {
    body = parseJsonBody(request, { maxBytes: 8_000 });
  } catch (error) {
    if (error instanceof RequestBodyError) return response.status(error.status).json({ error: error.message });
    return response.status(400).json({ error: 'Invalid JSON payload' });
  }
  const metrics = Array.isArray(body.metrics) ? body.metrics.slice(0, 8).filter((metric) => allowedMetrics.has(metric?.name) && Number.isFinite(metric?.value)).map((metric) => ({ name: metric.name, value: Math.max(0, Math.min(120000, Number(metric.value))), rating: ['good', 'needs-improvement', 'poor'].includes(metric.rating) ? metric.rating : 'unknown' })) : [];
  const path = String(body.path || '/').replace(/[^\w\-/?=&.]/g, '').slice(0, 200);
  if (!metrics.length) return response.status(400).json({ error: 'No valid metrics' });
  console.log(JSON.stringify({ event: 'web-vitals', release: 'fahim-atlas-5', path, metrics, receivedAt: new Date().toISOString(), requestId }));
  response.setHeader('Cache-Control', 'no-store');
  return response.status(202).json({ accepted: true });
}
