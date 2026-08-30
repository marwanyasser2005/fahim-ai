import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  Compass,
  LibraryBig,
  PlaySquare,
  Sparkles,
  Target,
} from "lucide-react";
import { getStudyStats, recordStudyAction } from "@/lib/studyProgress";
import { displayLabel } from "@/lib/displayLabels";

interface WorkspaceProps {
  language: "ar" | "en";
}
const copy = {
  ar: {
    tag: "مساحة العمل الذكية",
    title: "موضوع واحد. رحلة تعلم كاملة.",
    body: "اكتب ما تريد فهمه مرة واحدة، وسيحمله فَهيم معك بين الشرح والفيديو والمصدر والاختبار بدل بدء البحث من الصفر كل مرة.",
    grade: "المرحلة",
    subject: "المادة",
    topic: "الموضوع أو السؤال",
    gradeHint: "مثال: ثالث ثانوي",
    subjectHint: "مثال: فيزياء",
    topicHint: "مثال: الحث الكهرومغناطيسي وقاعدة لنز",
    start: "ابدأ جلسة الشرح",
    today: "أنشطة اليوم",
    topics: "موضوعات راجعتها",
    coverage: "مراحل مكتملة اليوم",
    steps: [
      ["اشرح", "شرح متدرج يناسب مرحلتك ويحتفظ بسياق الجلسة."],
      ["شاهد", "نتائج فيديو عربية مفلترة ومناسبة للموضوع."],
      ["تحقق", "مفاهيم ومصادر أصلية وروابط مصرية موثوقة."],
      ["اختبر", "سؤال واحد في كل مرة مع تغذية راجعة."],
    ],
    recent: "آخر نشاط",
    noRecent: "ابدأ أول جلسة لتظهر أنشطتك هنا.",
  },
  en: {
    tag: "Smart workspace",
    title: "One topic. A complete learning journey.",
    body: "Describe what you need once. Fahim carries it across explanation, video, source, and quiz instead of making you restart every search.",
    grade: "Level",
    subject: "Subject",
    topic: "Topic or question",
    gradeHint: "Example: Grade 12",
    subjectHint: "Example: Physics",
    topicHint: "Example: electromagnetic induction and Lenz’s law",
    start: "Start explanation session",
    today: "Actions today",
    topics: "Topics reviewed",
    coverage: "Stages completed today",
    steps: [
      ["Explain", "A level-aware explanation that keeps session context."],
      ["Watch", "Filtered Arabic learning videos matched to the topic."],
      ["Verify", "Original concept sources and trusted Egypt links."],
      ["Quiz", "One question at a time with feedback."],
    ],
    recent: "Recent activity",
    noRecent: "Start your first session to see activity here.",
  },
} as const;
const icons = [Bot, PlaySquare, LibraryBig, Target];

export default function Workspace({ language }: WorkspaceProps) {
  const t = copy[language];
  const navigate = useNavigate();
  const Arrow = language === "ar" ? ArrowLeft : ArrowRight;
  const stored = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem("fahim-study-profile") || "{}",
      ) as Record<string, string>;
    } catch {
      return {};
    }
  }, []);
  const [grade, setGrade] = useState(stored.grade || "");
  const [subject, setSubject] = useState(stored.subject || "");
  const [topic, setTopic] = useState(stored.topic || "");
  const [stats, setStats] = useState(() => getStudyStats());
  useEffect(() => {
    const refresh = () => setStats(getStudyStats());
    window.addEventListener("fahim-progress", refresh);
    return () => window.removeEventListener("fahim-progress", refresh);
  }, []);
  const start = (event: FormEvent) => {
    event.preventDefault();
    if (topic.trim().length < 3) return;
    localStorage.setItem(
      "fahim-study-profile",
      JSON.stringify({ grade, subject, topic }),
    );
    recordStudyAction("session", topic);
    const params = new URLSearchParams({
      q: topic,
      grade,
      subject,
      mode: "explain",
    });
    navigate(`/ask-fahim?${params.toString()}`);
  };
  const destinations = ["/ask-fahim", "/videos", "/library", "/ask-fahim"];
  return (
    <main className="workspace-page min-h-[75vh] pb-20">
      <section className="workspace-hero">
        <div className="workspace-shell">
          <div className="workspace-grid">
            <div className="workspace-copy">
              <p className="workspace-kicker">
                <Sparkles className="h-4 w-4" />
                {t.tag}
              </p>
              <h1 className="workspace-title">
                {t.title}
              </h1>
              <p className="workspace-lead">
                {t.body}
              </p>
              <form onSubmit={start} className="workspace-form">
                <div className="workspace-field-grid">
                  <label className="workspace-label">
                    <span>
                      {t.grade}
                    </span>
                    <input
                      value={grade}
                      onChange={(event) => setGrade(event.target.value)}
                      maxLength={80}
                      placeholder={t.gradeHint}
                      className="workspace-field"
                    />
                  </label>
                  <label className="workspace-label">
                    <span>
                      {t.subject}
                    </span>
                    <input
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      maxLength={80}
                      placeholder={t.subjectHint}
                      className="workspace-field"
                    />
                  </label>
                </div>
                <label className="workspace-label workspace-topic-label">
                  <span>
                    {t.topic}
                  </span>
                  <textarea
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder={t.topicHint}
                    className="workspace-field workspace-textarea"
                  />
                </label>
                <button
                  disabled={topic.trim().length < 3}
                  className="workspace-start"
                >
                  {t.start}
                  <Arrow className="h-4 w-4" />
                </button>
              </form>
            </div>
            <aside className="workspace-progress-card">
              <div className="workspace-progress-heading">
                <span className="workspace-progress-icon">
                  <Compass className="h-5 w-5" />
                </span>
                <div>
                  <p>
                    {language === "ar" ? "لوحة التقدم" : "Progress board"}
                  </p>
                  <h2>
                    {language === "ar"
                      ? "تقدم محفوظ على جهازك"
                      : "Progress saved on this device"}
                  </h2>
                </div>
              </div>
              <div className="workspace-progress-stats">
                {[
                  [t.today, stats.today],
                  [t.topics, stats.topics],
                  [t.coverage, `${stats.actions}/5`],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="workspace-progress-stat"
                  >
                    <strong>{value}</strong>
                    <span>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
              <p className="workspace-recent-title">
                {t.recent}
              </p>
              <div className="workspace-recent-list">
                {stats.recent.length ? (
                  stats.recent.map((item) => (
                    <div
                      key={item.id}
                      className="workspace-recent-item"
                    >
                      <span className="workspace-recent-check">
                        <Check className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p>
                          {item.topic}
                        </p>
                        <small>
                          {displayLabel(item.action, language)}
                        </small>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="workspace-recent-empty">
                    {t.noRecent}
                  </p>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>
      <div className="workspace-shell">
        <section className="workspace-steps">
          <div className="workspace-step-grid">
            {t.steps.map(([title, body], index) => {
              const Icon = icons[index];
              const params = new URLSearchParams({
                q: topic,
                grade,
                subject,
                mode: index === 3 ? "quiz" : "explain",
              });
              return (
                <button
                  type="button"
                  key={title}
                  onClick={() =>
                    navigate(`${destinations[index]}?${params.toString()}`)
                  }
                  className="workspace-step-card"
                  data-step={index + 1}
                >
                  <span className="workspace-step-icon">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="workspace-step-number">0{index + 1}</span>
                  <h2>{title}</h2>
                  <p>
                    {body}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
