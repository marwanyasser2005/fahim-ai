import verifiedSources from '../../src/data/verifiedSources.json' with { type: 'json' };

const ARABIC_DIACRITICS = /[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/g;
const SUBJECT_ALIASES = {
  arabic: ['عربي', 'العربية', 'نحو', 'بلاغة', 'أدب'],
  english: ['انجليزي', 'إنجليزي', 'english', 'grammar'],
  mathematics: ['رياضيات', 'رياضة', 'جبر', 'هندسة', 'تفاضل', 'تكامل', 'احصاء', 'إحصاء', 'math', 'algebra', 'calculus'],
  science: ['علوم', 'science'],
  physics: ['فيزياء', 'physics'],
  chemistry: ['كيمياء', 'chemistry'],
  biology: ['أحياء', 'احياء', 'biology'],
  history: ['تاريخ', 'history'],
  geography: ['جغرافيا', 'geography'],
  programming: ['برمجة', 'خوارزمية', 'كود', 'programming', 'coding', 'software'],
  'artificial-intelligence': ['ذكاء اصطناعي', 'تعلم آلي', 'تعلم عميق', 'ai', 'machine learning', 'deep learning'],
  cybersecurity: ['أمن سيبراني', 'امن سيبراني', 'cybersecurity', 'security'],
  'data-science': ['علم البيانات', 'تحليل البيانات', 'data science', 'data analysis'],
};

export function normalizeSearchText(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(ARABIC_DIACRITICS, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function inferSubject(value = '') {
  const normalized = normalizeSearchText(value);
  return Object.entries(SUBJECT_ALIASES).find(([, aliases]) =>
    aliases.some((alias) => normalized.includes(normalizeSearchText(alias))),
  )?.[0] || '';
}

function inferStage(value = '') {
  const normalized = normalizeSearchText(value);
  if (/ابتدا|primary|grade [1-6]/.test(normalized)) return 'primary';
  if (/اعداد|preparatory|middle/.test(normalized)) return 'preparatory';
  if (/ثانو|secondary|high school/.test(normalized)) return 'secondary';
  if (/جامع|university|college/.test(normalized)) return 'university';
  if (/مهني|وظيف|professional|career/.test(normalized)) return 'professional';
  return '';
}

export function rankVerifiedSources({ question = '', subject = '', grade = '', language = 'ar', limit = 4 } = {}) {
  const searchText = normalizeSearchText(`${question} ${subject} ${grade}`);
  const tokens = searchText.split(' ').filter((token) => token.length > 2);
  const inferredSubject = inferSubject(`${question} ${subject}`);
  const stage = inferStage(grade);

  return verifiedSources
    .map((source) => {
      const localized = `${source.title[language] || source.title.ar} ${source.description[language] || source.description.ar} ${source.owner[language] || source.owner.ar}`;
      const haystack = normalizeSearchText(`${localized} ${source.keywords.join(' ')}`);
      let score = source.authority === 'official' ? 6 : source.authority === 'institutional' ? 4 : 2;
      score += tokens.reduce((total, token) => total + (haystack.includes(token) ? 2 : 0), 0);
      if (inferredSubject && (source.subjects.includes(inferredSubject) || source.subjects.includes('all'))) score += 8;
      if (stage && source.stages.includes(stage)) score += 5;
      if (!inferredSubject && source.subjects.includes('all')) score += 2;
      return { ...source, score };
    })
    .sort((a, b) => b.score - a.score || a.title[language].localeCompare(b.title[language]))
    .slice(0, Math.max(1, Math.min(8, Number(limit) || 4)))
    .map(({ score: _score, ...source }, index) => ({
      ...source,
      citationId: `E${index + 1}`,
    }));
}

export { verifiedSources };
