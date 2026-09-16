import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const migration = readFileSync(new URL('../supabase/migrations/20260830010000_competition_evidence_teacher_cockpit.sql', import.meta.url), 'utf8');
const cockpit = readFileSync(new URL('../src/pages/TeacherCockpit.tsx', import.meta.url), 'utf8');
const classSignal = readFileSync(new URL('../src/components/teacher/ClassSignalCard.tsx', import.meta.url), 'utf8');
const pilotEvidence = readFileSync(new URL('../src/components/teacher/PilotEvidenceCard.tsx', import.meta.url), 'utf8');
const client = readFileSync(new URL('../src/lib/teacherCockpit.ts', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

describe('teacher cockpit and defensible impact contract', () => {
  it('stores real pilot protocols and phase measurements without seeded outcomes', () => {
    expect(migration).toContain('create table if not exists public.impact_pilots');
    expect(migration).toContain('create table if not exists public.impact_measurements');
    expect(migration).toContain('minimum_sample_size between 3 and 500');
    expect(migration).not.toMatch(/insert\s+into\s+public\.impact_measurements/i);
    expect(cockpit).toContain('no synthetic outcomes');
  });

  it('suppresses class patterns and pilot averages below the privacy gate', () => {
    expect(migration).toContain('having count(distinct event.user_id) >= 3');
    expect(migration).toContain("'suppressed', participant_count < selected_pilot.minimum_sample_size");
    expect(migration).toContain("'isReportable', (select count(*) from paired) >= selected_pilot.minimum_sample_size");
    expect(cockpit).toContain('يحجب المتوسطات الصغيرة');
  });

  it('uses secure one-time join codes and server-side membership boundaries', () => {
    expect(migration).toContain("extensions.digest(lower(join_code), 'sha256')");
    expect(migration).toContain("extensions.digest(lower(trim(p_join_code)), 'sha256')");
    expect(migration).toContain('create table if not exists public.class_join_attempts');
    expect(migration).toContain("interval '10 minutes'");
    expect(migration).toContain('revoke all on public.class_join_attempts from public, anon, authenticated');
    expect(migration).toContain('revoke all on function public.create_class_v1');
    expect(migration).toContain('grant execute on function public.join_class_v1(text) to authenticated');
    expect(client).toContain("client().rpc('create_class_v1'");
    expect(client).toContain("client().rpc('join_class_v1'");
  });

  it('keeps the teacher cockpit behind authentication', () => {
    expect(app).toMatch(/path="\/teacher".+ProtectedRoute/);
    expect(classSignal).toContain('MISCONCEPTION ATLAS');
    expect(pilotEvidence).toContain('REPORTING GATE');
  });
});
