import { supabase } from '@/lib/supabase/client';

/**
 * Durable per-concept mastery the Fahim tutor agent writes to the server-owned
 * `concept_mastery` table. Read back via the owner-scoped RPC so the learner sees the
 * mastery the agent has built for them, persistently and across devices.
 */
export interface ConceptMasteryRow {
  concept_key: string;
  subject: string | null;
  mastery: number;
  attempts: number;
  correct: number;
  ability: number;
  updated_at: string;
}

export async function loadConceptMastery(): Promise<ConceptMasteryRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('my_concept_mastery_v1');
  if (error || !Array.isArray(data)) return [];
  return (data as ConceptMasteryRow[]).map((row) => ({
    concept_key: String(row.concept_key || ''),
    subject: row.subject ?? null,
    mastery: Number(row.mastery) || 0,
    attempts: Number(row.attempts) || 0,
    correct: Number(row.correct) || 0,
    ability: Number(row.ability) || 0,
    updated_at: String(row.updated_at || ''),
  }));
}
