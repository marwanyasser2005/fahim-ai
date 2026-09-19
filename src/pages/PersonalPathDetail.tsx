import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Award, BookOpenCheck, Check, CheckCircle2, ChevronDown, Clock3, Cloud, Loader2, Play, Route, ShieldCheck, Sparkles, Target } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import type { Language } from '@/App';
import CourseAssessment from '@/components/learning/CourseAssessment';
import { getCourseProgress, saveCourseProgress } from '@/lib/courseProgress';
import { loadPersonalizedPath, type PersonalizedPath } from '@/lib/personalizedPaths';
import { loadCompletedLessons, recordLessonCompletion } from '@/lib/supabase/progressSync';

const copy = {
  ar: { back: 'مساراتي الشخصية', curriculum: 'خطة المسار المولّدة', progress: 'التقدم المحفوظ', complete: 'أكملت الدرس', undo: 'إلغاء الاكتمال', practice: 'طبّق الآن', outcomes: 'مخرجات المسار', certificate: 'شهادة الإتمام', certificateBody: 'أكمل كل الدروس ثم اجتز التقييم النهائي بنسبة 70% أو أكثر. عندها يصدر فَهيم الشهادة من سجل الدليل.', synced: 'متزامن مع حسابك', syncing: 'جارٍ حفظ التقدم…', local: 'محفوظ على الجهاز وسيعاد التزامن', notFound: 'تعذر فتح هذا المسار الشخصي.', retry: 'العودة إلى منشئ المسارات', weeks: 'أسابيع', minutes: 'دقيقة أسبوعيًا', lessons: 'دروس' },
  en: { back: 'My personal paths', curriculum: 'Generated path curriculum', progress: 'Saved progress', complete: 'Mark complete', undo: 'Undo completion', practice: 'Practice now', outcomes: 'Path outcomes', certificate: 'Completion credential', certificateBody: 'Complete every lesson, then pass the final assessment with at least 70%. Fahim issues the credential from the evidence record.', synced: 'Synced to your account', syncing: 'Saving progress…', local: 'Saved on device; sync will retry', notFound: 'This personal path could not be opened.', retry: 'Back to path builder', weeks: 'weeks', minutes: 'minutes per week', lessons: 'lessons' },
} as const;

type SyncState = 'synced' | 'syncing' | 'local';

