import { supabase } from '@/lib/supabase/client';

/**
 * Admin-only, privacy-safe platform overview of the Fahim tutor agent.
 * Backed by the SECURITY DEFINER RPC `admin_agent_overview_v1` (guarded by has_role('admin')),
 * which returns aggregates and run metadata only — never a learner's private content.
 */
export interface AdminAgentTotals {
  agentSessions: number;
  agentSessions7d: number;
  agentLearners: number;
  conceptsTracked: number;
  learnersWithMastery: number;
  reviewsScheduled: number;
  reviewsDue: number;
  avgMastery: number;
  masteredConcepts: number;
  smeOrganizations: number;
}
export interface MasteryBand { ord: number; band: string; count: number; }
export interface TopConcept { conceptKey: string; learners: number; avgMastery: number; }
export interface AgentRun { id: string; status: string; model: string; createdAt: string; tokens: number; }
export interface AdminAgentOverview {
  generatedAt: string;
  totals: AdminAgentTotals;
  masteryBands: MasteryBand[];
  topConcepts: TopConcept[];
  recentRuns: AgentRun[];
}

export async function loadAdminAgentOverview(): Promise<AdminAgentOverview> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.rpc('admin_agent_overview_v1');
  if (error) throw new Error(error.message);
  const payload = (data || {}) as Partial<AdminAgentOverview>;
  return {
    generatedAt: payload.generatedAt || new Date().toISOString(),
    totals: {
      agentSessions: 0, agentSessions7d: 0, agentLearners: 0, conceptsTracked: 0,
      learnersWithMastery: 0, reviewsScheduled: 0, reviewsDue: 0, avgMastery: 0,
      masteredConcepts: 0, smeOrganizations: 0, ...(payload.totals || {}),
    },
    masteryBands: Array.isArray(payload.masteryBands) ? payload.masteryBands : [],
    topConcepts: Array.isArray(payload.topConcepts) ? payload.topConcepts : [],
    recentRuns: Array.isArray(payload.recentRuns) ? payload.recentRuns : [],
  };
}
