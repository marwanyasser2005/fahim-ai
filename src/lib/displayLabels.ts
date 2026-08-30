import type { Language } from '@/App';

type Label = Record<Language, string>;

const labels: Record<string, Label> = {
  verified_source: { ar: 'موثّق بمصدر', en: 'Verified source' },
  inferred: { ar: 'استنتاج مبني على الأدلة', en: 'Evidence-based inference' },
  teaching_explanation: { ar: 'شرح تعليمي', en: 'Teaching explanation' },
  general_knowledge: { ar: 'معرفة عامة', en: 'General knowledge' },
  needs_review: { ar: 'يحتاج مراجعة', en: 'Needs review' },
  official_source: { ar: 'مصدر رسمي', en: 'Official source' },
  official: { ar: 'جهة رسمية', en: 'Official entity' },
  institutional: { ar: 'مؤسسة تعليمية', en: 'Education institution' },
  publisher: { ar: 'ناشر تعليمي', en: 'Education publisher' },
  'open-education': { ar: 'محتوى تعليمي مفتوح', en: 'Open education' },
  'open-reference': { ar: 'مرجع مفتوح', en: 'Open reference' },
  reference: { ar: 'مرجع', en: 'Reference' },
  pending: { ar: 'بانتظار المراجعة', en: 'Pending review' },
  under_review: { ar: 'قيد المراجعة', en: 'Under review' },
  approved: { ar: 'مقبول', en: 'Approved' },
  rejected: { ar: 'مرفوض', en: 'Rejected' },
  needs_resubmission: { ar: 'مطلوب إعادة الإرسال', en: 'Resubmission needed' },
  open: { ar: 'مفتوح', en: 'Open' },
  in_progress: { ar: 'جارٍ العمل عليه', en: 'In progress' },
  resolved: { ar: 'تم الحل', en: 'Resolved' },
  closed: { ar: 'مغلق', en: 'Closed' },
  draft: { ar: 'مسودة', en: 'Draft' },
  issued: { ar: 'صادرة', en: 'Issued' },
  revoked: { ar: 'ملغاة', en: 'Revoked' },
  general: { ar: 'استفسار عام', en: 'General' },
  billing: { ar: 'الاشتراك والدفع', en: 'Billing' },
  technical: { ar: 'مشكلة تقنية', en: 'Technical' },
  learning: { ar: 'تجربة التعلّم', en: 'Learning' },
  content: { ar: 'المحتوى', en: 'Content' },
  privacy: { ar: 'الخصوصية', en: 'Privacy' },
  customer: { ar: 'المتعلم', en: 'Learner' },
  admin: { ar: 'مدير المنصة', en: 'Administrator' },
  low: { ar: 'أولوية منخفضة', en: 'Low priority' },
  normal: { ar: 'أولوية عادية', en: 'Normal priority' },
  high: { ar: 'أولوية مرتفعة', en: 'High priority' },
  urgent: { ar: 'عاجل', en: 'Urgent' },
  free: { ar: 'الخطة المجانية', en: 'Free plan' },
  plus_monthly: { ar: 'فَهيم بلس الشهري', en: 'Fahim Plus monthly' },
  plus_annual: { ar: 'فَهيم بلس السنوي', en: 'Fahim Plus annual' },
  teacher_pro: { ar: 'المعلّم الاحترافي', en: 'Teacher Pro' },
  instapay: { ar: 'إنستاباي', en: 'InstaPay' },
  vodafone_cash: { ar: 'فودافون كاش', en: 'Vodafone Cash' },
  bank_transfer: { ar: 'تحويل بنكي', en: 'Bank transfer' },
  cash_deposit: { ar: 'إيداع نقدي', en: 'Cash deposit' },
  other: { ar: 'وسيلة أخرى', en: 'Other method' },
  student: { ar: 'طالب', en: 'Student' },
  instructor: { ar: 'معلّم', en: 'Instructor' },
  moderator: { ar: 'مشرف محتوى', en: 'Moderator' },
  completed_lesson: { ar: 'أكمل درسًا', en: 'Completed a lesson' },
  quiz_completed: { ar: 'أكمل اختبارًا', en: 'Completed a quiz' },
  video_watched: { ar: 'شاهد فيديو', en: 'Watched a video' },
  note_created: { ar: 'أضاف ملاحظة', en: 'Created a note' },
  project_updated: { ar: 'حدّث مشروعًا', en: 'Updated a project' },
};

/** Converts database/provider identifiers into calm, localized product language. */
export function displayLabel(value: string | null | undefined, language: Language, fallback?: string) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return fallback || labels.reference[language];
  if (labels[normalized]) return labels[normalized][language];

  const readable = normalized.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!readable) return fallback || labels.reference[language];
  return language === 'en' ? readable.replace(/(^|\s)\S/g, (letter) => letter.toUpperCase()) : readable;
}

export const evidenceLabels = (language: Language) => [
  'verified_source',
  'inferred',
  'teaching_explanation',
  'general_knowledge',
  'needs_review',
].map((value) => ({ value, label: displayLabel(value, language) }));
