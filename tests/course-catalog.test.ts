import { describe, expect, it } from 'vitest';
import { courseCatalog, courseMinutes, getCourse } from '../src/data/courseCatalog';

describe('course catalog integrity', () => {
  it('ships nine complete bilingual learning paths', () => {
    expect(courseCatalog).toHaveLength(9);
    expect(new Set(courseCatalog.map((course) => course.id)).size).toBe(courseCatalog.length);
    for (const course of courseCatalog) {
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
