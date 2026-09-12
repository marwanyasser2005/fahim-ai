import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpenCheck, Briefcase as BriefcaseBusiness, CalendarDays, Check, GraduationCap, Languages, Loader2, School, Target, UsersRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProductAccess } from '@/contexts/ProductAccessContext';
import { AUTH_REFRESH_FAILED, AUTH_SESSION_EXPIRED } from '@/lib/supabase/client';

type Language = 'ar' | 'en';
type Persona = 'student' | 'teacher' | 'parent' | 'professional' | 'other';
type Style = 'guided' | 'practice' | 'visual' | 'mixed';

const personas: { value: Persona; ar: string; en: string; icon: typeof GraduationCap }[] = [
  { value: 'student', ar: 'طالب/ـة', en: 'Student', icon: GraduationCap },
  { value: 'teacher', ar: 'معلّم/ـة', en: 'Teacher', icon: School },
  { value: 'parent', ar: 'ولي أمر', en: 'Parent', icon: UsersRound },
  { value: 'professional', ar: 'متعلّم مهني', en: 'Professional', icon: BriefcaseBusiness },
  { value: 'other', ar: 'هدف آخر', en: 'Another goal', icon: Target },
];

const educationOptions = [
  ['secondary', 'الثانوية العامة', 'Secondary school'],
  ['technical', 'التعليم الفني', 'Technical education'],
  ['university', 'الجامعة', 'University'],
  ['postgraduate', 'دراسات عليا', 'Postgraduate'],
  ['professional', 'تعلّم مهني مستقل', 'Independent professional'],
] as const;

const styleOptions: { value: Style; ar: string; en: string; detailAr: string; detailEn: string }[] = [
  { value: 'guided', ar: 'توجيه خطوة بخطوة', en: 'Guided', detailAr: 'شرح ثم سؤال ثم تصحيح', detailEn: 'Explain, ask, then correct' },
  { value: 'practice', ar: 'التعلّم بالمحاولة', en: 'Practice first', detailAr: 'ابدأ بمسألة واكشف الفجوة', detailEn: 'Start with an attempt and reveal the gap' },
  { value: 'visual', ar: 'بصري وتطبيقي', en: 'Visual', detailAr: 'أمثلة ورسوم وتطبيق', detailEn: 'Examples, diagrams, and application' },
  { value: 'mixed', ar: 'مزيج متكيف', en: 'Adaptive mix', detailAr: 'يتغير وفق أدائك', detailEn: 'Changes with your performance' },
];

