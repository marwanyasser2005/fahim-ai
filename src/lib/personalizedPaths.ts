import { authenticatedFetch } from '@/lib/supabase/client';

export type LocalizedText = { ar: string; en: string };

export type PersonalizedLesson = {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  practice: LocalizedText;
  type: 'concept' | 'practice' | 'project';
  durationMinutes: number;
  position: number;
  teaching?: Partial<Record<'ar' | 'en', PathLessonTeaching>>;
};
export type PathLessonTeaching = { text: string; generatedAt: string; qualityVersion: string; sourceCheck: string };

export type PersonalizedModule = {
  index: number;
  title: LocalizedText;
  lessons: PersonalizedLesson[];
};

export type PersonalizedPath = {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  outcomes: LocalizedText[];
  goal: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  durationWeeks: number;
  weeklyMinutes: number;
  createdAt: string;
  version?: number;
  versionHistory?: { version: number; weeklyMinutes: number; changedAt: string; reason: string }[];
  adaptivePlan?: { nextLessonId: string | null; remainingLessons: number; estimatedWeeksRemaining: number; reviewMinutesPerWeek: number; reason: string; warmup?: { concept: string; lessonId: string; attempts: number; minutes: number; provisional: boolean } | null };
  sources?: { citationId: string; title: string; url: string; excerpt?: string }[];
  workflow?: { phases: string[]; totalMinutes: number; blueprint?: { measurableGoal?: string; prerequisites?: string[]; assumptions?: string[] } };
  lessonCount?: number;
  moduleCount?: number;
  modules?: PersonalizedModule[];
};

export type PathGenerationInput = {
  goal: string;
  level: PersonalizedPath['level'];
  durationWeeks: number;
  weeklyMinutes: number;
  language: 'ar' | 'en';
  preferences: string;
};

async function responseJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || 'The request could not be completed.');
  return payload;
}

export async function listPersonalizedPaths(): Promise<PersonalizedPath[]> {
  const response = await authenticatedFetch('/api/learning-paths');
  const payload = await responseJson<{ paths: PersonalizedPath[] }>(response);
  return payload.paths || [];
}

export async function loadPersonalizedPath(id: string): Promise<PersonalizedPath> {
  const response = await authenticatedFetch(`/api/learning-paths?id=${encodeURIComponent(id)}`);
  const payload = await responseJson<{ path: PersonalizedPath }>(response);
  return payload.path;
}

export async function generatePersonalizedPath(input: PathGenerationInput): Promise<PersonalizedPath> {
  const response = await authenticatedFetch('/api/learning-paths', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const payload = await responseJson<{ path: PersonalizedPath }>(response);
  return payload.path;
}

export async function replanPersonalizedPath(path: PersonalizedPath, weeklyMinutes: number): Promise<PersonalizedPath> {
  const response = await authenticatedFetch('/api/learning-paths', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'replan', pathId: path.id, weeklyMinutes, expectedVersion: path.version || 1 }) });
  return (await responseJson<{ path: PersonalizedPath }>(response)).path;
}

export async function loadPathLessonTeaching(pathId: string, lessonId: string, language: 'ar' | 'en'): Promise<PathLessonTeaching> {
  const response = await authenticatedFetch('/api/learning-paths', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'lesson-content', pathId, lessonId, language }) });
  return (await responseJson<{ lesson: PathLessonTeaching }>(response)).lesson;
}
