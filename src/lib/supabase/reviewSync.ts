import { getFreshSession, supabase } from '@/lib/supabase/client';
import { loadReviewCards, persistReviewCards, type ReviewCard, type ReviewGrade } from '@/lib/spacedReview';
import { loadLearningSessions } from '@/lib/learningEvidence';

/**
 * Spaced-review cards used to live only in localStorage, so a learner lost their schedule
 * on a new device or after clearing storage, while the marketing copy promised continuity
 * across devices. The `review_items` table already existed for this and was never used.
 */

const ratingByGrade: Record<ReviewGrade, number> = { again: 0, hard: 2, good: 3, easy: 4 };

function conceptKeyFor(card: ReviewCard) {
  const session = card.sessionId ? loadLearningSessions().find((item) => item.id === card.sessionId) : undefined;
  if (session?.conceptKey) return session.conceptKey.slice(0, 160);
  const slug = card.front.toLowerCase().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}-]+/gu, '').slice(0, 120);
  return (slug.length >= 2 ? slug : 'fahim-review').slice(0, 160);
}

function rowFor(card: ReviewCard, userId: string) {
  return {
    id: card.id,
    user_id: userId,
    concept_key: conceptKeyFor(card),
    prompt: card.front,
    answer: card.back,
    interval_days: card.intervalDays,
    ease_factor: card.ease,
    repetitions: card.repetitions,
    due_at: card.dueAt,
    last_rating: card.lastGrade ? ratingByGrade[card.lastGrade] : null,
    sync_state: 'synced',
    updated_at: card.updatedAt,
  };
}

/** Pushes the local review schedule to Supabase so it survives a device change. */
export async function syncReviewCards(cards = loadReviewCards()) {
  if (!supabase || !cards.length) return { status: 'local_only' as const, synced: 0 };
  const fresh = await getFreshSession();
  const session = fresh.session;
  if (!session) return { status: 'local_only' as const, synced: 0, reason: fresh.error };
  const { error } = await supabase
    .from('review_items')
    .upsert(cards.slice(0, 500).map((card) => rowFor(card, session.user.id)), { onConflict: 'id' });
  if (error) return { status: 'failed' as const, synced: 0, reason: error.message };
  return { status: 'synced' as const, synced: Math.min(cards.length, 500) };
}

export async function syncPendingReviewCards() {
  return syncReviewCards();
}

/**
 * Merges the cloud schedule back into the local store. Reviews taken on another device are
 * adopted; the copy with the later `updatedAt` wins so grading is never silently reverted.
 */
export async function hydrateReviewCardsFromCloud() {
  if (!supabase) return loadReviewCards();
  const fresh = await getFreshSession();
  const session = fresh.session;
  if (!session) return loadReviewCards();
  const { data, error } = await supabase
    .from('review_items')
    .select('id, prompt, answer, interval_days, ease_factor, repetitions, due_at, last_rating, updated_at, created_at')
    .eq('user_id', session.user.id)
    .order('due_at')
    .limit(500);
  if (error || !data?.length) return loadReviewCards();

  const local = loadReviewCards();
  const byId = new Map(local.map((card) => [card.id, card]));
  let changed = false;

  for (const row of data) {
    const existing = byId.get(row.id as string);
    const remote: ReviewCard = {
      id: row.id as string,
      front: row.prompt as string,
      back: row.answer as string,
      subject: existing?.subject || '',
      sessionId: existing?.sessionId || (row.id as string).startsWith('ev-') ? (row.id as string).slice(3) : undefined,
      misconception: existing?.misconception,
      createdAt: (row.created_at as string) || new Date().toISOString(),
      updatedAt: (row.updated_at as string) || new Date().toISOString(),
      dueAt: row.due_at as string,
      intervalDays: Number(row.interval_days) || 0,
      ease: Number(row.ease_factor) || 2.5,
      repetitions: Number(row.repetitions) || 0,
      lapses: existing?.lapses || 0,
      lastGrade: existing?.lastGrade,
    };
    if (existing && existing.updatedAt >= remote.updatedAt) continue;
    byId.set(remote.id, remote);
    changed = true;
  }

  if (changed) persistReviewCards([...byId.values()]);
  return loadReviewCards();
}
