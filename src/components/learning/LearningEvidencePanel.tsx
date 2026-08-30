import {
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Language } from '@/App';
import { calculateEvidenceScore, type LearningEventType, type LearningSession } from '@/lib/learningEvidence';
import { displayLabel } from '@/lib/displayLabels';

const eventIcons: Record<LearningEventType, typeof BrainCircuit> = {
  diagnostic_started: BrainCircuit,
  attempt_submitted: BookOpenCheck,
  misconception_detected: ShieldCheck,
  intervention_completed: RotateCcw,
  retry_submitted: CheckCircle2,
  evidence_created: ShieldCheck,
  review_scheduled: Clock3,
  review_recalled: CheckCircle2,
  transfer_applied: CheckCircle2,
};

const copy = {
  ar: {
    title: 'دليل التعلّم',
    subtitle: 'سجل يوضح كيف تغيّر الفهم، لا مجرد نسبة إنجاز.',
    score: 'قوة الدليل الحالية',
    timeline: 'مسار الفهم',
    source: 'مرجع التعلّم',
    noSource: 'لم يُربط هذا التقييم بمصدر بعد',
    empty: 'أكمل تقييمًا قصيرًا ليظهر هنا أول دليل قابل للمراجعة.',
    start: 'ابدأ أول تقييم',
  },
  en: {
    title: 'Learning evidence',
    subtitle: 'A record of how understanding changed, not just completion.',
    score: 'Current evidence strength',
    timeline: 'Understanding journey',
    source: 'Learning source',
    noSource: 'This assessment is not linked to a source yet',
    empty: 'Complete a short assessment to create your first reviewable record.',
    start: 'Start first assessment',
  },
} as const;

export default function LearningEvidencePanel({ session, language }: { session?: LearningSession; language: Language }) {
  const t = copy[language];
  if (!session) {
    return (
      <section className="learning-panel learning-panel-empty" aria-labelledby="evidence-title">
        <span className="learning-panel-icon"><ShieldCheck aria-hidden="true" /></span>
        <div>
          <h2 id="evidence-title">{t.title}</h2>
          <p>{t.empty}</p>
          <Link className="text-link" to="/quiz-lab">{t.start}</Link>
        </div>
      </section>
    );
  }

  const score = calculateEvidenceScore(session.mastery);
  return (
    <section className="learning-panel" aria-labelledby="evidence-title">
      <header className="learning-panel-heading">
        <div>
          <p className="section-kicker"><ShieldCheck aria-hidden="true" />{displayLabel(session.classification, language)}</p>
          <h2 id="evidence-title">{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>
        <div className="evidence-score" aria-label={`${t.score}: ${score}%`}>
          <strong>{score}%</strong>
          <span>{t.score}</span>
        </div>
      </header>

      <div className="evidence-source">
        <span>{t.source}</span>
        <strong>{session.sourceTitle || t.noSource}</strong>
        {session.sourceLocation && <small>{session.sourceLocation}</small>}
      </div>

      <h3 className="evidence-subheading">{t.timeline}</h3>
      <ol className="evidence-timeline">
        {session.events.map((event) => {
          const Icon = eventIcons[event.type];
          return (
            <li key={event.id}>
              <span className="evidence-event-icon"><Icon aria-hidden="true" /></span>
              <div>
                <strong>{event.title}</strong>
                <p>{event.summary}</p>
                <time dateTime={event.occurredAt}>{new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(event.occurredAt))}</time>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
