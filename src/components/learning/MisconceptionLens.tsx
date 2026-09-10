import type { LearningSession } from "@/lib/learningEvidence";
import { ArrowLeft, ArrowRight } from "lucide-react";
export default function MisconceptionLens({
  session,
  language,
}: {
  session: LearningSession;
  language: "ar" | "en";
}) {
  const ar = language === "ar";
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const attempt = session.events.find((e) => e.type === "attempt_submitted");
  const hypothesis = session.events
    .filter((e) => e.type === "misconception_detected")
    .slice(-1)[0];
  const intervention = session.events
    .filter((e) => e.type === "intervention_completed")
    .slice(-1)[0];
  if (!hypothesis) return null;
  return (
    <section className="misconception-lens">
      <header>
        <span className="os-eyebrow">
          {ar ? "عدسة الفهم" : "Misconception lens"}
        </span>
        <h3>{ar ? "تفسير قابل للمراجعة" : "A revisable interpretation"}</h3>
      </header>
      <div>
        {[
          [ar ? "الفكرة الحالية" : "Current model", attempt?.summary],
          [
            ar ? "موضع الالتباس المحتمل" : "Possible confusion",
            hypothesis.summary,
          ],
          [
            ar ? "اتجاه التصحيح" : "Direction of correction",
            intervention?.summary,
          ],
        ].map(([label, body], i) => (
          <section key={label}>
            <span className="os-eyebrow">{label}</span>
            <p>
              {body ||
                (ar
                  ? "ينتظر دليلًا من المحاولة التالية."
                  : "Awaiting evidence from the next attempt.")}
            </p>
            {i < 2 && <Arrow size={18} aria-hidden="true" />}
          </section>
        ))}
      </div>
      <p className="text-xs text-[var(--muted)]">
        {ar
          ? "هذه فرضية مبنية على المحاولة؛ يمكن تعديلها عند ظهور دليل جديد."
          : "This hypothesis is based on an attempt and can change when new evidence appears."}
      </p>
    </section>
  );
}