export default function Onboarding({ language }: { language: Language }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const access = useProductAccess();
  const [step, setStep] = useState(0);
  const [persona, setPersona] = useState<Persona>('student');
  const [educationLevel, setEducationLevel] = useState('secondary');
  const [primarySubject, setPrimarySubject] = useState('');
  const [currentLevel, setCurrentLevel] = useState('');
  const [learningGoal, setLearningGoal] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<'ar' | 'en' | 'both'>(language === 'ar' ? 'ar' : 'en');
  const [learningStyle, setLearningStyle] = useState<Style>('mixed');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const rtl = language === 'ar';
  const ArrowNext = rtl ? ArrowLeft : ArrowRight;
  const ArrowBack = rtl ? ArrowRight : ArrowLeft;
  const destination = useMemo(() => {
    const value = (location.state as { from?: string } | null)?.from;
    return value && value !== '/onboarding' ? value : '/dashboard';
  }, [location.state]);

  useEffect(() => {
    if (access.onboardingComplete) navigate(destination, { replace: true });
  }, [access.onboardingComplete, destination, navigate]);

  const valid = step === 0 ? Boolean(persona)
    : step === 1 ? Boolean(educationLevel)
      : step === 2 ? primarySubject.trim().length >= 2 && currentLevel.trim().length >= 2
        : step === 3 ? learningGoal.trim().length >= 8
          : true;

  const next = () => {
    setError('');
    if (!valid) {
      setError(rtl ? 'أكمل المعلومات المطلوبة قبل المتابعة.' : 'Complete the required information before continuing.');
      return;
    }
    setStep((value) => Math.min(4, value + 1));
  };

  const finish = async () => {
    setError(''); setSaving(true);
    const result = await access.completeOnboarding({ persona, educationLevel, primarySubject: primarySubject.trim(), currentLevel: currentLevel.trim(), learningGoal: learningGoal.trim(), targetDate: targetDate || null, preferredLanguage, learningStyle });
    setSaving(false);
    if (result.error === 'onboarding_service_unavailable') {
      setError(rtl ? 'خدمة بدء التجربة قيد التحديث الآن. لم نفقد بياناتك؛ أعد المحاولة بعد لحظات.' : 'The trial service is being updated. Your answers are safe; please try again shortly.');
    } else if (result.error === AUTH_SESSION_EXPIRED) {
      navigate('/login', { replace: true, state: { from: '/onboarding', reason: AUTH_SESSION_EXPIRED } });
    } else if (result.error === AUTH_REFRESH_FAILED) {
      setError(rtl ? 'تعذر تجديد الجلسة بسبب مشكلة اتصال مؤقتة. إجاباتك ما زالت محفوظة في هذه الصفحة؛ تحقق من الإنترنت ثم أعد المحاولة.' : 'We could not refresh your session because of a temporary connection issue. Your answers remain on this page; check your connection and try again.');
    } else if (result.error) {
      setError(rtl ? `تعذر بدء التجربة: ${result.error}` : `Could not start the trial: ${result.error}`);
    }
  };

  return <main className="min-h-[calc(100vh-4rem)] bg-[var(--surface)] px-4 py-10 sm:px-6 lg:py-16">
    <div className="mx-auto max-w-5xl">
      <header className="grid gap-6 border-b border-[var(--border)] pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div><p className="atlas-kicker"><BookOpenCheck className="h-4 w-4" />{rtl ? 'إعداد مسار فَهيم' : 'Set up your Fahim path'}</p><h1 className="atlas-display mt-5 text-4xl sm:text-5xl">{rtl ? `أهلًا ${user?.user_metadata?.full_name || ''}، نبني خطوتك التالية.` : `Welcome ${user?.user_metadata?.full_name || ''}. Let’s build your next step.`}</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">{rtl ? 'خمسة اختيارات ضرورية فقط. بعدها تبدأ تجربة كاملة لمدة 30 يومًا دون بطاقة، ويُبنى هدف اليوم وفق سياقك.' : 'Only five necessary choices. Then your 30-day full trial starts without a card, and Today is shaped around your context.'}</p></div>
        <div className="min-w-52"><div className="flex justify-between text-[10px] font-black text-[var(--muted)]"><span>{rtl ? `الخطوة ${step + 1} من 5` : `Step ${step + 1} of 5`}</span><span>{(step + 1) * 20}%</span></div><div className="mt-2 h-2 overflow-hidden bg-[var(--soft)]"><div className="h-full bg-[#0F766E] transition-all" style={{ width: `${(step + 1) * 20}%` }} /></div></div>
      </header>

      <section className="mt-8 border border-[var(--ink)] bg-[var(--panel)] shadow-[7px_7px_0_var(--saffron)]">
        <div className="min-h-[25rem] p-5 sm:p-8 lg:p-10">
          {step === 0 && <div><StepHeading number="01" title={rtl ? 'ما دورك الأساسي؟' : 'What is your main role?'} body={rtl ? 'يمكن تغييره لاحقًا، ونطلبه فقط لتحديد تجربة البداية.' : 'You can change this later; it only shapes your starting experience.'} /><div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{personas.map((item) => <ChoiceCard key={item.value} selected={persona === item.value} onClick={() => setPersona(item.value)} title={rtl ? item.ar : item.en} icon={item.icon} />)}</div></div>}
          {step === 1 && <div><StepHeading number="02" title={rtl ? 'أين تتعلم الآن؟' : 'Where are you learning now?'} body={rtl ? 'هذا يضبط المصطلحات، العمق، ونوع الأنشطة.' : 'This calibrates terminology, depth, and activity type.'} /><div className="mt-7 grid gap-3 sm:grid-cols-2">{educationOptions.map(([value, ar, en]) => <ChoiceCard key={value} selected={educationLevel === value} onClick={() => setEducationLevel(value)} title={rtl ? ar : en} icon={GraduationCap} />)}</div></div>}
          {step === 2 && <div><StepHeading number="03" title={rtl ? 'ما المادة ومستواك الحالي؟' : 'What are you learning, and at what level?'} body={rtl ? 'لا نطلب درجاتك أو بيانات حساسة؛ وصف قصير يكفي.' : 'We do not ask for grades or sensitive data; a short description is enough.'} /><div className="mt-7 grid gap-5 sm:grid-cols-2"><TextField label={rtl ? 'المادة أو المهارة' : 'Subject or skill'} value={primarySubject} onChange={setPrimarySubject} placeholder={rtl ? 'مثال: فيزياء، Python، تحليل بيانات' : 'e.g. Physics, Python, data analysis'} /><TextField label={rtl ? 'مستواك الحالي' : 'Current level'} value={currentLevel} onChange={setCurrentLevel} placeholder={rtl ? 'مثال: أعرف الأساسيات وأتعثر في المسائل' : 'e.g. I know the basics but struggle with problems'} /></div></div>}
          {step === 3 && <div><StepHeading number="04" title={rtl ? 'ما النتيجة التي تريد الوصول إليها؟' : 'What outcome do you want?'} body={rtl ? 'هدف محدد يجعل التوصية قابلة للتنفيذ والقياس.' : 'A specific goal makes recommendations actionable and measurable.'} /><div className="mt-7 grid gap-5 sm:grid-cols-[1fr_.45fr]"><TextField label={rtl ? 'هدف التعلّم' : 'Learning goal'} value={learningGoal} onChange={setLearningGoal} placeholder={rtl ? 'أريد حل مسائل الحركة بثقة قبل الامتحان' : 'I want to solve motion problems confidently before the exam'} multiline /><label className="block"><span className="atlas-label mb-2 flex items-center gap-2"><CalendarDays className="h-4 w-4" />{rtl ? 'تاريخ مستهدف — اختياري' : 'Target date — optional'}</span><input type="date" min={new Date().toISOString().slice(0, 10)} value={targetDate} onChange={(event) => setTargetDate(event.target.value)} className="atlas-field min-h-12" /></label></div></div>}
          {step === 4 && <div><StepHeading number="05" title={rtl ? 'كيف تفضّل أن تتعلّم؟' : 'How do you prefer to learn?'} body={rtl ? 'لغة الشرح وأسلوب البداية؛ فَهيم يعدّل المسار لاحقًا وفق محاولاتك.' : 'Your explanation language and starting style; Fahim adapts later from your attempts.'} /><div className="mt-7 grid gap-7 lg:grid-cols-[.5fr_1fr]"><div><p className="atlas-label mb-3 flex items-center gap-2"><Languages className="h-4 w-4" />{rtl ? 'لغة التعلّم' : 'Learning language'}</p><div className="grid gap-2">{([['ar', 'العربية', 'Arabic'], ['en', 'الإنجليزية', 'English'], ['both', 'العربية + الإنجليزية', 'Arabic + English']] as const).map(([value, ar, en]) => <button type="button" key={value} onClick={() => setPreferredLanguage(value)} className={`flex min-h-12 items-center justify-between border px-4 text-sm font-black ${preferredLanguage === value ? 'border-[#14213D] bg-[#F2B84B] text-[#14213D]' : 'border-[var(--border)] text-[var(--text)] hover:bg-[var(--soft)]'}`}>{rtl ? ar : en}{preferredLanguage === value && <Check className="h-4 w-4" />}</button>)}</div></div><div><p className="atlas-label mb-3">{rtl ? 'أسلوب البداية' : 'Starting style'}</p><div className="grid gap-2 sm:grid-cols-2">{styleOptions.map((item) => <button type="button" key={item.value} onClick={() => setLearningStyle(item.value)} className={`border p-4 text-start ${learningStyle === item.value ? 'border-[#0F766E] bg-[#0F766E] text-white' : 'border-[var(--border)] text-[var(--text)] hover:bg-[var(--soft)]'}`}><strong className="block text-sm">{rtl ? item.ar : item.en}</strong><span className={`mt-2 block text-xs leading-6 ${learningStyle === item.value ? 'text-teal-50' : 'text-[var(--muted)]'}`}>{rtl ? item.detailAr : item.detailEn}</span></button>)}</div></div></div></div>}
        </div>

        {error && <div role="alert" className="mx-5 mb-4 border border-[var(--danger-border)] bg-[var(--danger-surface)] p-3 text-sm font-bold text-[var(--danger-text)] sm:mx-8 lg:mx-10">{error}</div>}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] p-5 sm:px-8">
          <button type="button" disabled={step === 0 || saving} onClick={() => setStep((value) => Math.max(0, value - 1))} className="atlas-secondary disabled:opacity-40"><ArrowBack className="h-4 w-4" />{rtl ? 'السابق' : 'Back'}</button>
          <p className="hidden text-[10px] font-bold text-[var(--muted)] sm:block">{rtl ? 'لا بطاقة مطلوبة · 30 يومًا · إلغاء بلا التزام' : 'No card · 30 days · no commitment'}</p>
          {step < 4 ? <button type="button" onClick={next} className="atlas-primary">{rtl ? 'متابعة' : 'Continue'}<ArrowNext className="h-4 w-4" /></button> : <button type="button" disabled={saving} onClick={() => void finish()} className="atlas-primary">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{rtl ? 'ابدأ تجربتي الكاملة' : 'Start my full trial'}</button>}
        </footer>
      </section>
    </div>
  </main>;
}

