/** Automatic screening, not scientific accuracy certification or human validation. */
export const QUALITY_VERSION = 'fahim-quality-1';

const words = (value) => String(value || '').toLowerCase().normalize('NFKC')
  .replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/[\u064B-\u065F]/g, '')
  .match(/[\p{L}\p{N}]{3,}/gu) || [];

export function inspectCitations(text, sources = []) {
  const registry = new Map(sources.map((source) => [source.citationId, source]));
  const citations = [...String(text || '').matchAll(/\[([A-Z]\d{1,2})\]/g)].map((match) => {
    const source = registry.get(match[1]);
    const context = String(text).slice(Math.max(0, match.index - 320), match.index);
    const evidence = new Set(words(source?.excerpt));
    const overlap = [...new Set(words(context))].filter((word) => evidence.has(word)).length;
    const destinationOnly = source?.kind === 'verification-destination' || source?.sourceType === 'verification-destination' || /^E\d/.test(match[1]);
    let safeUrl = false;
    try { safeUrl = ['https:', 'http:'].includes(new URL(source?.url).protocol); } catch { safeUrl = source?.sourceType === 'uploaded-source' && String(source?.url).startsWith('/knowledge-vault?source='); }
    const status = !source || !safeUrl ? 'invalid' : destinationOnly || evidence.size < 8 ? 'metadata-only' : overlap < 2 ? 'needs-review' : 'candidate-support';
    return { id: match[1], status, overlap };
  });
  return {
    method: 'lexical-screening-not-entailment',
    citations,
    invalidIds: [...new Set(citations.filter((entry) => entry.status === 'invalid').map((entry) => entry.id))],
    candidateCount: citations.filter((entry) => entry.status === 'candidate-support').length,
    reviewCount: citations.filter((entry) => entry.status !== 'candidate-support').length,
  };
}

export function inspectAnswer(text, sources = []) {
  const value = String(text || '').trim();
  const citationCheck = inspectCitations(value, sources);
  const issues = [];
  if (value.length < 60) issues.push('too-short');
  if (/\b(?:lorem ipsum|insert (?:answer|text) here|undefined|\[object Object\])\b/i.test(value)) issues.push('placeholder');
  if (citationCheck.invalidIds.length) issues.push('invented-citation');
  if (citationCheck.citations.some((entry) => entry.status === 'metadata-only')) issues.push('metadata-as-evidence');
  const paragraphs = value.split(/\n{2,}/).map((part) => part.trim()).filter((part) => part.length > 50);
  if (new Set(paragraphs).size < paragraphs.length) issues.push('repeated-paragraph');
  return { version: QUALITY_VERSION, passed: issues.length === 0, issues, citationCheck };
}

export function selectIntervention(state = {}) {
  const category = state.misconception?.category;
  if (Number(state.remediationCount) > 0) return { id: 'guided-practice', instruction: 'Use a simpler worked example, then ask for a similar application. Do not repeat the previous explanation.' };
  if (category === 'unit_confusion' || category === 'formula_misuse') return { id: 'worked-example', instruction: 'Work through a small numerical example, showing units and checking plausibility.' };
  if (category === 'sign_or_direction') return { id: 'contrast', instruction: 'Compare two directions or signs with one concrete example.' };
  if (category === 'definition_gap') return { id: 'concept-bridge', instruction: 'Give a plain definition, the English technical term once, and a counterexample.' };
  return { id: 'causal-example', instruction: 'Explain the causal link with a familiar example, then contrast the likely wrong mental model.' };
}
