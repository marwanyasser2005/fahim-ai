/** One bounded, owner-scoped evidence profile shared by chat and path generation. */
export async function readLearnerProfile(admin, userId) {
  if (!admin || !userId) return { concepts: [], dueReviews: 0, available: false };
  try {
    const [mastery, reviews] = await Promise.all([
      admin.from('concept_mastery').select('concept_key,mastery,attempts,subject').eq('user_id', userId).order('updated_at', { ascending: false }).limit(20),
      admin.from('review_items').select('id', { count: 'exact', head: true }).eq('user_id', userId).lte('due_at', new Date().toISOString()),
    ]);
    return {
      concepts: mastery.error ? [] : (mastery.data || []).map((entry) => ({ concept: entry.concept_key, subject: entry.subject, mastery: Number(entry.mastery) || 0, attempts: Number(entry.attempts) || 0 })),
      dueReviews: reviews.error ? 0 : reviews.count || 0,
      available: !mastery.error,
      interpretation: 'provisional-product-estimates-not-validated-learning-impact',
    };
  } catch { return { concepts: [], dueReviews: 0, available: false }; }
}
