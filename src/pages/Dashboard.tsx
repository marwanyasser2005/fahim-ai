import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileQuestion,
  Layers3,
  Lightbulb,
  ShieldCheck,
} from 'lucide-react';
import type { Language } from '@/App';
import { useAuth } from '@/contexts/AuthContext';
import LearningEvidencePanel from '@/components/learning/LearningEvidencePanel';
import MisconceptionMap from '@/components/learning/MisconceptionMap';
import BadgeTrail from '@/components/badges/BadgeTrail';
import LearningChanges from '@/components/learning/LearningChanges';
import { useBadgeProgress } from '@/hooks/useBadgeProgress';
import { getStudyEvents, type StudyEvent } from '@/lib/studyProgress';
import { learningEvidenceStats, loadLearningSessions, type LearningSession } from '@/lib/learningEvidence';
import { hydrateLearningSessionsFromCloud } from '@/lib/supabase/learningEvidenceSync';
import { dueReviewCards } from '@/lib/spacedReview';
import { syncEvidenceToReviewCards } from '@/lib/reviewBridge';

type Props = { language: Language };

const copy = {
  ar: {
    kicker: 'مساحة التعلّم الشخصية', welcome: 'أهلًا', title: 'ماذا يحتاج فهمك الآن؟',
    subtitle: 'قرار واحد في الأعلى: راجع ما استحق، أو أكمل حلقة فهم، أو ابدأ خط أساس جديد.',
    startAssessment: 'ابدأ تقييمًا تشخيصيًا', continueAssessment: 'أكمل حلقة الفهم', askFahim: 'اسأل فَهيم عن مفهوم',
    reviewToday: 'مراجعتك اليوم', reviewCount: 'بطاقة مستحقة الآن', reviewBody: 'حان موعد استرجاع هذه المفاهيم من الذاكرة قبل موعد النسيان.', startReview: 'ابدأ المراجعة',
    nextTitle: 'الخطوة التالية المقترحة', nextNewTitle: 'ابدأ بخط أساس قصير',
    nextNewBody: 'خمسة أسئلة تطبيقية تكشف أين يبدأ التدخل المناسب، من دون كشف الإجابة قبل التفكير.',
    nextReviewTitle: 'راجع هذا المفهوم الآن', nextReviewBody: 'حان موعد استرجاع الفكرة من الذاكرة. أجب أولًا ثم راجع دليل الجلسة السابقة.', reviewOne: 'راجع الآن',
    nextActiveTitle: 'أكمل حلقة الفهم', nextActiveBody: 'لديك جلسة لم تصل بعد إلى دليل مكتمل. أكمل التدخل ثم جرّب سؤالًا تطبيقيًا جديدًا.',
    evidenceReady: 'أدلة تعلّم جاهزة', activePatterns: 'التباسات مرصودة', reviewDue: 'مراجعات مستحقة', evidenceAverage: 'متوسط قوة الدليل',
    metricsNote: 'أرقام مبنية على جلساتك المسجلة على هذا الجهاز.', recentTitle: 'النشاط الأخير',
    recentBody: 'آخر الخطوات التي أضفتها إلى رحلة الفهم.', noRecent: 'لا يوجد نشاط بعد. ابدأ تقييمًا ليظهر السجل هنا.', viewAll: 'افتح مساحة التعلّم',
    quiz: 'تقييم', video: 'فيديو', source: 'مصدر', explain: 'شرح', session: 'جلسة',
    history: 'سجل التعلّم',
  },
  en: {
    kicker: 'Personal learning space', welcome: 'Welcome', title: 'What does your understanding need now?',
    subtitle: 'One decision up top: review what is due, complete the understanding loop, or start a fresh baseline.',
    startAssessment: 'Start diagnostic assessment', continueAssessment: 'Complete the loop', askFahim: 'Ask Fahim about a concept',
    reviewToday: 'Your review today', reviewCount: 'cards due now', reviewBody: 'These concepts are ready to be retrieved from memory before the forgetting deadline.', startReview: 'Start review',
    nextTitle: 'Recommended next step', nextNewTitle: 'Start with a short baseline',
    nextNewBody: 'Five application questions reveal where intervention should start without exposing the answer before reflection.',
    nextReviewTitle: 'Review this concept now', nextReviewBody: 'It is time to retrieve the idea from memory. Answer first, then inspect the previous evidence record.', reviewOne: 'Review now',
    nextActiveTitle: 'Complete the understanding loop', nextActiveBody: 'A session has not reached complete evidence yet. Finish the intervention, then try a new application question.',
    evidenceReady: 'Learning evidence ready', activePatterns: 'Patterns detected', reviewDue: 'Reviews due', evidenceAverage: 'Average evidence strength',
    metricsNote: 'Figures are based on sessions recorded on this device.', recentTitle: 'Recent activity',
    recentBody: 'The latest steps added to your understanding journey.', noRecent: 'No activity yet. Start an assessment to create your record.', viewAll: 'Open learning workspace',
    quiz: 'Assessment', video: 'Video', source: 'Source', explain: 'Explanation', session: 'Session',
    history: 'Learning history',
  },
} as const;

