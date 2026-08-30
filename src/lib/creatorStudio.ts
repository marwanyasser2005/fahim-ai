export type Assignment = { id: string; title: string; dueAt: string; createdAt: string };
export type Classroom = { id: string; name: string; subject: string; code: string; createdAt: string; assignments: Assignment[] };
export type LearningProject = { id: string; title: string; goal: string; rubric: string[]; scores: Record<string, number>; createdAt: string; updatedAt: string };
const CLASS_KEY = 'fahim-classrooms-v1'; const PROJECT_KEY = 'fahim-projects-v1';
const read = <T,>(key: string): T[] => { try { const value = JSON.parse(localStorage.getItem(key) || '[]') as T[]; return Array.isArray(value) ? value : []; } catch { return []; } };
export const loadClassrooms = () => read<Classroom>(CLASS_KEY);
export const loadProjects = () => read<LearningProject>(PROJECT_KEY);
const saveClasses = (items: Classroom[]) => localStorage.setItem(CLASS_KEY, JSON.stringify(items.slice(0, 100)));
const saveProjects = (items: LearningProject[]) => localStorage.setItem(PROJECT_KEY, JSON.stringify(items.slice(0, 200)));
export function createClassroom(name: string, subject: string) { const item: Classroom = { id: crypto.randomUUID(), name: name.trim().slice(0, 80), subject: subject.trim().slice(0, 80), code: Math.random().toString(36).slice(2, 8).toUpperCase(), createdAt: new Date().toISOString(), assignments: [] }; saveClasses([item, ...loadClassrooms()]); return item; }
export function addAssignment(classroomId: string, title: string, dueAt: string) { const items = loadClassrooms().map((item) => item.id === classroomId ? { ...item, assignments: [...item.assignments, { id: crypto.randomUUID(), title: title.trim().slice(0, 160), dueAt, createdAt: new Date().toISOString() }] } : item); saveClasses(items); return items; }
export function removeClassroom(id: string) { saveClasses(loadClassrooms().filter((item) => item.id !== id)); }
export function createProject(title: string, goal: string, rubric: string[]) { const now = new Date().toISOString(); const item: LearningProject = { id: crypto.randomUUID(), title: title.trim().slice(0, 120), goal: goal.trim().slice(0, 800), rubric: rubric.map((item) => item.trim()).filter(Boolean).slice(0, 8), scores: {}, createdAt: now, updatedAt: now }; saveProjects([item, ...loadProjects()]); return item; }
export function scoreProject(id: string, criterion: string, score: number) { const items = loadProjects().map((item) => item.id === id ? { ...item, scores: { ...item.scores, [criterion]: Math.max(1, Math.min(4, score)) }, updatedAt: new Date().toISOString() } : item); saveProjects(items); return items; }
export function removeProject(id: string) { saveProjects(loadProjects().filter((item) => item.id !== id)); }
