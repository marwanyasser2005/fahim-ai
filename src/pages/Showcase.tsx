import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  GraduationCap,
  Network,
  Play,
  RotateCcw,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import type { Language } from '@/App';
import EvidenceGraph from '@/components/learning/EvidenceGraph';
import UnderstandingMap from '@/components/learning/UnderstandingMap';
import MisconceptionLens from '@/components/learning/MisconceptionLens';
import MasteryJourney from '@/components/learning/MasteryJourney';
import { calculateEvidenceScore } from '@/lib/learningEvidence';
import { showcaseSession, showcaseTeacherInsight } from '@/data/showcaseScenario';

type Props = { language: Language };

const stepCopy = [
  {
    ar: { label: '01، المصدر والتشخيص', title: 'مريم تبدأ من سؤال، لا من إجابة جاهزة.', body: 'يربط فَهيم المفهوم بمصدر محدد، ثم يطلب محاولة قصيرة تكشف نقطة البداية الحقيقية.', signal: 'ما الذي يتغير عندما تؤثر قوة أكبر على نفس الكتلة؟' },
    en: { label: '01، Source & diagnostic', title: 'Mariam starts with a question, not a ready-made answer.', body: 'Fahim anchors the concept to a specific source, then asks for a short attempt that reveals the real starting point.', signal: 'What changes when a larger force acts on the same mass?' },
  },
  {
    ar: { label: '02، محاولة أصلية', title: 'المحاولة تحفظ كما هي؛ لا تُطمس بعد التصحيح.', body: 'قالت مريم إن القوة الأكبر تجعل الجسم أسرع دائمًا، حتى لو تغيّرت كتلته.', signal: 'ثقة المتعلّمة في الإجابة: 72%' },
    en: { label: '02، Original attempt', title: 'The attempt stays visible; correction does not erase it.', body: 'Mariam said a larger force always makes an object faster, even when its mass changes.', signal: 'Learner confidence: 72%' },
  },
  {
    ar: { label: '03، تشخيص الخطأ', title: 'المشكلة ليست “إجابة خاطئة” فقط.', body: 'اكتشف فَهيم خلطًا بين السرعة والتسارع، مع إهمال أثر الكتلة. هذا نمط مفاهيمي قابل للتدخل.', signal: 'ثقة التشخيص: 91%، فرضية قابلة للتحديث' },
    en: { label: '03، Misconception', title: 'The problem is more than a “wrong answer.”', body: 'Fahim detects confusion between velocity and acceleration while ignoring mass—a teachable conceptual pattern.', signal: 'Diagnostic confidence: 91%، a revisable hypothesis' },
  },
  {
    ar: { label: '04، تدخل موجّه', title: 'شرح أقل، مقارنة أذكى.', body: 'يقارن فَهيم عربتي تسوق مختلفتي الكتلة تحت نفس القوة، ويربط التسارع بكلمة acceleration.', signal: 'تدخل: مثال حسي + جسر عربي/إنجليزي + سؤال توقع' },
    en: { label: '04، Targeted intervention', title: 'Less exposition, a smarter comparison.', body: 'Fahim compares two shopping carts with different masses under the same force and bridges acceleration to التسارع.', signal: 'Intervention: concrete analogy + bilingual bridge + prediction' },
  },
  {
    ar: { label: '05، إعادة المحاولة', title: 'مريم تصلح نموذجها العقلي بنفسها.', body: 'عند ثبات الكتلة، زيادة القوة تزيد التسارع. وعند ثبات القوة، زيادة الكتلة تقلل التسارع.', signal: 'شرح صحيح + تطبيق عددي واحد' },
    en: { label: '05، Retry', title: 'Mariam repairs the mental model herself.', body: 'At constant mass, more force creates more acceleration. At constant force, more mass creates less acceleration.', signal: 'Correct explanation + one numerical application' },
  },
  {
    ar: { label: '06، دليل التعلّم', title: 'التقدّم هنا قابل للفحص، لا مجرد شريط مكتمل.', body: 'يجمع فَهيم المحاولة والتشخيص والتدخل والإعادة والمصدر في أثر واحد مع أبعاد واضحة للإتقان.', signal: 'درجة الدليل المركبة: 85/100' },
    en: { label: '06، Learning evidence', title: 'Progress is inspectable, not just a completed bar.', body: 'Fahim combines the attempt, diagnosis, intervention, retry, and source into one artifact with clear mastery dimensions.', signal: 'Composite evidence score: 85/100' },
  },
  {
    ar: { label: '07، الذاكرة والمعلم', title: 'تنتهي الجلسة بخطوة تالية ذات معنى.', body: 'تُجدول مراجعة استرجاعية بعد 3 أيام، بينما يرى المعلم نمط الخطأ المجمع دون قراءة محادثات الطلاب.', signal: 'الخصوصية: إشارة صفية مجمعة، لا محادثات شخصية' },
    en: { label: '07، Memory & teacher', title: 'The session ends with a meaningful next action.', body: 'A recall check is scheduled in three days, while the teacher sees an aggregate pattern without reading student chats.', signal: 'Privacy: aggregate class signal, not private conversations' },
  },
] as const;

