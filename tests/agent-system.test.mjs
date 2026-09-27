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

  it('keeps the agent authenticated, same-origin, and metered like chat', () => {
    expect(handler).toContain('requireAuthenticatedUser');
    expect(handler).toContain('isSameOrigin');
    expect(handler).toContain("consume_entitlement_v1");
    expect(handler).toContain("refund_entitlement_v1");
  });

  it('exposes the Agent Studio behind ProtectedRoute and the impact RPC in the client', () => {
    expect(app).toMatch(/path="\/agent".+ProtectedRoute/);
    expect(cockpitClient).toContain("client().rpc('sme_impact_summary_v1'");
  });
});
