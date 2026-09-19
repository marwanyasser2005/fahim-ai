import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BrainCircuit, Check, Clock3, Loader2, Route, ShieldCheck, Sparkles, Target } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { Language } from '@/App';
import { generatePersonalizedPath, listPersonalizedPaths, type PathGenerationInput, type PersonalizedPath } from '@/lib/personalizedPaths';

const DRAFT_KEY = 'fahim-personal-path-draft-v1';

const copy = {
  ar: {
    eyebrow: 'وكيل بناء المسارات', title: 'قل لفَهيم ماذا تريد أن تتقن.',
    body: 'يحوّل وكيل GenAI هدفك إلى مسار خاص كامل: وحدات، دروس قصيرة، تطبيقات، تقييم نهائي، وتقدم محفوظ حتى شهادة الإتمام.',
    goal: 'ما الهدف الذي تريد الوصول إليه؟', goalHint: 'مثال: أريد تعلّم تحليل البيانات ببايثون لبناء مشروع يعرضه ملفي المهني.',
    level: 'مستواك الحالي', beginner: 'أبدأ من الصفر', intermediate: 'لدي أساسيات', advanced: 'أريد مستوى متقدم',
    weeks: 'مدة المسار', weekly: 'الوقت الأسبوعي', preferences: 'تفضيلات أو قيود', preferencesHint: 'مثال: أفضل المشاريع العملية، وشرح عربي مع المصطلحات الإنجليزية.',
    generate: 'ابنِ مساري الآن', generating: 'الوكيل يبني الوحدات والتقييم ويحفظ المسار…',
    safety: 'التوليد لا يمنح شهادة تلقائيًا. الشهادة لا تصدر إلا بعد إكمال الدروس واجتياز التقييم المسجل.',
    existing: 'مساراتك الشخصية', empty: 'لم تنشئ مسارًا شخصيًا بعد.', open: 'تابع المسار', lessons: 'دروس',
    saved: 'مسودة النموذج محفوظة تلقائيًا على هذا الجهاز.', error: 'تعذر إنشاء المسار. راجع الهدف وحاول مرة أخرى.',
  },
  en: {
    eyebrow: 'Path-building agent', title: 'Tell Fahim what you want to master.',
    body: 'The GenAI agent turns your goal into a complete private path: modules, focused lessons, practice, a final assessment, saved progress, and a completion credential.',
    goal: 'What outcome do you want to reach?', goalHint: 'Example: I want to learn Python data analysis and build a portfolio-ready project.',
    level: 'Your current level', beginner: 'Starting from zero', intermediate: 'I know the basics', advanced: 'I want advanced depth',
    weeks: 'Path duration', weekly: 'Weekly time', preferences: 'Preferences or constraints', preferencesHint: 'Example: practical projects, concise explanations, and English terminology.',
    generate: 'Build my path', generating: 'The agent is designing modules, assessment, and saving the path…',
    safety: 'Generation never awards a credential. It is issued only after recorded lesson completion and a passing assessment.',
    existing: 'Your personal paths', empty: 'You have not created a personal path yet.', open: 'Continue path', lessons: 'lessons',
    saved: 'Your form draft is saved automatically on this device.', error: 'The path could not be created. Review the goal and try again.',
  },
} as const;

const initialDraft: PathGenerationInput = { goal: '', level: 'beginner', durationWeeks: 4, weeklyMinutes: 180, language: 'ar', preferences: '' };

