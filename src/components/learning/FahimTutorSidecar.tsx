import { Link } from "react-router-dom";
import { Sparkles, ArrowUpRight, BookOpen } from "lucide-react";
import type { LearningSession } from "@/lib/learningEvidence";
export default function FahimTutorSidecar({
  session,
  topic,
  language,
}: {
  session?: LearningSession;
  topic: string;
  language: "ar" | "en";
}) {
  const ar = language === "ar";
  const hypothesis = session?.events
    .filter((e) => e.type === "misconception_detected")
    .slice(-1)[0];
  const attempt = session?.events
    .filter((e) => e.type === "attempt_submitted")
    .slice(-1)[0];
  const query = new URLSearchParams({ q: topic, mode: "explain" });
  return (
    <aside className="tutor-sidecar">
      <header>
        <span className="os-ai-mark">
          <Sparkles size={18} />
        </span>
        <div>
          <h2>{ar ? "فَهيم معك" : "Fahim, beside you"}</h2>
          <p>
            {ar
              ? "مساعدة مرتبطة بما تتعلمه"
              : "Guidance in your learning context"}
          </p>
        </div>
      </header>
      <section>
        <span className="os-eyebrow">
          {ar ? "ما لاحظناه" : "What we noticed"}
        </span>
        <p>
          {hypothesis?.summary ||
            (ar
              ? "ابدأ بمحاولة واشرح سبب إجابتك، ليبني فَهيم تدخله على تفكيرك."
              : "Start with an attempt and explain your reasoning so Fahim can respond to your thinking.")}
        </p>
      </section>
      {hypothesis && (
        <section className="hypothesis-note">
          <strong>
            {ar ? "فرضية قابلة للمراجعة" : "A revisable hypothesis"}
          </strong>
          {attempt && <blockquote>{attempt.summary}</blockquote>}
          <p>
            {ar ? "درجة الثقة المسجلة" : "Recorded confidence"}:{" "}
            {typeof hypothesis.confidence === "number"
              ? `${Math.round(hypothesis.confidence * (hypothesis.confidence <= 1 ? 100 : 1))}%`
              : ar
                ? "غير متاحة"
                : "Not available"}
          </p>
        </section>
      )}
      <section>
        <span className="os-eyebrow">
          {ar ? "الخطوة التالية" : "Next step"}
        </span>
        {[
          [ar ? "تلميح يساعدني أفكر" : "Help me with a hint", "hint"],
          [ar ? "اشرحها ببساطة" : "Explain it simply", "explain"],
          [ar ? "اسألني سؤالًا جديدًا" : "Ask another question", "quiz"],
        ].map(([label, mode]) => (
          <Link
            key={mode}
            to={`/ask-fahim?${new URLSearchParams({ q: topic, mode })}`}
            className="sidecar-action"
          >
            {label}
            <ArrowUpRight size={16} />
          </Link>
        ))}
      </section>
      <Link
        className="sidecar-source"
        to={`/library?q=${encodeURIComponent(topic)}`}
      >
        <BookOpen size={17} />
        <span>
          {session?.sourceTitle || (ar ? "ابحث عن المصدر" : "Find a source")}
        </span>
      </Link>
      <footer>
        <p>
          {ar
            ? "قد يخطئ الذكاء الاصطناعي. راجع المصدر وجرّب الفكرة بنفسك."
            : "AI can be wrong. Review the source and test the idea yourself."}
        </p>
        <Link to={`/ask-fahim?${query}`} className="atlas-primary">
          {ar ? "اسأل فَهيم" : "Ask Fahim"}
          <Sparkles size={16} />
        </Link>
      </footer>
    </aside>
  );
}
