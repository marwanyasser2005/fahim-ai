import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const dashboard = readFileSync(new URL('../src/pages/Dashboard.tsx', import.meta.url), 'utf8');
const quiz = readFileSync(new URL('../src/pages/QuizLab.tsx', import.meta.url), 'utf8');
const navbar = readFileSync(new URL('../src/components/Navbar.tsx', import.meta.url), 'utf8');
const dock = readFileSync(new URL('../src/components/MobileDock.tsx', import.meta.url), 'utf8');

describe('competition learning experience', () => {
  it('makes assessment—not chat or gamification—the primary signed-in action', () => {
    expect(navbar).toContain('"/quiz-lab"');
    expect(dock).toContain("to: '/quiz-lab'");
    expect(dock).toContain('primary: true');
    expect(dock).not.toContain("to: '/ask-fahim', ar: 'اسأل'");
  });

  it('centres the dashboard on evidence, misconceptions, and retention', () => {
    expect(dashboard).toContain('LearningEvidencePanel');
    expect(dashboard).toContain('MisconceptionMap');
    expect(dashboard).toContain('stats.dueReviews');
    expect(dashboard).not.toMatch(/\bTrophy\b|\bFlame\b|\bxp\b/i);
  });

  it('requires learner reasoning before server grading', () => {
    expect(quiz).toContain('reasoning.trim().length < 8');
    expect(quiz).toContain('payload: { reasonings:');
    expect(quiz).toContain('Reviewable diagnosis');
  });

  it('does not render the correct answer after an incorrect response', () => {
    expect(quiz).not.toContain('{result.correctAnswer}');
    expect(quiz).toContain('result?.correct && result.correctIndex');
    expect(quiz).toContain('Post-intervention retry');
  });
});
