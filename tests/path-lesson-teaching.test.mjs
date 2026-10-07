import { describe, expect, it } from 'vitest';
import { teachPathLesson } from '../api/_lib/learning-paths.mjs';

function storage(course, lesson) {
  const reads = [];
  return { reads, from(table) {
    const query = { select() { return query; }, eq(key, value) { reads.push({ table, key, value }); return query; }, async maybeSingle() { return { data: table === 'courses' ? course : lesson, error: null }; } };
    return query;
  } };
}

describe('saved personalized lesson teaching', () => {
  it('checks path ownership before reading a cached lesson', async () => {
    const db = storage({ id: 'path' }, { id: 'lesson', metadata: { teaching: { ar: { text: 'شرح محفوظ', generatedAt: '2026-10-07' } } } });
    const result = await teachPathLesson(db, 'owner', { pathId: 'path', lessonId: 'lesson', language: 'ar' });
    expect(result.cached).toBe(true);
    expect(result.text).toBe('شرح محفوظ');
    expect(db.reads).toContainEqual({ table: 'courses', key: 'teacher_id', value: 'owner' });
    expect(db.reads).toContainEqual({ table: 'lessons', key: 'course_id', value: 'path' });
  });
  it('does not access lessons for an unavailable or foreign path', async () => {
    const db = storage(null, { id: 'lesson' });
    await expect(teachPathLesson(db, 'other', { pathId: 'path', lessonId: 'lesson' })).rejects.toThrow('Learning path not found');
    expect(db.reads.every(read => read.table === 'courses')).toBe(true);
  });
  it('rejects a lesson outside the selected path', async () => {
    await expect(teachPathLesson(storage({ id: 'path' }, null), 'owner', { pathId: 'path', lessonId: 'foreign' })).rejects.toThrow('Lesson not found');
  });
});
