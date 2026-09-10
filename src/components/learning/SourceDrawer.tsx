import { BookOpen, ChevronDown } from "lucide-react";
import type { LearningSession } from "@/lib/learningEvidence";
import { displayLabel } from "@/lib/displayLabels";
export default function SourceDrawer({
  session,
  language,
}: {
  session: LearningSession;
  language: "ar" | "en";
}) {
  const ar = language === "ar";
  return (
    <details className="source-drawer">
      <summary>
        <BookOpen size={17} />
        <span>
          {session.sourceTitle ||
            (ar ? "المصدر غير مرفق بعد" : "Source not attached yet")}
        </span>
        <ChevronDown size={17} />
      </summary>
      <dl>
        {[
          [
            ar ? "التصنيف" : "Classification",
            displayLabel(session.classification, language),
          ],
          [ar ? "الموضع" : "Section", session.sourceLocation],
          [ar ? "نسخة المصدر" : "Source version", session.sourceVersion],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value || (ar ? "غير مسجل" : "Not recorded")}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
