import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpenCheck,
  BrainCircuit,
  Cloud,
  ExternalLink,
  FlaskConical,
  Globe2,
  GraduationCap,
  Network,
  Quote,
  ShieldCheck,
  Target,
} from "lucide-react";

const founderTracks = [
  {
    icon: BrainCircuit,
    ar: "هندسة الذكاء الاصطناعي والتعلّم الآلي والعميق",
    en: "AI engineering, machine learning, and deep learning",
  },
  {
    icon: Cloud,
    ar: "تطبيقات الذكاء الاصطناعي والسحابة والاستدامة الرقمية",
    en: "AI applications, cloud, and digital sustainability",
  },
  {
    icon: FlaskConical,
    ar: "الحوسبة الكمية عبر برامج QWorld",
    en: "Quantum computing through QWorld programs",
  },
  {
    icon: Network,
    ar: "بناء وقيادة مجتمعات المطورين",
    en: "Developer-community building and leadership",
  },
] as const;

const affiliations = [
  ["WorldQuant University", "Deep Learning Fundamentals Lab"],
  ["HCDG Giza", "Lead & Owner"],
  [
    "Digital Egypt Pioneers Initiative",
    "AI & Data Science، Microsoft ML Engineer Track",
  ],
  ["Kader & Associates Designs", "Junior AI Expert"],
  ["QWorld", "Quantum Computing Programs"],
  ["Helwan University", "Faculty of Science، Geology & Chemistry"],
] as const;

const achievements = [
  [
    "Huawei ICT Competition 2025–2026",
    "Silver Medal، Cloud Track, National Phase",
  ],
  ["SOLE2025 BioHackathon", "3rd Place، Metagenomics & AI Track"],
  ["EcoHack", "2nd Place"],
  ["ITIDA GIGS", "Top Achiever، 3rd Place"],
] as const;

