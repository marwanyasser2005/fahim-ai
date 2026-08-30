export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy';
export type ReviewCard = { id: string; front: string; back: string; subject: string; createdAt: string; updatedAt: string; dueAt: string; intervalDays: number; ease: number; repetitions: number; lapses: number; lastGrade?: ReviewGrade };

const KEY = 'fahim-review-cards-v1';
export function loadReviewCards(): ReviewCard[] { try { const data = JSON.parse(localStorage.getItem(KEY) || '[]') as ReviewCard[]; return Array.isArray(data) ? data : []; } catch { return []; } }
function persist(cards: ReviewCard[]) { localStorage.setItem(KEY, JSON.stringify(cards.slice(0, 2000))); window.dispatchEvent(new Event('fahim-progress')); }
export function createReviewCard(front: string, back: string, subject = '') {
  const now = new Date().toISOString();
  const card: ReviewCard = { id: crypto.randomUUID(), front: front.trim().slice(0, 500), back: back.trim().slice(0, 1500), subject: subject.trim().slice(0, 80), createdAt: now, updatedAt: now, dueAt: now, intervalDays: 0, ease: 2.5, repetitions: 0, lapses: 0 };
  persist([card, ...loadReviewCards()]); return card;
}
export function removeReviewCard(id: string) { persist(loadReviewCards().filter((card) => card.id !== id)); }
export function dueReviewCards(now = new Date()) { return loadReviewCards().filter((card) => new Date(card.dueAt) <= now).sort((a, b) => a.dueAt.localeCompare(b.dueAt)); }
export function gradeReviewCard(id: string, grade: ReviewGrade) {
  const cards = loadReviewCards(); const card = cards.find((item) => item.id === id); if (!card) return;
  const now = new Date(); let interval = card.intervalDays; let ease = card.ease; let repetitions = card.repetitions; let lapses = card.lapses;
  if (grade === 'again') { interval = 10 / 1440; repetitions = 0; lapses += 1; ease = Math.max(1.3, ease - .2); }
  if (grade === 'hard') { interval = Math.max(1, interval ? interval * 1.2 : 1); repetitions += 1; ease = Math.max(1.3, ease - .15); }
  if (grade === 'good') { interval = repetitions === 0 ? 1 : repetitions === 1 ? 3 : Math.max(2, interval * ease); repetitions += 1; }
  if (grade === 'easy') { interval = repetitions === 0 ? 4 : Math.max(4, interval * ease * 1.3); repetitions += 1; ease = Math.min(3.2, ease + .15); }
  const dueAt = new Date(now.getTime() + interval * 86_400_000).toISOString();
  const updated = { ...card, intervalDays: Math.round(interval * 100) / 100, ease: Math.round(ease * 100) / 100, repetitions, lapses, lastGrade: grade, dueAt, updatedAt: now.toISOString() };
  persist(cards.map((item) => item.id === id ? updated : item)); return updated;
}
export function reviewStats() {
  const cards = loadReviewCards(); const now = new Date(); const tomorrow = new Date(now.getTime() + 86_400_000);
  return { total: cards.length, due: cards.filter((card) => new Date(card.dueAt) <= now).length, tomorrow: cards.filter((card) => { const date = new Date(card.dueAt); return date > now && date <= tomorrow; }).length, mature: cards.filter((card) => card.intervalDays >= 21).length };
}
