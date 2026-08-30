import { applyApiHeaders, consumeRateLimit, rejectRateLimit, requestSearchParams } from './_lib/security.mjs';

function send(response, status, body) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.status(status).json(body);
}

function formatDuration(value = '') {
  const match = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  const hours = Number(match[1] || 0); const minutes = Number(match[2] || 0); const seconds = Number(match[3] || 0);
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` : `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default async function handler(request, response) {
  applyApiHeaders(request, response);
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return send(response, 405, { error: 'Method not allowed' });
  }
  const rate = await consumeRateLimit(request, { namespace: 'youtube-search', limit: 30, windowMs: 10 * 60 * 1000 });
  if (!rate.allowed) return rejectRateLimit(response, rate, send, 'Too many searches. Try again later.');
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return send(response, 503, { error: 'YouTube search needs a server API key.' });
  const searchParams = requestSearchParams(request);
  const query = String(searchParams.get('q') || '').trim();
  if (query.length < 2 || query.length > 120) return send(response, 400, { error: 'Search must be between 2 and 120 characters.' });

  const language = searchParams.get('language') === 'en' ? 'en' : 'ar';
  const durationValue = searchParams.get('duration');
  const orderValue = searchParams.get('order');
  const duration = ['short', 'medium', 'long'].includes(durationValue) ? durationValue : '';
  const order = ['relevance', 'viewCount', 'date'].includes(orderValue) ? orderValue : 'relevance';
  const params = new URLSearchParams({
    part: 'snippet', type: 'video', maxResults: '18', q: language === 'ar' ? `${query} شرح تعليمي` : `${query} educational explanation`,
    regionCode: 'EG', relevanceLanguage: language, safeSearch: 'strict', order,
    videoEmbeddable: 'true', videoSyndicated: 'true', key,
  });
  if (searchParams.get('captions') === 'true') params.set('videoCaption', 'closedCaption');
  if (duration) params.set('videoDuration', duration);

  try {
    const result = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`, { signal: AbortSignal.timeout(10_000) });
    const data = await result.json();
    if (!result.ok) return send(response, result.status, { error: 'YouTube search is temporarily unavailable.' });
    const searchItems = data.items || [];
    const ids = searchItems.map((item) => item.id?.videoId).filter(Boolean);
    let detailsById = new Map();
    if (ids.length) {
      const detailsParams = new URLSearchParams({ part: 'contentDetails,status,statistics', id: ids.join(','), key });
      const detailsResult = await fetch(`https://www.googleapis.com/youtube/v3/videos?${detailsParams.toString()}`, { signal: AbortSignal.timeout(10_000) });
      if (detailsResult.ok) {
        const detailsData = await detailsResult.json();
        detailsById = new Map((detailsData.items || []).map((item) => [item.id, item]));
      }
    }
    const queryTokens = query.toLowerCase().split(/\s+/).filter((token) => token.length > 2);
    const items = searchItems.map((item) => {
      const details = detailsById.get(item.id?.videoId) || {};
      const title = String(item.snippet?.title || '');
      const duration = String(details.contentDetails?.duration || '');
      const durationMatch = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      const durationSeconds = durationMatch ? Number(durationMatch[1] || 0) * 3600 + Number(durationMatch[2] || 0) * 60 + Number(durationMatch[3] || 0) : 0;
      const hasCaptions = details.contentDetails?.caption === 'true';
      const titleMatches = queryTokens.filter((token) => title.toLowerCase().includes(token)).length;
      const score = titleMatches * 4 + (hasCaptions ? 2 : 0) + (durationSeconds >= 240 && durationSeconds <= 2400 ? 2 : 0);
      const viewCount = Number(details.statistics?.viewCount || 0);
      return {
      id: item.id?.videoId,
      title,
      description: item.snippet?.description,
      channel: item.snippet?.channelTitle,
      publishedAt: item.snippet?.publishedAt,
      thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url,
      duration: formatDuration(duration),
      viewCount,
      likeCount: Number(details.statistics?.likeCount || 0),
      hasCaptions,
      learningScore: Math.min(99, Math.round(54 + score * 5 + Math.min(15, Math.log10(Math.max(1, viewCount)) * 2))),
      score,
    }; }).filter((item) => item.id && item.title).sort((a, b) => b.score - a.score).map(({ score: _score, ...item }) => item);
    response.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');
    return send(response, 200, { items });
  } catch {
    return send(response, 502, { error: 'Video search is temporarily unavailable.' });
  }
}
