export type CourseProgress = {
  courseId: string;
  completedLessonIds: string[];
  enrolledAt: string;
  updatedAt: string;
};

import { readScopedJson, writeScopedJson } from '@/lib/userScope';

const KEY = 'fahim-course-progress-v1';

export function loadCourseProgress(): CourseProgress[] {
  const parsed = readScopedJson<CourseProgress[]>(KEY, []);
  return Array.isArray(parsed) ? parsed.filter((item) => item.courseId && Array.isArray(item.completedLessonIds)) : [];
}

export function getCourseProgress(courseId: string): CourseProgress {
  return loadCourseProgress().find((item) => item.courseId === courseId) || {
    courseId,
    completedLessonIds: [],
    enrolledAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function saveCourseProgress(progress: CourseProgress) {
  const items = loadCourseProgress().filter((item) => item.courseId !== progress.courseId);
  items.unshift({ ...progress, completedLessonIds: [...new Set(progress.completedLessonIds)], updatedAt: new Date().toISOString() });
  writeScopedJson(KEY, items.slice(0, 50));
  window.dispatchEvent(new Event('fahim-progress'));
}
