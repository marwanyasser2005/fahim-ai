export type CourseProgress = {
  courseId: string;
  completedLessonIds: string[];
  enrolledAt: string;
  updatedAt: string;
};

const KEY = 'fahim-course-progress-v1';

export function loadCourseProgress(): CourseProgress[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]') as CourseProgress[];
    return Array.isArray(parsed) ? parsed.filter((item) => item.courseId && Array.isArray(item.completedLessonIds)) : [];
  } catch {
    return [];
  }
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
  localStorage.setItem(KEY, JSON.stringify(items.slice(0, 50)));
  window.dispatchEvent(new Event('fahim-progress'));
}
