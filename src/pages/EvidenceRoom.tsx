import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Braces,
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  FlaskConical,
  Gauge,
  GraduationCap,
  LockKeyhole,
  Radar,
  Scale,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import type { Language } from '@/App';
import evaluationReport from '@/data/evaluationReport.json';

type Props = { language: Language };

const rubric = [
  { id: 'innovation', weight: 25, score: 23, icon: Sparkles, ar: 'الابتكار والإبداع', en: 'Innovation & creativity', proofAr: 'حلقة دليل متكاملة بدل شات منفصل: خطأ ← تدخل ← إعادة محاولة ← ذاكرة.', proofEn: 'A full evidence loop instead of isolated chat: error → intervention → retry → memory.' },
  { id: 'impact', weight: 25, score: 16, icon: GraduationCap, ar: 'الأثر التعليمي', en: 'Impact on education', proofAr: 'قياس pre/post/retention/transfer جاهز، لكن نتائج المتعلمين الحقيقية لم تُقَس بعد.', proofEn: 'Pre/post/retention/transfer measurement is ready; real learner outcomes are not measured yet.' },
  { id: 'technical', weight: 20, score: 19, icon: Braces, ar: 'التنفيذ التقني', en: 'Technical execution', proofAr: 'توجيه AI احتياطي، RLS، تصحيح موقّع، بوابات خصوصية، وفحص حماية حتمي.', proofEn: 'AI failover, RLS, signed grading, privacy gates, and a deterministic guard suite.' },
  { id: 'feasibility', weight: 15, score: 13, icon: Gauge, ar: 'القابلية للتطبيق والتوسع', en: 'Feasibility & scalability', proofAr: 'منتج منشور، PWA ووضع بيانات خفيفة وبنية Pilot؛ اقتصاديات الوحدة تحتاج بيانات تشغيل.', proofEn: 'Deployed PWA, low-data mode, and pilot infrastructure; unit economics still need field data.' },
  { id: 'presentation', weight: 15, score: 14, icon: Radar, ar: 'العرض والتجربة', en: 'Presentation & demo', proofAr: 'مسار لجنة بلا تسجيل وقصة 90 ثانية وغرفة دليل؛ فيديو النسخة الاحتياطية والعرض النهائي خارج المنتج.', proofEn: 'No-login judge path, 90-second story, and evidence room; backup video and final deck remain external.' },
] as const;

const evidenceLadder = [
  { state: 'verified', icon: CheckCircle2, ar: 'المنتج الأساسي يعمل على Production ومسار العرض لا يعتمد على AI حي.', en: 'The core product runs in production and the judge path does not depend on live AI.' },
  { state: 'verified', icon: CheckCircle2, ar: 'عقود الأمان والخصوصية والتقييم قابلة لإعادة التشغيل في CI.', en: 'Security, privacy, and assessment contracts are reproducible in CI.' },
  { state: 'ready', icon: ClipboardCheck, ar: 'بروتوكول Pilot وقياس pre/post/delayed/transfer جاهز لاستقبال بيانات حقيقية.', en: 'The pilot protocol and pre/post/delayed/transfer measurement are ready for real data.' },
  { state: 'pending', icon: CircleDashed, ar: 'تحسن التعلّم والاحتفاظ والدقة التشخيصية: غير مقاس على طلاب حقيقيين بعد.', en: 'Learning gain, retention, and diagnostic accuracy: not yet measured with real learners.' },
  { state: 'pending', icon: CircleDashed, ar: 'الشراكات والاعتماد المؤسسي: غير مُدّعاة حتى وجود اتفاق موثق.', en: 'Partnerships and institutional accreditation: not claimed without documented agreements.' },
] as const;

const measurement = [
  { number: '01', ar: 'خط أساس', en: 'Baseline', bodyAr: 'اختبار قبلي ومحاولة تفسير حرة قبل تدخل فَهيم.', bodyEn: 'A pre-test and open explanation before Fahim intervenes.' },
  { number: '02', ar: 'تدخل قابل للتتبع', en: 'Traceable intervention', bodyAr: 'تسجيل المصدر والتشخيص ونوع التدخل وإعادة المحاولة.', bodyEn: 'Record source, diagnosis, intervention type, and retry.' },
  { number: '03', ar: 'قياس مؤجل', en: 'Delayed measure', bodyAr: 'استرجاع بعد مدة وسؤال انتقال في سياق جديد.', bodyEn: 'Delayed recall and a transfer question in a new context.' },
  { number: '04', ar: 'بوابة نشر', en: 'Reporting gate', bodyAr: 'لا متوسطات تحت الحد الأدنى للعينة، ولا ادعاء بلا سجل قابل للتدقيق.', bodyEn: 'No averages below the sample threshold and no claim without an auditable record.' },
] as const;

