import { loadLearningSessions, type LearningSession } from '@/lib/learningEvidence';
import { loadReviewCards, persistReviewCards, type ReviewCard } from '@/lib/spacedReview';
import { readScopedJson, writeScopedJson } from '@/lib/userScope';

/**
 * Evidence → memory bridge. QuizLab schedules a review date on the learning
 * session, but the review page reads the card store. This sync turns every
 * scheduled session into a real review card so "review now" opens the actual
 * card. Cards created here never overwrite a card the learner already graded.
 */

const LINK_KEY = 'fahim-evidence-review-links-v1';

type LinkIndex = Record<string, string>; // sessionId -> cardId

const links = (): LinkIndex => readScopedJson<LinkIndex>(LINK_KEY, {});

function evidenceBack(session: LearningSession) {
  const attempt = session.events.find((event) => event.type === 'attempt_submitted');
  const intervention = session.events.find((event) => event.type === 'intervention_completed');
  const parts = [attempt?.summary || '', intervention?.summary || ''].filter(Boolean);
  return parts.length ? parts.join('\n\n') : session.conceptAr || session.conceptEn;
}

/** Ensure every scheduled evidence session has a matching review card. */
export function syncEvidenceToReviewCards(): ReviewCard[] {
  const sessions = loadLearningSessions().filter((session) => session.reviewDueAt);
  if (!sessions.length) return loadReviewCards();
  const index = links();
  const cards = loadReviewCards();
  let changed = false;
  for (const session of sessions) {
    const existingId = index[session.id];
    if (existingId && cards.some((card) => card.id === existingId)) continue;
    const now = new Date().toISOString();
    const card: ReviewCard = {
      id: existingId || `ev-${session.id}`,
      front: session.conceptAr || session.conceptEn,
      back: evidenceBack(session),
      subject: session.sourceTitle || '',
      createdAt: now,
      updatedAt: now,
      dueAt: session.reviewDueAt!,
      intervalDays: 0,
      ease: 2.5,
      repetitions: 0,
      lapses: 0,
    };
    index[session.id] = card.id;
    cards.unshift(card);
    changed = true;
  }
  if (changed) {
    writeScopedJson(LINK_KEY, index);
    persistReviewCards(cards);
  }
  return loadReviewCards();
}
