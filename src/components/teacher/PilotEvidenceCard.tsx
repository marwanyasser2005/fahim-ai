import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, ArrowRight, BarChart3, CheckCircle2, Clock3, Loader2, LockKeyhole, Save, UsersRound } from 'lucide-react';
import {
  loadClassStudents,
  loadPilotSummary,
  saveImpactMeasurement,
  setImpactPilotStatus,
  type ClassStudent,
  type ImpactPilot,
  type PilotPhase,
  type PilotSummary,
} from '@/lib/teacherCockpit';

const phaseCopy = {
  pre: { ar: 'قبل التدخل', en: 'Pre' },
  post: { ar: 'بعد التدخل', en: 'Post' },
  delayed: { ar: 'استرجاع متأخر', en: 'Delayed recall' },
} as const;

const statusFlow: ImpactPilot['status'][] = ['draft', 'recruiting', 'active', 'analysis', 'complete'];

export default function PilotEvidenceCard({ pilot, classTitle, userId, language, onChanged }: {
  pilot: ImpactPilot;
  classTitle: string;
  userId: string;
  language: 'ar' | 'en';
  onChanged: () => Promise<void>;
}) {
  const rtl = language === 'ar';
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [summary, setSummary] = useState<PilotSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [studentId, setStudentId] = useState('');
  const [phase, setPhase] = useState<PilotPhase>('pre');
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [note, setNote] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [classStudents, pilotSummary] = await Promise.all([loadClassStudents(pilot.class_id), loadPilotSummary(pilot.id)]);
      setStudents(classStudents);
      setStudentId((current) => current || classStudents[0]?.user_id || '');
      setSummary(pilotSummary);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setLoading(false);
    }
  }, [pilot.class_id, pilot.id]);

  useEffect(() => { void refresh(); }, [refresh]);

  const nextStatus = useMemo(() => {
    const index = statusFlow.indexOf(pilot.status);
    return index >= 0 && index < statusFlow.length - 1 ? statusFlow[index + 1] : null;
  }, [pilot.status]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const numericScore = Number(score);
    const numericMax = Number(maxScore);
    if (!studentId || !Number.isFinite(numericScore) || !Number.isFinite(numericMax) || numericScore < 0 || numericMax <= 0 || numericScore > numericMax || note.trim().length < 5) return;
    setBusy(true); setError('');
    try {
      await saveImpactMeasurement({ pilotId: pilot.id, studentId, phase, score: numericScore, maxScore: numericMax, evidenceNote: note, recordedBy: userId });
      setScore(''); setNote('');
      await refresh();
    } catch (reason) { setError((reason as Error).message); }
    finally { setBusy(false); }
  };

  const advance = async () => {
    if (!nextStatus) return;
    setBusy(true); setError('');
    try { await setImpactPilotStatus(pilot.id, nextStatus); await onChanged(); }
    catch (reason) { setError((reason as Error).message); }
    finally { setBusy(false); }
  };

  const phaseStats = summary?.phaseStats || {};
  return <article className="pilot-evidence-card">
    <header>
      <div>
        <p className="atlas-section-number">IMPACT PROTOCOL / {pilot.status.toUpperCase()}</p>
        <h2>{pilot.title}</h2>
        <p>{classTitle} · {pilot.concept_key}</p>
      </div>
      <span className="pilot-status"><Activity className="h-4 w-4" />{pilot.status}</span>
    </header>

    <div className="pilot-outcome-statement"><strong>{rtl ? 'النتيجة القابلة للقياس' : 'Observable outcome'}</strong><p>{pilot.outcome_statement}</p></div>

    <section className="pilot-stats" aria-label={rtl ? 'ملخص القياس' : 'Measurement summary'}>
      {(['pre', 'post', 'delayed'] as PilotPhase[]).map((item) => {
        const stats = phaseStats[item];
        return <div key={item} data-suppressed={!stats || stats.suppressed}>
          <span>{phaseCopy[item][language]}</span>
          <strong>{stats && !stats.suppressed && stats.averageScore !== null ? `${stats.averageScore}%` : '—'}</strong>
          <small>{stats?.participantCount || 0} {rtl ? 'قياسات' : 'measurements'}</small>
        </div>;
      })}
      <div data-suppressed={!summary?.isReportable}>
        <span>{rtl ? 'متوسط التحسن' : 'Average change'}</span>
        <strong>{summary?.averageChange !== null && summary?.averageChange !== undefined ? `${summary.averageChange > 0 ? '+' : ''}${summary.averageChange}` : '—'}</strong>
        <small>{summary?.pairedLearners || 0} {rtl ? 'طلاب مكتملون' : 'paired learners'}</small>
      </div>
    </section>

    <div className="pilot-privacy-note"><LockKeyhole className="h-4 w-4" /><p>{rtl ? `لا يعرض فَهيم أي متوسط قبل ${pilot.minimum_sample_size} طلاب لديهم قياس متكامل. كل رقم هنا محسوب من تقييمات مسجلة، وليس تقدير AI.` : `Fahim shows no average before ${pilot.minimum_sample_size} learners have sufficient evidence. Every number is calculated from recorded assessments—not estimated by AI.`}</p></div>

    <div className="grid gap-6 border-t border-[var(--border)] pt-6 lg:grid-cols-[1fr_.72fr]">
      <form onSubmit={submit} className="pilot-measurement-form">
        <div className="flex items-center justify-between gap-3"><div><p className="atlas-section-number">EVIDENCE ENTRY</p><h3>{rtl ? 'سجّل نتيجة تقييم فعلي' : 'Record an administered assessment'}</h3></div><BarChart3 className="h-5 w-5 text-[#0F766E]" /></div>
        {students.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label><span className="atlas-label">{rtl ? 'المتعلم' : 'Learner'}</span><select className="atlas-field mt-2 min-h-11" value={studentId} onChange={(event) => setStudentId(event.target.value)}>{students.map((student, index) => <option key={student.user_id} value={student.user_id}>{rtl ? 'متعلم' : 'Learner'} {index + 1} · {student.user_id.slice(0, 4).toUpperCase()}</option>)}</select></label>
          <label><span className="atlas-label">{rtl ? 'مرحلة القياس' : 'Measurement phase'}</span><select className="atlas-field mt-2 min-h-11" value={phase} onChange={(event) => setPhase(event.target.value as PilotPhase)}>{(['pre','post','delayed'] as PilotPhase[]).map((item) => <option key={item} value={item}>{phaseCopy[item][language]}</option>)}</select></label>
          <label><span className="atlas-label">{rtl ? 'الدرجة' : 'Score'}</span><input className="atlas-field mt-2 min-h-11" type="number" min="0" step="0.01" value={score} onChange={(event) => setScore(event.target.value)} /></label>
          <label><span className="atlas-label">{rtl ? 'من إجمالي' : 'Maximum score'}</span><input className="atlas-field mt-2 min-h-11" type="number" min="1" step="0.01" value={maxScore} onChange={(event) => setMaxScore(event.target.value)} /></label>
          <label className="sm:col-span-2"><span className="atlas-label">{rtl ? 'دليل القياس' : 'Evidence note'}</span><textarea className="atlas-field mt-2 min-h-24" value={note} onChange={(event) => setNote(event.target.value)} placeholder={rtl ? 'مثال: نموذج A، سؤال انتقال جديد، راجعه المعلم.' : 'Example: Form A, unseen transfer question, teacher reviewed.'} /></label>
          <button disabled={busy || note.trim().length < 5 || !score} className="atlas-primary justify-center sm:col-span-2"><Save className="h-4 w-4" />{rtl ? 'حفظ الدليل' : 'Save evidence'}</button>
        </div> : <div className="teacher-private-empty mt-4"><UsersRound className="h-5 w-5" /><p>{rtl ? 'أضف الطلاب إلى الفصل بكود الانضمام قبل تسجيل القياسات.' : 'Learners must join the class before measurements can be recorded.'}</p></div>}
      </form>

      <aside className="pilot-readiness">
        <p className="atlas-section-number">REPORTING GATE</p>
        {loading ? <Loader2 className="mt-5 h-5 w-5 animate-spin" /> : summary?.isReportable ? <><CheckCircle2 className="mt-5 h-7 w-7 text-[#0F766E]" /><h3>{rtl ? 'العينة قابلة للتحليل' : 'Sample is reportable'}</h3><p>{rtl ? 'يمكن تصدير الأرقام مع حجم العينة والمنهجية، دون تحويلها إلى ادعاء سببي أكبر من التصميم.' : 'Metrics can be reported with sample size and method, without overstating causality.'}</p></> : <><Clock3 className="mt-5 h-7 w-7 text-[#D95D39]" /><h3>{rtl ? 'الدليل ما زال غير مكتمل' : 'Evidence is not reportable yet'}</h3><p>{rtl ? `يلزم ${Math.max(0, pilot.minimum_sample_size - (summary?.pairedLearners || 0))} طلاب إضافيين لديهم قياس pre/post متكامل.` : `${Math.max(0, pilot.minimum_sample_size - (summary?.pairedLearners || 0))} more learners need complete pre/post measurements.`}</p></>}
        {nextStatus ? <button type="button" disabled={busy} onClick={() => void advance()} className="atlas-secondary mt-6 w-full justify-center">{rtl ? 'انتقل للمرحلة التالية' : 'Advance protocol'}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></button> : null}
      </aside>
    </div>
    {error ? <p role="alert" className="mt-5 border border-rose-300 bg-rose-50 p-3 text-xs font-bold text-rose-800">{error}</p> : null}
  </article>;
}