export default function EvidenceRoom({ language }: Props) {
  const rtl = language === 'ar';
  const Arrow = rtl ? ArrowLeft : ArrowRight;
  const totalScore = rubric.reduce((sum, item) => sum + item.score, 0);
  const suitePassed = evaluationReport.passed === evaluationReport.total;

  return (
    <main className="evidence-room-page">
      <section className="evidence-room-hero">
        <div className="atlas-grid absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-[96rem] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.12fr_.88fr] lg:px-8 lg:py-24">
          <div>
            <p className="atlas-kicker"><FlaskConical className="h-4 w-4" />{rtl ? 'غرفة أدلة التحكيم · إصدار قابل للفحص' : 'Judge evidence room · inspectable release'}</p>
            <h1>{rtl ? <>ما يعمل. ما قِيس.<br /><em>وما لم يُقَس بعد.</em></> : <>What works. What is measured.<br /><em>And what is not—yet.</em></>}</h1>
            <p className="evidence-room-lead">{rtl ? 'هذه ليست صفحة تسويق. إنها خريطة قصيرة تربط كل ادعاء بدليل تنفيذي، وتفصل جاهزية المنتج عن أثر تعليمي يحتاج طلابًا حقيقيين.' : 'This is not a marketing page. It maps each claim to implementation evidence and separates product readiness from educational impact that needs real learners.'}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/showcase" className="atlas-primary">{rtl ? 'شاهد دورة التعلّم' : 'Watch the learning loop'}<Arrow className="h-4 w-4" /></Link>
              <a href="#guard-suite" className="atlas-secondary">{rtl ? 'افحص بوابات الحماية' : 'Inspect the guard suite'}</a>
            </div>
          </div>
          <aside className="evidence-score-card" aria-label={rtl ? 'تقدير الجاهزية الداخلية' : 'Internal readiness estimate'}>
            <div>
              <p className="atlas-section-number">{rtl ? 'تقدير جاهزية داخلية · ليست نتيجة لجنة' : 'INTERNAL READINESS ESTIMATE · NOT A JUDGE SCORE'}</p>
              <h2>{rtl ? 'جاهزية تنافسية قوية، وليست نتيجة لجنة.' : 'Strong competition readiness—not a judge score.'}</h2>
              <p>{rtl ? 'الحدّ المتبقي مقصود: لا يمكن تحويل بنية القياس إلى أثر مثبت دون Pilot حقيقي.' : 'The remaining gap is intentional: measurement infrastructure cannot become proven impact without a real pilot.'}</p>
              <div className="evidence-score-inline">
                <strong><bdi>{totalScore}</bdi><small>/100</small></strong>
                <span>{rtl ? 'مقابل أوزان معايير المسابقة، دون أي نقاط لأثر تعليمي غير مقاس بعد.' : 'Against the competition rubric weights, with zero credit for impact that is not yet measured.'}</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="evidence-room-rubric" aria-labelledby="rubric-title">
        <div className="mx-auto max-w-[96rem] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="showcase-section-head">
            <div><p className="atlas-section-number">HACKATHON RUBRIC / 01</p><h2 id="rubric-title">{rtl ? 'تقييم موزون يمكن الدفاع عنه.' : 'A weighted score we can defend.'}</h2></div>
            <p>{rtl ? 'تقدير داخلي مبني على أوزان المسابقة والنسخة المنشورة. لا يساوي حكم اللجنة، ولا يمنح نقاط أثر غير موجودة.' : 'An internal estimate based on the competition weights and deployed build. It is not the jury decision and awards no points for missing impact evidence.'}</p>
          </div>
          <div className="evidence-rubric-grid">
            {rubric.map(({ id, weight, score, icon: Icon, ar, en, proofAr, proofEn }) => (
              <article key={id}>
                <header><span><Icon /></span><bdi>{score}/{weight}</bdi></header>
                <h3>{rtl ? ar : en}</h3>
                <div className="evidence-rubric-meter" aria-label={`${score} / ${weight}`}><i style={{ width: `${(score / weight) * 100}%` }} /></div>
                <p>{rtl ? proofAr : proofEn}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="guard-suite" className="evidence-guard-section" aria-labelledby="guard-title">
        <div className="mx-auto max-w-[96rem] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="evidence-guard-head">
            <div>
              <p className="atlas-section-number">DETERMINISTIC GUARD SUITE / 02</p>
              <h2 id="guard-title">{rtl ? 'الدليل التقني يُعاد تشغيله، لا يُحفظ كلقطة.' : 'Technical evidence is rerun—not preserved as a screenshot.'}</h2>
              <p>{rtl ? 'هذه النتيجة تقيس وجود عقود تنفيذية محددة في الكود وقاعدة البيانات. لا تقيس دقة الموديل أو تحسن الطالب.' : 'This result measures specific implementation contracts in code and the database. It does not measure model accuracy or learner improvement.'}</p>
            </div>
            <div className={`guard-suite-result ${suitePassed ? 'is-passed' : 'is-failed'}`}>
              {suitePassed ? <ShieldCheck /> : <Scale />}
              <strong><bdi>{evaluationReport.passed}/{evaluationReport.total}</bdi></strong>
              <span>{rtl ? 'بوابة حتمية ناجحة' : 'deterministic guards passed'}</span>
            </div>
          </div>
          <div className="proof-groups">
            {[
              {ar:'الأمان والاعتمادية',en:'Security & reliability',areas:['access','security','reliability','safety']},
              {ar:'نزاهة التعلّم',en:'Learning integrity',areas:['assessment','pedagogy']},
              {ar:'الخصوصية',en:'Privacy',areas:['privacy']},
              {ar:'الأدلة والشهادات',en:'Evidence & credentials',areas:['trust','integrity']},
            ].map(group=>{const controls=evaluationReport.controls.filter(control=>group.areas.includes(control.area));return <details className="proof-group" key={group.en} open><summary>{rtl?group.ar:group.en}<span>{controls.filter(c=>c.status==='passed').length}/{controls.length}</span></summary>{controls.map(control=><details className="proof-control" key={control.id}><summary>{rtl?control.titleAr:control.titleEn}<span>{control.status==='passed'?(rtl?'ناجح':'Pass'):(rtl?'يحتاج مراجعة':'Review')}</span></summary><p>{rtl?'التحقق: عقد تنفيذي يفحص آليًا أثناء البناء.':'Verification: an implementation contract checked automatically during the build.'}</p><code dir="ltr">{control.evidence}</code><p>{rtl?'الحد: هذا الفحص لا يثبت دقة النموذج أو تحسّن تعلّم الطلاب.':'Boundary: this check does not establish model accuracy or learner improvement.'}</p></details>)}</details>;})}
          </div>
          <div className="guard-exclusions">
            <LockKeyhole />
            <div><strong>{rtl ? 'ما لا تعنيه نتيجة 12/12' : 'What 12/12 does not mean'}</strong><p>{rtl ? 'ليست دقة AI، ولا تحسن تعلم، ولا traction، ولا اعتمادًا مؤسسيًا. هذه تحتاج مجموعة تقييم بشرية وPilot واتفاقات حقيقية.' : 'It is not AI accuracy, learning gain, traction, or institutional accreditation. Those require a human-reviewed evaluation set, a real pilot, and real agreements.'}</p></div>
          </div>
        </div>
      </section>

      <section className="evidence-ladder-section" aria-labelledby="ladder-title">
        <div className="mx-auto grid max-w-[96rem] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:px-8 lg:py-20">
          <div>
            <p className="atlas-section-number">EVIDENCE LADDER / 03</p>
            <h2 id="ladder-title">{rtl ? 'الشفافية جزء من المنتج.' : 'Transparency is part of the product.'}</h2>
            <p>{rtl ? 'كل مستوى يوضح الفرق بين شيء يعمل الآن، شيء جاهز للقياس، وشيء لا يزال يحتاج الواقع.' : 'Each level separates what works now, what is ready to measure, and what still needs the real world.'}</p>
          </div>
          <ol className="evidence-ladder-list">
            {evidenceLadder.map(({ state, icon: Icon, ar, en }, index) => (
              <li key={`${state}-${index}`} data-state={state}><span><Icon /></span><div><small>{String(index + 1).padStart(2, '0')}</small><p>{rtl ? ar : en}</p></div></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="evidence-measurement-section" aria-labelledby="measurement-title">
        <div className="mx-auto max-w-[96rem] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="showcase-section-head light">
            <div><p className="atlas-section-number">REAL IMPACT PROTOCOL / 04</p><h2 id="measurement-title">{rtl ? 'كيف يتحول الادعاء إلى نتيجة.' : 'How a claim becomes a result.'}</h2></div>
            <p>{rtl ? 'الخطوات التالية ليست Roadmap غامضة؛ هي بروتوكول تشغيل داخل Teacher Cockpit ينتظر بيانات المشاركين الحقيقية.' : 'The next steps are not a vague roadmap; they are an operating protocol in the Teacher Cockpit waiting for real participant data.'}</p>
          </div>
          <div className="evidence-measurement-grid">
            {measurement.map((item) => <article key={item.number}><span>{item.number}</span><h3>{rtl ? item.ar : item.en}</h3><p>{rtl ? item.bodyAr : item.bodyEn}</p></article>)}
          </div>
          <div className="evidence-final-ask">
            <UsersRound />
            <div><strong>{rtl ? `الخطوة التي ترفع فَهيم من ${totalScore} إلى نطاق 90+` : `The step that can move Fahim from ${totalScore} into the 90+ range`}</strong><p>{rtl ? 'معلم واحد و12–20 متعلمًا وأربعة أسابيع على مفهوم واحد، مع موافقة واضحة وقياس قبلي/بعدي/مؤجل.' : 'One teacher, 12–20 learners, and four weeks on one concept, with explicit consent and pre/post/delayed measurement.'}</p></div>
            <Link to="/teacher" className="atlas-primary">{rtl ? 'افتح بنية الـPilot' : 'Open the pilot infrastructure'}<Arrow className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
