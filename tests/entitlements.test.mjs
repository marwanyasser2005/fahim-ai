import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { consumeAiSession, refundAiSession, unlimitedAccessEnabled } from '../api/_lib/entitlements.mjs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

afterEach(() => { delete process.env.FAHIM_UNLIMITED_ACCESS; });

describe('AI entitlement gate — launch (unlimited) policy', () => {
  it('is unlimited by default and re-meterable via env', () => {
    expect(unlimitedAccessEnabled()).toBe(true);
    process.env.FAHIM_UNLIMITED_ACCESS = 'false';
    expect(unlimitedAccessEnabled()).toBe(false);
    process.env.FAHIM_UNLIMITED_ACCESS = 'true';
    expect(unlimitedAccessEnabled()).toBe(true);
  });

  it('allows without metering (and without touching the DB) when unlimited', async () => {
    const rpc = vi.fn();
    const gate = await consumeAiSession({ rpc });
    expect(gate).toEqual({ allowed: true, metered: false });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('meters through consume_entitlement_v1 when the launch policy is disabled', async () => {
    process.env.FAHIM_UNLIMITED_ACCESS = 'false';
    const allow = { rpc: vi.fn().mockResolvedValue({ data: true, error: null }) };
    expect(await consumeAiSession(allow)).toEqual({ allowed: true, metered: true });
    expect(allow.rpc).toHaveBeenCalledWith('consume_entitlement_v1', { target_key: 'ai_sessions_month', amount: 1 });

    const exhausted = { rpc: vi.fn().mockResolvedValue({ data: false, error: null }) };
    expect(await consumeAiSession(exhausted)).toEqual({ allowed: false, metered: true });

    const broken = { rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'x' } }) };
    expect(await consumeAiSession(broken)).toEqual({ allowed: false, metered: false, configError: true });
  });

  it('only refunds a metered session', async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    await refundAiSession({ rpc }, 'user-1', false);
    expect(rpc).not.toHaveBeenCalled();
    await refundAiSession({ rpc }, 'user-1', true);
    expect(rpc).toHaveBeenCalledWith('refund_entitlement_v1', { target_user: 'user-1', target_key: 'ai_sessions_month', amount: 1 });
  });
});

describe('handlers route AI access through the shared gate', () => {
  it('chat, quiz, and the agent all consume via the shared entitlement helper', () => {
    for (const file of ['../api/chat.mjs', '../api/quiz.mjs', '../api/_lib/agent/handler.mjs']) {
      const src = read(file);
      expect(src).toContain('consumeAiSession');
      expect(src).not.toContain("rpc('consume_entitlement_v1'");
    }
  });

  it('the launch migration makes access unlimited and top-tier', () => {
    const sql = read('../supabase/migrations/20260927030000_unlimited_pro_access.sql');
    expect(sql).toContain('create or replace function public.consume_entitlement_v1');
    expect(sql).toContain('select auth.uid() is not null');
    expect(sql).toContain("'plan_code', 'plus_annual'");
    expect(sql).toContain("'status', 'active'");
  });
});
