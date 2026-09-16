import { describe, expect, it } from 'vitest';
import { courseCatalog, courseMinutes, getCourse } from '../src/data/courseCatalog';
import { serverBackedCourses, verifiedCourseAssessmentQuizId } from '../src/lib/verifiedCourse';

/** The one short path whose completion is recorded server-side and can earn a credential. */
const VERIFIED_COURSE_ID = 'physics-force-motion';

describe('course catalog integrity', () => {
  const fullPaths = courseCatalog.filter((course) => course.id !== VERIFIED_COURSE_ID);

  it('ships nine complete bilingual learning paths', () => {
    expect(fullPaths).toHaveLength(9);
    expect(new Set(courseCatalog.map((course) => course.id)).size).toBe(courseCatalog.length);
    for (const course of fullPaths) {
      expect(course.title.ar.length).toBeGreaterThan(4);
      expect(course.title.en.length).toBeGreaterThan(4);
      expect(course.description.ar.length).toBeGreaterThan(20);
      expect(course.description.en.length).toBeGreaterThan(20);
      expect(course.modules).toHaveLength(4);
      expect(course.modules.flatMap((module) => module.lessons)).toHaveLength(8);
      expect(course.outcomes.length).toBeGreaterThanOrEqual(3);
      expect(course.resources.length).toBeGreaterThanOrEqual(2);
      expect(course.resources.every((resource) => resource.url.startsWith('https://'))).toBe(true);
      expect(courseMinutes(course)).toBeGreaterThan(250);
    }
  });

  it('ships one short completable path that can actually earn a credential', () => {
    const verified = getCourse(VERIFIED_COURSE_ID);
    expect(verified).toBeDefined();
    const lessons = verified!.modules.flatMap((module) => module.lessons);
    expect(lessons.length).toBeGreaterThanOrEqual(4);
    // Completion has to be recorded against real database lessons, so every lesson id in
    // this path must be a uuid seeded by the course-completion migration.
    for (const lesson of lessons) {
      expect(lesson.id).toMatch(/^f1000000-0000-4000-8000-0000000001\d{2}$/);
    }
    expect(serverBackedCourses[VERIFIED_COURSE_ID]).toMatch(/^f1000000-0000-4000-8000-0000000000\d{2}$/);
    expect(verifiedCourseAssessmentQuizId).toMatch(/^f1000000-0000-4000-8000-0000000002\d{2}$/);
  });

  it('keeps lesson identifiers unique within each path', () => {
    for (const course of courseCatalog) {
      const ids = course.modules.flatMap((module) => module.lessons.map((lesson) => lesson.id));
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('supports legacy numeric links without breaking old bookmarks', () => {
    expect(getCourse('1')?.id).toBe('python-foundations');
    expect(getCourse('9')?.id).toBe('applied-ai');
    expect(getCourse('python-foundations')?.title.en).toContain('Python');
  });
});
