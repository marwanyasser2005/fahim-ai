import type { LearningSession } from "@/lib/learningEvidence";
export default function LearningChanges({
  sessions,
  language,
}: {
  sessions: LearningSession[];
  language: "ar" | "en";
}) {
  const ar = language === "ar";
  return (
    <section className="learning-panel">
      <h2>{ar ? "ما تغيّر في فهمي" : "My learning changes"}</h2>
      <p className="text-sm text-[var(--muted)]">
        {ar
          ? "محاولتك الأولى والتفسير الذي وصلت إليه؛ كل خطوة محفوظة في سياقها."
          : "Your earlier attempt and the explanation you reached, with each step kept in context."}
      </p>
      <div className="learning-changes">
        {sessions.length ? (
          sessions.slice(0, 6).map((s) => {
            const before = s.events.find((e) => e.type === "attempt_submitted");
            const after = s.events
              .filter((e) => e.type === "retry_submitted")
              .slice(-1)[0];
            return (
              <article className="learning-change" key={s.id}>
                <h3>{ar ? s.conceptAr : s.conceptEn}</h3>
                <div className="learning-change-grid">
                  <div>
                    <span className="os-eyebrow">
                      {ar ? "محاولتي الأولى" : "My earlier attempt"}
                    </span>
                    <p>
                      {before?.summary ||
                        (ar
                          ? "لم تسجل محاولة بعد."
                          : "No attempt recorded yet.")}
                    </p>
                  </div>
                  <div>
                    <span className="os-eyebrow">
                      {ar ? "ما وصلت إليه" : "What I reached"}
                    </span>
                    <p>
                      {after?.summary ||
                        (ar
                          ? "إعادة المحاولة هي الدليل التالي المطلوب."
                          : "A retry is the next evidence to collect.")}
                    </p>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <p>
            {ar
              ? "ابدأ تقييمًا لتحتفظ بقصة تغيّر فهمك هنا."
              : "Start an assessment to keep your learning story here."}
          </p>
        )}
      </div>
    </section>
  );
}
