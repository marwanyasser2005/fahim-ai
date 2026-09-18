import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  BrainCircuit,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock3,
  Database,
  ExternalLink,
  FileCheck2,
  Fullscreen,
  Globe2,
  GraduationCap,
  Languages,
  LockKeyhole,
  Minimize2,
  Moon,
  Network,
  RotateCcw,
  ServerCog,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  UserCheck,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { Language, Theme } from '@/App';
import FahimBrand from '@/components/brand/FahimBrand';
import { calculateEvidenceScore } from '@/lib/learningEvidence';
import { showcaseSession } from '@/data/showcaseScenario';
import '@/styles/showcase-deck.css';

type Props = {
  language: Language;
  setLanguage: (language: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

type LocalCopy = { ar: string; en: string };

const copy = (ar: string, en: string): LocalCopy => ({ ar, en });

const chapters = [
  { id: 'story', short: copy('القصة', 'Story'), title: copy('رحلة الفهم', 'Learning story') },
  { id: 'why', short: copy('لماذا فَهيم؟', 'Why Fahim'), title: copy('محرك إثبات الفهم', 'Proof engine') },
  { id: 'responsible', short: copy('ذكاء مسؤول', 'Responsible AI'), title: copy('قرار يمكن تفسيره', 'Explainable decisions') },
  { id: 'trust', short: copy('الدليل والثقة', 'Evidence'), title: copy('ثقة قابلة للفحص', 'Inspectable trust') },
  { id: 'product', short: copy('إثبات المنتج', 'Product proof'), title: copy('نموذج يعمل الآن', 'Working prototype') },
] as const;

const storySteps = [
  {
    verb: copy('حدّد', 'Define'),
    eyebrow: copy('المصدر والسؤال', 'Source and question'),
    title: copy('ابدأ من مفهوم محدد', 'Start with one clear concept'),
    body: copy('يربط فَهيم السؤال بمصدر موثوق قبل أن يبدأ الشرح.', 'Fahim anchors the question to a trusted source before teaching begins.'),
    signal: copy('قانون نيوتن الثاني، صفحة 42', 'Newton’s second law, page 42'),
    icon: BookOpenCheck,
  },
  {
    verb: copy('حاول', 'Attempt'),
    eyebrow: copy('محاولة أصلية', 'Original attempt'),
    title: copy('دع المتعلم يفكر أولًا', 'Let the learner think first'),
    body: copy('تُحفظ الإجابة كما كتبها الطالب، حتى يظل مسار التغيير ظاهرًا.', 'The learner’s own answer is preserved so the change in thinking stays visible.'),
    signal: copy('ثقة الطالبة: 72%', 'Learner confidence: 72%'),
    icon: FileCheck2,
  },
  {
    verb: copy('شخّص', 'Diagnose'),
    eyebrow: copy('نمط الخطأ', 'Misconception pattern'),
    title: copy('افهم سبب الخطأ', 'Find the reason behind the error'),
    body: copy('الخلط هنا بين السرعة والتسارع، وليس مجرد اختيار خاطئ.', 'The issue is confusion between velocity and acceleration, not just a wrong choice.'),
    signal: copy('فرضية التشخيص: ثقة 91%', 'Diagnostic hypothesis: 91% confidence'),
    icon: BrainCircuit,
  },
  {
    verb: copy('تدخّل', 'Intervene'),
    eyebrow: copy('شرح موجّه', 'Targeted intervention'),
    title: copy('استخدم أقل شرح مفيد', 'Use the smallest useful explanation'),
    body: copy('مقارنة محسوسة، ثم جسر بين المصطلح العربي والإنجليزي.', 'A concrete comparison, followed by an Arabic and English concept bridge.'),
    signal: copy('مثال + توقع + سؤال متابعة', 'Analogy + prediction + follow-up'),
    icon: Sparkles,
  },
  {
    verb: copy('صحّح', 'Correct'),
    eyebrow: copy('إعادة المحاولة', 'Second attempt'),
    title: copy('الطالب يصلح النموذج بنفسه', 'The learner repairs the model'),
    body: copy('لا يمنح فَهيم الإجابة فقط؛ يطلب تفسيرًا جديدًا يمكن مقارنته بالمحاولة الأولى.', 'Fahim asks for a new explanation that can be compared with the first attempt.'),
    signal: copy('تفسير صحيح + تطبيق عددي', 'Correct explanation + numeric application'),
    icon: RotateCcw,
  },
  {
    verb: copy('أثبت', 'Prove'),
    eyebrow: copy('سجل الدليل', 'Evidence ledger'),
    title: copy('حوّل التقدم إلى دليل', 'Turn progress into evidence'),
    body: copy('المصدر والمحاولة والتدخل والتصحيح تظهر في أثر واحد قابل للمراجعة.', 'Source, attempt, intervention, and correction form one inspectable record.'),
    signal: copy('قوة الدليل: 85 من 100', 'Evidence strength: 85 of 100'),
    icon: BadgeCheck,
  },
  {
    verb: copy('طبّق', 'Transfer'),
    eyebrow: copy('سياق جديد', 'New context'),
    title: copy('اختبر الفهم خارج المثال', 'Test understanding beyond the example'),
    body: copy('مسألة جديدة تكشف هل انتقل المفهوم فعلًا أم حُفظت صياغة واحدة.', 'A new problem checks whether the concept transferred or only one answer was memorized.'),
    signal: copy('انتقال ناجح إلى سياق جديد', 'Successful transfer to a new context'),
    icon: Target,
  },
  {
    verb: copy('استرجع', 'Recall'),
    eyebrow: copy('مراجعة متباعدة', 'Spaced review'),
    title: copy('راجع قبل أن يضيع الفهم', 'Review before understanding fades'),
    body: copy('يُحدد موعد المراجعة من قوة الدليل، لا من جدول ثابت للجميع.', 'The next review is set by evidence strength, not one fixed schedule for everyone.'),
    signal: copy('المراجعة التالية بعد 3 أيام', 'Next recall check in 3 days'),
    icon: Clock3,
  },
  {
    verb: copy('أتقن', 'Master'),
    eyebrow: copy('إتقان قابل للتحقق', 'Verified mastery'),
    title: copy('أغلق الحلقة بثقة', 'Close the loop with confidence'),
    body: copy('يظهر الإنجاز بعد تكرار النجاح في الفهم والتطبيق والاسترجاع.', 'Achievement appears after repeated success in explanation, transfer, and recall.'),
    signal: copy('جاهز للانتقال إلى المفهوم التالي', 'Ready for the next concept'),
    icon: GraduationCap,
  },
] as const;

const proofNodes = [
  { icon: Network, title: copy('خريطة دليل التعلم', 'Learning Evidence Graph'), body: copy('تربط المحاولة والخطأ والتدخل والإتقان في سجل واحد.', 'Connects attempt, error, intervention, and mastery in one record.') },
  { icon: BrainCircuit, title: copy('أطلس التصورات الخاطئة', 'Misconception Atlas'), body: copy('يحوّل الخطأ إلى نمط يمكن تفسيره ومتابعته.', 'Turns errors into explainable, trackable patterns.') },
  { icon: Clock3, title: copy('طابور الذاكرة', 'Memory Queue'), body: copy('يرتب المراجعة حسب ضعف الدليل واحتمال النسيان.', 'Prioritizes recall by evidence weakness and forgetting risk.') },
  { icon: Languages, title: copy('جسر المفاهيم الثنائي', 'Bilingual Concept Bridge'), body: copy('يربط المصطلح العربي والإنجليزي بالمعنى والاستخدام.', 'Connects Arabic and English terms to meaning and use.') },
  { icon: BadgeCheck, title: copy('جواز إثبات التعلم', 'Proof-of-Learning Passport'), body: copy('يجمع الشارات والشهادات وسجل التحقق العام.', 'Combines badges, credentials, and public verification.') },
] as const;

const responsibleSteps = [
  { icon: BookOpenCheck, title: copy('الدليل', 'Evidence'), body: copy('مصدر محدد ومقتطف يمكن الرجوع إليه.', 'A precise source and a traceable excerpt.') },
  { icon: Sparkles, title: copy('اقتراح الذكاء', 'AI proposal'), body: copy('شرح أو تشخيص مرتبط بما ظهر في المحاولة.', 'An explanation or diagnosis grounded in the attempt.') },
  { icon: CircleDot, title: copy('درجة الثقة', 'Confidence'), body: copy('الثقة ظاهرة، وحدود الاستنتاج مكتوبة بوضوح.', 'Confidence is visible and inference limits are explicit.') },
  { icon: UserCheck, title: copy('القرار البشري', 'Human decision'), body: copy('المعلم والمتعلم يظلان أصحاب القرار النهائي.', 'Teachers and learners remain accountable for the final decision.') },
] as const;

const trustItems = [
  { icon: FileCheck2, title: copy('عقد الدليل', 'Evidence contract'), value: copy('موثّق، مستنتج، تعليمي، عام، أو يحتاج مراجعة', 'Verified, inferred, instructional, general, or review needed') },
  { icon: LockKeyhole, title: copy('حدود الخصوصية', 'Privacy boundary'), value: copy('المعلم يرى النمط المجمع، لا المحادثة الخاصة', 'Teachers see aggregate patterns, not private conversations') },
  { icon: ShieldCheck, title: copy('شهادة إتمام قابلة للتحقق', 'Verifiable completion credential'), value: copy('رمز فريد وسجل عام. الاعتماد الأكاديمي لا يظهر إلا بعد شراكة موثقة.', 'Unique ID and public registry. Academic accreditation only after a documented partnership.') },
  { icon: RotateCcw, title: copy('فرضيات قابلة للتحديث', 'Revisable hypotheses'), value: copy('كل محاولة جديدة تعيد تقييم الفهم', 'Every new attempt updates the understanding model') },
] as const;

export default function Showcase({ language, setLanguage, theme, setTheme }: Props) {
  const rtl = language === 'ar';
  const reduceMotion = useReducedMotion();
  const [chapter, setChapter] = useState(0);
  const [storyStep, setStoryStep] = useState(0);
  const [proofNode, setProofNode] = useState(0);
  const [responsibleStep, setResponsibleStep] = useState(0);
  const [trustStep, setTrustStep] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const pointerStart = useRef<number | null>(null);
  const PrevIcon = rtl ? ChevronRight : ChevronLeft;
  const ForwardIcon = rtl ? ChevronLeft : ChevronRight;
  const evidenceScore = useMemo(() => calculateEvidenceScore(showcaseSession.mastery), []);

  const goForward = useCallback(() => {
    if (chapter === 0 && storyStep < storySteps.length - 1) setStoryStep((value) => value + 1);
    else if (chapter < chapters.length - 1) setChapter((value) => value + 1);
  }, [chapter, storyStep]);

  const goBack = useCallback(() => {
    if (chapter === 0 && storyStep > 0) setStoryStep((value) => value - 1);
    else if (chapter > 0) setChapter((value) => value - 1);
  }, [chapter, storyStep]);

  useEffect(() => {
    document.body.classList.add('showcase-active');
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') rtl ? goBack() : goForward();
      if (event.key === 'ArrowLeft') rtl ? goForward() : goBack();
      if (event.key === 'Escape' && document.fullscreenElement) void document.exitFullscreen();
    };
    const onFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => {
      document.body.classList.remove('showcase-active');
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('fullscreenchange', onFullscreen);
    };
  }, [goBack, goForward, rtl]);

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  };

  const finishPointer = (x: number, target: EventTarget | null) => {
    if (pointerStart.current === null || (target instanceof Element && target.closest('button, a, input'))) {
      pointerStart.current = null;
      return;
    }
    const distance = x - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(distance) < 56) return;
    const physicalForward = distance < 0;
    if (rtl ? !physicalForward : physicalForward) goForward();
    else goBack();
  };

  return (
    <main className="showcase-deck" dir={rtl ? 'rtl' : 'ltr'}>
      <header className="showcase-deck__header">
        <Link to="/" className="showcase-deck__brand" aria-label={rtl ? 'العودة إلى فَهيم' : 'Back to Fahim'}>
          <FahimBrand language={language} compact />
        </Link>
        <nav className="showcase-deck__chapters" aria-label={rtl ? 'فصول العرض' : 'Showcase chapters'}>
          {chapters.map((item, index) => (
            <button key={item.id} type="button" onClick={() => setChapter(index)} className={index === chapter ? 'is-active' : ''} aria-current={index === chapter ? 'step' : undefined}>
              <span>{String(index + 1).padStart(2, '0')}</span>{item.short[language]}
            </button>
          ))}
        </nav>
        <div className="showcase-deck__tools">
          <span className="showcase-deck__data-label">{rtl ? 'بيانات توضيحية' : 'illustrative data'}</span>
          <span className="showcase-deck__count" aria-label={`${chapter + 1} / ${chapters.length}`}>{String(chapter + 1).padStart(2, '0')} / {String(chapters.length).padStart(2, '0')}</span>
          <button type="button" onClick={() => setLanguage(rtl ? 'en' : 'ar')} aria-label={rtl ? 'Switch to English' : 'التبديل إلى العربية'}><Globe2 /> <span>{rtl ? 'EN' : 'ع'}</span></button>
          <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={rtl ? 'تبديل المظهر' : 'Toggle theme'}>{theme === 'dark' ? <Sun /> : <Moon />}</button>
          <button type="button" onClick={() => void toggleFullscreen()} aria-label={rtl ? 'وضع العرض الكامل' : 'Fullscreen story mode'}>{isFullscreen ? <Minimize2 /> : <Fullscreen />}</button>
          <Link to="/" aria-label={rtl ? 'إنهاء العرض' : 'Exit showcase'}><X /></Link>
        </div>
      </header>

      <div className="showcase-deck__chapter-progress" aria-hidden="true"><i style={{ width: `${((chapter + 1) / chapters.length) * 100}%` }} /></div>

      <section
        className="showcase-deck__viewport"
        onPointerDown={(event) => { pointerStart.current = event.clientX; }}
        onPointerUp={(event) => finishPointer(event.clientX, event.target)}
        onPointerCancel={() => { pointerStart.current = null; }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={chapters[chapter].id}
            className="showcase-deck__scene"
            initial={reduceMotion ? false : { opacity: 0, x: rtl ? -28 : 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: rtl ? 20 : -20 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          >
            {chapter === 0 && <StoryScene language={language} step={storyStep} score={evidenceScore} reduceMotion={reduceMotion} />}
            {chapter === 1 && <ProofEngineScene language={language} selected={proofNode} setSelected={setProofNode} />}
            {chapter === 2 && <ResponsibleScene language={language} selected={responsibleStep} setSelected={setResponsibleStep} />}
            {chapter === 3 && <TrustScene language={language} selected={trustStep} setSelected={setTrustStep} />}
            {chapter === 4 && <ProductProofScene language={language} />}
          </motion.div>
        </AnimatePresence>
      </section>

      <footer className="showcase-deck__footer">
        {chapter === 0 ? (
          <StoryRail language={language} step={storyStep} setStep={setStoryStep} />
        ) : (
          <div className="showcase-deck__chapter-summary">
            <span>{String(chapter + 1).padStart(2, '0')}</span>
            <div><small>{chapters[chapter].short[language]}</small><strong>{chapters[chapter].title[language]}</strong></div>
          </div>
        )}
        <div className="showcase-deck__nav-buttons">
          <button type="button" onClick={goBack} disabled={chapter === 0 && storyStep === 0} aria-label={rtl ? 'السابق' : 'Previous'}><PrevIcon /></button>
          <span>{rtl ? 'اسحب أو استخدم الأسهم' : 'Swipe or use arrow keys'}</span>
          <button type="button" onClick={goForward} disabled={chapter === chapters.length - 1} aria-label={rtl ? 'التالي' : 'Next'}><ForwardIcon /></button>
        </div>
      </footer>
    </main>
  );
}

function StoryScene({ language, step, score, reduceMotion }: { language: Language; step: number; score: number; reduceMotion: boolean | null }) {
  const item = storySteps[step];
  const Icon = item.icon;
  return (
    <div className="showcase-stage">
      <div className="showcase-stage__visual" aria-label={language === 'ar' ? 'محاكاة رحلة التعلم' : 'Learning journey simulation'}>
        <div className="showcase-stage__visual-head"><span>LEARNING TRACE</span><b>{String(step + 1).padStart(2, '0')} / 09</b></div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step} className="showcase-simulation" initial={reduceMotion ? false : { opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} exit={reduceMotion ? undefined : { opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="showcase-simulation__orbit" aria-hidden="true"><i /><i /><i /></div>
            <span className="showcase-simulation__icon"><Icon /></span>
            <p>{item.eyebrow[language]}</p>
            <h2>{item.title[language]}</h2>
            <StoryArtifact language={language} step={step} score={score} />
          </motion.div>
        </AnimatePresence>
      </div>
      <aside className="showcase-stage__narrative" aria-live="polite">
        <p className="showcase-kicker"><span /> {item.eyebrow[language]}</p>
        <h1>{item.title[language]}</h1>
        <p className="showcase-stage__body">{item.body[language]}</p>
        <div className="showcase-stage__signal"><small>{language === 'ar' ? 'إشارة مسجلة' : 'Recorded signal'}</small><strong>{item.signal[language]}</strong></div>
        <div className="showcase-stage__source"><ShieldCheck /><span><b>{language === 'ar' ? 'سجل قابل للفحص' : 'Inspectable record'}</b><small>{showcaseSession.sourceTitle}</small></span></div>
      </aside>
    </div>
  );
}

function StoryArtifact({ language, step, score }: { language: Language; step: number; score: number }) {
  const rtl = language === 'ar';
  if (step === 0) return <div className="showcase-artifact source"><BookOpenCheck /><span><b>{rtl ? 'المصدر المعتمد' : 'Anchored source'}</b><small>{showcaseSession.sourceTitle} · {showcaseSession.sourceLocation}</small></span></div>;
  if (step === 1) return <blockquote className="showcase-artifact quote">{rtl ? '«القوة الأكبر تجعل الجسم أسرع دائمًا، حتى لو تغيرت كتلته.»' : '“More force always makes an object faster, even if its mass changes.”'}</blockquote>;
  if (step === 2) return <div className="showcase-artifact diagnosis"><span>{rtl ? 'السرعة' : 'Velocity'}</span><i>≠</i><span>{rtl ? 'التسارع' : 'Acceleration'}</span></div>;
  if (step === 3) return <div className="showcase-artifact carts"><span>m</span><i>F →</i><span>2m</span><i>F →</i></div>;
  if (step === 4) return <div className="showcase-artifact correction"><Check /> <span>{rtl ? 'عند ثبات الكتلة، زيادة القوة تزيد التسارع.' : 'At constant mass, greater force creates greater acceleration.'}</span></div>;
  if (step === 5) return <div className="showcase-artifact score"><strong>{score}</strong><span>/100</span><small>{rtl ? 'قوة دليل الفهم' : 'Evidence strength'}</small></div>;
  if (step === 6) return <div className="showcase-artifact transfer"><Target /><span><b>{rtl ? 'سياق جديد' : 'New context'}</b><small>{rtl ? 'مصعد يحمل كتلة متغيرة' : 'An elevator carrying a changing mass'}</small></span></div>;
  if (step === 7) return <div className="showcase-artifact recall"><b>{rtl ? 'اليوم' : 'Today'}</b><i /><b>+3</b><i /><b>+9</b></div>;
  return <div className="showcase-artifact mastery"><BadgeCheck /><span><b>{rtl ? 'فهم مثبت' : 'Verified understanding'}</b><small>{rtl ? 'شرح + تطبيق + استرجاع' : 'Explain + transfer + recall'}</small></span></div>;
}

function StoryRail({ language, step, setStep }: { language: Language; step: number; setStep: (step: number) => void }) {
  const railRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    railRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [step]);
  return <div ref={railRef} className="showcase-step-rail" role="tablist" aria-label={language === 'ar' ? 'مراحل رحلة التعلم' : 'Learning journey steps'}>
    {storySteps.map((item, index) => (
      <button key={item.verb.en} type="button" role="tab" aria-selected={index === step} className={index === step ? 'is-current' : index < step ? 'is-complete' : ''} onClick={() => setStep(index)}>
        <span>{index < step ? <Check /> : String(index + 1).padStart(2, '0')}</span><small>{item.verb[language]}</small>
      </button>
    ))}
  </div>;
}

function ProofEngineScene({ language, selected, setSelected }: { language: Language; selected: number; setSelected: (value: number) => void }) {
  const active = proofNodes[selected];
  const Icon = active.icon;
  return <div className="showcase-focus-scene">
    <header className="showcase-focus-scene__heading"><p className="showcase-kicker"><span /> WHY FAHIM / 02</p><h1>{language === 'ar' ? 'اختلاف يمكن رؤيته واختباره.' : 'A difference you can see and test.'}</h1><p>{language === 'ar' ? 'كل قدرة تعود إلى محرك واحد: إثبات أن الفهم تغيّر فعلًا.' : 'Every capability returns to one engine: proving that understanding actually changed.'}</p></header>
    <div className="proof-engine">
      <div className="proof-engine__map">
        <div className="proof-engine__path" aria-hidden="true" />
        <div className="proof-engine__core"><img src="/brand/fahim-symbol-v32.png" alt="" /><b>{language === 'ar' ? 'محرك إثبات الفهم' : 'Fahim Proof Engine'}</b><small>{language === 'ar' ? 'محاولة ← دليل ← إتقان' : 'Attempt → evidence → mastery'}</small></div>
        {proofNodes.map((node, index) => { const NodeIcon = node.icon; return <button key={node.title.en} type="button" className={index === selected ? 'is-active' : ''} onClick={() => setSelected(index)} style={{ '--node-index': index } as CSSProperties}><NodeIcon /><span>{node.title[language]}</span></button>; })}
      </div>
      <aside className="proof-engine__detail"><span>{String(selected + 1).padStart(2, '0')} / 05</span><Icon /><h2>{active.title[language]}</h2><p>{active.body[language]}</p><div><CircleDot />{language === 'ar' ? 'سلوك ظاهر داخل المنتج، وليس وعدًا تسويقيًا.' : 'Visible product behavior, not a marketing promise.'}</div></aside>
    </div>
  </div>;
}

function ResponsibleScene({ language, selected, setSelected }: { language: Language; selected: number; setSelected: (value: number) => void }) {
  const active = responsibleSteps[selected];
  const Icon = active.icon;
  return <div className="showcase-focus-scene">
    <header className="showcase-focus-scene__heading"><p className="showcase-kicker"><span /> RESPONSIBLE AI / 03</p><h1>{language === 'ar' ? 'الذكاء يقترح، والدليل يضبط القرار.' : 'AI proposes. Evidence constrains.'}</h1><p>{language === 'ar' ? 'المصدر والثقة والمسؤولية تظهر في لحظة الإجابة، لا في صفحة شروط بعيدة.' : 'Source, confidence, and accountability appear at the point of answer.'}</p></header>
    <div className="responsible-flow">
      <div className="responsible-flow__rail">
        {responsibleSteps.map((item, index) => { const StepIcon = item.icon; return <button key={item.title.en} type="button" className={index === selected ? 'is-active' : index < selected ? 'is-complete' : ''} onClick={() => setSelected(index)}><span>{index < selected ? <Check /> : <StepIcon />}</span><b>{item.title[language]}</b></button>; })}
      </div>
      <motion.div key={selected} className="responsible-flow__stage" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><div><Icon /></div><span>{String(selected + 1).padStart(2, '0')} / 04</span><h2>{active.title[language]}</h2><p>{active.body[language]}</p><small>{language === 'ar' ? 'AI يقترح. الدليل يحدد الثقة. الإنسان يقرر.' : 'AI proposes. Evidence sets confidence. Humans decide.'}</small></motion.div>
    </div>
  </div>;
}

function TrustScene({ language, selected, setSelected }: { language: Language; selected: number; setSelected: (value: number) => void }) {
  const active = trustItems[selected];
  const Icon = active.icon;
  return <div className="showcase-focus-scene">
    <header className="showcase-focus-scene__heading"><p className="showcase-kicker"><span /> EVIDENCE & TRUST / 04</p><h1>{language === 'ar' ? 'الثقة منتج، وليست عبارة.' : 'Trust is a product feature.'}</h1><p>{language === 'ar' ? 'كل ادعاء له مصدر، وكل إنجاز له سجل، وكل قرار له حدود واضحة.' : 'Every claim has a source, every achievement a record, and every decision clear limits.'}</p></header>
    <div className="trust-console">
      <div className="trust-console__list">{trustItems.map((item, index) => { const ItemIcon = item.icon; return <button key={item.title.en} type="button" className={index === selected ? 'is-active' : ''} onClick={() => setSelected(index)}><ItemIcon /><span><b>{item.title[language]}</b><small>{String(index + 1).padStart(2, '0')}</small></span><ChevronRight /></button>; })}</div>
      <div className="trust-console__record"><span className="credential-seal"><img src="/brand/fahim-symbol-v32.png" alt="" /></span><p>{String(selected + 1).padStart(2, '0')} / 04</p><Icon /><h2>{active.title[language]}</h2><strong>{active.value[language]}</strong><div className="trust-console__verified"><BadgeCheck />{language === 'ar' ? 'قابل للفحص في نفس واجهة القرار' : 'Inspectable in the same decision interface'}</div></div>
    </div>
  </div>;
}

function ProductProofScene({ language }: { language: Language }) {
  const rtl = language === 'ar';
  return <div className="showcase-focus-scene product-proof-scene">
    <header className="showcase-focus-scene__heading"><p className="showcase-kicker"><span /> PRODUCT PROOF / 05</p><h1>{rtl ? 'الفكرة تعمل الآن.' : 'The idea works now.'}</h1><p>{rtl ? 'هذه مؤشرات تنفيذ قابلة للفحص، وليست نتائج تجريبية مختلقة.' : 'These are inspectable implementation signals, not invented pilot outcomes.'}</p></header>
    <div className="product-proof">
      <div className="product-proof__pipeline">
        <ProofUnit icon={BookOpenCheck} title={rtl ? 'مصدر' : 'Source'} note={rtl ? 'RAG واستشهادات' : 'RAG and citations'} />
        <ProofUnit icon={BrainCircuit} title={rtl ? 'تعلم' : 'Learn'} note={rtl ? 'تشخيص وتدخل' : 'Diagnosis and intervention'} />
        <ProofUnit icon={Database} title={rtl ? 'دليل' : 'Evidence'} note={rtl ? 'سجل محمي' : 'Protected record'} />
        <ProofUnit icon={BadgeCheck} title={rtl ? 'إنجاز' : 'Credential'} note={rtl ? 'تحقق عام' : 'Public verification'} />
      </div>
      <div className="product-proof__facts">
        <Fact icon={Check} value="155" label={rtl ? 'اختبارًا آليًا ناجحًا' : 'automated tests passing'} />
        <Fact icon={ShieldCheck} value="65" label={rtl ? 'جدولًا بسياسات RLS' : 'tables protected by RLS'} />
        <Fact icon={Globe2} value="AR / EN" label={rtl ? 'تجربة ثنائية اللغة' : 'bilingual experience'} />
        <Fact icon={ServerCog} value="LIVE" label={rtl ? 'نموذج منشور' : 'deployed prototype'} />
      </div>
      <div className="product-proof__cta"><div><img src="/brand/fahim-symbol-v32.png" alt="" /><span><b>{rtl ? 'الفهم الذي يمكنك إثباته' : 'Verified learning'}</b><small>{rtl ? 'ابدأ رحلة تعلم حقيقية داخل المنتج.' : 'Start a real learning journey in the product.'}</small></span></div><div><Link to="/register" className="atlas-primary">{rtl ? 'ابدأ مجانًا' : 'Start free'}<ArrowRight /></Link><Link to="/evidence" className="atlas-secondary">{rtl ? 'افحص الدليل' : 'Inspect evidence'}<ExternalLink /></Link></div></div>
    </div>
  </div>;
}

function ProofUnit({ icon: Icon, title, note }: { icon: LucideIcon; title: string; note: string }) {
  return <article><span><Icon /></span><b>{title}</b><small>{note}</small></article>;
}

function Fact({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
  return <article><Icon /><strong>{value}</strong><span>{label}</span></article>;
}
