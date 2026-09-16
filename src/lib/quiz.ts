import type { TutorSource } from '@/lib/aiTutor';
import { authenticatedFetch } from '@/lib/supabase/client';

export type QuizDifficulty = 'easy' | 'medium' | 'hard';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  skill: string;
  difficulty: QuizDifficulty;
  token: string;
}

export interface GeneratedQuiz {
  id: string;
  title: string;
  topic: string;
  questions: QuizQuestion[];
  sources: TutorSource[];
}

export interface GradeResult {
  correct: boolean;
  correctIndex: number;
  correctAnswer: string;
  explanation: string;
  misconception: string;
  skill: string;
  xp: number;
}

async function postQuiz(body: Record<string, unknown>) {
  const response = await authenticatedFetch('/api/quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) throw new Error(data.error || 'Quiz service is unavailable.');
  return data;
}

export async function generateQuiz(input: {
  topic: string;
  subject: string;
  grade: string;
  language: 'ar' | 'en';
  difficulty: QuizDifficulty;
  count?: number;
}) {
  return postQuiz({ action: 'generate', ...input }) as Promise<GeneratedQuiz>;
}

export async function gradeQuizAnswer(token: string, answerIndex: number) {
  return postQuiz({ action: 'grade', token, answerIndex }) as Promise<GradeResult>;
}
