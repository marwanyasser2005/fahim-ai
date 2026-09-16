import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Award, BookOpenCheck, Bot, Check, CheckCircle2, ChevronDown, Clock3, ExternalLink, GraduationCap, LockKeyhole, Play, BrainCircuit, Target, Trophy } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import type { Language } from '@/App';
import { courseMinutes, getCourse } from '@/data/courseCatalog';
import { getCourseProgress, saveCourseProgress } from '@/lib/courseProgress';
import { recordStudyAction } from '@/lib/studyProgress';
import { serverCourseIdFor } from '@/lib/verifiedCourse';
import { recordLessonCompletion } from '@/lib/supabase/progressSync';
import CourseAssessment from '@/components/learning/CourseAssessment';

const copy = {
  ar: {
    paths: 'المسارات', curriculum: 'خطة المسار', outcomes: 'ماذا ستتقن', alignment: 'صلة المسار بتعلّمك', resources: 'مصادر أصلية للمراجعة',
    free: 'مجاني بالكامل', weeks: 'أسابيع', lessons: 'دروس', hours: 'ساعات تعلم', begin: 'ابدأ أول درس', continue: 'تابع من حيث توقفت',
    completed: 'مكتمل', progress: 'تقدمك', mark: 'أكملت الدرس', undo: 'إلغاء الاكتمال', concept: 'شرح', practice: 'تطبيق', project: 'مشروع',
    ask: 'اسأل فَهيم', video: 'ابحث عن شرح فيديو', quiz: 'اختبر إتقانك', active: 'حلقة تعلم نشطة', activeBody: 'افهم الفكرة، شاهد تطبيقًا، اختبر نفسك، ثم راجع نقطة الضعف مع فَهيم.',
    notFound: 'هذا المسار غير موجود.', back: 'العودة إلى المسارات', sourceNote: 'تفتح المصادر الأصلية في نافذة جديدة. لا ندّعي اعتمادًا رسميًا من الجهات المذكورة.', certificate: 'جاهز للشهادة', certificateBody: 'أكمل كل الدروس ثم حقق 70% أو أكثر في مختبر الإتقان.',
  },
  en: {
    paths: 'Paths', curriculum: 'Path curriculum', outcomes: 'What you will master', alignment: 'How this connects to your learning', resources: 'Primary review resources',
    free: 'Completely free', weeks: 'weeks', lessons: 'lessons', hours: 'learning hours', begin: 'Start the first lesson', continue: 'Continue where you left off',
    completed: 'Completed', progress: 'Your progress', mark: 'Mark lesson complete', undo: 'Undo completion', concept: 'Concept', practice: 'Practice', project: 'Project',
    ask: 'Ask Fahim', video: 'Find a video explanation', quiz: 'Test your mastery', active: 'An active learning loop', activeBody: 'Understand the idea, watch an application, test yourself, then review the weak point with Fahim.',
    notFound: 'This path does not exist.', back: 'Back to paths', sourceNote: 'Primary sources open in a new tab. Fahim does not claim endorsement by the listed organizations.', certificate: 'Certificate readiness', certificateBody: 'Complete every lesson and score at least 70% in the mastery lab.',
  },
} as const;

export default function CourseDetail({ language }: { language: Language }) {
  const { id } = useParams();
  const course = getCourse(id);
  if (!course) return <main className="grid min-h-[70vh] place-items-center bg-[var(--surface)] p-6"><div className="text-center"><h1 className="text-3xl font-black text-[var(--text)]">{copy[language].notFound}</h1><Link to="/courses" className="premium-button mt-6">{copy[language].back}</Link></div></main>;
  return <CourseExperience key={course.id} courseId={course.id} language={language} />;
}

