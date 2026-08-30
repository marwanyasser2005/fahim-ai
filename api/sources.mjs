import { rankVerifiedSources, verifiedSources } from './_lib/source-ranking.mjs';
import { applyApiHeaders, consumeRateLimit, rejectRateLimit, requestSearchParams } from './_lib/security.mjs';

function send(response, status, body) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.status(status).json(body);
}

export default async function handler(request, response) {
  applyApiHeaders(request, response, { cacheControl: 's-maxage=3600, stale-while-revalidate=86400' });
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return send(response, 405, { error: 'Method not allowed' });
  }
  const rate = await consumeRateLimit(request, { namespace: 'verified-sources', limit: 60, windowMs: 10 * 60 * 1000 });
  if (!rate.allowed) return rejectRateLimit(response, rate, send, 'Too many searches. Try again later.');
  const searchParams = requestSearchParams(request);
  const query = String(searchParams.get('q') || '').trim().slice(0, 180);
  const language = searchParams.get('language') === 'en' ? 'en' : 'ar';
  const subject = String(searchParams.get('subject') || '').slice(0, 80);
  const grade = String(searchParams.get('grade') || '').slice(0, 80);
  const items = query || subject || grade
    ? rankVerifiedSources({ question: query, subject, grade, language, limit: 8 })
    : verifiedSources.map((source, index) => ({ ...source, citationId: `E${index + 1}` }));
  return send(response, 200, {
    updatedAt: '2026-08-07',
    methodology: 'Curated registry with owner, authority type, scope, and manual verification date.',
    items,
  });
}