export default function PersonalPathDetail({ language }: { language: Language }) {
  const { id = '' } = useParams();
  const t = copy[language];
  const Arrow = language === 'ar' ? ArrowLeft : ArrowRight;
  const [path, setPath] = useState<PersonalizedPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(0);
  const [progress, setProgress] = useState(() => getCourseProgress(id));
  const [syncState, setSyncState] = useState<SyncState>('syncing');

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    void Promise.all([loadPersonalizedPath(id), loadCompletedLessons(id)]).then(([loadedPath, serverLessons]) => {
      if (!active) return;
      setPath(loadedPath);
      const current = getCourseProgress(id);
      const merged = { ...current, completedLessonIds: [...new Set([...current.completedLessonIds, ...serverLessons])], updatedAt: new Date().toISOString() };
      setProgress(merged); saveCourseProgress(merged); setSyncState('synced');
    }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : t.notFound); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, t.notFound]);

  const lessons = useMemo(() => path?.modules?.flatMap((module) => module.lessons) || [], [path]);
  const completed = useMemo(() => new Set(progress.completedLessonIds), [progress.completedLessonIds]);
  const percent = lessons.length ? Math.round((completed.size / lessons.length) * 100) : 0;

  const toggle = async (lessonId: string) => {
    const nowCompleted = !completed.has(lessonId);
    const nextIds = nowCompleted ? [...progress.completedLessonIds, lessonId] : progress.completedLessonIds.filter((item) => item !== lessonId);
    const updated = { ...progress, courseId: id, completedLessonIds: nextIds, updatedAt: new Date().toISOString() };
    setProgress(updated); saveCourseProgress(updated); setSyncState('syncing');
    const result = await recordLessonCompletion({ courseId: id, lessonId, completed: nowCompleted });
    setSyncState(result.status === 'synced' ? 'synced' : 'local');
  };

  if (loading) return <main className="grid min-h-[70vh] place-items-center bg-[var(--surface)]"><div className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--nile)]" /><p className="mt-4 text-xs font-black text-[var(--muted)]">{language === 'ar' ? 'نفتح المسار ونزامن التقدم…' : 'Opening your path and syncing progress…'}</p></div></main>;
  if (error || !path) return <main className="grid min-h-[70vh] place-items-center bg-[var(--surface)] p-6"><div className="max-w-lg text-center"><h1 className="text-3xl font-black text-[var(--text)]">{t.notFound}</h1><p className="mt-3 text-sm text-[var(--muted)]">{error}</p><Link to="/personal-paths" className="atlas-primary mt-6">{t.retry}</Link></div></main>;

  return <main className="personal-path-detail min-h-[80vh] bg-[var(--surface)] pb-20">
    <section className="relative overflow-hidden border-b border-white/10 bg-[#071B38] text-white"><div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_20%_20%,#0F8B83_0,transparent_28%),radial-gradient(circle_at_80%_70%,#F2B84B_0,transparent_24%)]" /><div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8"><Link to="/personal-paths" className="inline-flex min-h-11 items-center gap-2 text-xs font-black text-teal-200"><Arrow className="h-4 w-4" />{t.back}</Link><div className="mt-5 grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]"><div><span className="inline-flex items-center gap-2 rounded-full border border-teal-300/25 bg-teal-300/10 px-3 py-1.5 text-[10px] font-black text-teal-200"><Sparkles className="h-3.5 w-3.5" />{language === 'ar' ? 'مسار شخصي صممه وكيل فَهيم' : 'A personal path designed by Fahim Agent'}</span><h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight sm:text-6xl">{path.title[language] || path.title.ar}</h1><p className="mt-5 max-w-3xl text-sm leading-8 text-slate-300">{path.description[language] || path.description.ar}</p><div className="mt-6 flex flex-wrap gap-3 text-[10px] font-black text-slate-200"><span className="metadata-pill border-white/10 bg-white/5"><Route className="h-4 w-4 text-teal-300" />{path.durationWeeks} {t.weeks}</span><span className="metadata-pill border-white/10 bg-white/5"><Clock3 className="h-4 w-4 text-amber-300" />{path.weeklyMinutes} {t.minutes}</span><span className="metadata-pill border-white/10 bg-white/5"><BookOpenCheck className="h-4 w-4 text-teal-300" />{lessons.length} {t.lessons}</span></div></div>
          <aside className="rounded-[2rem] border border-white/10 bg-white/[.07] p-5 backdrop-blur-xl"><div className="flex items-center justify-between"><span className="text-xs font-black">{t.progress}</span><strong className="text-3xl font-black text-teal-300">{percent}%</strong></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-amber-300 transition-[width] duration-300" style={{ width: `${percent}%` }} /></div><p className="mt-3 text-[10px] font-bold text-slate-300"><bdi>{completed.size}/{lessons.length}</bdi> · {syncState === 'synced' ? t.synced : syncState === 'syncing' ? t.syncing : t.local}</p></aside>
        </div></div></section>

    <div className="mx-auto mt-8 grid max-w-7xl gap-7 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:px-8"><div className="min-w-0 space-y-7"><section className="premium-card p-5 sm:p-7"><h2 className="text-2xl font-black text-[var(--text)]">{t.curriculum}</h2><div className="mt-6 space-y-3">{path.modules?.map((module, moduleIndex) => { const open = expanded === moduleIndex; const moduleDone = module.lessons.every((lesson) => completed.has(lesson.id)); return <article key={module.index} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)]"><button type="button" onClick={() => setExpanded(open ? -1 : moduleIndex)} className="flex min-h-16 w-full items-center gap-3 p-4 text-start transition hover:bg-[var(--soft)]"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-black ${moduleDone ? 'bg-teal-600 text-white' : 'bg-[var(--soft)] text-[var(--nile)]'}`}>{moduleDone ? <Check className="h-4 w-4" /> : moduleIndex + 1}</span><span className="min-w-0 flex-1 text-sm font-black text-[var(--text)]">{module.title[language] || module.title.ar}</span><ChevronDown className={`h-4 w-4 text-[var(--muted)] transition ${open ? 'rotate-180' : ''}`} /></button>{open && <div className="border-t border-[var(--border)]">{module.lessons.map((lesson) => { const done = completed.has(lesson.id); return <article key={lesson.id} className="border-b border-[var(--border)] p-4 last:border-0 sm:p-5"><div className="flex items-start gap-3"><span className={`mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${done ? 'bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300' : 'bg-[var(--soft)] text-[var(--muted)]'}`}>{done ? <CheckCircle2 className="h-4 w-4" /> : <Play className="h-4 w-4" />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-black leading-6 text-[var(--text)]">{lesson.title[language] || lesson.title.ar}</h3><span className="rounded-full bg-[var(--soft)] px-2 py-1 text-[9px] font-black uppercase text-[var(--muted)]">{lesson.type}</span></div><p className="mt-2 text-xs font-bold leading-6 text-[var(--muted)]">{lesson.summary[language] || lesson.summary.ar}</p><div className="mt-4 rounded-xl border-s-4 border-[var(--saffron)] bg-[var(--soft)] p-3"><strong className="text-[10px] font-black uppercase text-[var(--nile)]">{t.practice}</strong><p className="mt-1 text-xs leading-6 text-[var(--text)]">{lesson.practice[language] || lesson.practice.ar}</p></div><button type="button" onClick={() => void toggle(lesson.id)} className={`mt-4 min-h-11 rounded-xl px-4 text-xs font-black ${done ? 'border border-[var(--border)] bg-[var(--panel)] text-[var(--muted)]' : 'bg-[var(--brand-solid)] text-[var(--on-solid)]'}`}>{done ? t.undo : t.complete}</button></div></div></article>; })}</div>}</article>; })}</div></section>
      <CourseAssessment courseId={path.id} language={language} /></div>
      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start"><section className="premium-card p-5"><Target className="h-6 w-6 text-[var(--nile)]" /><h2 className="mt-4 text-lg font-black text-[var(--text)]">{t.outcomes}</h2><ul className="mt-4 space-y-3">{path.outcomes.map((outcome) => <li key={outcome.en} className="flex gap-2 text-xs font-bold leading-6 text-[var(--muted)]"><Check className="mt-1 h-3.5 w-3.5 shrink-0 text-teal-600" />{outcome[language] || outcome.ar}</li>)}</ul></section><section className="rounded-[2rem] bg-[#14213D] p-6 text-white"><Award className="h-7 w-7 text-[#F2B84B]" /><h2 className="mt-4 text-lg font-black">{t.certificate}</h2><p className="mt-3 text-xs leading-7 text-slate-300">{t.certificateBody}</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-[#F2B84B]" style={{ width: `${percent}%` }} /></div><Link to="/certificates" className="mt-5 flex min-h-11 items-center justify-between rounded-xl bg-white px-4 text-xs font-black text-[#14213D]"><span>{language === 'ar' ? 'مركز الشهادات' : 'Credential center'}</span><ShieldCheck className="h-4 w-4" /></Link></section><p className="flex items-center gap-2 px-2 text-[10px] font-bold text-[var(--muted)]"><Cloud className="h-4 w-4" />{syncState === 'synced' ? t.synced : syncState === 'syncing' ? t.syncing : t.local}</p></aside>
    </div>
  </main>;
}
