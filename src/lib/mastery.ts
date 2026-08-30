export interface QuizAttempt {
  id: string;
  quizId: string;
  topic: string;
  subject: string;
  grade: string;
  score: number;
  total: number;
  mastery: number;
  xp: number;
  skills: Array<{ skill: string; correct: boolean }>;
  createdAt: string;
}

const KEY = 'fahim-quiz-attempts-v1';

export function calculateMastery(score: number, total: number) {
  if (!Number.isFinite(score) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((score / total) * 100)));
}

export function loadQuizAttempts(): QuizAttempt[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]') as QuizAttempt[];
    return Array.isArray(parsed) ? parsed.filter((attempt) => attempt?.id && attempt.total > 0).slice(0, 100) : [];
  } catch {
    return [];
  }
}

export function saveQuizAttempt(input: Omit<QuizAttempt, 'id' | 'mastery' | 'createdAt'>) {
  const attempt: QuizAttempt = {
    ...input,
    id: crypto.randomUUID(),
    mastery: calculateMastery(input.score, input.total),
    createdAt: new Date().toISOString(),
  };
  const attempts = [attempt, ...loadQuizAttempts()].slice(0, 100);
  localStorage.setItem(KEY, JSON.stringify(attempts));
  window.dispatchEvent(new Event('fahim-progress'));
  return attempt;
}

export function getMasteryStats() {
  const attempts = loadQuizAttempts();
  const totalQuestions = attempts.reduce((sum, attempt) => sum + attempt.total, 0);
  const correctAnswers = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
  const byTopic = new Map<string, { topic: string; score: number; total: number; latestAt: string }>();
  attempts.forEach((attempt) => {
    const key = attempt.topic.trim().toLowerCase();
    const current = byTopic.get(key) || { topic: attempt.topic, score: 0, total: 0, latestAt: attempt.createdAt };
    current.score += attempt.score;
    current.total += attempt.total;
    if (attempt.createdAt > current.latestAt) current.latestAt = attempt.createdAt;
    byTopic.set(key, current);
  });
  const topics = [...byTopic.values()].map((topic) => ({
    ...topic,
    mastery: calculateMastery(topic.score, topic.total),
  })).sort((a, b) => a.mastery - b.mastery);
  return {
    attempts: attempts.length,
    totalQuestions,
    correctAnswers,
    mastery: calculateMastery(correctAnswers, totalQuestions),
    xp: attempts.reduce((sum, attempt) => sum + attempt.xp, 0),
    weakestTopics: topics.slice(0, 3),
    strongestTopics: [...topics].sort((a, b) => b.mastery - a.mastery).slice(0, 3),
  };
}
