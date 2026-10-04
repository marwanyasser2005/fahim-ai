import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const agentMemory = read('../supabase/migrations/20260927000000_agent_memory.sql');
const smeImpact = read('../supabase/migrations/20260927010000_sme_impact.sql');
const aiEntry = read('../api/ai.mjs');
const vercel = read('../vercel.json');
const app = read('../src/App.tsx');
const handler = read('../api/_lib/agent/handler.mjs');
const cockpitClient = read('../src/lib/teacherCockpit.ts');
const adminMigration = read('../supabase/migrations/20260927020000_admin_agent_oversight.sql');
const adminLib = read('../src/lib/adminAgent.ts');
const adminPage = read('../src/pages/Admin.tsx');
const sessionIntegrity = read('../supabase/migrations/20261002185911_agent_session_integrity.sql');
const orchestrator = read('../api/_lib/agent/orchestrator.mjs');
const tools = read('../api/_lib/agent/tools.mjs');
const agentClient = read('../src/lib/agentClient.ts');
const agentPage = read('../src/pages/AgentStudio.tsx');

describe('durable agent memory migration', () => {
  it('creates a server-owned concept_mastery table with owner RLS and a reader RPC', () => {
    expect(agentMemory).toContain('create table if not exists public.concept_mastery');
    expect(agentMemory).toContain('unique (user_id, concept_key)');
    expect(agentMemory).toContain('using (user_id = auth.uid())');
    expect(agentMemory).toContain('create or replace function public.my_concept_mastery_v1()');
    expect(agentMemory).not.toMatch(/insert\s+into\s+public\.concept_mastery/i);
  });

  it('completes the FSRS state on review_items and allows the agent generation task', () => {
    expect(agentMemory).toContain('add column if not exists stability');
    expect(agentMemory).toContain('add column if not exists difficulty');
    expect(agentMemory).toContain('add column if not exists last_review_at');
    expect(agentMemory).toMatch(/task_type in \([^)]*'agent'/);
  });
});

describe('SME business-impact migration', () => {
  it('stores editable centre assumptions behind org membership', () => {
    expect(smeImpact).toContain('create table if not exists public.sme_impact_assumptions');
    expect(smeImpact).toContain("public.is_org_member(org_id, array['owner','admin','teacher'])");
  });

  it('computes a transparent projection from real activity and never seeds outcomes', () => {
    expect(smeImpact).toContain('create or replace function public.sme_impact_summary_v1(p_org_id uuid)');
    expect(smeImpact).toContain('hours_saved :=');
    expect(smeImpact).toContain('cost_saved :=');
    expect(smeImpact).toContain('revenue_enabled :=');
    expect(smeImpact).toContain("g.task_type = 'agent'");
    expect(smeImpact).toContain('Not a measured financial outcome.');
    expect(smeImpact).not.toMatch(/insert\s+into\s+public\.sme_impact_assumptions[^;]*values/i);
  });
});

describe('agent endpoint wiring (zero new Vercel functions)', () => {
  it('routes /api/agent through the existing /api/ai function', () => {
    expect(aiEntry).toContain("if (route === 'agent') return agentHandler(request, response)");
    expect(vercel).toContain('"/api/agent"');
    expect(vercel).toContain('/api/ai?route=agent');
  });

  it('keeps checkpoints server-authoritative and never trusts browser prior state', () => {
    expect(handler).toContain('loadAgentSession');
    expect(handler).toContain('saveAgentSession');
    expect(handler).not.toContain('body.priorState');
    expect(agentClient).toContain('sessionId?: string | null');
    expect(agentClient).not.toContain('priorState');
  });

  it('keeps the agent authenticated, same-origin, and metered like chat', () => {
    expect(handler).toContain('requireAuthenticatedUser');
    expect(handler).toContain('isSameOrigin');
    expect(handler).toContain('consumeAiSession');
    expect(handler).toContain('refundAiSession');
  });

  it('exposes the Agent Studio behind ProtectedRoute and the impact RPC in the client', () => {
    expect(app).toMatch(/path="\/agent".+ProtectedRoute/);
    expect(cockpitClient).toContain("client().rpc('sme_impact_summary_v1'");
  });
});

describe('agent session integrity and accountable reasoning', () => {
  it('stores opaque checkpoints behind service-role access only', () => {
    expect(sessionIntegrity).toContain('create table if not exists public.agent_sessions');
    expect(sessionIntegrity).toContain('alter table public.agent_sessions enable row level security');
    expect(sessionIntegrity).toContain('revoke all on public.agent_sessions from anon, authenticated');
    expect(sessionIntegrity).toContain("security invoker");
    expect(sessionIntegrity).toContain("set search_path = ''");
  });

  it('uses a bounded policy, explanation assessment, and public reason codes without chain-of-thought', () => {
    expect(orchestrator).toContain('selectPolicyAction');
    expect(orchestrator).toContain("tool: 'assess_explanation'");
    expect(orchestrator).toContain('reasonCode');
    expect(orchestrator).not.toContain('decision.thought');
    expect(agentClient).not.toContain('thought?:');
    expect(agentPage).not.toContain('entry.thought');
    expect(tools).toContain("name: 'assess_explanation'");
  });

  it('keeps encrypted answer material out of public stream results', () => {
    expect(orchestrator).toContain("!['token', 'correctAnswer'].includes(key)");
    expect(orchestrator).toContain('Public state never contains the encrypted answer token');
    expect(agentClient).not.toContain('itemToken?:');
  });
});

describe('admin agent oversight', () => {
  it('gates the overview RPC by the admin role and returns aggregates only', () => {
    expect(adminMigration).toContain('create or replace function public.admin_agent_overview_v1()');
    expect(adminMigration).toContain("public.has_role('admin')");
    expect(adminMigration).toContain('security definer');
    // Privacy: it must never select learner prompt/answer/result column content.
    expect(adminMigration).not.toMatch(/prompt_text|result_text/);
    expect(adminMigration).toContain("grant execute on function public.admin_agent_overview_v1() to authenticated");
  });

  it('wires the admin oversight tab and client loader', () => {
    expect(adminLib).toContain("supabase.rpc('admin_agent_overview_v1')");
    expect(adminPage).toContain('loadAdminAgentOverview');
    expect(adminPage).toContain('AgentOversight');
    expect(adminPage).toMatch(/key:\s*"agent"/);
  });
});
