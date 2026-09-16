import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  BrainCircuit,
  FileCheck2,
  Flag,
  FolderInput,
  GraduationCap,
  Hammer,
  RefreshCcw,
  Route,
  Target,
} from "lucide-react";
import { displayLabel } from "@/lib/displayLabels";

const steps = [
  {
    icon: Target,
    ar: "اختر ما تريد تعلّمه",
    en: "Choose what you want to learn",
    arBody: "هدف واضح وموعد وسياق، لا سؤالًا منفصلًا عن رحلتك.",
    enBody: "A clear outcome, date, and context—not an isolated prompt.",
  },
  {
    icon: Route,
    ar: "فَهيم يبني المسار",
    en: "Fahim builds the path",
    arBody: "يختار المفاهيم السابقة والأنشطة التي تحتاجها الآن.",
    enBody: "It selects prerequisites and the activities you need now.",
  },
  {
    icon: BookOpen,
    ar: "تتعلم بنشاط",
    en: "Learn actively",
    arBody: "شرح قصير ومثال وسؤال داخل سياق الدرس.",
    enBody: "A concise explanation, example, and question inside the lesson.",
  },
  {
    icon: BrainCircuit,
    ar: "تُحاول قبل أن ترى الحل",
    en: "Attempt before the answer",
    arBody: "المحاولة تكشف فهمك الحقيقي بدل وهم المشاهدة.",
    enBody:
      "An attempt reveals real understanding instead of passive familiarity.",
  },
  {
    icon: Flag,
    ar: "يُكتشف سبب الخطأ",
    en: "Find the misconception",
    arBody: "نربط الإجابة بنمط الخطأ والمفهوم السابق المفقود.",
    enBody:
      "The answer is connected to an error pattern and missing prerequisite.",
  },
  {
    icon: Hammer,
    ar: "تدخّل تعليمي مستهدف",
    en: "Targeted intervention",
    arBody: "مثال مضاد أو تبسيط أو عودة لمفهوم واحد، لا إعادة الدرس كله.",
    enBody:
      "A counterexample, scaffold, or one prerequisite—not the entire lesson again.",
  },
  {
    icon: RefreshCcw,
    ar: "مراجعة في الموعد",
    en: "Review on time",
    arBody: "الاسترجاع المتباعد يعيد الضعف قبل أن يتحوّل إلى نسيان.",
    enBody:
      "Spaced retrieval brings back weaknesses before they become forgetting.",
  },
  {
    icon: Hammer,
    ar: "تطبيق في مشروع",
    en: "Apply in a project",
    arBody: "معيار نجاح وروبريك ونسخ متتابعة تُوضّح التحسّن.",
    enBody: "Success criteria, rubric, and versions that make growth visible.",
  },
  {
    icon: FileCheck2,
    ar: "يُنتج دليل تعلّم",
    en: "Generate learning evidence",
    arBody: "مصدر ومحاولة وتصحيح وإتقان محفوظة كسلسلة قابلة للفحص.",
    enBody:
      "Source, attempt, correction, and mastery form an inspectable trail.",
  },
  {
    icon: GraduationCap,
    ar: "تتعرف الخطوة التالية",
    en: "Know the next step",
    arBody: "لوحة اليوم تقترح فعلًا واحدًا بناءً على الدليل، لا feed إضافيًا.",
    enBody: "Today recommends one action from evidence—not another feed.",
  },
] as const;

