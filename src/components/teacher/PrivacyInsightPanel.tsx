import { Check, LockKeyhole } from "lucide-react";
export default function PrivacyInsightPanel({
  language,
}: {
  language: "ar" | "en";
}) {
  const ar = language === "ar";
  return (
    <section className="privacy-insight">
      <h2>
        {ar
          ? "إشارات مفيدة، بخصوصية محفوظة"
          : "Actionable insights, with privacy"}
      </h2>
      <div>
        <div>
          <strong>
            <Check />
            {ar ? "ما يمكنك رؤيته" : "What you can see"}
          </strong>
          <p>
            {ar
              ? "صعوبات على مستوى المفهوم، حالة الدليل وإشارات التدخل للفصول التي تديرها، وفق حد العينة المطلوب."
              : "Concept-level difficulty, evidence states, and intervention signals for classes you manage, subject to the sample threshold."}
          </p>
        </div>
        <div>
          <strong>
            <LockKeyhole />
            {ar ? "ما يظل خاصًا" : "What stays private"}
          </strong>
          <p>
            {ar
              ? "محادثات الطالب الخاصة وبياناته الشخصية الحساسة لا تدخل في تحليلات الفصل."
              : "Private student conversations and sensitive personal data are excluded from class analytics."}
          </p>
        </div>
      </div>
    </section>
  );
}
