export type StudyAction = 'session' | 'explain' | 'video' | 'source' | 'quiz';

export interface StudyEvent {
  id: string;
  action: StudyAction;
  topic: string;
  createdAt: string;
}

const KEY = 'fahim-study-events-v1';

export function getStudyEvents(): StudyEvent[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') as StudyEvent[]; }
  catch { return []; }
}

export function recordStudyAction(action: StudyAction, topic: string) {
  const cleanTopic = topic.trim().slice(0, 120);
  if (!cleanTopic) return;
  const events = getStudyEvents();
  events.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, action, topic: cleanTopic, createdAt: new Date().toISOString() });
  localStorage.setItem(KEY, JSON.stringify(events.slice(0, 100)));
  window.dispatchEvent(new Event('fahim-progress'));
}

export function getStudyStats() {
  const events = getStudyEvents();
  const today = new Date().toISOString().slice(0, 10);
  const todayEvents = events.filter((event) => event.createdAt.slice(0, 10) === today);
  return {
    total: events.length,
    today: todayEvents.length,
    topics: new Set(events.map((event) => event.topic.toLowerCase())).size,
    actions: new Set(todayEvents.map((event) => event.action)).size,
    recent: events.slice(0, 4),
  };
}
