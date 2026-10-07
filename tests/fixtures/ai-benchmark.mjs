// Synthetic bilingual regression fixtures. Not learner outcomes or a scientific accuracy score.
const concepts = [
  { subject: 'physics', ar: 'القوة المحصلة والتسارع', en: 'net force and acceleration', arText: 'عند ثبات الكتلة، مضاعفة القوة المحصلة بتضاعف التسارع. مثلًا جسم كتلته 2 كجم تؤثر عليه قوة 6 نيوتن، تسارعه 3 متر لكل ثانية تربيع.', enText: 'At constant mass, doubling the net force doubles acceleration. For example, a 2 kg object under a net force of 6 N accelerates at 3 metres per second squared.' },
  { subject: 'mathematics', ar: 'احتمال حدثين مستقلين', en: 'probability of independent events', arText: 'لو الحدثين مستقلين، احتمال حصولهم مع بعض هو حاصل ضرب الاحتمالين. في رمي عملة مرتين، احتمال ظهور الصورة مرتين هو ربع.', enText: 'For two independent events, the probability that both occur is the product of their probabilities. For two fair coin tosses, two heads have probability one quarter.' },
  { subject: 'biology', ar: 'البناء الضوئي', en: 'photosynthesis', arText: 'النبات بيحوّل طاقة الضوء لطاقة كيميائية أثناء البناء الضوئي. بيستخدم الماء وثاني أكسيد الكربون لتكوين سكريات، وبيُطلق الأكسجين.', enText: 'Plants convert light energy into chemical energy during photosynthesis. They use water and carbon dioxide to produce sugars and release oxygen.' },
  { subject: 'programming', ar: 'شرط توقف الحلقة', en: 'loop termination', arText: 'علشان الحلقة تنتهي، لازم قيمة الشرط تتغير وتوصل لحالة توقف. لو العداد مش بيتحدّث والشرط دايمًا صحيح، الحلقة ممكن تفضل شغالة.', enText: 'A loop terminates when its condition eventually becomes false. If a counter never changes and the condition remains true, the loop may run indefinitely.' },
  { subject: 'statistics', ar: 'الفرق بين المتوسط والوسيط', en: 'mean versus median', arText: 'المتوسط بيتأثر بالقيم المتطرفة، لكن الوسيط هو القيمة اللي في المنتصف بعد ترتيب البيانات. للأرقام 1 و2 و12، الوسيط 2 والمتوسط 5.', enText: 'The mean is sensitive to extreme values, whereas the median is the middle value after sorting. For 1, 2, and 12, the median is 2 and the mean is 5.' },
  { subject: 'entrepreneurship', ar: 'الإيراد والربح', en: 'revenue versus profit', arText: 'الإيراد هو قيمة المبيعات قبل خصم التكاليف. الربح بيتحسب بعد خصم التكاليف المرتبطة بالفترة، فزيادة المبيعات مش دايمًا معناها زيادة الربح.', enText: 'Revenue is sales income before costs are deducted. Profit accounts for costs over a period, so higher sales do not necessarily mean higher profit.' },
];

const variants = [
  ['valid-explanation', (text) => text, true],
  ['invented-reference', (text) => `${text} [Z9]`, false],
  ['portal-is-not-evidence', (text) => `${text} [E1]`, false],
  ['placeholder', () => 'Insert answer here. Lorem ipsum is a placeholder instead of a useful teaching explanation.', false],
  ['empty', () => '', false],
  ['short', () => 'a', false],
  ['duplicate-paragraph', (text) => `${text}\n\n${text}`, false],
  ['real-excerpt-citation', (text) => `${text} [R1]`, true],
  ['unsafe-reference-url', (text) => `${text} [R2]`, false],
  ['local-upload-citation', (text) => `${text} [U1]`, true],
];

export const benchmarkCases = concepts.flatMap((concept) => ['ar', 'en'].flatMap((language) => variants.map(([variant, transform, expectedPass]) => {
  const excerpt = concept[`${language}Text`];
  return {
    id: `${concept.subject}-${language}-${variant}`, subject: concept.subject, language, variant,
    prompt: language === 'ar' ? `اشرح ${concept.ar} بمثال، ووضح الخطأ الشائع.` : `Explain ${concept.en} with an example and a common misconception.`,
    text: transform(excerpt), expectedPass,
    sources: [
      { citationId: 'R1', title: concept[language], excerpt, url: 'https://example.org/evidence', kind: 'topical-reference' },
      { citationId: 'E1', title: 'Registry destination', excerpt: 'An educational portal, not subject matter evidence.', url: 'https://example.org/portal', kind: 'verification-destination' },
      { citationId: 'R2', title: 'Unsafe URL', excerpt, url: 'javascript:alert(1)', kind: 'topical-reference' },
      { citationId: 'U1', title: 'Learner excerpt', excerpt, url: '/knowledge-vault?source=fixture', sourceType: 'uploaded-source' },
    ],
  };
})));

export const rubric = [
  'scientific-accuracy', 'diagnosis', 'level-fit', 'question-quality', 'citation-support',
  'groundedness', 'guessing-awareness', 'calibrated-confidence', 'language', 'application',
];
