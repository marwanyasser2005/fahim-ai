/** Bounded learner-provided excerpts. Content is untrusted, never source certification. */
export function normalizeLearnerSources(raw, language = 'ar') {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 6).filter(item => item && typeof item === 'object').map((item, index) => ({
    citationId: `U${index + 1}`,
    title: String(item.title || `Learner source ${index + 1}`).replace(/<[^>]+>/g, ' ').slice(0, 160),
    excerpt: String(item.text || '').replace(/<[^>]+>/g, ' ').trim().slice(0, 1200),
    description: language === 'ar' ? 'مقطع اختاره المتعلّم من ملفه؛ مش مصدر متحقق منه مستقلًا' : 'Learner-selected file excerpt; not independently verified',
    url: `/knowledge-vault?source=${encodeURIComponent(String(item.id || 'local').slice(0, 80))}`,
    authority: 'learner-provided', sourceType: 'uploaded-source', kind: 'uploaded-source', verifiedAt: null,
  })).filter(item => item.excerpt.length >= 60);
}