export default function Showcase({ language }: Props) {
  const [step, setStep] = useState(0);
  const reduceMotion = useReducedMotion();
  const rtl = language === 'ar';
  const content = stepCopy[step][language];
  const Arrow = rtl ? ArrowLeft : ArrowRight;
  const Previous = rtl ? ChevronRight : ChevronLeft;
  const Next = rtl ? ChevronLeft : ChevronRight;
  const evidenceScore = calculateEvidenceScore(showcaseSession.mastery);
  const eventTime = useMemo(() => `${String(step * 2).padStart(2, '0')}:${step ? '00' : '00'}`, [step]);

  return (
    <main className="showcase-page">
      <section className="showcase-hero">
        <div className="atlas-grid absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-[96rem] px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
          <div className="showcase-status-row">
            <span className="showcase-demo-badge"><span />{rtl ? 'بيئة عرض جاهزة، بيانات توضيحية' : 'Prepared demo، illustrative data'}</span>
            <span>{rtl ? 'GenAI for Education Hackathon 2026' : 'GenAI for Education Hackathon 2026'}</span>
          </div>
          <div className="mt-10 grid items-end gap-10 xl:grid-cols-[1.05fr_.95fr]">
            <div>
              <p className="atlas-kicker"><BadgeCheck className="h-4 w-4" />{rtl ? 'نظام تعلم قائم على الدليل' : 'Evidence-based AI learning system'}</p>
              <h1 className="showcase-title mt-6">
                {rtl ? <>افهمها. <em>اثبتها.</em><br />افتكرها.</> : <>Learn it. <em>Prove it.</em><br />Remember it.</>}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--muted)] sm:text-lg">
                {rtl ? 'فَهيم لا يكتفي بشرح الإجابة. هو يتتبع كيف تغيّر فهم المتعلم من المحاولة الأولى إلى دليل يمكن مراجعته واسترجاعه لاحقًا.' : 'Fahim does not stop at explaining an answer. It tracks how understanding changes from the first attempt to evidence that can be inspected and recalled later.'}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" className="atlas-primary" onClick={() => setStep((value) => value === 6 ? 0 : value + 1)}>
                  {step === 6 ? (rtl ? 'أعد القصة' : 'Replay story') : (rtl ? 'تابع القصة' : 'Continue story')}<Arrow className="h-4 w-4" />
                </button>
                <Link to="/register" className="atlas-secondary">{rtl ? 'ابدأ مسارك الحقيقي' : 'Start your learning path'}</Link>
                <Link to="/evidence" className="atlas-secondary">{rtl ? 'افتح غرفة الأدلة' : 'Open the evidence room'}</Link>
              </div>
            </div>
            <div className="showcase-hero-card" aria-label={rtl ? 'نظرة سريعة على جلسة مريم' : "Mariam's learning session at a glance"}>
              <div className="flex items-start justify-between gap-4">
                <div><p className="atlas-section-number">LEARNER / 01</p><h2>{rtl ? 'مريم · فيزياء ثانوية عامة' : 'Mariam · Secondary physics'}</h2></div>
                <span className="showcase-score"><bdi>{evidenceScore}</bdi><small>/100</small></span>
              </div>
              <div className="showcase-concept-bridge">
                <span>{showcaseSession.conceptAr}</span><i aria-hidden="true" /><span dir="ltr">{showcaseSession.conceptEn}</span>
              </div>
              <EvidenceGraph session={showcaseSession} language={language} visibleSteps={step + 1} compact />
            </div>
          </div>
        </div>
      </section>

      <section className="showcase-story" aria-labelledby="story-title">
        <div className="mx-auto max-w-[96rem] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="showcase-section-head">
            <div><p className="atlas-section-number">VERIFIED LEARNING LOOP / 01</p><h2 id="story-title">{rtl ? 'قصة تعلّم كاملة في أقل من 90 ثانية.' : 'A complete learning story in under 90 seconds.'}</h2></div>
            <p>{rtl ? 'اختر أي خطوة لترى ماذا يعرف النظام، ولماذا يوصي بالخطوة التالية.' : 'Choose any step to see what the system knows and why it recommends the next action.'}</p>
          </div>
          <div className="mt-10 grid gap-6 xl:grid-cols-[20rem_1fr]">
            <EvidenceGraph session={showcaseSession} language={language} visibleSteps={step + 1} />
            <motion.article key={step} initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .26 }} className="showcase-stage" aria-live="polite">
              <div className="showcase-stage-meta"><span>{content.label}</span><span><Clock3 className="h-4 w-4" /><bdi>{eventTime}</bdi></span></div>
              <div className="showcase-stage-body">
                <div>
                  <span className="showcase-stage-icon">{step < 2 ? <BookOpenCheck /> : step === 2 ? <BrainCircuit /> : step < 5 ? <BrainCircuit /> : step === 5 ? <BadgeCheck /> : <Clock3 />}</span>
                  <h3>{content.title}</h3>
                  <p>{content.body}</p>
                  <div className="showcase-signal"><span>{rtl ? 'إشارة مسجلة' : 'Recorded signal'}</span><strong>{content.signal}</strong></div>
                  {step === 0 && <div className="showcase-source"><ShieldCheck /><div><b>{rtl ? 'موثّق بمصدر' : 'Verified source'}</b><span>{showcaseSession.sourceTitle} · {showcaseSession.sourceLocation}</span></div></div>}
                  {step === 2 && <div className="showcase-misconception"><b>{rtl ? 'النمط المفاهيمي' : 'Conceptual pattern'}</b><span>{rtl ? 'الخلط بين السرعة والتسارع' : 'Confusing velocity with acceleration'}</span><small>{rtl ? 'التشخيص فرضية، ويُعاد تقييمه بعد كل محاولة.' : 'The diagnosis is a hypothesis and is re-evaluated after each attempt.'}</small></div>}
                  {step === 2 && <MisconceptionLens session={showcaseSession} language={language} />}
                  {step === 5 && <UnderstandingMap session={showcaseSession} language={language} />}
                  {step === 6 && <TeacherInsight language={language} />}
                </div>
                <aside className="showcase-ledger">
                  <p className="atlas-section-number">EVIDENCE LEDGER</p>
                  {showcaseSession.events.map((event, index) => (
                    <div key={event.id} data-visible={index <= step}>
                      <span>{index < step ? <CheckCircle2 /> : index === step ? <Play /> : <span />}</span>
                      <div><b>{stepCopy[index][language].label.replace(/^\d+\s—\s/, '')}</b>{index <= step && <small>{event.summary}</small>}</div>
                    </div>
                  ))}
                </aside>
              </div>
              <footer>
                <button type="button" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}><Previous />{rtl ? 'السابق' : 'Previous'}</button>
                <div>{stepCopy.map((_, index) => <button key={index} type="button" className={index === step ? 'active' : ''} onClick={() => setStep(index)} aria-label={`${rtl ? 'الخطوة' : 'Step'} ${index + 1}`} aria-current={index === step ? 'step' : undefined} />)}</div>
                <button type="button" onClick={() => setStep((value) => Math.min(6, value + 1))} disabled={step === 6}>{rtl ? 'التالي' : 'Next'}<Next /></button>
              </footer>
            </motion.article>
          </div>
        </div>
      </section>

      <section className="bg-[var(--surface)]">
        <div className="mx-auto max-w-[96rem] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <MasteryJourney language={language} session={showcaseSession} />
        </div>
      </section>

      <section className="showcase-proof">
        <div className="mx-auto max-w-[96rem] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="showcase-section-head light">
            <div><p className="atlas-section-number">WHY FAHIM / 02</p><h2>{rtl ? 'فرق يمكن للّجنة رؤيته، لا وعود تسويقية.' : 'A distinction judges can inspect—not a marketing promise.'}</h2></div>
            <p>{rtl ? 'كل بطاقة أدناه مربوطة ببيانات أو سلوك ظاهر داخل نسخة العرض.' : 'Every card below maps to visible behavior or data in the demo build.'}</p>
          </div>
          <div className="showcase-value-grid">
            <Value icon={Network} number="01" title={rtl ? 'Learning Evidence Graph' : 'Learning Evidence Graph'} body={rtl ? 'يسجل العلاقة بين المحاولة والخطأ والتدخل والإتقان بدل عدّ الدقائق.' : 'Connects attempt, error, intervention, and mastery instead of counting minutes.'} />
            <Value icon={BrainCircuit} number="02" title={rtl ? 'Misconception Atlas' : 'Misconception Atlas'} body={rtl ? 'يحوّل الإجابة الخاطئة إلى نمط قابل للتفسير والتدخل والمتابعة.' : 'Turns a wrong answer into an explainable, actionable, trackable pattern.'} />
            <Value icon={Clock3} number="03" title={rtl ? 'Memory Queue' : 'Memory Queue'} body={rtl ? 'يرتب المراجعة حسب ضعف الدليل وموعد النسيان المتوقع.' : 'Prioritizes recall by evidence weakness and predicted forgetting.'} />
            <Value icon={GraduationCap} number="04" title={rtl ? 'تعليم ثنائي اللغة' : 'Bilingual concept bridge'} body={rtl ? 'يربط المصطلح العربي والإنجليزي والمعنى والاستخدام في سياق واحد.' : 'Connects Arabic and English terminology, meaning, and use in one context.'} />
            <Value icon={BarChart3} number="05" title={rtl ? 'بوابة أثر قابلة للدفاع' : 'Defensible impact gate'} body={rtl ? 'لا يعرض Pilot تحسنًا قبل اكتمال pre/post والحد الأدنى للعينة؛ النتيجة تأتي من القياس لا من بيانات عرض.' : 'A pilot reports no gain before paired pre/post evidence and its minimum sample—measurement, never demo data.'} />
          </div>
        </div>
      </section>

      <section className="showcase-trust">
        <div className="mx-auto grid max-w-[96rem] gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:px-8 lg:py-20">
          <div><p className="atlas-section-number">RESPONSIBLE AI / 03</p><h2>{rtl ? 'الذكاء الاصطناعي يقترح. الدليل يحدد الثقة.' : 'AI proposes. Evidence determines confidence.'}</h2><p>{rtl ? 'لا تُخفى حدود المنتج داخل حاشية: المصدر والتصنيف والخصوصية ونوع البيانات ظاهرة في نفس لحظة القرار.' : 'Product boundaries are not buried in fine print: source, classification, privacy, and data type appear at the moment of decision.'}</p></div>
          <div className="showcase-trust-grid">
            <Trust icon={ShieldCheck} title={rtl ? 'عقد الدليل' : 'Evidence contract'} body={rtl ? 'موثّق بمصدر، استنتاج، شرح تعليمي، معرفة عامة، أو يحتاج مراجعة.' : 'Verified source, inference, teaching explanation, general knowledge, or needs review.'} />
            <Trust icon={UsersRound} title={rtl ? 'حدود خصوصية واضحة' : 'Clear privacy boundary'} body={rtl ? 'لوحات المعلمين تجمع الأنماط ولا تعرض محادثات الطالب الخاصة افتراضيًا.' : 'Teacher views aggregate patterns and do not expose private student chats by default.'} />
            <Trust icon={BadgeCheck} title={rtl ? 'شهادة إتمام بلا ادعاء اعتماد' : 'Completion without fake accreditation'} body={rtl ? 'يمكن لفَهيم إصدار شهادة إتمام بسجل تحقق عام بعد مراجعة الشروط. الاعتماد الأكاديمي لا يظهر إلا بعد شراكة موثقة.' : 'Fahim can issue a completion credential with a public registry after eligibility review. Academic accreditation appears only after a documented partnership.'} />
            <Trust icon={RotateCcw} title={rtl ? 'قابل للتراجع والتصحيح' : 'Revisable by design'} body={rtl ? 'تشخيص الخطأ ودرجة الإتقان فرضيات تتغير بعد كل محاولة جديدة.' : 'Misconception and mastery are hypotheses that update after every new attempt.'} />
            <div className="showcase-trust-actions"><Link to="/trust" className="atlas-secondary">{rtl ? 'اقرأ عقد الثقة' : 'Read the trust contract'}</Link><Link to="/evidence" className="atlas-secondary">{rtl ? 'راجع الدليل القابل للفحص' : 'Inspect reproducible evidence'}</Link><Link to="/teacher" className="atlas-primary">{rtl ? 'افتح غرفة قيادة المعلم' : 'Open teacher command room'}<Arrow className="h-4 w-4" /></Link></div>
          </div>
        </div>
      </section>
    </main>
  );
}

function TeacherInsight({ language }: { language: Language }) {
  const rtl = language === 'ar';
  return <div className="teacher-insight">
    <div className="flex items-center justify-between gap-4"><span><UsersRound />{rtl ? 'إشارة المعلم' : 'Teacher insight'}</span><bdi>{showcaseTeacherInsight.misconceptionCount}/{showcaseTeacherInsight.sampleSize}</bdi></div>
    <h4>{showcaseTeacherInsight[rtl ? 'titleAr' : 'titleEn']}</h4>
    <div className="teacher-insight-bar"><i /></div>
    <p>{showcaseTeacherInsight[rtl ? 'noteAr' : 'noteEn']}</p>
  </div>;
}

function Value({ icon: Icon, number, title, body }: { icon: typeof Network; number: string; title: string; body: string }) {
  return <article><div><span>{number}</span><Icon /></div><h3>{title}</h3><p>{body}</p></article>;
}

function Trust({ icon: Icon, title, body }: { icon: typeof ShieldCheck; title: string; body: string }) {
  return <article><Icon /><div><h3>{title}</h3><p>{body}</p></div></article>;
}
