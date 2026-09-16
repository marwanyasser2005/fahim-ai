/**
 * Catalog courses are authored in the repository, while `progress`, `quiz_results` and
 * `certificates` all key off rows in `public.courses`. Only the courses listed here have a
 * matching database row, so only these can record completion and earn a credential.
 *
 * These identifiers are the ones seeded by
 * supabase/migrations/20260915010000_course_completion_v1.sql. Keep them in sync.
 */
export const serverBackedCourses: Record<string, string> = {
  'physics-force-motion': 'f1000000-0000-4000-8000-000000000001',
};

export const verifiedCourseAssessmentQuizId = 'f1000000-0000-4000-8000-000000000201';

/** The database course id for a catalog course, or null when it exists only in the catalog. */
export function serverCourseIdFor(catalogCourseId: string): string | null {
  return serverBackedCourses[catalogCourseId] ?? null;
}
