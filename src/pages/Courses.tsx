import { useDeferredValue, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Clock3, Filter, Search, BrainCircuit, Sparkles, Star, Users, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Language } from '@/App';
import { courseCatalog, courseMinutes, type CourseLevel } from '@/data/courseCatalog';

const copy = {
  ar: {
    eyebrow: 'مسارات فَهيم', title: 'تعلّم عبر مسار واضح، لا قائمة فيديوهات.',
    body: 'تسعة مسارات مجانية بمخرجات قابلة للقياس، ودروس قصيرة، وممارسة، ومشروع نهائي يرتبط مباشرة بفَهيم ومختبر الإتقان.',
    search: 'ابحث في المسارات والمهارات', filters: 'تصفية', all: 'الكل', beginner: 'تأسيسي', intermediate: 'متوسط', advanced: 'متقدم',
    tracks: 'مسارات متاحة', free: 'مجاني بالكامل', learners: 'متعلم', lessons: 'درس', hours: 'ساعة', start: 'افتح المسار', outcomes: 'ستتقن',
    empty: 'لا توجد مسارات مطابقة. جرّب كلمة أخرى أو أزل التصفية.', clear: 'إزالة التصفية', quality: 'مصادر أصلية • تقدم محفوظ • تعلم نشط', aiTitle: 'هدف مختلف؟ ابنِ مسارك الخاص.', aiBody: 'وكيل فَهيم يحوّل احتياجك إلى وحدات ودروس وتطبيقات وتقييم نهائي بشهادة قائمة على الإنجاز.', aiAction: 'اصنع مساري بالـAI',
  },
  en: {
    eyebrow: 'Fahim paths', title: 'Follow a learning path, not a video list.',
    body: 'Nine free paths with measurable outcomes, focused lessons, practice, and a capstone connected directly to Fahim and the mastery lab.',
    search: 'Search paths and skills', filters: 'Filter', all: 'All', beginner: 'Foundation', intermediate: 'Intermediate', advanced: 'Advanced',
    tracks: 'Available paths', free: 'Completely free', learners: 'learners', lessons: 'lessons', hours: 'hours', start: 'Open path', outcomes: 'You will master',
    empty: 'No matching paths. Try another term or clear the filter.', clear: 'Clear filters', quality: 'Primary resources • saved progress • active learning', aiTitle: 'Different goal? Build your own path.', aiBody: 'Fahim Agent turns your need into modules, lessons, practice, a final assessment, and an evidence-based credential.', aiAction: 'Build my AI path',
  },
} as const;