const actionIcons = { quiz: ClipboardCheck, video: BookOpen, source: ShieldCheck, explain: Lightbulb, session: BrainCircuit };

export default function Dashboard({ language }: Props) {
  const t = copy[language];
  const { user } = useAuth();
  const { progress: badgeProgress, loading: badgesLoading } = useBadgeProgress();
  const [sessions, setSessions] = useState<LearningSession[]>(() => loadLearningSessions());
  const [events, setEvents] = useState<StudyEvent[]>(() => getStudyEvents());
  const [dueCards, setDueCards] = useState(() => { syncEvidenceToReviewCards(); return dueReviewCards(); });

  useEffect(() => {
    const refresh = () => {
      setSessions(loadLearningSessions());
      setEvents(getStudyEvents());
      setDueCards(syncEvidenceToReviewCards().filter((card) => new Date(card.dueAt) <= new Date()));
    };
    refresh();
    // Signed-in learners pick up their cloud evidence so Today is accurate on
    // any device، this is what makes a demo account portable for reviewers.
    if (user) {
      void hydrateLearningSessionsFromCloud().then((cloudSessions) => {
        if (cloudSessions.length) refresh();
      });
    }
    window.addEventListener('fahim-evidence', refresh);
    window.addEventListener('fahim-progress', refresh);
    return () => { window.removeEventListener('fahim-evidence', refresh); window.removeEventListener('fahim-progress', refresh); };
  }, [user]);

  const stats = useMemo(() => learningEvidenceStats(sessions), [sessions]);
  const latest = sessions[0];
  const active = sessions.find((session) => session.status === 'active');

  // ONE decision object drives title, body, icon, label, and destination —
  // the button text can never disagree with where it goes again.
  const next = dueCards.length
    ? {
        kicker: t.reviewToday,
        title: `${dueCards.length} ${t.reviewCount}`,
        body: t.reviewBody,
        concept: dueCards[0].front,
        icon: Layers3,
        cta: t.startReview,
        href: dueCards.length === 1 ? `/review?topic=${encodeURIComponent(dueCards[0].front)}` : '/review',
      }
    : active
      ? {
          kicker: t.nextTitle,
          title: t.nextActiveTitle,
          body: t.nextActiveBody,
          concept: active.conceptAr || active.conceptEn,
          icon: BrainCircuit,
          cta: t.continueAssessment,
          href: `/quiz-lab?topic=${encodeURIComponent(active.conceptAr || active.conceptEn)}`,
        }
      : {
          kicker: t.nextTitle,
          title: t.nextNewTitle,
          body: t.nextNewBody,
          concept: '',
          icon: ClipboardCheck,
          cta: t.startAssessment,
          href: '/quiz-lab',
        };
  const NextIcon = next.icon;
  const Arrow = language === 'ar' ? ArrowLeft : ArrowRight;
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || (language === 'ar' ? 'يا متعلّم' : 'Learner');
  const misconceptionCount = new Set(sessions.flatMap((session) => session.events.map((event) => event.misconception).filter(Boolean))).size;

  return (
    <main className="learning-dashboard">
      <div className="learning-dashboard-shell">
        <header className="dashboard-hero">
          <div>
            <p className="section-kicker"><BrainCircuit aria-hidden="true" />{t.kicker}</p>
            <p className="dashboard-welcome">{t.welcome}، {name}</p>
            <h1>{t.title}</h1>
            <p className="dashboard-subtitle">{t.subtitle}</p>
          </div>
          <div className="dashboard-actions">
            <Link to="/ask-fahim" className="premium-button-secondary"><FileQuestion aria-hidden="true" />{t.askFahim}</Link>
          </div>
        </header>

        <section className={`next-action ${dueCards.length ? 'is-review' : ''}`} aria-labelledby="next-action-title">
          <span className="next-action-icon"><NextIcon aria-hidden="true" /></span>
          <div>
            <p>{next.kicker}</p>
            <h2 id="next-action-title">{next.title}</h2>
            {next.concept && <strong>{next.concept}</strong>}
            <span>{next.body}</span>
          </div>
          <Link to={next.href}>{next.cta}<Arrow aria-hidden="true" /></Link>
        </section>

        <section aria-label={language === 'ar' ? 'مؤشرات التعلّم' : 'Learning indicators'}>
          <div className="learning-metrics">
            <Metric icon={ShieldCheck} value={stats.evidenceReady} label={t.evidenceReady} />
            <Metric icon={BrainCircuit} value={misconceptionCount} label={t.activePatterns} />
            <Metric icon={CalendarClock} value={stats.dueReviews} label={t.reviewDue} tone={stats.dueReviews > 0 ? 'attention' : undefined} />
            <Metric icon={CheckCircle2} value={`${stats.averageScore}%`} label={t.evidenceAverage} />
          </div>
          <p className="metrics-note">{t.metricsNote}</p>
        </section>

        <LearningChanges sessions={sessions} language={language} />
        <BadgeTrail progress={badgeProgress} language={language} loading={badgesLoading} compact />

        <div className="learning-intelligence-grid">
          <MisconceptionMap sessions={sessions} language={language} />
          <LearningEvidencePanel session={latest} language={language} />
        </div>

        <section className="learning-panel recent-learning" aria-labelledby="recent-title">
          <header className="learning-panel-heading">
            <div><p className="section-kicker"><Clock3 aria-hidden="true" />{t.history}</p><h2 id="recent-title">{t.recentTitle}</h2><p>{t.recentBody}</p></div>
            <Link className="text-link" to="/workspace">{t.viewAll}<Arrow aria-hidden="true" /></Link>
          </header>
          {events.length === 0 ? <p className="recent-empty">{t.noRecent}</p> : (
            <ol className="recent-learning-list">
              {events.slice(0, 5).map((event) => {
                const Icon = actionIcons[event.action];
                return <li key={event.id}><span><Icon aria-hidden="true" /></span><div><strong>{event.topic}</strong><small>{t[event.action]}</small></div><time dateTime={event.createdAt}>{new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', { dateStyle: 'medium' }).format(new Date(event.createdAt))}</time></li>;
              })}
            </ol>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({ icon: Icon, value, label, tone }: { icon: typeof ShieldCheck; value: string | number; label: string; tone?: 'attention' }) {
  return <article className={`learning-metric ${tone === 'attention' ? 'is-attention' : ''}`}><span><Icon aria-hidden="true" /></span><div><strong>{value}</strong><p>{label}</p></div></article>;
}