export default function PersonalPathBuilder({ language }: { language: Language }) {
  const t = copy[language];
  const navigate = useNavigate();
  const Arrow = language === 'ar' ? ArrowLeft : ArrowRight;
  const [form, setForm] = useState<PathGenerationInput>(() => {
    try { return { ...initialDraft, ...JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}'), language }; }
    catch { return { ...initialDraft, language }; }
  });
  const [paths, setPaths] = useState<PersonalizedPath[]>([]);
  const [loadingPaths, setLoadingPaths] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setForm((value) => ({ ...value, language })); }, [language]);
  useEffect(() => { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)); }, [form]);
  useEffect(() => {
    let active = true;
    void listPersonalizedPaths().then((items) => { if (active) setPaths(items); }).catch(() => undefined).finally(() => { if (active) setLoadingPaths(false); });
    return () => { active = false; };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true); setError('');
    try {
      const path = await generatePersonalizedPath({ ...form, language });
      localStorage.removeItem(DRAFT_KEY);
      navigate(`/personal-path/${path.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t.error);
    } finally {
      setSubmitting(false);
    }
  };

  return <main className="personal-path-builder min-h-[80vh] bg-[var(--surface)] pb-20">
    <section className="atlas-grid border-b border-[var(--border)] bg-[var(--paper)] py-12 sm:py-16">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_23rem] lg:px-8">
        <div><span className="atlas-kicker"><Sparkles className="h-4 w-4" />{t.eyebrow}</span><h1 className="atlas-display mt-5 text-4xl sm:text-6xl">{t.title}</h1><p className="mt-5 max-w-3xl text-sm leading-8 text-[var(--muted)] sm:text-base">{t.body}</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">{[
            [Route, language === 'ar' ? 'خطة كاملة' : 'Complete plan'],
            [Target, language === 'ar' ? 'تقييم خادمي' : 'Server assessment'],
            [ShieldCheck, language === 'ar' ? 'شهادة موثقة' : 'Verified credential'],
          ].map(([Icon, label]) => <span key={String(label)} className="flex min-h-12 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 text-xs font-black text-[var(--text)]"><Icon className="h-4 w-4 text-[var(--nile)]" />{String(label)}</span>)}</div>
        </div>
        <aside className="self-end rounded-[2rem] bg-[#14213D] p-6 text-white shadow-[var(--shadow-lg)]"><BrainCircuit className="h-8 w-8 text-[#F2B84B]" /><strong className="mt-5 block text-xl">{language === 'ar' ? 'الذكاء يقترح، والدليل يحكم.' : 'AI proposes. Evidence decides.'}</strong><p className="mt-3 text-xs leading-7 text-slate-300">{t.safety}</p></aside>
      </div>
    </section>

    <div className="mx-auto mt-8 grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:px-8">
      <form onSubmit={submit} className="premium-card p-5 sm:p-8" aria-busy={submitting}>
        <div><label htmlFor="path-goal" className="text-base font-black text-[var(--text)]">{t.goal}</label><textarea id="path-goal" required minLength={12} maxLength={700} rows={5} value={form.goal} onChange={(event) => setForm((value) => ({ ...value, goal: event.target.value }))} placeholder={t.goalHint} className="mt-3 min-h-36 w-full resize-y rounded-2xl border border-[var(--border-strong)] bg-[var(--soft)] p-4 text-base font-bold leading-7 text-[var(--text)] outline-none transition focus:border-[var(--brand-solid)] focus:ring-4 focus:ring-teal-500/10" /></div>
        <fieldset className="mt-7"><legend className="text-sm font-black text-[var(--text)]">{t.level}</legend><div className="mt-3 grid gap-3 sm:grid-cols-3">{(['beginner', 'intermediate', 'advanced'] as const).map((level) => <label key={level} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border px-4 text-xs font-black transition ${form.level === level ? 'border-[var(--brand-solid)] bg-[color-mix(in_srgb,var(--brand-primary)_10%,var(--panel))] text-[var(--text)]' : 'border-[var(--border)] bg-[var(--panel)] text-[var(--muted)]'}`}><input type="radio" name="level" value={level} checked={form.level === level} onChange={() => setForm((value) => ({ ...value, level }))} className="accent-teal-600" />{t[level]}</label>)}</div></fieldset>
        <div className="mt-7 grid gap-5 sm:grid-cols-2"><label className="text-sm font-black text-[var(--text)]">{t.weeks}<select value={form.durationWeeks} onChange={(event) => setForm((value) => ({ ...value, durationWeeks: Number(event.target.value) }))} className="mt-3 h-12 w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--panel)] px-4 text-sm font-bold"><option value={2}>2</option><option value={4}>4</option><option value={6}>6</option><option value={8}>8</option><option value={12}>12</option></select></label><label className="text-sm font-black text-[var(--text)]">{t.weekly}<select value={form.weeklyMinutes} onChange={(event) => setForm((value) => ({ ...value, weeklyMinutes: Number(event.target.value) }))} className="mt-3 h-12 w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--panel)] px-4 text-sm font-bold"><option value={60}>1 {language === 'ar' ? 'ساعة' : 'hour'}</option><option value={180}>3 {language === 'ar' ? 'ساعات' : 'hours'}</option><option value={300}>5 {language === 'ar' ? 'ساعات' : 'hours'}</option><option value={480}>8 {language === 'ar' ? 'ساعات' : 'hours'}</option></select></label></div>
        <div className="mt-7"><label htmlFor="path-preferences" className="text-sm font-black text-[var(--text)]">{t.preferences}</label><textarea id="path-preferences" maxLength={700} rows={3} value={form.preferences} onChange={(event) => setForm((value) => ({ ...value, preferences: event.target.value }))} placeholder={t.preferencesHint} className="mt-3 w-full resize-y rounded-2xl border border-[var(--border-strong)] bg-[var(--soft)] p-4 text-base font-bold leading-7 text-[var(--text)] outline-none focus:border-[var(--brand-solid)] focus:ring-4 focus:ring-teal-500/10" /></div>
        {error && <p role="alert" className="mt-5 rounded-xl border border-[var(--danger-border)] bg-[var(--danger-surface)] p-4 text-xs font-bold text-[var(--danger-text)]">{error}</p>}
        <div className="mt-7 flex flex-wrap items-center gap-4"><button type="submit" disabled={submitting || form.goal.trim().length < 12} className="atlas-primary min-h-12 disabled:cursor-not-allowed disabled:opacity-45">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{submitting ? t.generating : t.generate}</button><p className="flex items-center gap-2 text-[10px] font-bold text-[var(--muted)]"><Check className="h-3.5 w-3.5 text-teal-600" />{t.saved}</p></div>
      </form>

      <aside className="min-w-0"><div className="flex items-center justify-between"><h2 className="text-lg font-black text-[var(--text)]">{t.existing}</h2>{loadingPaths && <Loader2 className="h-4 w-4 animate-spin text-[var(--nile)]" />}</div><div className="mt-4 space-y-3">{!loadingPaths && paths.length === 0 && <p className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--panel)] p-5 text-xs font-bold leading-6 text-[var(--muted)]">{t.empty}</p>}{paths.map((path) => <article key={path.id} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--shadow-sm)]"><span className="flex items-center gap-2 text-[10px] font-black text-[var(--nile)]"><Clock3 className="h-3.5 w-3.5" />{path.durationWeeks} {language === 'ar' ? 'أسابيع' : 'weeks'}</span><h3 className="mt-2 text-sm font-black leading-6 text-[var(--text)]">{path.title[language] || path.title.ar}</h3><Link to={`/personal-path/${path.id}`} className="mt-4 flex min-h-11 items-center justify-between rounded-xl bg-[var(--brand-solid)] px-3 text-xs font-black text-[var(--on-solid)]"><span>{t.open}</span><Arrow className="h-4 w-4" /></Link></article>)}</div></aside>
    </div>
  </main>;
}
