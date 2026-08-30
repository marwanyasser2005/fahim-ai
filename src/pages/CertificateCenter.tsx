import { useCallback, useEffect, useState } from 'react';
import { Award, BadgeCheck, CheckCircle2, Flag, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Language } from '@/App';
import CertificateArtwork, { type PublicCredential } from '@/components/certificates/CertificateArtwork';
import { supabase } from '@/lib/supabase/client';
import { credentialLevelFromScore, credentialLevelLabel, credentialLevelPolicy, type CredentialLevel } from '@/lib/credentials';

type Eligibility = {
  courseId: string;
  courseTitle: string;
  totalLessons: number;
  completedLessons: number;
  completionPercent: number;
  finalAssessmentScore: number;
  eligible: boolean;
  certificateId?: string;
  certificateNumber?: string;
  certificateStatus?: string;
};

export default function CertificateCenter({ language }: { language: Language }) {
  const rtl = language === 'ar';
  const [eligibility, setEligibility] = useState<Eligibility[]>([]);
  const [credentials, setCredentials] = useState<PublicCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const client = supabase;
    if (!client) { setError(rtl ? 'خدمة الشهادات غير مهيأة.' : 'The credential service is not configured.'); setLoading(false); return; }
    setLoading(true); setError('');
    const { data, error: eligibilityError } = await client.rpc('my_certificate_eligibility_v2');
    if (eligibilityError) { setError(rtl ? 'تعذر قراءة أهلية الشهادات.' : 'Could not read certificate eligibility.'); setLoading(false); return; }
    let rows = (Array.isArray(data) ? data : []) as Eligibility[];
    const issuable = rows.filter((item) => item.eligible && !item.certificateId);
    for (const item of issuable) {
      const { error: issueError } = await client.rpc('issue_my_completion_certificate_v2', { target_course: item.courseId });
      if (issueError) setError(issueError.message);
    }
    if (issuable.length) {
      const refreshed = await client.rpc('my_certificate_eligibility_v2');
      if (!refreshed.error) rows = (Array.isArray(refreshed.data) ? refreshed.data : []) as Eligibility[];
      setMessage(rtl ? 'أصدر فَهيم الشهادات المستحقة تلقائيًا من سجل الإنجاز.' : 'Fahim automatically issued every eligible credential from the completion record.');
    }
    setEligibility(rows);
    const verified = await Promise.all(rows.filter((item) => item.certificateNumber).map(async (item) => {
       const result = await client.rpc('verify_certificate_v2', { certificate_identifier: item.certificateNumber! });
      return result.error ? null : result.data as PublicCredential;
    }));
    setCredentials(verified.filter(Boolean) as PublicCredential[]);
    setLoading(false);
  }, [rtl]);

  useEffect(() => { void load(); }, [load]);

  return <main className="credential-center min-h-[80vh] bg-[var(--surface)] px-4 py-10 sm:px-6 lg:px-8 lg:py-16"><div className="mx-auto max-w-7xl">
    <header className="credential-center-hero"><div><p className="atlas-kicker"><BadgeCheck className="h-4 w-4" />{rtl ? 'سجل إنجازك القابل للتحقق' : 'Your verifiable achievement registry'}</p><h1 className="atlas-display mt-5 text-5xl sm:text-7xl">{rtl ? 'شهادات فَهيم' : 'Fahim credentials'}</h1><p className="mt-5 max-w-3xl text-base leading-8 text-[var(--muted)]">{rtl ? 'لا تحتاج إلى تقديم طلب يدوي: عندما يثبت السجل إكمال الدروس واجتياز التقييم، يصدر فَهيم شهادة الإتمام تلقائيًا برقم وQR وصفحة تحقق عامة.' : 'No manual request is needed. When the database proves lesson completion and assessment success, Fahim issues the credential automatically with an ID, QR code, and public verification page.'}</p></div><div className="credential-policy"><ShieldCheck className="h-6 w-6" /><div><strong>{rtl ? 'إصدار مبني على الدليل' : 'Evidence-based issuance'}</strong><p>{rtl ? '100% من الدروس + 70% على الأقل في تقييم منشور.' : '100% of lessons + at least 70% in a published assessment.'}</p></div></div></header>
    {message && <div className="fahim-status mt-8 border-teal-500/40 bg-teal-50 text-teal-950 dark:bg-teal-500/10 dark:text-teal-100">{message}</div>}
    {error && <div role="alert" className="fahim-status mt-8 border-rose-500/40 bg-rose-50 text-rose-950 dark:bg-rose-500/10 dark:text-rose-100">{error}</div>}
    <CredentialJourney language={language} />
    <CredentialLevels language={language} />
    {loading ? <div className="mt-10 grid min-h-80 place-items-center rounded-[2rem] border border-[var(--border)] bg-[var(--panel)]"><Loader2 className="h-8 w-8 animate-spin text-[var(--nile)]" /></div> : credentials.length > 0 ? <div className="mt-10 space-y-12">{credentials.map((credential) => <CertificateArtwork key={credential.id} credential={credential} language={language} />)}</div> : <section className="mt-10 grid min-h-80 place-items-center rounded-[2rem] border border-dashed border-[var(--border)] bg-[var(--panel)] p-8 text-center"><div className="max-w-xl"><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[var(--soft)] text-[var(--nile)]"><Award className="h-7 w-7" /></span><h2 className="mt-6 text-2xl font-black">{rtl ? 'أول شهادة تبدأ بإكمال حقيقي.' : 'Your first credential starts with real completion.'}</h2><p className="mt-3 text-sm leading-7 text-[var(--muted)]">{eligibility.length ? (rtl ? 'واصل الدروس واجتز التقييم النهائي. سيصدر فَهيم الشهادة تلقائيًا عند تحقق الشروط.' : 'Continue the lessons and pass the final assessment. Fahim will issue the credential automatically when the requirements are met.') : (rtl ? 'التحق بمسار منشور وابدأ تسجيل تقدّمك حتى تظهر الأهلية هنا.' : 'Join a published path and start recording progress for eligibility to appear here.')}</p><button type="button" className="atlas-secondary mt-6" onClick={() => void load()}><RefreshCw className="h-4 w-4" />{rtl ? 'تحديث الأهلية' : 'Refresh eligibility'}</button></div></section>}
    {!loading && eligibility.length > 0 && <section className="mt-10" aria-labelledby="eligibility-title"><div className="flex items-end justify-between gap-4"><div><p className="atlas-section-number">{rtl ? 'المتطلبات الحالية' : 'Current requirements'}</p><h2 id="eligibility-title" className="mt-2 text-2xl font-black">{rtl ? 'طريقك إلى الإصدار' : 'Your path to issuance'}</h2></div></div><div className="mt-5 grid gap-4 lg:grid-cols-2">{eligibility.map((item) => { const level = credentialLevelFromScore(item.finalAssessmentScore); return <article key={item.courseId} className="credential-eligibility"><div><span>{credentialLevelLabel(level, language)}</span><h3>{item.courseTitle}</h3></div><dl><div><dt>{rtl ? 'الدروس' : 'Lessons'}</dt><dd><bdi>{item.completedLessons}/{item.totalLessons}</bdi></dd></div><div><dt>{rtl ? 'التقييم' : 'Assessment'}</dt><dd><bdi>{item.finalAssessmentScore}%</bdi></dd></div><div><dt>{rtl ? 'الحالة' : 'Status'}</dt><dd>{item.certificateNumber ? (rtl ? 'صدرت' : 'Issued') : item.eligible ? (rtl ? 'جاهزة للإصدار' : 'Ready') : (rtl ? 'قيد التقدم' : 'In progress')}</dd></div></dl><div className="credential-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={item.completionPercent}><span style={{ width: `${Math.max(0, Math.min(100, item.completionPercent))}%` }} /></div></article>; })}</div></section>}
  </div></main>;
}

function CredentialJourney({ language }: { language: Language }) {
  const rtl = language === 'ar';
  const steps = [
    { icon: BadgeCheck, title: rtl ? 'شارات دليل التعلّم' : 'Learning-evidence badges', body: rtl ? 'إنجازات صغيرة تُمنح تلقائيًا من التشخيص والمحاولة والمراجعة والتطبيق.' : 'Small achievements awarded automatically from diagnostic, attempt, review, and transfer evidence.' },
    { icon: Flag, title: rtl ? 'متمّم المسار' : 'Path Finisher', body: rtl ? 'آخر شارة عند إكمال جميع دروس المسار المنشور.' : 'The final badge after completing every lesson in the published path.' },
    { icon: Award, title: rtl ? 'شهادة إتمام قابلة للتحقق' : 'Verifiable completion credential', body: rtl ? 'تصدر بعد الإكمال واجتياز التقييم؛ لا تعني اعتمادًا خارجيًا.' : 'Issued after completion and assessment; it does not claim external accreditation.' },
  ];
  return <section className="credential-journey" aria-labelledby="credential-journey-title"><header><p className="atlas-section-number">{rtl ? 'الشارات قبل الشهادة' : 'BADGES BEFORE CREDENTIALS'}</p><h2 id="credential-journey-title">{rtl ? 'تقدّم مرئي من أول محاولة حتى دليل الإتمام.' : 'Visible progress from first attempt to completion proof.'}</h2><Link to="/profile">{rtl ? 'شاهد سلسلة شاراتك' : 'View your badge trail'}</Link></header><ol>{steps.map(({ icon: Icon, title, body }, index) => <li key={title}><span><Icon aria-hidden="true" /></span><bdi>{index + 1}</bdi><div><strong>{title}</strong><p>{body}</p></div>{index < steps.length - 1 && <CheckCircle2 aria-hidden="true" />}</li>)}</ol></section>;
}

function CredentialLevels({ language }: { language: Language }) {
  const rtl = language === 'ar';
  const levels: { level: CredentialLevel; threshold: string }[] = [
    { level: 'completion', threshold: '70–79%' },
    { level: 'proficiency', threshold: '80–89%' },
    { level: 'mastery', threshold: '90–100%' },
  ];
  return <section className="credential-levels" aria-labelledby="credential-levels-title"><div><p className="atlas-section-number">{rtl ? 'مستويات مبنية على النتيجة' : 'Outcome-based levels'}</p><h2 id="credential-levels-title">{rtl ? 'نفس الشهادة، ودليل أدق على مستوى الإنجاز' : 'One credential, clearer evidence of achievement'}</h2><p>{rtl ? 'المستوى لا يُشترى ولا يختاره المستخدم؛ يحسبه فَهيم تلقائيًا من التقييم النهائي بعد إكمال المسار.' : 'The level cannot be purchased or self-selected. Fahim calculates it from the final assessment after full path completion.'}</p></div><div className="credential-level-grid">{levels.map(({ level, threshold }) => <article key={level} data-level={level}><span><bdi>{threshold}</bdi></span><strong>{credentialLevelLabel(level, language)}</strong><small>{credentialLevelPolicy(level, language)}</small></article>)}</div></section>;
}
