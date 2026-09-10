import { useState } from "react";
import type {
  LearningEventType,
  LearningSession,
} from "@/lib/learningEvidence";
import LearningStateBadge, { type LearningState } from "./LearningStateBadge";

const dimensions: {
  key: string;
  ar: string;
  en: string;
  type: LearningEventType;
}[] = [
  { key: "explain", ar: "اشرح", en: "Explain", type: "attempt_submitted" },
  { key: "recall", ar: "استرجع", en: "Recall", type: "review_recalled" },
  { key: "apply", ar: "طبّق", en: "Apply", type: "retry_submitted" },
  {
    key: "transfer",
    ar: "انقل الفهم",
    en: "Transfer",
    type: "transfer_applied",
  },
  { key: "source", ar: "المصدر", en: "Source", type: "evidence_created" },
];
export default function UnderstandingMap({
  session,
  language,
}: {
  session: LearningSession;
  language: "ar" | "en";
}) {
  const [selected, setSelected] = useState("explain");
  const ar = language === "ar";
  const nodes = dimensions.map((d) => {
    const events = session.events.filter((e) => e.type === d.type);
    const event = events[events.length - 1];
    // An event proves an attempt exists, not that a learner has mastered a concept.
    const verified =
      d.key === "source"
        ? session.classification === "verified_source" &&
          Boolean(session.sourceTitle)
        : event?.payload?.verified === true;
    const state: LearningState = verified
      ? "verified"
      : d.key === "recall" &&
          session.reviewDueAt &&
          new Date(session.reviewDueAt) <= new Date()
        ? "review"
        : event
          ? "developing"
          : "untested";
    return { ...d, event, state, count: events.length };
  });
  const active = nodes.find((n) => n.key === selected)!;
  return (
    <section
      className="understanding-map"
      aria-label={ar ? "خريطة الفهم" : "Understanding map"}
    >
      <header>
        <div>
          <span className="os-eyebrow">
            {ar ? "دليل متعدد الأبعاد" : "Evidence dimensions"}
          </span>
          <h3>
            {ar ? "كيف نعرف أنك فهمت؟" : "How do we know you understand?"}
          </h3>
        </div>
      </header>
      <div className="understanding-nodes">
        {nodes.map((node) => (
          <button
            key={node.key}
            type="button"
            aria-pressed={selected === node.key}
            onClick={() => setSelected(node.key)}
          >
            <span
              className="evidence-ring"
              data-state={node.state}
              aria-hidden="true"
            />
            <strong>{node[language]}</strong>
            <LearningStateBadge language={language} state={node.state} />
          </button>
        ))}
      </div>
      <div className="understanding-detail" aria-live="polite">
        <strong>{active[language]}</strong>
        <p>
          {active.event?.summary ||
            (ar
              ? "لا يوجد دليل مسجل لهذا البعد بعد."
              : "No evidence has been recorded for this dimension yet.")}
        </p>
        <dl>
          <div>
            <dt>{ar ? "المحاولات المسجلة" : "Recorded attempts"}</dt>
            <dd>{active.count}</dd>
          </div>
          <div>
            <dt>{ar ? "آخر دليل" : "Latest evidence"}</dt>
            <dd>
              {active.event
                ? new Date(active.event.occurredAt).toLocaleDateString(
                    ar ? "ar-EG" : "en-GB",
                  )
                : "—"}
            </dd>
          </div>
          <div>
            <dt>{ar ? "استخدام التلميح" : "Hint usage"}</dt>
            <dd>
              {typeof active.event?.payload?.hintsUsed === "boolean"
                ? active.event.payload.hintsUsed
                  ? ar
                    ? "نعم"
                    : "Yes"
                  : ar
                    ? "لا"
                    : "No"
                : ar
                  ? "غير مسجل"
                  : "Not recorded"}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
