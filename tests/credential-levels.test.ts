import { describe, expect, it } from 'vitest';
import { credentialLevelFromScore, credentialLevelLabel, credentialLevelPolicy } from '../src/lib/credentials';

describe('credential achievement levels', () => {
  it('derives levels deterministically from final-assessment evidence', () => {
    expect(credentialLevelFromScore(70)).toBe('completion');
    expect(credentialLevelFromScore(79.99)).toBe('completion');
    expect(credentialLevelFromScore(80)).toBe('proficiency');
    expect(credentialLevelFromScore(90)).toBe('mastery');
  });

  it('keeps learner-facing labels and evidence policies bilingual', () => {
    expect(credentialLevelLabel('mastery', 'ar')).toBe('إتقان');
    expect(credentialLevelLabel('proficiency', 'en')).toBe('Proficiency');
    expect(credentialLevelPolicy('completion', 'en')).toContain('70%');
  });
});
