import { getFreshSession, supabase } from '@/lib/supabase/client';

/**
 * Lesson completion was tracked only in localStorage, while `my_certificate_eligibility_v2`
 * and the `path_finisher` badge both read `public.progress`. Nothing ever wrote that table,
 * so a learner could finish every lesson and still never become eligible. This is the writer.
 *
 * Only courses that exist in the database can be recorded, so catalog-only courses keep
 * working locally and simply report `local_only`.
 */

export type LessonCompletionInput = {
  courseId: string;
  lessonId: string;
  completed: boolean;
  positionSeconds?: number;
};

/** Upserts one lesson's completion state for the signed-in learner. */
export async function recordLessonCompletion(input: LessonCompletionInput) {
  if (!supabase) return { status: 'local_only' as const };
  const fresh = await getFreshSession();
  const session = fresh.session;
  if (!session) return { status: 'local_only' as const, reason: fresh.error };

  const now = new Date().toISOString();
  const { error } = await supabase
    .from('progress')
    .upsert({
      user_id: session.user.id,
      course_id: input.courseId,
      lesson_id: input.lessonId,
      status: input.completed ? 'completed' : 'in_progress',
      completion_percentage: input.completed ? 100 : 0,
      position_seconds: input.positionSeconds ?? 0,
      completed_at: input.completed ? now : null,
      last_accessed_at: now,
      updated_at: now,
    }, { onConflict: 'user_id,lesson_id' });

  if (error) return { status: 'failed' as const, reason: error.message };
  return { status: 'synced' as const };
}

/** Loads the lessons the learner has already completed for a course, from the database. */
export async function loadCompletedLessons(courseId: string, options: { strict?: boolean } = {}): Promise<string[]> {
  if (!supabase) { if (options.strict) throw new Error('Progress storage is unavailable.'); return []; }
  const fresh = await getFreshSession();
  const session = fresh.session;
  if (!session) { if (options.strict) throw new Error('Your open session needs to reconnect.'); return []; }
  const { data, error } = await supabase
    .from('progress')
    .select('lesson_id, status, completion_percentage')
    .eq('user_id', session.user.id)
    .eq('course_id', courseId);
  if (error || !data) { if (options.strict) throw new Error('Saved progress could not be loaded.'); return []; }
  return data
    .filter((row) => row.status === 'completed' || Number(row.completion_percentage) === 100)
    .map((row) => row.lesson_id as string)
    .filter(Boolean);
}

/** Server-side course assessment: questions without answers, and graded submission. */
export type AssessmentQuestion = {
  quizId: string;
  questionId: string;
  prompt: string;
  choices: string[];
  points: number;
  position: number;
};

export async function loadCourseAssessment(courseId: string): Promise<{ questions: AssessmentQuestion[]; quizId: string | null }> {
  if (!supabase) return { questions: [], quizId: null };
  const { data, error } = await supabase.rpc('course_assessment_v1', { target_course: courseId });
  if (error || !Array.isArray(data)) return { questions: [], quizId: null };
  return { questions: data as AssessmentQuestion[], quizId: (data[0] as AssessmentQuestion | undefined)?.quizId ?? null };
}

export type AssessmentResult = {
  attempt: number;
  correctCount: number;
  questionCount: number;
  percentage: number;
  passed: boolean;
  feedback: { questionId: string; correct: boolean; correctIndex: number; explanation: string }[];
};

export async function submitCourseAssessment(quizId: string, responses: { questionId: string; selectedIndex: number }[]): Promise<AssessmentResult> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.rpc('submit_course_assessment_v1', { target_quiz: quizId, responses });
  if (error) throw new Error(error.message);
  return data as AssessmentResult;
}
