import { expect, it } from 'vitest';
import { saveAgentSession } from '../api/_lib/agent/memory.mjs';

it('checkpoint compares the expected version and increments in the same update', async () => {
  const conditions = []; let stored;
  const chain = { update(row) { stored = row; return this; }, eq(key, value) { conditions.push([key, value]); return this; }, select() { return this; }, async maybeSingle() { return { data: { id: 'session', turn_count: 3 }, error: null }; } };
  const result = await saveAgentSession({ from: () => chain }, 'owner', 'session', { state: { attempts: 1 }, expectedTurnCount: 2 });
  expect(result.persisted).toBe(true); expect(stored.turn_count).toBe(3);
  expect(conditions).toContainEqual(['turn_count', 2]); expect(conditions).toContainEqual(['user_id', 'owner']);
});

it('does not claim persistence when the version has changed or the row is absent', async () => {
  const chain = { update() { return this; }, eq() { return this; }, select() { return this; }, async maybeSingle() { return { data: null, error: null }; } };
  expect(await saveAgentSession({ from: () => chain }, 'owner', 'session', { expectedTurnCount: 0 })).toEqual({ persisted: false, conflict: true });
});
