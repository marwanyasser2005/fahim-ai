import { getFreshSession, supabase } from '@/lib/supabase/client';
import { loadLearningSessions, saveLearningSession, type EvidenceClassification, type LearningEvent, type LearningSession } from '@/lib/learningEvidence';

const classificationToDb: Record<EvidenceClassification, string> = {
  verified_source: 'VERIFIED_SOURCE',
  inferred: 'INFERRED',
  teaching_explanation: 'TEACHING_EXPLANATION',
  general_knowledge: 'GENERAL_KNOWLEDGE',
  needs_review: 'NEEDS_REVIEW',
};

const classificationFromDb = Object.fromEntries(Object.entries(classificationToDb).map(([key, value]) => [value, key])) as Record<string, EvidenceClassification>;

function sessionRow(session: LearningSession, userId: string) {
  return {
    id: session.id,
    user_id: userId,
    concept_key: session.conceptKey,
    concept_ar: session.conceptAr,
    concept_en: session.conceptEn,
    source_title: session.sourceTitle ?? null,
    source_location: session.sourceLocation ?? null,
    source_version: session.sourceVersion ?? null,
    evidence_classification: classificationToDb[session.classification],
    mastery_dimensions: session.mastery,
    status: session.status,
    review_due_at: session.reviewDueAt ?? null,
    client_updated_at: session.updatedAt,
  };
}

function eventRow(event: LearningEvent, userId: string) {
  return {
    id: event.id,
    session_id: event.sessionId,
    user_id: userId,
    sequence: event.sequence,
    event_type: event.type,
    concept_key: event.conceptKey,
    title: event.title,
    summary: event.summary,
    misconception_category: event.misconception ?? null,
    confidence: event.confidence ?? null,
    payload: event.payload ?? {},
    occurred_at: event.occurredAt,
  };
}

export async function syncLearningSession(session: LearningSession) {
  if (!supabase) return { status: 'local_only' as const };
  const fresh = await getFreshSession();
  if (!fresh.session) return { status: 'local_only' as const, reason: fresh.error };
  const userId = fresh.session.user.id;
  const { error: sessionError } = await supabase.from('learning_sessions').upsert(sessionRow(session, userId), { onConflict: 'id' });
  if (sessionError) return { status: 'failed' as const, reason: sessionError.message };
  if (session.events.length) {
    const { error: eventsError } = await supabase.from('learning_events').upsert(session.events.map((event) => eventRow(event, userId)), { onConflict: 'id' });
    if (eventsError) return { status: 'failed' as const, reason: eventsError.message };
  }
  return { status: 'synced' as const };
}

export async function syncPendingLearningSessions() {
  const results = await Promise.all(loadLearningSessions().map((session) => syncLearningSession(session)));
  return { synced: results.filter((result) => result.status === 'synced').length, total: results.length };
}

export async function hydrateLearningSessionsFromCloud() {
  if (!supabase) return loadLearningSessions();
  const fresh = await getFreshSession();
  if (!fresh.session) return loadLearningSessions();
  const { data: sessions, error } = await supabase.from('learning_sessions').select('*').eq('user_id', fresh.session.user.id).order('client_updated_at', { ascending: false }).limit(250);
  if (error || !sessions?.length) return loadLearningSessions();
  const ids = sessions.map((session) => session.id as string);
  const { data: events } = await supabase.from('learning_events').select('*').in('session_id', ids).order('sequence');
  const bySession = new Map<string, LearningEvent[]>();
  (events || []).forEach((event) => {
    const list = bySession.get(event.session_id as string) || [];
    list.push({ id: event.id, sessionId: event.session_id, sequence: event.sequence, type: event.event_type, conceptKey: event.concept_key, title: event.title, summary: event.summary, occurredAt: event.occurred_at, misconception: event.misconception_category ?? undefined, confidence: event.confidence ?? undefined, payload: event.payload ?? undefined } as LearningEvent);
    bySession.set(event.session_id as string, list);
  });
  return sessions.map((row) => {
    const session: LearningSession = {
      id: row.id,
      conceptKey: row.concept_key,
      conceptAr: row.concept_ar,
      conceptEn: row.concept_en,
      sourceTitle: row.source_title ?? undefined,
      sourceLocation: row.source_location ?? undefined,
      sourceVersion: row.source_version ?? undefined,
      classification: classificationFromDb[row.evidence_classification] || 'needs_review',
      mastery: row.mastery_dimensions,
      status: row.status,
      reviewDueAt: row.review_due_at ?? undefined,
      events: bySession.get(row.id) || [],
      createdAt: row.created_at,
      updatedAt: row.client_updated_at,
    };
    return saveLearningSession(session);
  });
}
