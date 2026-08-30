import { ArrowUpRight, Check, Circle, ScanSearch, Target, type LucideIcon } from 'lucide-react';
import type { LearningEventType, LearningSession } from '@/lib/learningEvidence';

type Stage = {
  id: string;
  event: LearningEventType;
  ar: string;
  en: string;
  detailAr: string;
  detailEn: string;
  icon: LucideIcon;
};

const stages: Stage[] = [
  { id: 'diagnose', event: 'diagnostic_started', ar: 'حدّد', en: 'Orient', detailAr: 'حدّد المفهوم والهدف', detailEn: 'Set the concept and goal', icon: Target },
  { id: 'attempt', event: 'attempt_submitted', ar: 'حاول', en: 'Attempt', detailAr: 'أظهر فهمك الحالي', detailEn: 'Show your current thinking', icon: ArrowUpRight },
  { id: 'detect', event: 'misconception_detected', ar: 'شخّص', en: 'Diagnose', detailAr: 'اعرف نمط الخطأ', detailEn: 'Find the misconception', icon: ScanSearch },
  { id: 'intervene', event: 'intervention_completed', ar: 'افهم', en: 'Understand', detailAr: 'تلقَّ شرحًا مناسبًا', detailEn: 'Receive a targeted explanation', icon: Circle },
  { id: 'retry', event: 'retry_submitted', ar: 'صحّح', en: 'Correct', detailAr: 'أعد المحاولة بوعي', detailEn: 'Retry with the new model', icon: ArrowUpRight },
  { id: 'prove', event: 'evidence_created', ar: 'أثبت', en: 'Prove', detailAr: 'أنشئ دليل فهم', detailEn: 'Create learning evidence', icon: Check },
  { id: 'retain', event: 'review_recalled', ar: 'ثبّت', en: 'Retain', detailAr: 'استرجع بعد فترة', detailEn: 'Recall after spacing', icon: Check },
  { id: 'transfer', event: 'transfer_applied', ar: 'طبّق', en: 'Transfer', detailAr: 'استخدم الفهم في سياق جديد', detailEn: 'Apply it in a new context', icon: ArrowUpRight },
];

export default function MasteryJourney({ language, session }: { language: 'ar' | 'en'; session?: LearningSession }) {
  const completed = new Set(session?.events.map((event) => event.type) ?? []);
  const reached = stages.reduce((highest, stage, index) => completed.has(stage.event) ? Math.max(highest, index) : highest, -1);
  return <section className="mastery-journey" aria-labelledby="mastery-journey-title">
    <div className="mastery-journey-heading">
      <div><p className="atlas-section-number">{language === 'ar' ? 'مسار فَهيم للإتقان' : 'Fahim mastery journey'}</p><h2 id="mastery-journey-title">{language === 'ar' ? 'من محاولة أولى إلى فهم يمكن إثباته' : 'From first attempt to provable understanding'}</h2></div>
      <p>{language === 'ar' ? 'كل مرحلة تُفتح بفعل تعلّم مسجّل، لا بمجرد قضاء وقت داخل المنصة.' : 'Each stage is unlocked by a recorded learning action—not time spent in the app.'}</p>
    </div>
    <ol className="mastery-journey-grid">
      {stages.map((stage, index) => {
        const state = completed.has(stage.event) ? 'complete' : index === reached + 1 ? 'current' : 'pending';
        const Icon = stage.icon;
        return <li key={stage.id} data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
          <span className="mastery-stage-number"><bdi>{String(index + 1).padStart(2, '0')}</bdi></span>
          <span className="mastery-stage-icon" aria-hidden="true">{state === 'complete' ? <Check /> : <Icon />}</span>
          <strong>{language === 'ar' ? stage.ar : stage.en}</strong>
          <small>{language === 'ar' ? stage.detailAr : stage.detailEn}</small>
        </li>;
      })}
    </ol>
  </section>;
}
