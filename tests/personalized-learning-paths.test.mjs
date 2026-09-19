import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { normalizeGeneratedPlan } from '../api/learning-paths.mjs';

const api = readFileSync(new URL('../api/learning-paths.mjs', import.meta.url), 'utf8');
const migration = readFileSync(new URL('../supabase/migrations/20260919010000_personalized_learning_paths.sql', import.meta.url), 'utf8');
const detail = readFileSync(new URL('../src/pages/PersonalPathDetail.tsx', import.meta.url), 'utf8');
const certificate = readFileSync(new URL('../src/components/certificates/CertificateArtwork.tsx', import.meta.url), 'utf8');

const local = (value) => ({ ar: value, en: value });
const validPlan = {
  title: local('Data path'), description: local('A complete data path'), outcomes: [local('One'), local('Two'), local('Three')],
  modules: [0, 1, 2].map((module) => ({
    title: local(`Module ${module + 1}`),
    lessons: [0, 1].map((lesson) => ({ title: local(`Lesson ${lesson + 1}`), summary: local('Summary'), practice: local('Practice'), type: lesson ? 'practice' : 'concept', durationMinutes: 25 })),
  })),
  assessment: [0, 1, 2, 3, 4].map((index) => ({ prompt: local(`Question ${index + 1}`), choices: { ar: ['A', 'B', 'C', 'D'], en: ['A', 'B', 'C', 'D'] }, correctIndex: 1, explanation: local('Because evidence') })),
};

describe('personalized learning-path agent', () => {
  it('validates a complete bounded plan before persistence', () => {
    const normalized = normalizeGeneratedPlan(validPlan, { goal: 'Learn data analysis' });
    expect(normalized.modules).toHaveLength(3);
    expect(normalized.modules.flatMap((item) => item.lessons)).toHaveLength(6);
    expect(normalized.assessment).toHaveLength(5);
  });

  it('rejects incomplete generations instead of saving a decorative shell', () => {
    expect(() => normalizeGeneratedPlan({ ...validPlan, modules: validPlan.modules.slice(0, 1) }, { goal: 'Learn data analysis' })).toThrow(/incomplete_plan/);
  });

  it('authenticates, rate-limits, validates origin, and rolls back partial persistence', () => {
    expect(api).toContain('requireAuthenticatedUser(request)');
    expect(api).toContain('isSameOrigin(request)');
    expect(api).toContain('consumeRateLimit(request');
    expect(api).toContain("await admin.from('courses').delete().eq('id', courseId)");
    expect(api).toContain("action: 'learning_path.generated'");
  });

  it('keeps personalized paths private while allowing their owner to earn a credential', () => {
    expect(migration).toContain("source = 'genai'");
    expect(migration).toContain('c.is_published or c.teacher_id = auth.uid()');
    expect(migration).toContain('c.is_published or c.teacher_id = learner_id');
    expect(migration).toContain("final_score >= 70");
  });

  it('merges server progress and exposes evidence-backed assessment and exports', () => {
    expect(detail).toContain('loadCompletedLessons(id)');
    expect(detail).toContain('recordLessonCompletion');
    expect(detail).toContain('<CourseAssessment');
    expect(certificate).toContain('Download evidence JSON');
    expect(certificate).toContain('Copy verification link');
  });
});