export default function Courses({ language }: { language: Language }) {
  const t = copy[language];
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<CourseLevel | 'all'>('all');
  const [category, setCategory] = useState('all');
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase(language === 'ar' ? 'ar' : 'en'));
  const numberFormatter = useMemo(() => new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en', { notation: 'compact' }), [language]);
  const Arrow = language === 'ar' ? ArrowLeft : ArrowRight;
  const categories = useMemo(() => [...new Map(courseCatalog.map((course) => [course.categoryKey, course.category[language]])).entries()], [language]);
  const courses = useMemo(() => courseCatalog.filter((course) => {
    const search = [course.title[language], course.description[language], course.category[language], ...course.outcomes.map((item) => item[language])].join(' ').toLocaleLowerCase(language === 'ar' ? 'ar' : 'en');
    return (!deferredQuery || search.includes(deferredQuery)) && (level === 'all' || course.level === level) && (category === 'all' || course.categoryKey === category);
  }), [category, deferredQuery, language, level]);
  const clear = () => { setQuery(''); setLevel('all'); setCategory('all'); };

  return <main className="courses-page min-h-[80vh] bg-[var(--surface)] pb-20">
    <section className="catalog-hero atlas-grid border-b border-[var(--border)] bg-[var(--paper)] py-14 sm:py-20">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl"><span className="atlas-kicker"><BrainCircuit className="h-4 w-4" />{t.eyebrow}</span><h1 className="atlas-display mt-5 text-4xl sm:text-6xl">{t.title}</h1><p className="mt-5 max-w-2xl text-sm leading-8 text-[var(--muted)] sm:text-base">{t.body}</p><p className="mt-5 inline-flex items-center gap-2 text-xs font-black text-[var(--nile)]"><Check className="h-4 w-4" />{t.quality}</p></div>
    </div></section><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

      <section className="mt-8 grid items-center gap-5 overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[#14213D] p-5 text-white shadow-[var(--shadow-lg)] sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto]" aria-labelledby="ai-path-title"><div><span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-[#F2B84B]"><Sparkles className="h-4 w-4" />FAHIM PATH AGENT</span><h2 id="ai-path-title" className="mt-3 text-2xl font-black sm:text-3xl">{t.aiTitle}</h2><p className="mt-2 max-w-3xl text-xs font-bold leading-7 text-slate-300 sm:text-sm">{t.aiBody}</p></div><Link to="/personal-paths" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#F2B84B] px-5 text-xs font-black text-[#14213D] transition hover:bg-amber-300"><Sparkles className="h-4 w-4" />{t.aiAction}</Link></section>

      <section className="catalog-filter-panel sticky top-[calc(var(--nav-height)+0.5rem)] z-40 mx-auto mt-8 min-w-0 max-w-6xl border border-[var(--band)] bg-[var(--panel)] p-3 shadow-[5px_5px_0_var(--saffron)]" aria-label={t.filters}>
        <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
          <label className="relative min-w-0"><Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" /><span className="sr-only">{t.search}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} className="catalog-control h-12 min-w-0 w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--soft)] pe-10 ps-11 text-sm font-bold text-[var(--text)] outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10" />{query && <button type="button" onClick={() => setQuery('')} className="absolute end-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--panel)]" aria-label={t.clear}><X className="h-4 w-4" /></button>}</label>
          <div className="flex min-w-0 max-w-full items-center gap-2 overflow-x-auto"><Filter className="h-4 w-4 shrink-0 text-[var(--muted)]" />{(['all', 'beginner', 'intermediate', 'advanced'] as const).map((item) => <button type="button" key={item} onClick={() => setLevel(item)} className={`whitespace-nowrap rounded-lg px-3 py-2.5 text-[10px] font-black ${level === item ? 'bg-[var(--brand-solid)] text-[var(--on-solid)]' : 'bg-[var(--soft)] text-[var(--muted)] hover:text-[var(--text)]'}`}>{t[item]}</button>)}</div>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="catalog-control h-12 min-w-0 w-full max-w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--panel)] px-4 text-xs font-black text-[var(--text)] outline-none focus:border-teal-600 lg:w-auto"><option value="all">{t.all}</option>{categories.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
        </div>
      </section>

      <div className="mt-10 flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.2em] text-[var(--vermilion)]">{t.tracks}</p><h2 className="mt-2 text-2xl font-black text-[var(--text)]">{courses.length} / {courseCatalog.length}</h2></div><span className="rounded-sm bg-[var(--paper)] px-3 py-1.5 text-[10px] font-black text-[var(--nile)]">{t.free}</span></div>

      {courses.length ? <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{courses.map((course) => {
        const lessonCount = course.modules.reduce((sum, item) => sum + item.lessons.length, 0);
        const hours = Math.round(courseMinutes(course) / 60);
        return <article key={course.id} className="content-auto group flex min-h-full flex-col overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow-sm)] transition duration-300 hover:-translate-y-1 hover:border-teal-400 hover:shadow-[var(--shadow-lg)]">
          <Link to={`/course/${course.id}`} className="relative block aspect-[16/9] overflow-hidden bg-[var(--soft)]"><img src={course.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /><span className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent" /><span className="absolute bottom-4 start-4 rounded-full border border-white/15 bg-slate-950/65 px-3 py-1.5 text-[10px] font-black text-white backdrop-blur-md">{course.category[language]}</span><span className="absolute bottom-4 end-4 rounded-full bg-white px-3 py-1.5 text-[10px] font-black text-slate-950">{t[course.level]}</span></Link>
          <div className="flex flex-1 flex-col p-5 sm:p-6"><div className="flex items-center gap-3 text-[10px] font-bold text-[var(--muted)]"><span className="flex items-center gap-1 text-amber-600"><Star className="h-3.5 w-3.5 fill-current" />{course.rating}</span><span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{numberFormatter.format(course.learners)} {t.learners}</span></div><h3 className="mt-3 text-xl font-black leading-8 text-[var(--text)]"><Link to={`/course/${course.id}`}>{course.title[language]}</Link></h3><p className="mt-2 line-clamp-3 text-xs leading-6 text-[var(--muted)]">{course.description[language]}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-black text-[var(--muted)]"><span className="metadata-pill"><BookOpen className="h-3.5 w-3.5" />{lessonCount} {t.lessons}</span><span className="metadata-pill"><Clock3 className="h-3.5 w-3.5" />{hours} {t.hours}</span></div>
            <div className="mt-5 border-t border-[var(--border)] pt-4"><p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">{t.outcomes}</p><ul className="mt-3 space-y-2">{course.outcomes.slice(0, 2).map((outcome) => <li key={outcome.en} className="flex gap-2 text-xs font-bold leading-5 text-[var(--text)]"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600" />{outcome[language]}</li>)}</ul></div>
            <Link to={`/course/${course.id}`} className="mt-6 flex h-12 items-center justify-between rounded-2xl bg-[var(--brand-solid)] px-4 text-xs font-black text-[var(--on-solid)] transition hover:bg-[var(--evidence-solid)] dark:bg-[var(--saffron)] dark:text-[#14213D] dark:hover:bg-amber-300"><span>{t.start}</span><Arrow className="h-4 w-4" /></Link>
          </div>
        </article>;
      })}</div> : <section className="mt-6 grid min-h-80 place-items-center rounded-[2rem] border border-dashed border-[var(--border)] bg-[var(--panel)] p-8 text-center"><div><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--soft)] text-[var(--muted)]"><Search className="h-6 w-6" /></span><p className="mt-5 max-w-md text-sm font-bold text-[var(--muted)]">{t.empty}</p><button type="button" onClick={clear} className="premium-button-secondary mt-5">{t.clear}</button></div></section>}
    </div>
  </main>;
}