const evidenceContract = [
  {
    code: "VERIFIED_SOURCE" as const,
    arTitle: "موثّق بمصدر",
    enTitle: "Verified source",
    arBody: "ادعاء مرتبط بموضع ونسخة وثقة.",
    enBody: "A claim linked to a location, version, and confidence.",
  },
  {
    code: "INFERRED" as const,
    arTitle: "مستنتج",
    enTitle: "Inferred",
    arBody: "استنتاج معلن بوضوح، لا حقيقة منسوبة للمصدر.",
    enBody: "An explicitly labeled inference, not a sourced fact.",
  },
  {
    code: "TEACHING_EXPLANATION" as const,
    arTitle: "شرح تعليمي",
    enTitle: "Teaching explanation",
    arBody: "تبسيط هدفه الفهم مع فصل الحقائق عن المثال.",
    enBody: "A teaching scaffold that separates fact from illustration.",
  },
  {
    code: "NEEDS_REVIEW" as const,
    arTitle: "يحتاج مراجعة",
    enTitle: "Needs review",
    arBody: "يتوقف النظام عن ادّعاء اليقين عندما لا تكفي الأدلة.",
    enBody: "The system stops claiming certainty when evidence is insufficient.",
  },
];

export default function HowItWorks({ language }: { language: "ar" | "en" }) {
  const rtl = language === "ar";
  const Arrow = rtl ? ArrowLeft : ArrowRight;

  return (
    <main className="bg-[var(--surface)]">
      {/* ——— Hero ——— */}
      <section className="fahim-band-hero relative overflow-hidden border-b border-[var(--band)] bg-[var(--band)] px-4 py-20 text-white sm:px-6 lg:py-28">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 85% 15%, color-mix(in srgb, var(--nile) 22%, transparent), transparent 26rem), radial-gradient(circle at 12% 85%, color-mix(in srgb, var(--saffron) 14%, transparent), transparent 22rem)",
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-6xl">
          <p className="flex w-fit items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-[var(--saffron)]">
            <Route className="h-4 w-4" />
            {rtl ? "دورة التعلّم في فَهيم" : "Fahim learning loop"}
          </p>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
            <div>
              <h1 className="atlas-display max-w-[16ch] text-5xl text-white sm:text-7xl">
                {rtl
                  ? "عملية واحدة تنتهي بدليل، لا محتوى أكثر."
                  : "One process that ends in evidence—not more content."}
              </h1>
              <p className="mt-7 max-w-xl text-base leading-8 text-[#B9C6D4] sm:text-lg">
                {rtl
                  ? "كل جلسة لها هدف وسياق ومحاولة وتغذية راجعة وتصحيح وتطبيق ودليل وخطوة تالية. المعلّم الذكي جزء من هذا السياق، وليس الصفحة الأولى للمنتج."
                  : "Every session has a goal, context, attempt, feedback, correction, application, evidence, and a next action. The AI tutor belongs inside that context; it is not the product homepage."}
              </p>
            </div>
            <dl className="grid grid-cols-3 gap-3 sm:gap-4 lg:grid-cols-1">
              {[
                [
                  "10",
                  rtl ? "خطوات متكاملة" : "connected steps",
                ],
                [
                  "4",
                  rtl ? "فئات دليل" : "evidence classes",
                ],
                [
                  "30",
                  rtl ? "يومًا مجانيًا" : "free days",
                ],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/12 bg-white/[.06] p-4 backdrop-blur-sm"
                >
                  <dt className="text-xs font-bold text-[#B9C6D4]">{label}</dt>
                  <dd className="mt-1 text-4xl font-black tracking-tight text-white">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ——— 10-step timeline ——— */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="atlas-section-number">
            {rtl ? "دورة التعلّم" : "The learning loop"}
          </p>
          <h2 className="atlas-display mt-3 text-4xl sm:text-5xl">
            {rtl
              ? "عشر خطوات تنتهي بدليل قابل للفحص"
              : "Ten steps that end in an inspectable trail"}
          </h2>
          <p className="mt-5 text-base leading-8 text-[var(--muted)]">
            {rtl
              ? "كل خطوة تُنجب خطوة التالية: من اختيار الهدف إلى الخطوة المقترحة في لوحة اليوم."
              : "Each step produces the next: from goal selection to the action recommended in today's dashboard."}
          </p>
        </div>

        <ol className="mx-auto mt-14 max-w-4xl">
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            return (
              <li key={step.en} className="relative flex gap-6 pb-10 sm:gap-8">
                {/* rail */}
                <div className="flex flex-col items-center">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow-sm)] transition-transform duration-200 group-hover:scale-105">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--saffron)] text-[#14213D]">
                      <step.icon className="h-5 w-5" strokeWidth={2.25} />
                    </span>
                  </span>
                  {!isLast && (
                    <span
                      className="mt-3 w-px flex-1 bg-[var(--border)]"
                      aria-hidden="true"
                    />
                  )}
                </div>

                {/* card */}
                <div className="group min-w-0 flex-1 pt-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className="text-xs font-black tabular-nums tracking-widest text-[var(--vermilion)]"
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, "0")} / 10
                    </span>
                    <h3 className="text-xl font-black text-[var(--text)] sm:text-2xl">
                      {rtl ? step.ar : step.en}
                    </h3>
                  </div>
                  <p className="mt-2.5 max-w-2xl text-[15px] leading-7 text-[var(--muted)]">
                    {rtl ? step.arBody : step.enBody}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ——— Evidence contract ——— */}
      <section className="fahim-band-hero border-y border-[var(--band)] bg-[var(--band)] px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="atlas-section-number text-[var(--saffron)]">
                {rtl ? "عقد الدليل" : "The evidence contract"}
              </p>
              <h2 className="atlas-display mt-3 text-4xl text-white sm:text-5xl">
                {rtl
                  ? "كل محتوى يُميّز حالته بوضوح"
                  : "Every piece of content is labeled by its state"}
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-7 text-[#B9C6D4]">
              {rtl
                ? "لا يختلط الموثق بالمستنتج. النظام يُعلن دائمًا ما يقوله عن مصدره ودرجة ثقته."
                : "Sourced facts never blend with inferences. The system always declares what it claims and how confident it is."}
            </p>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-white/12 bg-white/12 sm:grid-cols-2 lg:grid-cols-4">
            {evidenceContract.map((item) => (
              <article
                key={item.code}
                className="group relative flex flex-col bg-[var(--band)] p-7 transition-colors duration-200 hover:bg-[#1A2A4E]"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/12 bg-white/[.07]">
                    <BadgeCheck
                      className="h-5 w-5 text-[var(--saffron)]"
                      strokeWidth={2}
                    />
                  </span>
                  <span className="text-[11px] font-black tracking-[.14em] text-[#B9C6D4]">
                    {displayLabel(item.code, language as "ar" | "en")}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-black text-white">
                  {rtl ? item.arTitle : item.enTitle}
                </h3>
                <p className="mt-2.5 text-sm leading-7 text-[#B9C6D4]">
                  {rtl ? item.arBody : item.enBody}
                </p>
                <span
                  className="pointer-events-none absolute bottom-0 h-[3px] w-0 bg-[var(--saffron)] transition-all duration-300 group-hover:w-full"
                  aria-hidden="true"
                />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ——— CTA ——— */}
      <section className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:py-28">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-[color-mix(in_srgb,var(--saffron)_16%,var(--panel))] text-[var(--nile)]">
          <FolderInput className="h-7 w-7" strokeWidth={1.75} />
        </span>
        <h2 className="atlas-display mt-7 text-4xl sm:text-5xl">
          {rtl
            ? "جرّب العملية على هدفك الحقيقي."
            : "Run the process on a real goal."}
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-[var(--muted)]">
          {rtl
            ? "أنشئ حسابًا أولًا لحماية ملفاتك وربط المحاولات والمراجعات والأدلة بشخصك. التجربة الكاملة 30 يومًا دون بطاقة."
            : "Create an account first so files, attempts, reviews, and evidence belong to you. The full trial is 30 days with no card."}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/register"
            state={{ from: "/dashboard" }}
            className="atlas-primary justify-center"
          >
            {rtl ? "ابدأ مجانًا لمدة 30 يومًا" : "Start 30 days free"}
            <Arrow className="h-4 w-4" />
          </Link>
          <Link to="/showcase" className="atlas-secondary justify-center">
            {rtl ? "شاهد العرض التفاعلي" : "Watch the interactive story"}
          </Link>
        </div>
      </section>
    </main>
  );
}
