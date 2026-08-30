import type { LearningEvent, LearningSession } from '@/lib/learningEvidence';

const at = (minute: number) => new Date(Date.UTC(2026, 7, 25, 9, minute)).toISOString();

const events: LearningEvent[] = [
  { id: 'demo-diagnostic', sessionId: 'demo-newton', sequence: 1, type: 'diagnostic_started', conceptKey: 'physics.newton-second-law', title: 'سؤال تشخيصي', summary: 'ما الذي يتغير عندما تؤثر قوة أكبر على نفس الكتلة؟', occurredAt: at(0) },
  { id: 'demo-attempt', sessionId: 'demo-newton', sequence: 2, type: 'attempt_submitted', conceptKey: 'physics.newton-second-law', title: 'محاولة مريم', summary: 'القوة الأكبر تجعل الجسم أسرع دائمًا حتى لو تغيّرت كتلته.', occurredAt: at(2), confidence: 0.72 },
  { id: 'demo-misconception', sessionId: 'demo-newton', sequence: 3, type: 'misconception_detected', conceptKey: 'physics.newton-second-law', title: 'نمط خطأ مكتشف', summary: 'خلط السرعة بالتسارع وإهمال أثر الكتلة في العلاقة F = ma.', occurredAt: at(3), misconception: 'concept_confusion', confidence: 0.91 },
  { id: 'demo-intervention', sessionId: 'demo-newton', sequence: 4, type: 'intervention_completed', conceptKey: 'physics.newton-second-law', title: 'تدخل مفاهيمي', summary: 'مقارنة عربتي تسوق مختلفتي الكتلة تحت نفس القوة، مع جسر المصطلح acceleration ↔ التسارع.', occurredAt: at(5) },
  { id: 'demo-retry', sessionId: 'demo-newton', sequence: 5, type: 'retry_submitted', conceptKey: 'physics.newton-second-law', title: 'إعادة المحاولة', summary: 'عند ثبات الكتلة، زيادة القوة تزيد التسارع. وعند ثبات القوة، زيادة الكتلة تقلل التسارع.', occurredAt: at(8), confidence: 0.94 },
  { id: 'demo-evidence', sessionId: 'demo-newton', sequence: 6, type: 'evidence_created', conceptKey: 'physics.newton-second-law', title: 'دليل تعلّم', summary: 'شرح صحيح + تطبيق عددي + ربط بالمصدر المستخدم.', occurredAt: at(10) },
  { id: 'demo-memory', sessionId: 'demo-newton', sequence: 7, type: 'review_scheduled', conceptKey: 'physics.newton-second-law', title: 'مراجعة ذاكرة', summary: 'استرجاع قصير بعد 3 أيام للتحقق من بقاء الفهم.', occurredAt: at(11) },
];

export const showcaseSession: LearningSession = {
  id: 'demo-newton',
  conceptKey: 'physics.newton-second-law',
  conceptAr: 'قانون نيوتن الثاني',
  conceptEn: "Newton's Second Law",
  sourceTitle: 'OpenStax University Physics, Volume 1',
  sourceLocation: 'Chapter 5 — Section 5.3',
  sourceVersion: 'OpenStax web edition accessed for the prepared demo',
  classification: 'verified_source',
  mastery: { concept: 91, explanation: 86, application: 84, recall: 72, sourceUse: 94 },
  status: 'review_due',
  reviewDueAt: at(11 + 3 * 24 * 60),
  events,
  createdAt: at(0),
  updatedAt: at(11),
};

export const showcaseTeacherInsight = {
  sampleSize: 12,
  misconceptionCount: 7,
  titleAr: 'الخلط بين السرعة والتسارع',
  titleEn: 'Confusing velocity with acceleration',
  noteAr: 'بيانات توضيحية معدّة لعرض الهاكاثون، وليست بيانات طلاب حقيقيين.',
  noteEn: 'Illustrative hackathon demo data, not real student data.',
};
