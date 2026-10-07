/**
 * Fahim Agent — durable learner memory.
 *
 * This is the persistence spine that turns the tutor into an agent with real memory:
 * per-concept mastery (BKT posterior), adaptive ability (IRT theta), and the spaced-review
 * schedule (FSRS card) survive across sessions and devices in Supabase. Reads and writes go
 * through the service-role client (RLS is bypassed intentionally; every row is scoped to the
 * authenticated learner's id by the caller). Every function degrades to an in-memory default
 * when Supabase is unconfigured so the agent still runs in local/test environments.
 */

import { BKT_DEFAULTS, masteryLabel } from '../learning.mjs';

const clamp01 = (value) => Math.min(1, Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0));

export function normalizeConceptKey(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'general-concept';
}

const AGENT_STAGES = new Set(['discover', 'diagnose', 'teach', 'prove', 'remember', 'complete']);

/** Create a private, server-authoritative checkpoint for a tutoring journey. */
export async function createAgentSession(admin, userId, {
  conceptKey,
  goal,
  subject = '',
  grade = '',
  language = 'ar',
} = {}) {
  if (!admin || !userId) return null;
  try {
    const { data, error } = await admin.from('agent_sessions').insert({
      user_id: userId,
      concept_key: normalizeConceptKey(conceptKey || goal),
      goal: String(goal || conceptKey || '').trim().slice(0, 400),
      subject: String(subject || '').trim().slice(0, 80) || null,
      grade: String(grade || '').trim().slice(0, 80) || null,
      language: language === 'en' ? 'en' : 'ar',
      status: 'active',
      stage: 'discover',
      state: {},
    }).select('id,concept_key,goal,subject,grade,language,status,stage,state,mastery,turn_count').single();
    return error ? null : data;
  } catch {
    return null;
  }
}

/** Load a checkpoint only when it belongs to the authenticated learner. */
export async function loadAgentSession(admin, userId, sessionId) {
  if (!admin || !userId || !sessionId) return null;
  try {
    const { data, error } = await admin.from('agent_sessions')
      .select('id,concept_key,goal,subject,grade,language,status,stage,state,mastery,turn_count')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .maybeSingle();
    return error ? null : data;
  } catch {
    return null;
  }
}

/** Persist the minimal controller state needed to resume safely on another device. */
export async function saveAgentSession(admin, userId, sessionId, {
  state,
  stage = 'discover',
  status = 'active',
  mastery = BKT_DEFAULTS.p0,
  generationId = null,
  completed = false,
  expectedTurnCount = null,
} = {}) {
  if (!admin || !userId || !sessionId) return { persisted: false };
  const safeStage = AGENT_STAGES.has(stage) ? stage : 'discover';
  const safeStatus = ['active', 'awaiting', 'completed', 'abandoned'].includes(status) ? status : 'active';
  try {
    const row = {
      state: state && typeof state === 'object' ? state : {},
      stage: safeStage,
      status: safeStatus,
      mastery: Math.round(clamp01(mastery) * 1000) / 1000,
      last_generation_id: generationId || null,
      updated_at: new Date().toISOString(),
      ...(Number.isInteger(expectedTurnCount) ? { turn_count: expectedTurnCount + 1 } : {}),
      ...(completed ? { completed_at: new Date().toISOString() } : {}),
    };
    let update = admin.from('agent_sessions')
      .update(row)
      .eq('id', sessionId)
      .eq('user_id', userId);
    if (Number.isInteger(expectedTurnCount)) update = update.eq('turn_count', expectedTurnCount);
    const { data, error } = await update.select('id,turn_count').maybeSingle();
    if (error || !data) return { persisted: false, conflict: !error };
    return { persisted: true };
  } catch {
    return { persisted: false };
  }
}

