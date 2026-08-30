import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, BookOpenCheck, BrainCircuit, Clock3, ExternalLink, FileCheck2, ShieldCheck } from 'lucide-react';
import type { Language } from '@/App';
import EvidenceGraph from '@/components/learning/EvidenceGraph';
import MasteryRadar from '@/components/learning/MasteryRadar';
import MasteryJourney from '@/components/learning/MasteryJourney';
import { calculateEvidenceScore, learningEvidenceStats, loadLearningSessions, type LearningSession } from '@/lib/learningEvidence';
import { displayLabel } from '@/lib/displayLabels';

export default function LearningPassport({ language }: { language: Language }) {
  const rtl = language === 'ar';
  const [sessions, setSessions] = useState<LearningSession[]>(() => loadLearningSessions());
  useEffect(() => {
    const refresh = () => setSessions(loadLearningSessions());
    window.addEventListener('fahim-evidence', refresh);
    return () => window.removeEventListener('fahim-evidence', refresh);
  }, []);
  const stats = useMemo(() => learningEvidenceStats(sessions), [sessions]);
  return <main className="min-h-[80vh] bg-[var(--surface)] px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
    <div className="mx-auto max-w-7xl">
      <header className="grid gap-6 border-b border-[var(--ink)] pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div><p className="atlas-kicker"><BadgeCheck className="h-4 w-4" />{rtl ? 'سجل الفهم القابل للفحص' : 'Inspectable understanding record'}</p><h1 className="atlas-display mt-5 text-5xl sm:text-7xl">{rtl ? 'جواز التعلّم' : 'Learning Passport'}</h1><p className="mt-5 max-w-2xl text-base leading-8 text-[var(--muted)]">{rtl ? 'ليس قائمة دورات مكتملة؛ بل آثار توضح ما حاولت، أين أخطأت، كيف صححت، وما الذي ما زال يحتاج استرجاعًا.' : 'Not a list of completed courses—evidence of what you tried, where you struggled, how you corrected, and what still needs recall.'}</p></div>
        <div className="atlas-notice max-w-sm"><ShieldCheck className="h-5 w-5" /><div><b>{rtl ? 'خاص بك افتراضيًا' : 'Private by default'}</b><p className="mt-1 text-xs leading-6">{rtl ? 'المشاركة اختيارية، ولا تُعرض محادثاتك للمعلم أو ولي الأمر.' : 'Sharing is optional; teachers and guardians cannot read your chats.'}</p></div></div>
      </header>
      <section className="mt-8 grid gap-px border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-4">
        <PassportMetric icon={BookOpenCheck} label={rtl ? 'جلسات موثقة' : 'Evidence sessions'} value={stats.sessions} />
        <PassportMetric icon={FileCheck2} label={rtl ? 'أدلة مكتملة' : 'Ready evidence'} value={stats.evidenceReady} />
        <PassportMetric icon={BrainCircuit} label={rtl ? 'متوسط الدليل' : 'Average evidence'} value={`${stats.averageScore}%`} />
        <PassportMetric icon={Clock3} label={rtl ? 'مراجعات مستحقة' : 'Reviews due'} value={stats.dueReviews} />
      </section>
      <div className="mt-8"><MasteryJourney language={language} session={sessions[0]} /></div>
      {sessions.length === 0 ? <section className="mt-8 grid min-h-[24rem] place-items-center border border-dashed border-[var(--border)] bg-[var(--panel)] p-8 text-center"><div className="max-w-lg"><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[var(--soft)] text-[var(--nile)]"><BadgeCheck className="h-7 w-7" /></span><h2 className="mt-6 text-2xl font-black text-[var(--text)]">{rtl ? 'أول دليل يبدأ بمحاولة.' : 'Your first evidence starts with an attempt.'}</h2><p className="mt-3 text-sm leading-7 text-[var(--muted)]">{rtl ? 'ابدأ جلسة تعلم مركزة، أو شاهد مسار العرض لفهم كيف يبني فَهيم دليلك دون إضافة بيانات تجريبية إلى حسابك.' : 'Start a focused learning session, or view the showcase to understand how Fahim builds evidence without adding demo data to your account.'}</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Link to="/workspace" className="atlas-primary">{rtl ? 'ابدأ جلسة' : 'Start a session'}</Link><Link to="/showcase" className="atlas-secondary">{rtl ? 'شاهد العرض' : 'View showcase'}<ExternalLink className="h-4 w-4" /></Link></div></div></section> : <section className="mt-8 grid gap-5 lg:grid-cols-2">
        {sessions.map((session) => <article key={session.id} className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow-sm)] sm:p-7">
          <div className="flex items-start justify-between gap-4"><div><p className="atlas-section-number">{displayLabel(session.classification, language)}</p><h2 className="mt-2 text-2xl font-black text-[var(--text)]">{language === 'ar' ? session.conceptAr : session.conceptEn}</h2><p className="mt-2 text-xs leading-6 text-[var(--muted)]">{session.sourceTitle || (rtl ? 'لا يوجد مصدر مربوط بعد' : 'No source attached yet')}</p></div><span className="showcase-score"><bdi>{calculateEvidenceScore(session.mastery)}</bdi><small>/100</small></span></div>
          <div className="mt-5"><EvidenceGraph session={session} language={language} compact /></div>
          <MasteryRadar dimensions={session.mastery} language={language} />
        </article>)}
      </section>}
    </div>
  </main>;
}

function PassportMetric({ icon: Icon, label, value }: { icon: typeof BookOpenCheck; label: string; value: string | number }) {
  return <article className="bg-[var(--panel)] p-5"><Icon className="h-5 w-5 text-[var(--nile)]" /><p className="mt-4 text-xs font-black text-[var(--muted)]">{label}</p><p className="mt-2 text-3xl font-black text-[var(--text)]"><bdi>{value}</bdi></p></article>;
}
