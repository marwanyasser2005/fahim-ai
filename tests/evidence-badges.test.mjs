import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const migration = read('supabase/migrations/20260829010000_evidence_badges.sql');

describe('evidence-backed badge trail', () => {
  it('defines nine ordered stages before the completion credential', () => {
    for (const key of ['starting_compass', 'brave_attempt', 'gap_hunter', 'understanding_engineer', 'smarter_return', 'evidence_builder', 'memory_keeper', 'connection_maker', 'path_finisher']) {
      expect(migration).toContain(`'${key}'`);
    }
    expect(migration).toContain("criteria_kind in ('learning_event','course_completion')");
    expect(migration).toContain("'path_finisher', 9");
  });

  it('awards only from observable events or full published-path completion', () => {
    expect(migration).toContain('event.user_id = target_user');
    expect(migration).toContain('observed.event_count >= definition.criteria_threshold');
    expect(migration).toContain('where c.is_published = true');
    expect(migration).toContain('count(distinct lesson.id) = count(distinct case when progress.status');
    expect(migration).not.toMatch(/insert into public\.user_badges[^;]+select[^;]+auth\.users/is);
  });

  it('prevents clients from granting or editing their own badges', () => {
    expect(migration).toContain('alter table public.user_badges enable row level security');
    expect(migration).toContain('for select to authenticated using (user_id = auth.uid())');
    expect(migration).toContain('grant select on public.user_badges to authenticated');
    expect(migration).not.toMatch(/grant\s+(insert|update|delete|all)[^;]+public\.user_badges\s+to\s+authenticated/i);
    expect(migration).toContain('revoke all on function public.refresh_badges_for_user_v1(uuid) from public, anon, authenticated');
  });

  it('publishes a profile and dashboard trail with accessible earned and locked states', () => {
    const trail = read('src/components/badges/BadgeTrail.tsx');
    const emblem = read('src/components/badges/BadgeEmblem.tsx');
    const profile = read('src/pages/Profile.tsx');
    const dashboard = read('src/pages/Dashboard.tsx');
    const center = read('src/pages/CertificateCenter.tsx');
    expect(trail).toContain('role="progressbar"');
    expect(trail).toContain('LockKeyhole');
    expect(emblem).toContain('role="img"');
    expect(profile).toContain('badgeProgress.certificateCount');
    expect(dashboard).toContain('compact');
    expect(center).toContain('الشارات قبل الشهادة');
  });
});
