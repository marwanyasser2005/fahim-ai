import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import report from '../src/data/evaluationReport.json';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const page = readFileSync(new URL('../src/pages/EvidenceRoom.tsx', import.meta.url), 'utf8');
const evaluator = readFileSync(new URL('../scripts/evaluate-learning-guards.mjs', import.meta.url), 'utf8');
const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
const quiz = readFileSync(new URL('../api/quiz.mjs', import.meta.url), 'utf8');

describe('competition evidence room', () => {
  it('publishes an inspectable, no-login evidence route', () => {
    expect(app).toContain('path="/evidence"');
    expect(app).toContain('<EvidenceRoom language={language} />');
    expect(page).toContain('What works. What is measured.');
    expect(page).toContain('ليست نتيجة لجنة');
  });

  it('keeps product-contract coverage separate from outcome claims', () => {
    expect(report.evaluationKind).toBe('deterministic-contract-coverage');
    expect(report.passed).toBe(report.total);
    expect(report.total).toBeGreaterThanOrEqual(12);
    expect(report.exclusions).toContain('model accuracy');
    expect(report.exclusions).toContain('learning outcome or retention improvement');
    expect(page).toContain('not yet measured with real learners');
    expect(page).toContain('غير مقاس على طلاب حقيقيين بعد');
  });

  it('derives every published guard from repository evidence', () => {
    expect(evaluator).toContain("status: pass ? 'passed' : 'failed'");
    expect(evaluator).toContain("if (passed !== controls.length) process.exitCode = 1");
    expect(evaluator).toContain('writeFile(output');
    expect(workflow).toContain('npm run check');
  });

  it('protects AI quiz generation and grading with a verified session', () => {
    expect(quiz).toContain('requireAuthenticatedUser(request)');
    expect(quiz).toContain('Authentication could not be verified.');
  });
});
