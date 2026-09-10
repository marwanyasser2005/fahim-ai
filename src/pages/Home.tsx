import { Link } from "react-router-dom";
import { useState } from "react";
import {
  AlertTriangle as TriangleAlert,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Bot,
  BrainCircuit,
  Check,
  ChevronDown,
  FileCheck2,
  FolderInput,
  GraduationCap,
  LockKeyhole,
  PlaySquare,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { courseCatalog } from "@/data/courseCatalog";
import { publicPlans } from "@/config/plans";

type Language = "ar" | "en";

const learningLoop = [
  ["ASSESS", "قيّم", "Assess"],
  ["DIAGNOSE", "شخّص", "Diagnose"],
  ["INTERVENE", "تدخّل", "Intervene"],
  ["RETRY", "أعد المحاولة", "Retry"],
  ["EVIDENCE", "أثبت", "Evidence"],
  ["RETAIN", "ثبّت", "Retain"],
] as const;

const featureCards = [
  {
    icon: FolderInput,
    titleAr: "منهجك وملفاتك أولًا",
    titleEn: "Your curriculum and files first",
    bodyAr:
      "احتفظ بملفاتك ومراجعك في مكان واحد، مع تمييز مصادر تعلّمك عن نتائج الويب العام.",
    bodyEn:
      "A local vault and Source Registry separate your material from the open web and preserve source versions.",
    href: "/knowledge-vault",
    statusAr: "متاح: PDF محلي وبحث داخل الملف",
    statusEn: "Available: local PDF retrieval",
  },
  {
    icon: Bot,
    titleAr: "معلّم داخل سياق الدرس",
    titleEn: "A tutor inside the lesson",
    bodyAr: "يسأل ويشرح ويقارن وفق الهدف والمحاولة الحالية بدل دردشة بلا سياق.",
    bodyEn:
      "It asks, explains, and compares from the goal and current attempt—not context-free chat.",
    href: "/ask-fahim",
    statusAr: "متاح عند تهيئة مزود AI",
    statusEn: "Available when the AI provider is configured",
  },
  {
    icon: BrainCircuit,
    titleAr: "أطلس سوء الفهم",
    titleEn: "Misconception Atlas",
    bodyAr:
      "يربط نمط الإجابة بالمفهوم السابق والتدخل المناسب، ولا يكتفي بصحيح أو خطأ.",
    bodyEn:
      "It connects an answer pattern to a prerequisite and intervention—not only right or wrong.",
    href: "/quiz-lab",
    statusAr: "متاح: تحليل المحاولات الآمن",
    statusEn: "Available: secure attempt analysis",
  },
  {
    icon: RefreshCcw,
    titleAr: "مراجعة متباعدة",
    titleEn: "Spaced review",
    bodyAr:
      "البطاقات تعود وفق تذكرك الفعلي مع حالات pending وsynced وfailed للعمل المحلي.",
    bodyEn:
      "Cards return from actual recall, with pending, synced, and failed states for local-first work.",
    href: "/review",
    statusAr: "متاح على الجهاز",
    statusEn: "Available on device",
  },
  {
    icon: FileCheck2,
    titleAr: "دليل تعلّم لا نسبة فقط",
    titleEn: "Evidence, not only progress",
    bodyAr:
      "محاولة ومصدر وتصحيح وتطبيق يمكن فحصها؛ الشهادة لا تُصدر قبل تحقق الشروط.",
    bodyEn:
      "An inspectable attempt, source, correction, and application; no certificate before requirements are verified.",
    href: "/how-it-works",
    statusAr: "متاح: شهادة إتمام بسجل تحقق عام",
    statusEn: "Available: completion credential with public registry",
  },
  {
    icon: Search,
    titleAr: "بحث تعليمي متعدد المصادر",
    titleEn: "Multi-source learning search",
    bodyAr:
      "نتائج مصر وWikimedia والأبحاث تُجمع حسب نية التعلّم مع بيان نوع كل مصدر.",
    bodyEn:
      "Egyptian, Wikimedia, and research results are grouped by learning intent with source types visible.",
    href: "/library",
    statusAr: "متاح مع fallback واضح",
    statusEn: "Available with explicit fallbacks",
  },
] as const;

const faqs = [
  {
    arQ: "هل أستطيع استخدام الأدوات قبل التسجيل؟",
    enQ: "Can I use the tools before signing up?",
    arA: "يمكنك مشاهدة الجولة والمسارات والعينة. الاستخدام الحقيقي يبدأ بحساب حتى تُربط الملفات والمحاولات والمراجعات بك بأمان.",
    enA: "You can view the tour, paths, and sample. Real use starts with an account so files, attempts, and reviews stay securely linked to you.",
  },
  {
    arQ: "هل التجربة تحتاج بطاقة؟",
    enQ: "Does the trial require a card?",
    arA: "لا. التجربة الكاملة 30 يومًا دون بطاقة، ولا يحدث أي خصم تلقائي.",
    enA: "No. The full trial is 30 days with no card and no automatic charge.",
  },
  {
    arQ: "هل إجابات الذكاء الاصطناعي موثقة دائمًا؟",
    enQ: "Are AI answers always verified?",
    arA: "لا ندّعي ذلك. كل جزء يُصنف: مصدر موثّق، مستنتج، شرح تعليمي، معرفة عامة، أو يحتاج مراجعة.",
    enA: "We do not claim that. Every part is classified as verified source, inferred, teaching explanation, general knowledge, or needs review.",
  },
  {
    arQ: "هل الشهادة معتمدة؟",
    enQ: "Is the certificate accredited?",
    arA: "يصدر فَهيم شهادة إتمام قابلة للتحقق بعد اكتمال المسار واجتياز التقييم ومراجعة الإدارة. وهي ليست اعتمادًا أكاديميًا أو حكوميًا؛ سيظهر أي اعتماد مستقبلي فقط بعد شراكة حقيقية.",
    enA: "Fahim issues a verifiable Certificate of Completion after course completion, assessment, and admin review. It is not academic or government accreditation; future accreditation will appear only after a real partnership.",
  },
] as const;

export default function Home({ language }: { language: Language }) {
  const rtl = language === "ar";
  const Arrow = rtl ? ArrowLeft : ArrowRight;
  const levelNames = {
    beginner: rtl ? "مبتدئ" : "Beginner",
    intermediate: rtl ? "متوسط" : "Intermediate",
    advanced: rtl ? "متقدم" : "Advanced",
  };

  return (
    <main className="overflow-hidden bg-[var(--surface)]">
      <section className="relative border-b border-[var(--ink)] bg-[var(--paper)]">
        <div className="atlas-grid absolute inset-0 opacity-55" />
        <div className="relative mx-auto max-w-[100rem] px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--ink)]/20 py-3 text-xs font-extrabold text-[var(--muted)]">
            <span>
              {rtl
                ? "فَهيم / نظام الفهم الموثّق"
                : "Fahim / Verified learning system"}
            </span>
            <span className="shrink-0">
              {rtl ? "القاهرة · ٢٠٢٦" : "Cairo · 2026"}
            </span>
          </div>
          <div className="grid min-h-[44rem] lg:grid-cols-[1.05fr_.95fr]">
            <div className="flex min-w-0 flex-col justify-center py-14 lg:border-e lg:border-[var(--ink)]/20 lg:pe-12">
              <p className="atlas-kicker w-fit">
                <BookOpenCheck className="h-4 w-4" />
                {rtl
                  ? "ثورة في تقييم الفهم، لا حفظ الإجابات"
                  : "An assessment revolution for real understanding"}
              </p>
              <h1 className="atlas-display mt-7 max-w-4xl text-[clamp(3rem,6.2vw,5.6rem)]">
                {rtl
                  ? "الإجابة صحيحة. لكن هل تغيّر الفهم فعلًا؟"
                  : "The answer is right. Has understanding really changed?"}
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-9 text-[var(--muted)] sm:text-lg">
                {rtl
                  ? "تقييم تشخيصي يطلب سبب اختيارك، يرصد الالتباس كفرضية قابلة للمراجعة، يقدّم تدخلًا مناسبًا، ثم يبني دليل تعلّم واسترجاعًا لاحقًا."
                  : "A diagnostic assessment asks why you chose an answer, treats misconceptions as reviewable hypotheses, provides a focused intervention, and builds evidence for later recall."}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register"
                  state={{ from: "/dashboard" }}
                  className="atlas-primary justify-center"
                >
                  {rtl
                    ? "ابدأ أول تقييم — 30 يومًا مجانًا"
                    : "Start your first assessment — 30 days free"}
                  <Arrow className="h-4 w-4" />
                </Link>
                <Link to="/showcase" className="atlas-secondary justify-center">
                  <PlaySquare className="h-4 w-4" />
                  {rtl ? "شاهد القصة التفاعلية" : "Open the interactive story"}
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-[var(--ink)]/20 pt-5 text-xs font-bold text-[var(--muted)]">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#0F766E]" />
                  {rtl ? "لا بطاقة مطلوبة" : "No card required"}
                </span>
                <span className="flex items-center gap-2">
                  <LockKeyhole className="h-4 w-4 text-[#0F766E]" />
                  {rtl
                    ? "الاستخدام الحقيقي بعد حساب آمن"
                    : "Real use after secure signup"}
                </span>
                <span className="flex items-center gap-2">
                  <TriangleAlert className="h-4 w-4 text-[#D95D39]" />
                  {rtl
                    ? "لا نتائج أو دفع أو شهادات وهمية"
                    : "No fake results, payments, or certificates"}
                </span>
              </div>
            </div>
            <div className="flex items-center py-10 lg:ps-12">
              <ProductPreview language={language} />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--ink)] bg-[#14213D] text-white">
        <div className="mx-auto max-w-[100rem] px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2">
            {learningLoop.map(([code, ar, en], index) => (
              <div key={code} className="flex items-center gap-2">
                <span
                  className={`border px-3 py-2 text-[10px] font-black ${index === learningLoop.length - 1 ? "border-[#F2B84B] bg-[#F2B84B] text-[#14213D]" : "border-white/20 text-blue-100"}`}
                >
                  {rtl ? ar : en}
                </span>
                {index < learningLoop.length - 1 && (
                  <Arrow className="h-3.5 w-3.5 text-[#F2B84B]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeader
          number="01"
          title={
            rtl
              ? "ليست مجموعة أدوات. إنها عملية تعلم كاملة."
              : "Not a toolbox. A complete learning process."
          }
          body={
            rtl
              ? "كل شاشة تجيب عن سؤال واحد: ما الذي أتعلمه؟ ماذا حاولت؟ أين الخطأ؟ وما الفعل التالي؟"
              : "Every screen answers one question: what am I learning, what did I attempt, where is the error, and what happens next?"
          }
        />
        <div className="mt-10 grid gap-px border border-[var(--border)] bg-[var(--border)] md:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((feature) => (
            <Link
              key={feature.href}
              to={feature.href}
              className="group bg-[var(--panel)] p-6 transition hover:bg-[var(--paper)] sm:p-8"
            >
              <feature.icon className="h-6 w-6 text-[#0F766E]" />
              <h3 className="mt-6 text-xl font-black text-[var(--text)]">
                {rtl ? feature.titleAr : feature.titleEn}
              </h3>
              <p className="mt-3 text-sm leading-8 text-[var(--muted)]">
                {rtl ? feature.bodyAr : feature.bodyEn}
              </p>
              <div className="mt-6 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
                <span className="text-[9px] font-black text-[#D95D39]">
                  {rtl ? feature.statusAr : feature.statusEn}
                </span>
                <Arrow className="h-4 w-4 text-[var(--muted)] transition group-hover:-translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--ink)] bg-[var(--paper)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeader
            number="02"
            title={
              rtl
                ? "الخطأ لا يختفي. يتحول إلى أصل تعليمي."
                : "Mistakes do not disappear. They become learning assets."
            }
            body={
              rtl
                ? "Mistake Portfolio يحفظ المحاولة وسبب الالتباس والتدخل والنسخة المصححة حتى ترى كيف تغيّر فهمك."
                : "The Mistake Portfolio keeps the attempt, misconception, intervention, and corrected version so growth is visible."
            }
          />
          <div className="mt-10 grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
            <article className="border border-[#D95D39] bg-[#F7DDD4] p-6 text-[#14213D]">
              <p className="text-[9px] font-black tracking-widest">
                ATTEMPT 01
              </p>
              <h3 className="mt-4 text-xl font-black">
                {rtl
                  ? "طبقت القانون الصحيح على الحالة الخطأ."
                  : "The correct formula was used for the wrong condition."}
              </h3>
              <p className="mt-3 text-sm leading-7">
                {rtl
                  ? "نمط الالتباس: الخلط بين السرعة المتوسطة واللحظية."
                  : "Misconception: confusing average and instantaneous velocity."}
              </p>
            </article>
            <article className="border border-[#0F766E] bg-[#DCEDE9] p-6 text-[#14213D]">
              <p className="text-[9px] font-black tracking-widest">
                INTERVENTION → EVIDENCE
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {[
                  [
                    rtl ? "تدخل" : "Intervention",
                    rtl ? "مثال مضاد بخط زمني" : "Counterexample on a timeline",
                  ],
                  [
                    rtl ? "إعادة المحاولة" : "Retry",
                    rtl
                      ? "حل دون تلميح في 3:40"
                      : "Solved without hint in 3:40",
                  ],
                  [
                    rtl ? "الدليل" : "Evidence",
                    rtl
                      ? "المفهوم متقن مبدئيًا؛ مراجعة بعد 3 أيام"
                      : "Initial mastery; review in 3 days",
                  ],
                ].map(([title, body]) => (
                  <div key={title} className="border-s-2 border-[#0F766E] ps-3">
                    <strong className="text-xs">{title}</strong>
                    <p className="mt-1 text-xs leading-6">{body}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeader
          number="03"
          title={
            rtl
              ? "مسارات موجودة، لكن المشاهدة ليست الإنجاز."
              : "Courses exist, but watching is not the outcome."
          }
          body={
            rtl
              ? "كل بطاقة تعرض المستوى والزمن والمخرج والخطوة التالية؛ التقدم الحقيقي يُبنى من الدروس والمحاولات والمشروعات."
              : "Each card shows level, time, outcome, and next action; real progress comes from lessons, attempts, and projects."
          }
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {courseCatalog.slice(0, 3).map((course) => (
            <article
              key={course.id}
              className="flex flex-col border border-[var(--border)] bg-[var(--panel)] p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="bg-[#DCEDE9] px-2.5 py-1 text-[9px] font-black text-[#0F766E]">
                  {levelNames[course.level]}
                </span>
                <span className="text-[9px] font-black text-[var(--muted)]">
                  {course.weeks} {rtl ? "أسابيع" : "weeks"}
                </span>
              </div>
              <h3 className="mt-5 text-xl font-black text-[var(--text)]">
                {course.title[language]}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-8 text-[var(--muted)]">
                {course.description[language]}
              </p>
              <div className="mt-6 border-t border-[var(--border)] pt-4">
                <p className="text-[9px] font-black text-[#D95D39]">
                  {rtl ? "المخرج الأول" : "FIRST OUTCOME"}
                </p>
                <p className="mt-2 text-xs font-bold leading-6 text-[var(--text)]">
                  {course.outcomes[0][language]}
                </p>
              </div>
              <Link
                to={`/course/${course.id}`}
                className="atlas-secondary mt-5 justify-between"
              >
                {rtl ? "معاينة المسار" : "Preview path"}
                <Arrow className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
        <div className="mt-7 text-center">
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 text-sm font-black text-[#0F766E]"
          >
            {rtl ? "استكشف كل المسارات" : "Explore all paths"}
            <Arrow className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="border-y border-[var(--ink)] bg-[#14213D] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-3 lg:px-8 lg:py-20">
          {[
            [
              GraduationCap,
              rtl ? "المشروعات" : "Projects",
              rtl
                ? "سؤال واضح، روبرك، نسخ، مراجعة، ودليل على التحسن."
                : "A clear brief, rubric, versions, review, and evidence of improvement.",
            ],
            [
              BadgeCheck,
              rtl ? "شهادة إتمام قابلة للتحقق" : "Verifiable completion",
              rtl
                ? "لا تُصدر إلا بعد تقييم الشروط؛ ليست اعتمادًا أكاديميًا."
                : "Issued only after requirements are checked; not academic accreditation.",
            ],
            [
              ShieldCheck,
              rtl ? "حدود خصوصية حقيقية" : "Real privacy boundaries",
              rtl
                ? "المدرس وولي الأمر يحصلان على ما يلزم للدعم، لا نسخًا من المحادثات الخاصة."
                : "Teachers and parents get what is needed for support—not copies of private conversations.",
            ],
          ].map(([Icon, title, body]) => {
            const CardIcon = Icon as typeof GraduationCap;
            return (
              <article key={String(title)}>
                <CardIcon className="h-7 w-7 text-[#F2B84B]" />
                <h2 className="mt-6 text-2xl font-black">{String(title)}</h2>
                <p className="mt-3 text-sm leading-8 text-blue-100">
                  {String(body)}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeader
          number="04"
          title={
            rtl
              ? "سعر مصري واضح، وتجربة تكفي لاتخاذ قرار."
              : "Clear Egyptian pricing and enough time to decide."
          }
          body={
            rtl
              ? "Plus يبدأ بـ49 جنيهًا شهريًا كسعر إطلاق، مع خطة مجانية دائمة. لا تحتاج بطاقة لبدء الثلاثين يومًا."
              : "Plus launches at EGP 49/month, with a permanent Free plan. No card is required for the 30 days."
          }
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {publicPlans.map((plan) => (
            <article
              key={plan.code}
              className={`border p-6 ${plan.code === "plus_annual" ? "border-[#14213D] bg-[#14213D] text-white shadow-[6px_6px_0_#F2B84B]" : "border-[var(--border)] bg-[var(--panel)] text-[var(--text)]"}`}
            >
              <p
                className={`text-[9px] font-black tracking-widest ${plan.code === "plus_annual" ? "text-[#F2B84B]" : "text-[#D95D39]"}`}
              >
                {plan.launchPrice ? "LAUNCH PRICE" : "FREE FOREVER"}
              </p>
              <h3 className="mt-4 text-xl font-black">{plan.name[language]}</h3>
              <p className="mt-5 text-4xl font-black">
                {plan.priceEgp}{" "}
                <span className="text-sm">{rtl ? "جنيه" : "EGP"}</span>
              </p>
              <ul className="mt-5 space-y-2">
                {plan.features.slice(0, 2).map((feature) => (
                  <li
                    key={feature.en}
                    className={`flex items-start gap-2 text-xs leading-6 ${plan.code === "plus_annual" ? "text-blue-100" : "text-[var(--muted)]"}`}
                  >
                    <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-[#0F766E]" />
                    {feature[language]}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link to="/pricing" className="atlas-primary justify-center">
            {rtl ? "قارن الخطط بشفافية" : "Compare plans clearly"}
            <Arrow className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--paper)]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader
            number="05"
            title={
              rtl
                ? "أسئلة مهمة قبل أن تبدأ."
                : "Important questions before you start."
            }
            body={
              rtl
                ? "الثقة تبدأ بما لا ندّعيه بقدر ما تبدأ بما نبنيه."
                : "Trust starts with what we do not claim as much as with what we build."
            }
          />
          <div className="mt-9 divide-y divide-[var(--border)] border-y border-[var(--border)]">
            {faqs.map((faq) => (
              <details key={faq.enQ} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-black text-[var(--text)]">
                  <span>{rtl ? faq.arQ : faq.enQ}</span>
                  <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
                </summary>
                <p className="mt-3 max-w-3xl text-sm leading-8 text-[var(--muted)]">
                  {rtl ? faq.arA : faq.enA}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[.55fr_1fr] lg:items-center lg:px-8 lg:py-24">
        <img
          src="/images/founder/marwan-abdelghaffar.webp"
          alt={
            rtl
              ? "مروان عبد الغفار، مؤسس فَهيم"
              : "Marwan Abdelghaffar, founder of Fahim"
          }
          width="800"
          height="800"
          loading="lazy"
          className="aspect-square w-full border border-[var(--ink)] object-cover shadow-[8px_8px_0_#F2B84B]"
        />
        <div>
          <p className="atlas-section-number">06 / FOUNDER</p>
          <h2 className="atlas-display mt-5 text-4xl sm:text-6xl">
            {rtl
              ? "بناه مهندس تعلّم آلي بدأ من سؤال تعليمي حقيقي."
              : "Built by an AI engineer starting from a real learning problem."}
          </h2>
          <p className="mt-5 text-sm leading-8 text-[var(--muted)]">
            {rtl
              ? "مروان عبد الغفار يجمع بين هندسة الذكاء الاصطناعي، التعلّم العميق، الحوسبة الكمية، بناء المنتجات، وقيادة مجتمعات المطورين. فَهيم مبني على اعتقاد بسيط: التعلّم يجب أن ينتج دليلًا، لا نشاطًا فقط."
              : "Marwan Abdelghaffar works across AI engineering, deep learning, quantum computing, product building, and developer communities. Fahim is built on one belief: learning should produce evidence, not just activity."}
          </p>
          <Link to="/about" className="atlas-secondary mt-7">
            {rtl ? "قصة فَهيم والمؤسس" : "The Fahim and founder story"}
            <Arrow className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="border-t border-[var(--ink)] bg-[#F2B84B] text-[#14213D]">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:py-24">
          <Target className="mx-auto h-8 w-8" />
          <h2 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">
            {rtl
              ? "ما الذي تريد أن تفهمه حقًا؟"
              : "What do you genuinely want to understand?"}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-bold leading-8">
            {rtl
              ? "أنشئ حسابك، أكمل خمس خطوات، وابدأ مهمة اليوم. لا بطاقة، ولا تجربة مجهولة قبل التسجيل."
              : "Create your account, complete five steps, and start Today’s mission. No card and no anonymous product trial."}
          </p>
          <Link
            to="/register"
            state={{ from: "/dashboard" }}
            className="mt-8 inline-flex min-h-12 items-center gap-2 border border-[#14213D] bg-[#14213D] px-6 text-sm font-black text-white shadow-[5px_5px_0_#D95D39]"
          >
            {rtl ? "ابدأ 30 يومًا كاملة" : "Start the full 30 days"}
            <Arrow className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function SectionHeader({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <header className="grid gap-5 lg:grid-cols-[.65fr_1.35fr]">
      <div>
        <p className="atlas-section-number">{number}</p>
        <h2 className="atlas-display mt-4 text-3xl sm:text-5xl">{title}</h2>
      </div>
      <p className="max-w-2xl self-end text-sm leading-8 text-[var(--muted)]">
        {body}
      </p>
    </header>
  );
}

function ProductPreview({ language }: { language: Language }) {
  const ar = language === "ar";
  const [step, setStep] = useState(0);
  const steps = [
    {
      ar: "المحاولة",
      en: "Attempt",
      bodyAr:
        "«القوة الأكبر تعني سرعة أكبر دائمًا». هذه محاولة أولى في مثال توضيحي.",
      bodyEn:
        "“A larger force always means greater speed.” An initial attempt in this illustrative scenario.",
    },
    {
      ar: "فرضية التشخيص",
      en: "Hypothesis",
      bodyAr: "قد يكون هناك خلط بين السرعة والعجلة، مع إغفال تأثير الكتلة.",
      bodyEn:
        "Velocity and acceleration may be conflated, while the role of mass is overlooked.",
    },
    {
      ar: "تدخل فَهيم",
      en: "Intervention",
      bodyAr:
        "ماذا يحدث للعجلة إذا زادت القوة والكتلة بالنسبة نفسها؟ فكّر في العلاقة بينهما.",
      bodyEn:
        "What happens to acceleration if force and mass increase by the same proportion? Think about their relationship.",
    },
    {
      ar: "إعادة المحاولة",
      en: "Retry",
      bodyAr: "طبّق العلاقة على حالة جديدة، ثم اشرح لماذا اخترت إجابتك.",
      bodyEn:
        "Apply the relationship to a new case, then explain why you chose your answer.",
    },
    {
      ar: "دليل الفهم",
      en: "Evidence",
      bodyAr:
        "المحاولة والتفسير والمصدر أدلة منفصلة. إجابة صحيحة وحدها لا تكفي لإثبات بقاء الفهم.",
      bodyEn:
        "The attempt, explanation, and source are separate evidence. One right answer does not establish durable understanding.",
    },
    {
      ar: "اختبار الذاكرة",
      en: "Recall",
      bodyAr:
        "ما زال الاسترجاع المؤجل ونقل الفكرة إلى سياق جديد يحتاجان دليلًا.",
      bodyEn:
        "Delayed recall and transfer to a new context still need evidence.",
    },
  ];
  return (
    <section
      className="hero-learning-story"
      aria-label={ar ? "رحلة توضيحية للفهم" : "Illustrative learning journey"}
    >
      <header>
        <span className="os-eyebrow">
          {ar ? "من المحاولة إلى الفهم" : "From an attempt to understanding"}
        </span>
        <small>
          {ar
            ? "مثال تفاعلي · ليس نتيجة طالب"
            : "Interactive example · not a learner result"}
        </small>
      </header>
      <div className="hero-story-steps">
        {steps.map((item, i) => (
          <button
            key={item.en}
            type="button"
            aria-pressed={step === i}
            onClick={() => setStep(i)}
          >
            <span>{String(i + 1).padStart(2, "0")}</span>
            {ar ? item.ar : item.en}
          </button>
        ))}
      </div>
      <div className="hero-story-content" aria-live="polite">
        <span className="os-ai-mark">
          <Sparkles size={20} />
        </span>
        <h2>{ar ? steps[step].ar : steps[step].en}</h2>
        <p>{ar ? steps[step].bodyAr : steps[step].bodyEn}</p>
      </div>
      <footer>
        <button
          type="button"
          className="atlas-secondary"
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
        >
          {ar ? "السابق" : "Previous"}
        </button>
        {step < steps.length - 1 ? (
          <button
            type="button"
            className="atlas-primary"
            onClick={() => setStep((s) => s + 1)}
          >
            {ar ? "الدليل التالي" : "Next evidence"}
          </button>
        ) : (
          <Link className="atlas-primary" to="/showcase">
            {ar ? "شاهد الرحلة كاملة" : "Explore the full journey"}
          </Link>
        )}
      </footer>
    </section>
  );
}
