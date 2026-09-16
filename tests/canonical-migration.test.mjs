import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationsDirectory = resolve('supabase/migrations');
const canonicalPath = resolve(migrationsDirectory, '20260810000000_canonical_product_foundation.sql');
const migration = readFileSync(canonicalPath, 'utf8');
const learningOsMigration = readFileSync(resolve(migrationsDirectory, '20260807000000_learning_os.sql'), 'utf8');
const operationalMigration = readFileSync(resolve(migrationsDirectory, '20260810010000_operational_hardening.sql'), 'utf8');
const stripeMigration = readFileSync(resolve(migrationsDirectory, '20260810020000_stripe_billing.sql'), 'utf8');
const onboardingRepairMigration = readFileSync(resolve(migrationsDirectory, '20260814010000_onboarding_rpc_repair.sql'), 'utf8');
const conversationSync = readFileSync(resolve('src/lib/supabase/conversationSync.ts'), 'utf8');

describe('canonical FAHIM product migration', () => {
  it('quarantines the overlapping owner_id learning model', () => {
    const active = readdirSync(migrationsDirectory);
    expect(active).not.toContain('20260807000100_fahim_learning_os.sql');
    expect(existsSync(resolve('supabase/legacy_migrations/20260807000100_fahim_learning_os.sql'))).toBe(true);
  });

  it('starts the account trial once for exactly thirty days', () => {
    expect(migration).toContain("end_at := now() + interval '30 days'");
    expect(migration).toContain('trial_started_at = coalesce(public.subscriptions.trial_started_at, start_at)');
    expect(migration).toContain('complete_onboarding_v1');
  });

  it('repairs the onboarding RPC, serializes trial creation, and refreshes the API schema', () => {
    expect(onboardingRepairMigration).toContain('create or replace function public.complete_onboarding_v1(profile_input jsonb)');
    expect(onboardingRepairMigration).toContain('for update');
    expect(onboardingRepairMigration).toContain("start_at + interval '30 days'");
    expect(onboardingRepairMigration).toContain("notify pgrst, 'reload schema'");
    expect(onboardingRepairMigration).toContain('grant execute on function public.complete_onboarding_v1(jsonb) to authenticated');
  });

  it('upgrades the legacy student projects table without dropping learner work', () => {
    expect(migration).toContain('add column if not exists user_id uuid');
    expect(migration).toContain('set user_id = project.student_id');
    expect(migration).toContain("when 'approved' then 'complete'");
    expect(migration).toContain('projects_user_id_fkey');
    expect(migration).not.toMatch(/drop table(?: if exists)? public\.projects/i);
  });

  it('backfills profiles and roles for accounts that predate the canonical trigger', () => {
    expect(learningOsMigration).toContain('from auth.users account');
    expect(learningOsMigration).toContain("where role_record.key = 'student'");
    expect(learningOsMigration).toContain('on conflict (id) do nothing');
  });

  it('has RLS and owner policies for billing, evidence, review, and organizations', () => {
    for (const table of ['payment_orders', 'product_entitlements', 'learning_evidence', 'review_items', 'organizations', 'submissions', 'ai_generations']) {
      expect(migration).toContain(`alter table public.${table} enable row level security`);
    }
    expect(migration).toContain('payment_orders_owner_read');
    expect(migration).toContain('learning_evidence_owner_read');
    expect(migration).toContain('submissions_owner_or_teacher_read');
  });

  it('keeps every API registry seed row aligned with the thirteen-column contract', () => {
    const registryInsert = migration.match(/insert into public\.api_registry[\s\S]*?on conflict \(key\)/)?.[0] ?? '';
    const seedRows = [...registryInsert.matchAll(/^\s*\('(?:[^']|'')*'[\s\S]*?\)(?:,|\n)/gm)].map((match) => match[0]);
    expect(seedRows.length).toBe(4);
    for (const row of seedRows) {
      expect([...row.matchAll(/'(?:[^']|'')*'/g)]).toHaveLength(13);
    }
  });

  it('does not let authenticated clients activate subscriptions or write evidence', () => {
    expect(migration).not.toMatch(/grant\s+(insert|update|all)[^;]+public\.payment_orders\s+to\s+authenticated/i);
    expect(migration).not.toMatch(/grant\s+(insert|update|all)[^;]+public\.learning_evidence\s+to\s+authenticated/i);
    expect(migration).toContain('grant execute on function public.refund_entitlement_v1(uuid, text, integer) to service_role');
  });

  it('uses the canonical conversation ownership and message model in the client', () => {
    expect(conversationSync).toContain(".from('chat_history')");
    expect(conversationSync).toContain(".eq('user_id', ownerId)");
    expect(conversationSync).toContain('learner_level');
    expect(conversationSync).not.toContain(".from('chat_messages')");
    expect(conversationSync).not.toContain(".eq('owner_id'");
  });

  it('uses an atomic service-only distributed rate limit', () => {
    expect(operationalMigration).toContain('create table if not exists public.api_rate_limits');
    expect(operationalMigration).toContain('on conflict (key_hash) do update');
    expect(operationalMigration).toContain('alter table public.api_rate_limits enable row level security');
    expect(operationalMigration).toContain('revoke all on function public.consume_api_rate_limit(text, text, integer, integer) from public, anon, authenticated');
    expect(operationalMigration).toContain('grant execute on function public.consume_api_rate_limit(text, text, integer, integer) to service_role');
  });

  it('activates Stripe subscriptions through a service-only database transaction', () => {
    expect(stripeMigration).toContain('create or replace function public.activate_stripe_subscription_v1');
    expect(stripeMigration).toContain("provider = 'stripe'");
    expect(stripeMigration).toContain('on conflict (user_id) do update set');
    expect(stripeMigration).toContain('to service_role');
  });
});
