import { normalizeSearchText, rankVerifiedSources } from './_lib/source-ranking.mjs';
import { applyApiHeaders, consumeRateLimit, rejectRateLimit, requestSearchParams } from './_lib/security.mjs';
const TIMEOUT_MS = 7000;

function send(response, status, body) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=86400');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Server-Timing', `search;dur=${body?.tookMs || 0}`);
  response.status(status).json(body);
}

const clean = (value = '') => String(value).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const first = (value) => Array.isArray(value) ? value[0] : value;
const yearFromParts = (value) => Number(value?.['date-parts']?.[0]?.[0]) || undefined;

function scoreResult(item, query, yearFrom) {
  const normalized = normalizeSearchText(`${item.title} ${item.description}`);
  const tokens = normalizeSearchText(query).split(' ').filter((token) => token.length > 2);
  const matches = tokens.reduce((sum, token) => sum + (normalized.includes(token) ? 1 : 0), 0);
  const base = item.authority === 'official' ? 82 : item.source === 'openalex' ? 62 : item.source === 'crossref' ? 58 : 52;
  const citationSignal = Math.min(10, Math.log10((item.citations || 0) + 1) * 4);
  const recencySignal = item.year && item.year >= new Date().getFullYear() - 5 ? 5 : 0;
  const datePenalty = yearFrom && item.year && item.year < yearFrom ? -50 : 0;
  return Math.max(1, Math.min(99, Math.round(base + matches * 4 + citationSignal + recencySignal + datePenalty)));
}

async function wikipedia(query, language) {
  const host = language === 'ar' ? 'ar.wikipedia.org' : 'en.wikipedia.org';
  const response = await fetch(`https://${host}/w/rest.php/v1/search/page?q=${encodeURIComponent(query)}&limit=8`, { headers: { Accept: 'application/json', 'User-Agent': 'FahimAI/3.0 learning-search' }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error('Wikipedia unavailable');
  const data = await response.json();
  return (data.pages || []).map((page) => ({ id: `wiki-${page.id}`, source: 'wikipedia', authority: 'open-reference', kind: 'encyclopedia', title: clean(page.title), description: clean(page.description), excerpt: clean(page.excerpt), thumbnail: page.thumbnail?.url, url: `https://${host}/wiki/${encodeURIComponent(page.key)}`, language, citations: 0 }));
}

async function openAlex(query, language, yearFrom, openAccess) {
  const filters = [yearFrom ? `from_publication_date:${yearFrom}-01-01` : '', openAccess ? 'open_access.is_oa:true' : ''].filter(Boolean).join(',');
  const url = new URL('https://api.openalex.org/works');
  url.searchParams.set('search', query); url.searchParams.set('per-page', '8');
  url.searchParams.set('select', 'id,doi,display_name,publication_year,type,language,cited_by_count,open_access,primary_location,authorships');
  if (filters) url.searchParams.set('filter', filters);
  const response = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'FahimAI/3.0 (learning search)' }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error('OpenAlex unavailable');
  const data = await response.json();
  return (data.results || []).filter((work) => !work.is_retracted).map((work) => ({
    id: `oa-${String(work.id).split('/').pop()}`, source: 'openalex', authority: 'scholarly-index', kind: work.type || 'research',
    title: clean(work.display_name), description: (work.authorships || []).slice(0, 3).map((item) => item.author?.display_name).filter(Boolean).join('، '), excerpt: clean(work.primary_location?.source?.display_name || ''),
    url: work.doi || work.open_access?.oa_url || work.id, year: work.publication_year, language: work.language || language, citations: work.cited_by_count || 0, openAccess: Boolean(work.open_access?.is_oa), doi: work.doi,
  }));
}

async function crossref(query, yearFrom) {
  const url = new URL('https://api.crossref.org/works');
  url.searchParams.set('query.bibliographic', query); url.searchParams.set('rows', '7');
  url.searchParams.set('select', 'DOI,title,author,published-print,published-online,type,publisher,URL,is-referenced-by-count,abstract,license');
  if (yearFrom) url.searchParams.set('filter', `from-pub-date:${yearFrom}-01-01`);
  const response = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'FahimAI/3.0 (mailto:research@fahim.ai)' }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error('Crossref unavailable');
  const data = await response.json();
  return (data.message?.items || []).map((work) => ({
    id: `cr-${work.DOI}`, source: 'crossref', authority: 'publisher-metadata', kind: work.type || 'research', title: clean(first(work.title)),
    description: (work.author || []).slice(0, 3).map((author) => [author.given, author.family].filter(Boolean).join(' ')).join('، '), excerpt: clean(work.abstract || work.publisher || ''),
    url: work.URL || `https://doi.org/${work.DOI}`, year: yearFromParts(work['published-print']) || yearFromParts(work['published-online']), citations: work['is-referenced-by-count'] || 0, openAccess: Boolean(work.license?.length), doi: work.DOI ? `https://doi.org/${work.DOI}` : undefined,
  }));
}

