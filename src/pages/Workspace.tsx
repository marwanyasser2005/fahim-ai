import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, BrainCircuit, Clock3 } from "lucide-react";
import { getStudyStats, recordStudyAction } from "@/lib/studyProgress";
import { loadLearningSessions } from "@/lib/learningEvidence";
import { readScopedJson, writeScopedJson } from "@/lib/userScope";
import { displayLabel } from "@/lib/displayLabels";
import FahimTutorSidecar from "@/components/learning/FahimTutorSidecar";
import LearningEvidencePanel from "@/components/learning/LearningEvidencePanel";

export default function Workspace({ language }: { language: "ar" | "en" }) {
  const ar = language === "ar";
  const navigate = useNavigate();
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const [profile, setProfile] = useState<{
    grade: string;
    subject: string;
    topic: string;
  }>(() => ({
    grade: "",
    subject: "",
    topic: "",
    ...readScopedJson<{
      grade?: string;
      subject?: string;
      topic?: string;
    }>("fahim-study-profile", {}),
  }));
  const [stats, setStats] = useState(getStudyStats);
  const [sessions, setSessions] = useState(loadLearningSessions);
  const [view, setView] = useState("content");
  useEffect(() => {
    const refresh = () => {
      setStats(getStudyStats());
      setSessions(loadLearningSessions());
    };
    window.addEventListener("fahim-progress", refresh);
    window.addEventListener("fahim-evidence", refresh);
    return () => {
      window.removeEventListener("fahim-progress", refresh);
      window.removeEventListener("fahim-evidence", refresh);
    };
  }, []);
  const session = sessions.find(
    (s) => s.conceptAr === profile.topic || s.conceptEn === profile.topic,
  );
  const params = new URLSearchParams({
    q: profile.topic,
    grade: profile.grade,
    subject: profile.subject,
    mode: "explain",
  });
  const start = (event: FormEvent) => {
    event.preventDefault();
    if (profile.topic.trim().length < 3) return;
    writeScopedJson("fahim-study-profile", profile);
    recordStudyAction("session", profile.topic);
    navigate(`/ask-fahim?${params}`);
  };
  const map = [
    ["المفهوم", "Concept", "/workspace"],
    ["المصدر", "Source", `/library?${params}`],
    ["المحاولة", "Attempt", `/quiz-lab?${params}`],
    ["التشخيص", "Diagnosis", `/quiz-lab?${params}`],
    ["التدخل", "Intervention", `/ask-fahim?${params}`],
    ["إعادة المحاولة", "Retry", `/quiz-lab?${params}`],
    ["الدليل", "Evidence", "/passport"],
    ["الاسترجاع", "Recall", "/review"],
  ];
  return (
    <main className="workspace-page pb-20">
      <div
        className="workspace-mobile-tabs"
        aria-label={ar ? "أقسام مساحة التعلّم" : "Learning workspace sections"}
      >
        {[
          ["content", "المحتوى", "Content"],
          ["tutor", "فَهيم", "Fahim"],
          ["evidence", "الدليل", "Evidence"],
        ].map(([id, arabic, english]) => (
          <button
            key={id}
            type="button"
            aria-pressed={view === id}
            onClick={() => setView(id)}
          >
            {ar ? arabic : english}
          </button>
        ))}
      </div>
      <div className="workspace-os-shell" data-view={view}>
        <nav
          className="workspace-map"
          aria-label={ar ? "خريطة التعلّم" : "Learning map"}
        >
          <span className="os-eyebrow">
            {ar ? "رحلة الفهم" : "Understanding journey"}
          </span>
          {map.map(([arabic, english, to], i) => (
            <Link
              key={english}
              to={to}
              aria-current={i === 0 ? "step" : undefined}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              {ar ? arabic : english}
            </Link>
          ))}
        </nav>
        <div className="workspace-os-canvas">
          <div className="workspace-content">
            <p className="atlas-kicker">
              <BrainCircuit size={16} />
              {ar ? "مساحة التعلّم" : "Learning workspace"}
            </p>
            <h1 className="workspace-title">
              {ar
                ? "فكرة واحدة. نفهمها بعمق."
                : "One idea. Understand it deeply."}
            </h1>
            <p className="workspace-lead">
              {ar
                ? "ابدأ بما يشغلك. انتقل من المصدر إلى محاولتك، ثم اختبر ما تغيّر في فهمك."
                : "Start with your question. Move from a source to your own attempt, then test what changed in your understanding."}
            </p>
            <form onSubmit={start} className="workspace-form">
              <div className="workspace-field-grid">
                {(["grade", "subject"] as const).map((key) => (
                  <label key={key} className="workspace-label">
                    <span>
                      {key === "grade"
                        ? ar
                          ? "المرحلة"
                          : "Level"
                        : ar
                          ? "المادة"
                          : "Subject"}
                    </span>
                    <input
                      value={profile[key]}
                      maxLength={80}
                      onChange={(e) =>
                        setProfile({ ...profile, [key]: e.target.value })
                      }
                      className="workspace-field"
                    />
                  </label>
                ))}
              </div>
              <label className="workspace-label workspace-topic-label">
                <span>
                  {ar
                    ? "ما الذي تريد فهمه؟"
                    : "What would you like to understand?"}
                </span>
                <textarea
                  value={profile.topic}
                  onChange={(e) =>
                    setProfile({ ...profile, topic: e.target.value })
                  }
                  rows={4}
                  maxLength={500}
                  className="workspace-field"
                  placeholder={
                    ar
                      ? "اكتب المفهوم أو السؤال بطريقتك…"
                      : "Describe the concept or question in your own words…"
                  }
                />
              </label>
              <button
                className="workspace-start"
                disabled={profile.topic.trim().length < 3}
              >
                {ar ? "ابدأ رحلة الفهم" : "Start learning"}
                <Arrow size={17} />
              </button>
            </form>
            <div className="workspace-step-grid mt-6">
              {[
                ["/videos", "شاهد شرحًا", "Watch a lesson"],
                ["/library", "افحص المصدر", "Inspect the source"],
                ["/quiz-lab", "اختبر فهمك", "Test understanding"],
              ].map(([to, arabic, english]) => (
                <Link
                  key={to}
                  to={`${to}?${params}`}
                  className="sidecar-action"
                >
                  {ar ? arabic : english}
                  <Arrow size={16} />
                </Link>
              ))}
            </div>
            <section className="workspace-progress-card">
              <span className="os-eyebrow">
                <Clock3 size={16} />
                {ar
                  ? "نشاطك الأخير · محفوظ على هذا الجهاز"
                  : "Recent activity · saved on this device"}
              </span>
              {stats.recent.length ? (
                stats.recent.slice(0, 4).map((item) => (
                  <div className="workspace-recent-item" key={item.id}>
                    <div>
                      <p>{item.topic}</p>
                      <small>{displayLabel(item.action, language)}</small>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--muted)]">
                  {ar
                    ? "ستظهر هنا محاولاتك بعد أول جلسة."
                    : "Your attempts will appear here after your first session."}
                </p>
              )}
            </section>
          </div>
          <div className="workspace-evidence">
            <LearningEvidencePanel session={session} language={language} />
          </div>
        </div>
        <FahimTutorSidecar
          session={session}
          topic={profile.topic}
          language={language}
        />
      </div>
    </main>
  );
}
