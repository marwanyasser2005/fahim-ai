import { describe, expect, it } from 'vitest';
import { loadLearnerState, saveConceptMastery, normalizeConceptKey } from '../api/_lib/agent/memory.mjs';

/** Minimal chainable fake of the supabase-js client for the calls memory.mjs makes. */
function fakeAdmin(store) {
  return {
    from(table) {
      const state = { table, filters: {} };
      const builder = {
        select() { return builder; },
        eq(col, val) { state.filters[col] = val; return builder; },
        limit() { return builder; },
        lte() { return Promise.resolve({ data: store.review || [], error: null }); },
        maybeSingle() {
          if (table === 'concept_mastery') return Promise.resolve({ data: store.mastery || null, error: null });
          return Promise.resolve({ data: null, error: null });
        },
        upsert(row, options) { store.calls.push({ op: 'upsert', table, row, options }); return Promise.resolve({ error: null }); },
        insert(row) { store.calls.push({ op: 'insert', table, row }); return Promise.resolve({ error: null }); },
        update(row) { store.calls.push({ op: 'update', table, row }); return { eq() { return Promise.resolve({ error: null }); } }; },
      };
      return builder;
    },
  };
}

describe('agent memory', () => {
  it('normalizes concept keys into slugs with a safe fallback', () => {
    expect(normalizeConceptKey('Newton\'s Second Law')).toBe('newton-s-second-law');
    expect(normalizeConceptKey('  ')).toBe('general-concept');
  });

  it('returns a default state when no admin client is configured', async () => {
    const state = await loadLearnerState(null, null, 'قانون نيوتن');
    expect(state.mastery).toBeCloseTo(0.2, 5);
    expect(state.persisted).toBe(false);
    expect(state.dueReviews).toBe(0);
  });

  it('maps persisted mastery and due reviews from the store', async () => {
    const admin = fakeAdmin({
      mastery: { mastery: 0.62, attempts: 4, correct: 3, ability: 0.5, params: {} },
      review: [{ id: 'r1', due_at: new Date().toISOString(), stability: 3.2, difficulty: 0.4, repetitions: 2, last_review_at: new Date().toISOString() }],
      calls: [],
    });
    const state = await loadLearnerState(admin, 'user-1', 'Newton second law');
    expect(state.mastery).toBeCloseTo(0.62, 5);
    expect(state.attempts).toBe(4);
    expect(state.dueReviews).toBe(1);
    expect(state.persisted).toBe(true);
    expect(state.reviewCard).toMatchObject({ stability: 3.2, difficulty: 0.4 });
  });

  it('upserts a clamped, rounded mastery row on the composite key', async () => {
    const store = { calls: [] };
    const admin = fakeAdmin(store);
    const result = await saveConceptMastery(admin, 'user-1', 'Fractions!', { mastery: 1.4, attempts: 3, correct: 2, ability: 0.777, subject: 'math' });
    expect(result.persisted).toBe(true);
    const call = store.calls.find((entry) => entry.op === 'upsert');
    expect(call.table).toBe('concept_mastery');
    expect(call.row.concept_key).toBe('fractions');
    expect(call.row.mastery).toBe(1); // clamped to [0,1]
    expect(call.row.ability).toBe(0.777);
    expect(call.options.onConflict).toBe('user_id,concept_key');
  });

  it('never throws when persistence fails', async () => {
    const throwingAdmin = { from() { throw new Error('db down'); } };
    await expect(saveConceptMastery(throwingAdmin, 'u', 'c', { mastery: 0.5 })).resolves.toEqual({ persisted: false });
    await expect(loadLearnerState(throwingAdmin, 'u', 'c')).resolves.toMatchObject({ persisted: false });
  });
});
