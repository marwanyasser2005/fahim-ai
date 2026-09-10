import type { ReviewCard } from "@/lib/spacedReview";
import LearningStateBadge from "./LearningStateBadge";
export default function MemoryTimeline({
  cards,
  language,
  onSelect,
}: {
  cards: ReviewCard[];
  language: "ar" | "en";
  onSelect: (id: string) => void;
}) {
  const ar = language === "ar";
  const now = Date.now();
  const groups = [
    { ar: "اليوم", en: "Today", min: -Infinity, max: 1 },
    { ar: "خلال يومين", en: "Within 2 days", min: 1, max: 3 },
    { ar: "هذا الأسبوع", en: "This week", min: 3, max: 7 },
    {
      ar: "الأسبوع القادم وما بعده",
      en: "Next week & later",
      min: 7,
      max: Infinity,
    },
  ];
  return (
    <section className="memory-timeline">
      <h2>{ar ? "خطّ الذاكرة" : "Your memory timeline"}</h2>
      {groups.map((group) => {
        const items = cards
          .filter((c) => {
            const days = (new Date(c.dueAt).getTime() - now) / 86400000;
            return days >= group.min && days < group.max;
          })
          .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
        return (
          <div className="memory-group" key={group.en}>
            <h3>
              {group[language]} · {items.length}
            </h3>
            <div>
              {items.length ? (
                items.map((card) => (
                  <button
                    type="button"
                    key={card.id}
                    onClick={() => onSelect(card.id)}
                  >
                    <span>
                      <strong>{card.front}</strong>
                      <small>
                        {new Date(card.dueAt).toLocaleDateString(
                          ar ? "ar-EG" : "en-GB",
                        )}{" "}
                        ·{" "}
                        {ar
                          ? "استرجاع دون النظر للإجابة"
                          : "Recall without looking at the answer"}
                      </small>
                      <small>
                        {card.lastGrade === "again"
                          ? ar
                            ? "السبب: تحتاج محاولة التذكر إلى تعزيز."
                            : "Reason: the last recall needs reinforcement."
                          : ar
                            ? "السبب: اختبر بقاء الفكرة بعد مرور الوقت."
                            : "Reason: check whether the idea persists over time."}
                      </small>
                    </span>
                    <LearningStateBadge
                      language={language}
                      state={
                        new Date(card.dueAt).getTime() <= now
                          ? "review"
                          : card.repetitions
                            ? "developing"
                            : "untested"
                      }
                    />
                  </button>
                ))
              ) : (
                <p className="text-sm text-[var(--muted)]">
                  {ar
                    ? "لا توجد مراجعات مجدولة في هذه الفترة."
                    : "No reviews scheduled in this period."}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