/** Read the learner's durable state for one concept: mastery, ability, and due reviews. */
export async function loadLearnerState(admin, userId, conceptKey) {
  const key = normalizeConceptKey(conceptKey);
  const fallback = {
    conceptKey: key,
    mastery: BKT_DEFAULTS.p0,
    masteryLabel: masteryLabel(BKT_DEFAULTS.p0, true),
    attempts: 0,
    correct: 0,
    ability: 0,
    reviewCard: null,
    dueReviews: 0,
    persisted: false,
  };
  if (!admin || !userId) return fallback;
  try {
    const [{ data: mastery }, { data: due }] = await Promise.all([
      admin.from('concept_mastery').select('mastery,attempts,correct,ability,params').eq('user_id', userId).eq('concept_key', key).maybeSingle(),
      admin.from('review_items').select('id,due_at,stability,difficulty,repetitions,last_review_at').eq('user_id', userId).eq('concept_key', key).lte('due_at', new Date().toISOString()),
    ]);
    const reviewCard = Array.isArray(due) && due.length && Number.isFinite(Number(due[0].stability))
      ? {
          difficulty: Number(due[0].difficulty) || 0.5,
          stability: Number(due[0].stability) || 0,
          lastReviewAt: due[0].last_review_at || new Date().toISOString(),
          reviews: Number(due[0].repetitions) || 0,
          lapses: 0,
        }
      : null;
    return {
      conceptKey: key,
      mastery: mastery ? clamp01(mastery.mastery) : BKT_DEFAULTS.p0,
      masteryLabel: masteryLabel(mastery ? clamp01(mastery.mastery) : BKT_DEFAULTS.p0, true),
      attempts: mastery ? Number(mastery.attempts) || 0 : 0,
      correct: mastery ? Number(mastery.correct) || 0 : 0,
      ability: mastery ? Number(mastery.ability) || 0 : 0,
      reviewCard,
      dueReviews: Array.isArray(due) ? due.length : 0,
      persisted: Boolean(mastery),
    };
  } catch {
    return fallback;
  }
}

/** Upsert the BKT/IRT state for one concept. Best-effort: never throws into the agent loop. */
export async function saveConceptMastery(admin, userId, conceptKey, { mastery, attempts, correct, ability, subject } = {}) {
  if (!admin || !userId) return { persisted: false };
  const key = normalizeConceptKey(conceptKey);
  try {
    const { error } = await admin.from('concept_mastery').upsert({
      user_id: userId,
      concept_key: key,
      subject: String(subject || '').slice(0, 80) || null,
      mastery: Math.round(clamp01(mastery) * 1000) / 1000,
      attempts: Math.max(0, Math.round(Number(attempts) || 0)),
      correct: Math.max(0, Math.round(Number(correct) || 0)),
      ability: Math.round((Number.isFinite(Number(ability)) ? Number(ability) : 0) * 1000) / 1000,
      params: BKT_DEFAULTS,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,concept_key' });
    return { persisted: !error };
  } catch {
    return { persisted: false };
  }
}

/** Persist an FSRS card as a due review item so the schedule survives a device change. */
export async function saveReviewSchedule(admin, userId, conceptKey, { card, nextReviewAt, intervalDays, prompt, answer } = {}) {
  if (!admin || !userId || !card) return { persisted: false };
  const key = normalizeConceptKey(conceptKey);
  try {
    const { data: existing } = await admin.from('review_items').select('id').eq('user_id', userId).eq('concept_key', key).limit(1).maybeSingle();
    const row = {
      user_id: userId,
      concept_key: key,
      prompt: String(prompt || `Recall: ${conceptKey}`).slice(0, 600),
      answer: String(answer || '').slice(0, 2000) || 'See the intervention notes in your learning passport.',
      interval_days: Math.round((Number(intervalDays) || 0) * 100) / 100,
      repetitions: Math.max(0, Math.round(Number(card.reviews) || 0)),
      due_at: nextReviewAt || new Date().toISOString(),
      stability: Math.round((Number(card.stability) || 0) * 1000) / 1000,
      difficulty: Math.round((Number(card.difficulty) || 0.5) * 1000) / 1000,
      last_review_at: card.lastReviewAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { error } = existing?.id
      ? await admin.from('review_items').update(row).eq('id', existing.id)
      : await admin.from('review_items').insert(row);
    return { persisted: !error };
  } catch {
    return { persisted: false };
  }
}

/** Best-effort evidence trail. Failure here must never break the agent turn. */
export async function recordEvidence(admin, userId, { conceptKey, masteryScore, evidenceType = 'attempt', note = '' } = {}) {
  if (!admin || !userId) return { persisted: false };
  try {
    const { error } = await admin.from('learning_evidence').insert({
      user_id: userId,
      concept_key: normalizeConceptKey(conceptKey),
      evidence_type: evidenceType,
      mastery_score: Math.round(clamp01(masteryScore) * 100 * 100) / 100,
      generated_by: 'ai_assisted',
      summary: String(note || 'Fahim agent recorded a measured change in understanding.').slice(0, 500),
    });
    return { persisted: !error };
  } catch {
    return { persisted: false };
  }
}