function CourseExperience({ courseId, language }: { courseId: string; language: Language }) {
  const course = getCourse(courseId)!;
  const t = copy[language];
  const Arrow = language === 'ar' ? ArrowLeft : ArrowRight;
  const lessons = useMemo(() => course.modules.flatMap((item) => item.lessons), [course]);
  const [progress, setProgress] = useState(() => getCourseProgress(course.id));
  const [expanded, setExpanded] = useState(course.modules[0]?.id || '');
  const serverCourseId = serverCourseIdFor(course.id);
  const completed = new Set(progress.completedLessonIds);
  const percent = lessons.length ? Math.round((completed.size / lessons.length) * 100) : 0;
  const nextLesson = lessons.find((item) => !completed.has(item.id)) || lessons[lessons.length - 1];
  const toggleLesson = (lessonId: string, title: string) => {
    const next = completed.has(lessonId) ? progress.completedLessonIds.filter((item) => item !== lessonId) : [...progress.completedLessonIds, lessonId];
    const updated = { ...progress, completedLessonIds: next, updatedAt: new Date().toISOString() };
    setProgress(updated); saveCourseProgress(updated);
    const nowCompleted = !completed.has(lessonId);
    if (nowCompleted) recordStudyAction('session', title);
    // Supabase `progress` is what the credential and the final badge read, so completion has
    // to reach the server too. Catalog-only courses report `local_only` and stay device-local.
    if (!serverCourseId) return;
    void recordLessonCompletion({ courseId: serverCourseId, lessonId, completed: nowCompleted });
  };

  return <main className="min-h-[80vh] bg-[var(--surface)] pb-20">
    <section className="relative overflow-hidden border-b border-white/10 bg-slate-950 text-white">
      <img src={course.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-15" /><div className="absolute inset-0 bg-gradient-to-e from-slate-950 via-slate-950/95 to-[color-mix(in_srgb,var(--band)_80%,transparent)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8"><nav className="flex items-center gap-2 text-[10px] font-black text-slate-400"><Link to="/courses" className="hover:text-white">{t.paths}</Link><Arrow className="h-3 w-3" /><span className="truncate text-[var(--brand-primary)]">{course.title[language]}</span></nav><div className="mt-8 grid items-end gap-10 lg:grid-cols-[1fr_22rem]"><div><span className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--brand-primary)_30%,transparent)] bg-[color-mix(in_srgb,var(--brand-primary)_10%,transparent)] px-3 py-1.5 text-[10px] font-black text-[var(--brand-primary)]"><BrainCircuit className="h-3.5 w-3.5" />{course.category[language]} · {t.free}</span><h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">{course.title[language]}</h1><p className="mt-5 max-w-3xl text-sm leading-8 text-slate-300 sm:text-base">{course.description[language]}</p><div className="mt-7 flex flex-wrap gap-3 text-[10px] font-black text-slate-300"><span className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-2"><Clock3 className="h-4 w-4 text-[var(--brand-primary)]" />{course.weeks} {t.weeks}</span><span className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-2"><BookOpenCheck className="h-4 w-4 text-teal-300" />{lessons.length} {t.lessons}</span><span className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-2"><Target className="h-4 w-4 text-amber-300" />{Math.round(courseMinutes(course) / 60)} {t.hours}</span></div></div>
        <aside className="rounded-[2rem] border border-white/10 bg-white/[.06] p-5 backdrop-blur-xl"><div className="flex items-center justify-between"><p className="text-xs font-black">{t.progress}</p><strong className="text-2xl font-black text-teal-300">{percent}%</strong></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[var(--brand-solid)] to-teal-400 transition-all" style={{ width: `${percent}%` }} /></div><p className="mt-3 text-[10px] font-bold text-slate-400">{completed.size} / {lessons.length} {t.lessons}</p><a href={`#lesson-${nextLesson.id}`} className="mt-5 flex h-12 items-center justify-between rounded-2xl bg-white px-4 text-xs font-black text-slate-950"><span>{percent ? t.continue : t.begin}</span><Play className="h-4 w-4 fill-current" /></a></aside>
      </div></div>
    </section>

    <div className="mx-auto mt-8 grid max-w-7xl gap-7 px-4 sm:px-6 lg:grid-cols-[1fr_22rem] lg:px-8">
      <div className="min-w-0 space-y-7">
        <section className="premium-card p-5 sm:p-7"><h2 className="text-2xl font-black text-[var(--text)]">{t.curriculum}</h2><div className="mt-6 space-y-3">{course.modules.map((courseModule, moduleIndex) => {
          const moduleCompleted = courseModule.lessons.every((item) => completed.has(item.id));
          const isOpen = expanded === courseModule.id;
          return <article key={courseModule.id} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)]"><button type="button" onClick={() => setExpanded(isOpen ? '' : courseModule.id)} className="flex w-full items-center gap-3 p-4 text-start hover:bg-[var(--soft)]"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-black ${moduleCompleted ? 'bg-teal-500 text-white' : 'bg-[color-mix(in_srgb,var(--brand-primary)_14%,var(--panel))] text-[var(--brand-secondary)] dark:bg-[color-mix(in_srgb,var(--brand-primary)_16%,transparent)] dark:text-[var(--brand-primary)]'}`}>{moduleCompleted ? <Check className="h-4 w-4" /> : moduleIndex + 1}</span><span className="min-w-0 flex-1"><span className="block text-sm font-black text-[var(--text)]">{courseModule.title[language]}</span><span className="mt-1 block text-[10px] font-bold text-[var(--muted)]">{courseModule.lessons.length} {t.lessons}</span></span><ChevronDown className={`h-4 w-4 text-[var(--muted)] transition ${isOpen ? 'rotate-180' : ''}`} /></button>{isOpen && <div className="border-t border-[var(--border)]">{courseModule.lessons.map((lessonItem, lessonIndex) => {
            const done = completed.has(lessonItem.id);
            const locked = moduleIndex > 0 && !course.modules[moduleIndex - 1].lessons.some((item) => completed.has(item.id));
            return <div id={`lesson-${lessonItem.id}`} key={lessonItem.id} className="scroll-mt-32 border-b border-[var(--border)] p-4 last:border-0 sm:p-5"><div className="flex items-start gap-3"><span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${done ? 'bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300' : 'bg-[var(--soft)] text-[var(--muted)]'}`}>{locked ? <LockKeyhole className="h-3.5 w-3.5" /> : done ? <CheckCircle2 className="h-4 w-4" /> : <Play className="h-3.5 w-3.5" />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-black text-[var(--text)]">{lessonItem.title[language]}</h3><span className="rounded-full bg-[var(--soft)] px-2 py-1 text-[8px] font-black uppercase text-[var(--muted)]">{t[lessonItem.type]}</span></div><p className="mt-1 text-[10px] font-bold text-[var(--muted)]">{lessonItem.duration} min · {moduleIndex + 1}.{lessonIndex + 1}</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={locked} onClick={() => toggleLesson(lessonItem.id, lessonItem.title[language])} className={`rounded-xl px-3 py-2 text-[10px] font-black disabled:cursor-not-allowed disabled:opacity-45 ${done ? 'border border-[var(--border)] text-[var(--muted)]' : 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'}`}>{done ? t.undo : t.mark}</button><Link to={`/ask-fahim?q=${encodeURIComponent(`${language === 'ar' ? 'علّمني' : 'Teach me'}: ${lessonItem.title[language]}`)}&subject=${encodeURIComponent(course.title[language])}`} className="rounded-xl border border-[var(--border)] px-3 py-2 text-[10px] font-black text-[var(--brand-secondary)] hover:bg-[color-mix(in_srgb,var(--brand-primary)_10%,var(--panel))] dark:text-[var(--brand-primary)] dark:hover:bg-[color-mix(in_srgb,var(--brand-primary)_16%,transparent)]">{t.ask}</Link><Link to={`/videos?q=${encodeURIComponent(`${course.title[language]} ${lessonItem.title[language]}`)}`} className="rounded-xl border border-[var(--border)] px-3 py-2 text-[10px] font-black text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">{t.video}</Link></div></div></div></div>;
          })}</div>}</article>;
        })}</div></section>

        <section className="grid gap-5 md:grid-cols-2"><InfoCard icon={<Target />} title={t.outcomes} items={course.outcomes.map((item) => item[language])} /><InfoCard icon={<GraduationCap />} title={t.alignment} items={course.alignment.map((item) => item[language])} /></section>
        <section className="premium-card p-5 sm:p-7"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"><BookOpenCheck className="h-5 w-5" /></span><div><h2 className="text-xl font-black text-[var(--text)]">{t.resources}</h2><p className="mt-1 text-[10px] font-bold text-[var(--muted)]">{t.sourceNote}</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{course.resources.map((resource) => <a key={resource.url} href={resource.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--soft)] p-4 text-sm font-black text-[var(--text)] hover:border-[var(--brand-primary)]"><span>{resource.title}</span><ExternalLink className="h-4 w-4 shrink-0 text-[var(--brand-primary)]" /></a>)}</div></section>
      </div>

      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start"><section className="overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--brand-solid)] text-white"><Bot className="h-5 w-5" /></span><h2 className="mt-5 text-xl font-black">{t.active}</h2><p className="mt-3 text-xs leading-7 text-slate-300">{t.activeBody}</p><div className="mt-5 grid gap-2"><Link to={`/ask-fahim?mode=explain&subject=${encodeURIComponent(course.title[language])}&q=${encodeURIComponent(language === 'ar' ? `ابنِ لي جلسة تعلم في ${course.title.ar}` : `Build me a learning session for ${course.title.en}`)}`} className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-xs font-black text-slate-950"><span>{t.ask}</span><Arrow className="h-4 w-4" /></Link><Link to={`/quiz-lab?topic=${encodeURIComponent(course.title[language])}`} className="flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs font-black"><span>{t.quiz}</span><Trophy className="h-4 w-4 text-amber-300" /></Link></div></section>
        <section className="premium-card p-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"><Award className="h-5 w-5" /></span><h2 className="text-sm font-black text-[var(--text)]">{t.certificate}</h2></div><p className="mt-3 text-xs leading-6 text-[var(--muted)]">{t.certificateBody}</p><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--soft)]"><div className="h-full rounded-full bg-amber-400" style={{ width: `${percent}%` }} /></div></section>
      </aside>
    </div>

    {serverCourseId && <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><CourseAssessment courseId={serverCourseId} language={language} /></div>}
  </main>;
}

function InfoCard({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return <section className="premium-card p-5 sm:p-6"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--brand-primary)_14%,var(--panel))] text-[var(--brand-secondary)] dark:bg-[color-mix(in_srgb,var(--brand-primary)_16%,transparent)] dark:text-[var(--brand-primary)] [&>svg]:h-5 [&>svg]:w-5">{icon}</span><h2 className="mt-4 text-lg font-black text-[var(--text)]">{title}</h2><ul className="mt-4 space-y-3">{items.map((item) => <li key={item} className="flex gap-2 text-xs font-bold leading-6 text-[var(--muted)]"><Check className="mt-1 h-3.5 w-3.5 shrink-0 text-teal-600" />{item}</li>)}</ul></section>;
}
