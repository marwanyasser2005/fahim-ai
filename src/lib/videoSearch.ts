export interface EducationalVideo {
  id: string;
  title: string;
  description: string;
  channel: string;
  publishedAt: string;
  thumbnail: string;
  duration?: string;
  viewCount?: number;
  likeCount?: number;
  hasCaptions?: boolean;
  learningScore?: number;
}

export interface VideoSearchOptions {
  captioned: boolean;
  duration: 'any' | 'short' | 'medium' | 'long';
  order: 'relevance' | 'viewCount' | 'date';
  language: 'ar' | 'en';
}

export async function searchVideos(query: string, options: VideoSearchOptions): Promise<EducationalVideo[]> {
  const params = new URLSearchParams({
    q: query,
    captions: String(options.captioned),
    duration: options.duration,
    order: options.order,
    language: options.language,
  });
  const response = await fetch(`/api/youtube?${params.toString()}`);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(payload.error || 'Video search is unavailable');
  }
  const payload = await response.json() as { items?: EducationalVideo[] };
  return payload.items || [];
}
