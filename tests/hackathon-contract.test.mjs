import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const showcase = readFileSync(new URL('../src/pages/Showcase.tsx', import.meta.url), 'utf8');
const scenario = readFileSync(new URL('../src/data/showcaseScenario.ts', import.meta.url), 'utf8');
const migration = readFileSync(new URL('../supabase/migrations/20260825000000_learning_event_spine.sql', import.meta.url), 'utf8');
const ai = readFileSync(new URL('../api/chat.mjs', import.meta.url), 'utf8');

describe('hackathon competition contract', () => {
  it('keeps a public deterministic showcase and a protected passport', () => {
    expect(app).toContain('path="/showcase"');
    expect(app).toContain('path="/demo"');
    expect(app).toMatch(/path="\/passport".+ProtectedRoute/);
    expect(showcase).toContain('بيانات توضيحية');
    expect(showcase).toContain('illustrative data');
  });

  it('shows the complete verified learning loop', () => {
    for (const term of ['diagnostic_started', 'attempt_submitted', 'misconception_detected', 'intervention_completed', 'retry_submitted', 'evidence_created', 'review_scheduled']) expect(scenario).toContain(term);
    expect(scenario).toContain('not real student data');
    expect(showcase).toContain('Completion without fake accreditation');
    expect(showcase).toContain('Academic accreditation appears only after a documented partnership');
  });

  it('stores ordered owner-scoped events and protects teacher insight', () => {
    expect(migration).toContain('create table if not exists public.learning_sessions');
    expect(migration).toContain('create table if not exists public.learning_events');
    expect(migration).toContain('user_id = auth.uid()');
    expect(migration).toContain("having count(distinct event.user_id) >= 3");
    expect(migration).toContain('revoke all on public.learning_sessions, public.learning_events from anon');
  });

  it('supports teach-back and retrieval modes without exposing providers', () => {
    expect(ai).toContain('teach:');
    expect(ai).toContain('recall:');
    expect(ai).toContain('Never claim long-term retention from a single answer');
    expect(ai).toContain('Never name, guess, compare, or reveal an underlying model');
  });
});
