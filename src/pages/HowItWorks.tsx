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
    ar: "اختر ما تريد تعلمه",
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
    ar: "تحاول قبل أن ترى الحل",
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
    ar: "تدخل تعليمي مستهدف",
    en: "Targeted intervention",
    arBody: "مثال مضاد أو تبسيط أو عودة لمفهوم واحد، لا إعادة الدرس كله.",
    enBody:
      "A counterexample, scaffold, or one prerequisite—not the entire lesson again.",
  },
  {
    icon: RefreshCcw,
    ar: "مراجعة في الموعد",
    en: "Review on time",
    arBody: "الاسترجاع المتباعد يعيد الضعف قبل أن يتحول إلى نسيان.",
    enBody:
      "Spaced retrieval brings back weaknesses before they become forgetting.",
  },
  {
    icon: Hammer,
    ar: "تطبيق في مشروع",
    en: "Apply in a project",
    arBody: "معيار نجاح وروبرك ونسخ متتابعة توضح التحسن.",
    enBody: "Success criteria, rubric, and versions that make growth visible.",
  },
  {
    icon: FileCheck2,
    ar: "يتولد دليل تعلّم",
    en: "Generate learning evidence",
    arBody: "مصدر ومحاولة وتصحيح وإتقان محفوظة كسلسلة قابلة للفحص.",
    enBody:
      "Source, attempt, correction, and mastery form an inspectable trail.",
  },
  {
    icon: GraduationCap,
    ar: "تعرف الخطوة التالية",
    en: "Know the next step",
    arBody: "لوحة اليوم تقترح فعلًا واحدًا بناءً على الدليل، لا feed إضافيًا.",
    enBody: "Today recommends one action from evidence—not another feed.",
  },
] as const;

export default function HowItWorks({ language }: { language: "ar" | "en" }) {
  const rtl = language === "ar";
  const Arrow = rtl ? ArrowLeft : ArrowRight;
  return (
    <main className="bg-[var(--surface)]">
      <section className="border-b border-[var(--ink)] bg-[#14213D] px-4 py-16 text-white sm:px-6 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="flex items-center gap-2 text-xs font-black text-[#F2B84B]">
            <Route className="h-4 w-4" />
            {rtl ? "دورة التعلّم في فَهيم" : "Fahim learning loop"}
          </p>
          <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_.65fr] lg:items-end">
            <h1 className="atlas-display !text-white text-5xl sm:text-7xl">
              {rtl
                ? "عملية واحدة تنتهي بدليل، لا محتوى أكثر."
                : "One process that ends in evidence—not more content."}
            </h1>
            <p className="text-sm leading-8 text-blue-100">
              {rtl
                ? "كل جلسة لها هدف وسياق ومحاولة وتغذية راجعة وتصحيح وتطبيق ودليل وخطوة تالية. المعلّم الذكي جزء من هذا السياق، وليس الصفحة الأولى للمنتج."
                : "Every session has a goal, context, attempt, feedback, correction, application, evidence, and a next action. The AI tutor belongs inside that context; it is not the product homepage."}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <ol className="relative grid gap-px border border-[var(--border)] bg-[var(--border)] md:grid-cols-2">
          {steps.map((step, index) => (
            <li
              key={step.en}
              className="group relative bg-[var(--panel)] p-6 sm:p-8"
            >
              <div className="flex items-start gap-5">
                <span className="grid h-12 w-12 shrink-0 place-items-center border border-[#14213D] bg-[#F2B84B] text-[#14213D] shadow-[3px_3px_0_#14213D]">
                  <step.icon className="h-5 w-5" />
                </span>
                <div>
                  <span className="atlas-section-number">
                    {String(index + 1).padStart(2, "0")} / 10
                  </span>
                  <h2 className="mt-2 text-xl font-black text-[var(--text)]">
                    {rtl ? step.ar : step.en}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                    {rtl ? step.arBody : step.enBody}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-[var(--ink)] bg-[var(--paper)]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="atlas-section-number">
            {rtl ? "عقد الدليل" : "The evidence contract"}
          </p>
          <div className="mt-5 grid gap-5 lg:grid-cols-4">
            {[
              [
                "VERIFIED_SOURCE",
                rtl ? "موثّق بمصدر" : "Verified source",
                rtl
                  ? "ادعاء مرتبط بموضع ونسخة وثقة."
                  : "A claim linked to a location, version, and confidence.",
              ],
              [
                "INFERRED",
                rtl ? "مستنتج" : "Inferred",
                rtl
                  ? "استنتاج معلن بوضوح، لا حقيقة منسوبة للمصدر."
                  : "An explicitly labeled inference, not a sourced fact.",
              ],
              [
                "TEACHING_EXPLANATION",
                rtl ? "شرح تعليمي" : "Teaching explanation",
                rtl
                  ? "تبسيط هدفه الفهم مع فصل الحقائق عن المثال."
                  : "A teaching scaffold that separates fact from illustration.",
              ],
              [
                "NEEDS_REVIEW",
                rtl ? "يحتاج مراجعة" : "Needs review",
                rtl
                  ? "يتوقف النظام عن ادعاء اليقين عندما لا تكفي الأدلة."
                  : "The system stops claiming certainty when evidence is insufficient.",
              ],
            ].map(([code, title, body]) => (
              <article
                key={code}
                className="rounded-[1.125rem] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow-sm)]"
              >
                <div className="fahim-source-badge">
                  <BadgeCheck className="h-4 w-4" />
                  {displayLabel(code, language)}
                </div>
                <h3 className="mt-4 text-base font-black text-[var(--text)]">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  {body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:py-24">
        <FolderInput className="mx-auto h-8 w-8 text-[var(--nile)]" />
        <h2 className="atlas-display mt-5 text-4xl sm:text-6xl">
          {rtl
            ? "جرّب العملية على هدفك الحقيقي."
            : "Run the process on a real goal."}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-[var(--muted)]">
          {rtl
            ? "أنشئ حسابًا أولًا لحماية ملفاتك وربط المحاولات والمراجعات والأدلة بشخصك. التجربة الكاملة 30 يومًا دون بطاقة."
            : "Create an account first so files, attempts, reviews, and evidence belong to you. The full trial is 30 days with no card."}
        </p>
        <Link
          to="/register"
          state={{ from: "/dashboard" }}
          className="atlas-primary mt-8 justify-center"
        >
          {rtl ? "ابدأ مجانًا لمدة 30 يومًا" : "Start 30 days free"}
          <Arrow className="h-4 w-4" />
        </Link>
      </section>
    </main>
  );
}
