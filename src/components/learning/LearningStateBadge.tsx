import {
  CheckCircle2,
  Circle,
  CircleDashed,
  AlertTriangle as TriangleAlert,
} from "lucide-react";
export type LearningState = "verified" | "developing" | "untested" | "review";
const states = {
  verified: { ar: "موثّق", en: "Verified", icon: CheckCircle2 },
  developing: { ar: "قيد التكوّن", en: "Developing", icon: CircleDashed },
  untested: { ar: "لم يُختبر", en: "Untested", icon: Circle },
  review: { ar: "يحتاج مراجعة", en: "Needs review", icon: TriangleAlert },
};
export default function LearningStateBadge({
  state,
  language,
}: {
  state: LearningState;
  language: "ar" | "en";
}) {
  const item = states[state];
  const Icon = item.icon;
  return (
    <span className="learning-state-badge" data-state={state}>
      <Icon aria-hidden="true" />
      {item[language]}
    </span>
  );
}
