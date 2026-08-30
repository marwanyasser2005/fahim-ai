export type CredentialLevel = 'completion' | 'proficiency' | 'mastery';

export function credentialLevelFromScore(score?: number | null): CredentialLevel {
  if (typeof score !== 'number' || !Number.isFinite(score) || score < 80) return 'completion';
  if (score < 90) return 'proficiency';
  return 'mastery';
}

export function credentialLevelLabel(level: CredentialLevel, language: 'ar' | 'en') {
  const labels = {
    ar: { completion: 'إتمام', proficiency: 'تمكّن', mastery: 'إتقان' },
    en: { completion: 'Completion', proficiency: 'Proficiency', mastery: 'Mastery' },
  } as const;
  return labels[language][level];
}

export function credentialLevelPolicy(level: CredentialLevel, language: 'ar' | 'en') {
  const copy = {
    ar: {
      completion: 'أكمل جميع الدروس واجتاز التقييم النهائي بنسبة 70% على الأقل.',
      proficiency: 'أكمل جميع الدروس وحقق 80% على الأقل في التقييم النهائي.',
      mastery: 'أكمل جميع الدروس وحقق 90% على الأقل في التقييم النهائي.',
    },
    en: {
      completion: 'Complete every lesson and score at least 70% in the final assessment.',
      proficiency: 'Complete every lesson and score at least 80% in the final assessment.',
      mastery: 'Complete every lesson and score at least 90% in the final assessment.',
    },
  } as const;
  return copy[language][level];
}