export default async function handler(request, response) {
  applyApiHeaders(request, response, { cacheControl: 's-maxage=900, stale-while-revalidate=86400' });
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return send(response, 405, { error: 'Method not allowed' });
  }
  const rate = await consumeRateLimit(request, { namespace: 'knowledge-search', limit: 45, windowMs: 10 * 60 * 1000 });
  if (!rate.allowed) return rejectRateLimit(response, rate, send, 'Too many searches. Try again later.');
  const started = Date.now();
  const searchParams = requestSearchParams(request);
  const query = String(searchParams.get('q') || '').trim().slice(0, 180);
  if (query.length < 2) return send(response, 400, { error: 'Search query is too short.' });
  const language = searchParams.get('language') === 'en' ? 'en' : 'ar';
  const sourceValue = searchParams.get('source');
  const source = ['all', 'official', 'encyclopedia', 'research'].includes(sourceValue) ? sourceValue : 'all';
  const yearFrom = Math.max(0, Math.min(new Date().getFullYear(), Number(searchParams.get('yearFrom')) || 0)) || undefined;
  const openAccess = searchParams.get('openAccess') === 'true';

  const official = rankVerifiedSources({ question: query, language, limit: 8 }).map((item) => ({ id: `official-${item.id}`, source: 'official', authority: item.authority, kind: item.category, title: item.title[language], description: item.owner[language], excerpt: item.description[language], url: item.url, language, citations: 0, verifiedAt: item.verifiedAt }));
  const tasks = [];
  if (source === 'all' || source === 'encyclopedia') tasks.push(wikipedia(query, language));
  if (source === 'all' || source === 'research') tasks.push(openAlex(query, language, yearFrom, openAccess), crossref(query, yearFrom));
  const settled = await Promise.allSettled(tasks);
  const external = settled.flatMap((item) => item.status === 'fulfilled' ? item.value : []);
  const merged = (source === 'official' ? official : source === 'all' ? [...official, ...external] : external)
    .map((item) => ({ ...item, learningScore: scoreResult(item, query, yearFrom) }))
    .filter((item) => !yearFrom || !item.year || item.year >= yearFrom)
    .filter((item) => !openAccess || item.source === 'official' || item.source === 'wikipedia' || item.openAccess)
    .sort((a, b) => b.learningScore - a.learningScore || (b.citations || 0) - (a.citations || 0));
  const seen = new Set();
  const items = merged.filter((item) => { const key = normalizeSearchText(item.doi || item.title); if (!key || seen.has(key)) return false; seen.add(key); return true; }).slice(0, 24);
  return send(response, 200, { query, source, tookMs: Date.now() - started, partial: settled.some((item) => item.status === 'rejected'), providers: ['Egypt verified registry', 'Wikimedia', 'OpenAlex', 'Crossref'], items });
}
