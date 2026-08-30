export type KnowledgeSource = 'official' | 'wikipedia' | 'openalex' | 'crossref';
export interface KnowledgeResult {
  id: string;
  title: string;
  description: string;
  excerpt: string;
  thumbnail?: string;
  url: string;
  source: KnowledgeSource;
  authority: string;
  kind: string;
  year?: number;
  language?: string;
  citations?: number;
  openAccess?: boolean;
  learningScore: number;
  verifiedAt?: string;
}

export type KnowledgeSearchOptions = { source: 'all' | 'official' | 'encyclopedia' | 'research'; yearFrom?: number; openAccess?: boolean };
type WikiPage = { id: number; key: string; title: string; description?: string; excerpt?: string; thumbnail?: { url?: string } };

async function wikipediaFallback(query: string, language: 'ar' | 'en'): Promise<KnowledgeResult[]> {
  const host = language === 'ar' ? 'ar.wikipedia.org' : 'en.wikipedia.org';
  const response = await fetch(`https://${host}/w/rest.php/v1/search/page?q=${encodeURIComponent(query)}&limit=12`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Knowledge search is unavailable');
  const data = await response.json() as { pages?: WikiPage[] };
  return (data.pages || []).map((page) => ({ id: `wiki-${page.id}`, source: 'wikipedia', authority: 'open-reference', kind: 'encyclopedia', title: page.title, description: page.description || '', excerpt: (page.excerpt || '').replace(/<[^>]+>/g, ''), thumbnail: page.thumbnail?.url, url: `https://${host}/wiki/${encodeURIComponent(page.key)}`, learningScore: 55 }));
}

export async function searchKnowledge(query: string, language: 'ar' | 'en', options: KnowledgeSearchOptions): Promise<{ items: KnowledgeResult[]; tookMs?: number; partial?: boolean; providers: string[] }> {
  const params = new URLSearchParams({ q: query, language, source: options.source });
  if (options.yearFrom) params.set('yearFrom', String(options.yearFrom));
  if (options.openAccess) params.set('openAccess', 'true');
  try {
    const response = await fetch(`/api/search?${params}`);
    if (!response.ok) throw new Error('Unified search is unavailable');
    return await response.json() as { items: KnowledgeResult[]; tookMs?: number; partial?: boolean; providers: string[] };
  } catch {
    if (options.source === 'official' || options.source === 'research') throw new Error('Selected search provider is unavailable');
    return { items: await wikipediaFallback(query, language), partial: true, providers: ['Wikimedia fallback'] };
  }
}