function StepHeading({ number, title, body }: { number: string; title: string; body: string }) {
  return <header className="grid gap-3 sm:grid-cols-[3rem_1fr]"><span className="atlas-index">{number}</span><div><h2 className="text-2xl font-black text-[var(--text)] sm:text-3xl">{title}</h2><p className="mt-2 text-sm leading-7 text-[var(--muted)]">{body}</p></div></header>;
}

function ChoiceCard({ selected, onClick, title, icon: Icon }: { selected: boolean; onClick: () => void; title: string; icon: typeof GraduationCap }) {
  return <button type="button" aria-pressed={selected} onClick={onClick} className={`flex min-h-24 items-center gap-4 border p-4 text-start transition ${selected ? 'border-[#14213D] bg-[#F2B84B] text-[#14213D] shadow-[4px_4px_0_#14213D]' : 'border-[var(--border)] text-[var(--text)] hover:-translate-y-0.5 hover:border-[#0F766E]'}`}><span className={`grid h-11 w-11 place-items-center ${selected ? 'bg-[#14213D] text-white' : 'bg-[var(--soft)] text-[var(--nile)]'}`}><Icon className="h-5 w-5" /></span><strong className="text-sm font-black">{title}</strong>{selected && <Check className="ms-auto h-5 w-5" />}</button>;
}

function TextField({ label, value, onChange, placeholder, multiline = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; multiline?: boolean }) {
  return <label className="block"><span className="atlas-label mb-2">{label}</span>{multiline ? <textarea rows={5} maxLength={500} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="atlas-field" /> : <input maxLength={120} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="atlas-field min-h-12" />}</label>;
}
