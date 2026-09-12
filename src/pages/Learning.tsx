import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Check,
  Clock3,
  Compass,
  ListChecks,
} from "lucide-react";
interface LearningProps {
  language: "ar" | "en";
}
const copy = {
  ar: {
    tag: "رحلة التعلم",
    title: "رتّب جلسة اليوم قبل أن تبدأ.",
    body: "هدف واحد، مصدر واحد، وتطبيق قصير. هذا المسار يمنع التشتت ويحوّل كل جلسة إلى خطوة يمكن قياسها.",
    ask: "ابدأ بسؤال",
    videos: "اختر فيديو",
    session: "إيقاع 45 دقيقة",
    phases: [
      ["افهم", "15 دقيقة: اقرأ التعريف واسأل عن النقطة الصعبة."],
      ["شاهد", "10 دقائق: اختر فيديوًا واحدًا مناسبًا للمفهوم."],
      ["طبّق", "15 دقيقة: حل مثالًا دون نقل الخطوات."],
      ["استرجع", "5 دقائق: اكتب ما فهمته من الذاكرة."],
    ],
    rules: [
      ["صغّر الهدف", "درس واحد أو مفهوم واحد في الجلسة."],
      ["غيّر النشاط", "لا تجعل الجلسة مشاهدة فقط."],
      ["تحقق من المصدر", "ارجع للكتاب أو المنصة الرسمية عند تفاصيل المنهج."],
    ],
  },
  en: {
    tag: "Learning journey",
    title: "Structure today’s session before you begin.",
    body: "One goal, one source, and one short application. This path reduces distraction and makes every session measurable.",
    ask: "Start with a question",
    videos: "Pick a video",
    session: "A 45-minute rhythm",
    phases: [
      [
        "Understand",
        "15 min: read the definition and ask about the hard point.",
      ],
      ["Watch", "10 min: choose one video matched to the concept."],
      ["Apply", "15 min: solve an example without copying the steps."],
      ["Recall", "5 min: write what you learned from memory."],
    ],
    rules: [
      ["Shrink the goal", "One lesson or concept per session."],
      ["Change the activity", "Do not make the session passive watching."],
      [
        "Verify the source",
        "Use the textbook or official platform for curriculum details.",
      ],
    ],
  },
} as const;
export default function Learning({ language }: LearningProps) {
  const t = copy[language];
  const Arrow = language === "ar" ? ArrowLeft : ArrowRight;
  return (
    <main className="min-h-[72vh] bg-[var(--surface)] pb-20">
      <section className="atlas-grid border-b border-[var(--border)] bg-[var(--paper)] py-14 dark:bg-[#0b1116] sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="atlas-kicker">
            {t.tag}
          </p>
          <h1 className="atlas-display mt-5 text-4xl sm:text-6xl">
            {t.title}
          </h1>
          <p className="mt-5 max-w-2xl leading-8 text-[var(--muted)]">
            {t.body}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/ask-fahim"
              className="atlas-primary"
            >
              <BrainCircuit className="h-4 w-4" />
              {t.ask}
              <Arrow className="h-4 w-4" />
            </Link>
            <Link
              to="/videos"
              className="atlas-secondary"
            >
              <BookOpen className="h-4 w-4 text-red-600" />
              {t.videos}
            </Link>
          </div>
        </div>
      </div>
      </section>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <section className="premium-card p-6 sm:p-8">
            <h2 className="flex items-center gap-2 text-xl font-black text-[var(--text)]">
              <Clock3 className="h-5 w-5 text-[var(--nile)]" />
              {t.session}
            </h2>
            <div className="mt-7 space-y-3">
              {t.phases.map(([title, body], index) => (
                <div
                  key={title}
                  className="flex items-start gap-4 border border-[var(--border)] bg-[var(--soft)] p-4"
                >
                  <span className="atlas-index bg-[var(--panel)]">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-black text-[var(--text)]">
                      {title}
                    </p>
                    <p className="mt-1 text-xs leading-6 text-[var(--muted)]">
                      {body}
                    </p>
                  </div>
                  {index === 3 && (
                    <Check className="ms-auto h-5 w-5 text-teal-600" />
                  )}
                </div>
              ))}
            </div>
          </section>
          <aside className="border border-[var(--band)] bg-[var(--band)] p-6 text-white shadow-[7px_7px_0_var(--saffron)] sm:p-8">
            <h2 className="flex items-center gap-2 text-xl font-black">
              <Compass className="h-5 w-5 text-teal-300" />
              {language === "ar" ? "بعد الجلسة" : "After the session"}
            </h2>
            <p className="mt-5 text-sm leading-8 text-slate-300">
              {language === "ar"
                ? "اسأل نفسك: هل أستطيع شرح الفكرة دون النظر؟ إن لم تستطع، ارجع إلى نقطة واحدة فقط بدل إعادة الدرس كله."
                : "Ask yourself: can I explain the idea without looking? If not, return to one point instead of replaying the whole lesson."}
            </p>
            <Link
              to="/library"
              className="mt-7 inline-flex min-h-12 items-center gap-2 bg-white px-4 py-3 text-sm font-black text-slate-950"
            >
              {language === "ar" ? "راجع المفهوم" : "Review the concept"}
              <Arrow className="h-4 w-4" />
            </Link>
          </aside>
        </div>
        <section className="premium-card mt-6 p-6 sm:p-8">
          <h2 className="flex items-center gap-2 text-xl font-black text-[var(--text)]">
            <ListChecks className="h-5 w-5 text-[var(--nile)]" />
            {language === "ar"
              ? "قواعد تقلل التشتت"
              : "Rules that reduce distraction"}
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {t.rules.map(([title, body]) => (
              <div
                key={title}
                className="border-t-2 border-[var(--saffron)] bg-[var(--soft)] p-5"
              >
                <p className="font-black text-[var(--text)]">
                  {title}
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