export default function About({ language }: { language: "ar" | "en" }) {
  const rtl = language === "ar";
  const Arrow = rtl ? ArrowLeft : ArrowRight;
  return (
    <main className="bg-[var(--surface)]">
      <section className="relative overflow-hidden border-b border-[var(--band)] bg-[var(--paper)]">
        <div className="atlas-grid absolute inset-0 opacity-50" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:px-8 lg:py-24">
          <div className="min-w-0">
            <p className="atlas-kicker">
              <BookOpenCheck className="h-4 w-4" />
              {rtl ? "عن فَهيم" : "About Fahim"}
            </p>
          <h1 className="about-hero-title atlas-display mt-7 text-[clamp(2.75rem,6vw,5.35rem)]">
              {rtl
                ? "التعلّم يجب أن ينتج دليلًا، لا نشاطًا فقط."
                : "Learning should produce evidence—not just activity."}
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-9 text-[var(--muted)] sm:text-lg">
              {rtl
                ? "فَهيم يُبنى كنظام تشغيل للفهم الموثق: يجمع المصدر والمحاولة والخطأ والتدخل والمراجعة والتطبيق في مسار يمكن للمتعلم رؤيته وفحصه."
                : "Fahim is being built as an operating system for verified understanding: source, attempt, error, intervention, review, and application form a trail the learner can inspect."}
            </p>
          </div>
          <blockquote className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#14213D] p-7 text-white shadow-[8px_8px_0_#F2B84B] sm:p-9">
            <span className="absolute -end-8 -top-10 h-32 w-32 rounded-full bg-[#0F766E]/20 blur-2xl" />
            <Quote className="relative h-8 w-8 text-[#F2B84B]" />
            <p className="relative mt-6 text-lg font-black leading-9 sm:text-xl sm:leading-10">
              {rtl
                ? "المشكلة ليست نقص المحتوى. المشكلة أن الطالب لا يعرف: ماذا فهمت؟ لماذا أخطأت؟ ماذا أراجع الآن؟ وما الدليل على تقدمي؟"
                : "The problem is not a lack of content. It is not knowing: what did I understand, why was I wrong, what should I review now, and what proves my progress?"}
            </p>
          </blockquote>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr]">
          <div>
            <p className="atlas-section-number">
              01 / {rtl ? "لماذا يوجد فَهيم؟" : "Why Fahim exists"}
            </p>
            <h2 className="mt-4 text-3xl font-black text-[var(--text)]">
              {rtl
                ? "من الاستهلاك إلى الفهم القابل للإثبات."
                : "From consumption to provable understanding."}
            </h2>
          </div>
          <div className="grid gap-px border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2">
            {[
              [
                rtl ? "مصدر قبل الإجابة" : "Source before answer",
                rtl
                  ? "المحتوى المعتمد وإصداره وموضع الادعاء جزء من التجربة."
                  : "The approved source, version, and claim location belong in the experience.",
                BadgeCheck,
              ],
              [
                rtl ? "محاولة قبل اليقين" : "Attempt before certainty",
                rtl
                  ? "لا نساوي بين مشاهدة الشرح والقدرة على الحل."
                  : "Watching an explanation is not the same as being able to solve.",
                Target,
              ],
              [
                rtl ? "الخطأ أصل تعليمي" : "Mistakes are learning assets",
                rtl
                  ? "يُحفظ سبب الخطأ والتدخل والنسخة المصححة بدل إخفائه."
                  : "The cause, intervention, and corrected version are kept instead of hidden.",
                BrainCircuit,
              ],
              [
                rtl ? "خصوصية بحدود واضحة" : "Privacy with boundaries",
                rtl
                  ? "ولي الأمر يرى التقدم دون قراءة المحادثات افتراضيًا."
                  : "Parents see progress without reading private conversations by default.",
                ShieldCheck,
              ],
            ].map(([title, body, Icon]) => {
              const ItemIcon = Icon as typeof Target;
              return (
                <article key={String(title)} className="bg-[var(--panel)] p-6">
                  <ItemIcon className="h-5 w-5 text-[var(--nile)]" />
                  <h3 className="mt-5 text-lg font-black text-[var(--text)]">
                    {String(title)}
                  </h3>
                  <p className="mt-2 text-sm leading-8 text-[var(--muted)]">
                    {String(body)}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--band)] bg-[#14213D] text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <p className="atlas-section-number !text-[#F2B84B]">
            02 / {rtl ? "منظومة التعلّم" : "The learning system"}
          </p>
          <h2 className="mt-6 max-w-5xl text-3xl font-black leading-[1.35] sm:text-5xl sm:leading-[1.25]">
            {rtl
              ? "مصدر ← فهم ← شرح ← محاولة ← خطأ ← تدخل ← مراجعة ← تطبيق ← دليل"
              : "Source → Understand → Explain → Attempt → Error → Intervention → Review → Apply → Evidence"}
          </h2>
          <p className="mt-7 max-w-3xl text-base leading-8 text-blue-100">
            {rtl
              ? "هذه ليست قائمة خصائص تسويقية؛ إنها العقد الذي ينبغي لكل جلسة تعلم أن تحققه. إذا تعذر المصدر أو الذكاء الاصطناعي، تظهر الحالة كما هي بدل اختلاق نتيجة."
              : "This is not a marketing feature list; it is the contract each session should satisfy. If a source or AI service is unavailable, the product says so instead of fabricating a result."}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <p className="atlas-section-number">
              03 / {rtl ? "المؤسس" : "Founder"}
            </p>
            <h2 className="mt-4 text-4xl font-black text-[var(--text)]">
              Marwan Abdelghaffar
            </h2>
            <p className="mt-2 text-sm font-black text-[#D95D39]">
              AI Engineer · Product Builder · Community Lead
            </p>
            <p className="mt-5 text-sm leading-8 text-[var(--muted)]">
              {rtl
                ? "مهندس ذكاء اصطناعي متخصص في التعلّم الآلي والعميق، يبني تطبيقات عملية ويجمع في مساره بين العلم والتقنية والتعليم وقيادة المجتمعات."
                : "An AI engineer specialized in machine learning and deep learning, building practical systems at the intersection of science, technology, education, and community leadership."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="https://www.linkedin.com/in/marwan-abdelghaffar"
                target="_blank"
                rel="noreferrer"
                className="atlas-primary"
              >
                LinkedIn
                <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href="https://www.marwan-abdelghaffar.us/"
                target="_blank"
                rel="noreferrer"
                className="atlas-secondary"
              >
                {rtl ? "الموقع الشخصي" : "Portfolio"}
                <Globe2 className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div>
            <figure className="relative overflow-hidden border border-[var(--band)] bg-[var(--paper)] p-3 shadow-[8px_8px_0_#F2B84B]">
              <img
                src="/images/founder/marwan-abdelghaffar.webp"
                alt={
                  rtl
                    ? "مروان عبد الغفار، مؤسس فَهيم"
                    : "Marwan Abdelghaffar, founder of Fahim"
                }
                width="800"
                height="800"
                loading="eager"
                className="aspect-square w-full object-cover object-center"
              />
              <figcaption className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-2 pt-3 text-[10px] font-black text-[var(--muted)]">
                <span>{rtl ? "القاهرة · مصر" : "Cairo · Egypt"}</span>
                <span>{rtl ? "مؤسس فَهيم" : "Founder of Fahim"}</span>
              </figcaption>
            </figure>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {founderTracks.map((track) => (
                <div
                  key={track.en}
                  className="flex items-start gap-3 border border-[var(--border)] bg-[var(--panel)] p-4"
                >
                  <track.icon className="mt-1 h-4 w-4 shrink-0 text-[var(--nile)]" />
                  <p className="text-xs font-bold leading-6 text-[var(--text)]">
                    {rtl ? track.ar : track.en}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--paper)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="atlas-section-number">
              {rtl ? "الخلفية المهنية" : "Background"}
            </p>
            <div className="mt-5 divide-y divide-[var(--border)] border-y border-[var(--border)]">
              {affiliations.map(([name, role]) => (
                <div
                  key={name}
                  className="grid gap-1 py-4 sm:grid-cols-[1fr_1.2fr]"
                >
                  <strong className="text-sm text-[var(--text)]">{name}</strong>
                  <span className="text-xs leading-6 text-[var(--muted)]">
                    {role}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="atlas-section-number">
              {rtl ? "إنجازات مختارة" : "Selected achievements"}
            </p>
            <div className="mt-5 grid gap-3">
              {achievements.map(([name, result]) => (
                <article
                  key={name}
                  className="flex items-start gap-4 border border-[var(--border)] bg-[var(--panel)] p-4"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center bg-[#F2B84B] text-[#14213D]">
                    <Award className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-[var(--text)]">
                      {name}
                    </h3>
                    <p className="mt-1 text-xs leading-6 text-[var(--muted)]">
                      {result}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:py-24">
        <GraduationCap className="mx-auto h-8 w-8 text-[#D95D39]" />
        <h2 className="atlas-display mt-5 text-4xl sm:text-6xl">
          {rtl
            ? "ابنِ دليلًا على ما فهمت."
            : "Build evidence of what you understand."}
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-[var(--muted)]">
          {rtl
            ? "التجربة الكاملة 30 يومًا دون بطاقة. يبدأ الاستخدام الحقيقي بعد إنشاء حساب حتى تبقى ملفاتك ومحاولاتك وأدلتك مرتبطة بك."
            : "The full trial is 30 days with no card. Real use starts after account creation so your files, attempts, and evidence remain yours."}
        </p>
        <Link
          to="/register"
          state={{ from: "/dashboard" }}
          className="atlas-primary mt-8 justify-center"
        >
          {rtl ? "ابدأ التجربة" : "Start the trial"}
          <Arrow className="h-4 w-4" />
        </Link>
      </section>
    </main>
  );
}
