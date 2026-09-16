import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  BookOpenText,
  Check,
  ChevronDown,
  HelpCircle,
  Copy,
  Download,
  Edit3,
  Menu,
  MessageSquarePlus,
  MessagesSquare,
  Mic,
  PanelLeftClose,
  Pin,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  BrainCircuit,
  Square,
  Star,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Volume2,
  X,
  LibraryBig,
  Sparkles,
  Wand2,
} from "lucide-react";
import {
  askFahim,
  streamFahim,
  type TutorMode,
  type TutorSource,
  type TutorSourceContext,
} from "@/lib/aiTutor";
import {
  conversationTitle,
  createConversation,
  downloadText,
  exportConversationMarkdown,
  loadConversations,
  saveConversations,
  type ChatMessage,
  type Conversation,
} from "@/lib/conversations";
import { recordStudyAction } from "@/lib/studyProgress";
import { findSessionForConcept, recordTransferApplied } from "@/lib/reviewBridge";
import { syncLearningSession } from "@/lib/supabase/learningEvidenceSync";
import RichMessage from "@/components/RichMessage";
import type { Language } from "@/App";
import { useAuth } from "@/contexts/AuthContext";
import {
  deleteCloudConversation,
  loadCloudConversations,
  syncCloudConversations,
} from "@/lib/supabase/conversationSync";
import { displayLabel } from "@/lib/displayLabels";

const MODES: TutorMode[] = [
  "explain",
  "quiz",
  "flashcards",
  "plan",
  "summary",
  "project",
  "teach",
  "recall",
];
const modeLabels: Record<Language, Record<TutorMode, string>> = {
  ar: {
    explain: "اشرح",
    quiz: "اختبار",
    flashcards: "بطاقات",
    plan: "خطة",
    summary: "تلخيص",
    project: "مشروع",
    teach: "علّمني أنا",
    recall: "استرجاع",
  },
  en: {
    explain: "Explain",
    quiz: "Quiz",
    flashcards: "Flashcards",
    plan: "Plan",
    summary: "Summarize",
    project: "Project",
    teach: "Teach Fahim",
    recall: "Recall",
  },
};
const copy = {
  ar: {
    intro:
      "أهلًا، أنا فَهيم. قل لي ما الذي تدرسه وأين توقفت، وسنبني الفهم معًا خطوة بخطوة. أشرح بالأمثلة، أختبر فهمك، وأربط الإجابة بمصدر عندما يتوفر.",
    newChat: "محادثة جديدة",
    search: "ابحث في المحادثات",
    empty: "ابدأ محادثة جديدة",
    placeholder: "اكتب ما تريد فهمه، أو الصق السؤال هنا",
    level: "المرحلة",
    subject: "المادة",
    noSubject: "المادة (اختياري)",
    send: "إرسال",
    thinking: "فَهيم يراجع السياق ويجهّز الشرح",
    stop: "إيقاف",
    today: "اليوم",
    history: "المحادثات",
    connected: "متصل",
    offline: "خدمة AI غير متاحة",
    privacy: "لا تكتب بيانات شخصية. راجع المصادر قبل الاعتماد على معلومة مهمة.",
    rename: "إعادة تسمية",
    delete: "حذف",
    export: "تصدير Markdown",
    pin: "تثبيت",
    copy: "نسخ",
    copied: "تم النسخ",
    favorite: "حفظ",
    listen: "استماع",
    edit: "تعديل السؤال",
    regenerate: "إعادة الإجابة",
    continue: "تابع الإجابة",
    sources: "مصادر للمراجعة",
    local: "AI غير متاح",
    menu: "خيارات",
    all: "الكل",
    pinned: "المثبتة",
    context: "سياق الجلسة",
    gradePlaceholder: "المرحلة الدراسية",
    openVault: "إضافة مصدر من ملفاتي",
    readyTitle: "ما الذي تريد أن تفهمه اليوم؟",
    readyBody: "ابدأ بسؤال حقيقي. سيقسّم فَهيم الفكرة، يطلب منك محاولة، ثم يقترح خطوة تالية واضحة.",
    evidence: "مصادر واضحة",
    adaptive: "شرح يناسب مستواك",
    practice: "تحقق من الفهم",
    responseTools: "إجراءات الإجابة",
    learner: "أنت",
    assistant: "فَهيم",
    helpful: "إجابة مفيدة",
    notHelpful: "الإجابة تحتاج تحسينًا",
    messages: "رسالة",
    conversations: "محادثة",
    checking: "جارٍ التحقق",
    voiceUnavailable: "الإملاء الصوتي غير مدعوم في هذا المتصفح",
    voiceFailed: "تعذّر تشغيل الإملاء الصوتي. راجع إذن الميكروفون وحاول مرة أخرى.",
    confirmDelete: "هل تريد حذف هذه المحادثة نهائيًا؟",
  },
  en: {
    intro:
      "Hi! I’m Fahim. Tell me what you are learning and where you got stuck, and we will build understanding step by step.\n\nI can **teach with examples**, create quizzes or flashcards, and build a practical learning plan.",
    newChat: "New conversation",
    search: "Search conversations",
    empty: "Start a new conversation",
    placeholder: "Describe what you want to understand, or paste a question",
    level: "Level",
    subject: "Subject",
    noSubject: "Subject (optional)",
    send: "Send",
    thinking: "Fahim is reviewing the context and preparing an explanation",
    stop: "Stop",
    today: "Today",
    history: "Conversations",
    connected: "Connected",
    offline: "AI service unavailable",
    privacy: "Verify important information and never share personal data.",
    rename: "Rename",
    delete: "Delete",
    export: "Export Markdown",
    pin: "Pin",
    copy: "Copy",
    copied: "Copied",
    favorite: "Save",
    listen: "Listen",
    edit: "Edit question",
    regenerate: "Regenerate",
    continue: "Continue response",
    sources: "Sources to review",
    local: "AI unavailable",
    menu: "Options",
    all: "All",
    pinned: "Pinned",
    context: "Session context",
    gradePlaceholder: "Learning level",
    openVault: "Add a source from my files",
    readyTitle: "What do you want to understand today?",
    readyBody: "Start with a real question. Fahim will break it down, ask for an attempt, and recommend a clear next step.",
    evidence: "Clear sources",
    adaptive: "Level-aware teaching",
    practice: "Check understanding",
    responseTools: "Response actions",
    learner: "You",
    assistant: "Fahim",
    helpful: "Helpful response",
    notHelpful: "Response needs improvement",
    messages: "messages",
    conversations: "conversations",
    checking: "Checking",
    voiceUnavailable: "Voice input is not supported in this browser",
    voiceFailed: "Voice input could not start. Check microphone permission and try again.",
    confirmDelete: "Delete this conversation permanently?",
  },
} as const;

const gradeOptions: Record<Language, string[]> = {
  ar: ["ابتدائي", "إعدادي", "ثانوي", "جامعي", "تعلّم ذاتي"],
  en: ["Primary", "Middle school", "High school", "University", "Self-learning"],
};

const newId = () => crypto.randomUUID();

export default function AiTutor({ language }: { language: Language }) {
  const t = copy[language];
  const { user } = useAuth();
  const [params] = useSearchParams();
  const initialMode = MODES.includes(params.get("mode") as TutorMode)
    ? (params.get("mode") as TutorMode)
    : "explain";
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState("");
  const [input, setInput] = useState(params.get("q") || "");
  const [query, setQuery] = useState("");
  const [historyFilter, setHistoryFilter] = useState<"all" | "pinned">("all");
  const [loading, setLoading] = useState(false);
  const [sidebar, setSidebar] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [copied, setCopied] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [composerNotice, setComposerNotice] = useState("");
  const [vaultContext] = useState<TutorSourceContext[]>(() => {
    if (params.get("vault") !== "1") return [];
    try {
      return JSON.parse(
        sessionStorage.getItem("fahim-vault-handoff") || "[]",
      ) as TutorSourceContext[];
    } catch {
      return [];
    }
  });
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const syncTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const saved = loadConversations();
    const contextQuestion = params.get("q");
    const first = saved[0] || createConversation(language, t.intro);
    if (!saved.length) {
      first.tutorMode = initialMode;
      first.grade = params.get("grade") || "";
      first.subject = params.get("subject") || "";
    }
    // A context handoff (lesson/video/course → ask-fahim?q=…) must open a NEW
    // conversation bound to that context, never resume an unrelated old one.
    if (contextQuestion) {
      const contextual = createConversation(language, t.intro);
      contextual.tutorMode = initialMode;
      contextual.grade = params.get("grade") || "";
      contextual.subject = params.get("subject") || "";
      contextual.title = contextQuestion.replace(/\s+/g, " ").trim().slice(0, 42) || contextual.title;
      setConversations([contextual, ...(saved.length ? saved : [first])]);
      setActiveId(contextual.id);
    } else {
      setConversations(saved.length ? saved : [first]);
      setActiveId(first.id);
    }
    if (user) {
      void loadCloudConversations(user.id).then((cloud) => {
        if (!cloud.length) return;
        setConversations((current) => {
          const merged = new Map(
            [...cloud, ...current].map((item) => [item.id, item]),
          );
          return [...merged.values()].sort((a, b) =>
            b.updatedAt.localeCompare(a.updatedAt),
          );
        });
      });
    }
    fetch("/api/health")
      .then((response) => response.json())
      .then((data: { aiConfigured?: boolean }) =>
        setConfigured(Boolean(data.aiConfigured)),
      )
      .catch(() => setConfigured(false));
  }, [initialMode, language, params, t.intro, user]);
  useEffect(() => {
    if (!conversations.length) return;
    saveConversations(conversations);
    if (!user) return;
    if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    syncTimerRef.current = window.setTimeout(
      () => void syncCloudConversations(conversations, user.id),
      1400,
    );
    return () => {
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    };
  }, [conversations, user]);
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [conversations, activeId, loading]);
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === "o"
      ) {
        event.preventDefault();
        addConversation();
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  });

  const active =
    conversations.find((item) => item.id === activeId) || conversations[0];
  const visible = useMemo(
    () =>
      conversations
        .filter((item) => historyFilter === "all" || item.pinned)
        .filter((item) =>
          `${item.title} ${item.subject}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        )
        .sort(
          (a, b) =>
            Number(b.pinned) - Number(a.pinned) ||
            b.updatedAt.localeCompare(a.updatedAt),
        ),
    [conversations, historyFilter, query],
  );
  const updateActive = (mutate: (item: Conversation) => Conversation) =>
    setConversations((items) =>
      items.map((item) => (item.id === activeId ? mutate(item) : item)),
    );
  const addConversation = () => {
    const item = createConversation(language, t.intro);
    setConversations((items) => [item, ...items]);
    setActiveId(item.id);
    setMobileSidebar(false);
    setInput("");
  };
  const removeConversation = (id: string) => {
    if (!window.confirm(t.confirmDelete)) return;
    if (user) void deleteCloudConversation(id, user.id);
    const remaining = conversations.filter((item) => item.id !== id);
    if (!remaining.length) {
      const item = createConversation(language, t.intro);
      setConversations([item]);
      setActiveId(item.id);
    } else {
      setConversations(remaining);
      if (activeId === id) setActiveId(remaining[0].id);
    }
  };
  const patchMessage = (id: string, patch: Partial<ChatMessage>) =>
    updateActive((item) => ({
      ...item,
      messages: item.messages.map((message) =>
        message.id === id ? { ...message, ...patch } : message,
      ),
    }));
  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
  };

  /**
   * A finished teach-back is the learner restating a concept in their own words, which is
   * the new-context application the evidence model calls `transfer_applied`. It is only
   * recorded when an existing learning record can be linked, so the event stays traceable
   * back to a real session instead of being invented by the tutor.
   */
  const recordTeachBackTransfer = (text: string) => {
    if (active.tutorMode !== "teach" && active.tutorMode !== "recall") return;
    const session = findSessionForConcept(text) || (active.subject ? findSessionForConcept(active.subject) : null);
    if (!session) return;
    if (session.events.some((item) => item.type === "transfer_applied" && item.conceptKey === session.conceptKey)) return;
    const updated = recordTransferApplied(session, {
      title: language === "ar" ? "تطبيق المفهوم في سياق جديد" : "Applied the concept in a new context",
      summary: text.slice(0, 1200),
    });
    void syncLearningSession(updated);
  };

  const submit = async (
    event?: FormEvent,
    override?: string,
    options?: { replaceAssistantId?: string; appendUser?: boolean },
  ) => {
    event?.preventDefault();
    const question = (override ?? input).trim();
    if (question.length < 3 || loading || !active) return;
    const now = new Date().toISOString();
    const userMessage: ChatMessage = {
      id: newId(),
      role: "user",
      text: question,
      createdAt: now,
    };
    const assistantId = options?.replaceAssistantId || newId();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      text: "",
      createdAt: now,
      mode: "ai",
      sources: [],
    };
    const historySource = options?.replaceAssistantId
      ? active.messages.slice(
          0,
          active.messages.findIndex(
            (message) => message.id === options.replaceAssistantId,
          ),
        )
      : active.messages;
    const history = historySource
      .filter((message) => message.text)
      .slice(-10)
      .map(({ role, text }) => ({ role, text }));
    setInput("");
    setLoading(true);
    updateActive((item) => ({
      ...item,
      title:
        item.messages.length <= 1 && options?.appendUser !== false
          ? conversationTitle(question)
          : item.title,
      updatedAt: now,
      messages: options?.replaceAssistantId
        ? item.messages.map((message) =>
            message.id === options.replaceAssistantId
              ? assistantMessage
              : message,
          )
        : [
            ...item.messages,
            ...(options?.appendUser === false ? [] : [userMessage]),
            assistantMessage,
          ],
    }));
    recordStudyAction(
      active.tutorMode === "quiz" ? "quiz" : "explain",
      question,
    );
    recordTeachBackTransfer(question);
    const controller = new AbortController();
    abortRef.current = controller;
    let streamed = "";
    try {
      await streamFahim(
        {
          question,
          language,
          grade: active.grade,
          subject: active.subject,
          mode: active.tutorMode,
          history,
          sourceContext: vaultContext,
          conversationId: active.id,
          clientMessageId: assistantId,
        },
        {
          onMeta: (sources, generationId) =>
            patchMessage(assistantId, { sources, generationId }),
          onDelta: (text) => {
            streamed += text;
            patchMessage(assistantId, { text: streamed });
          },
        },
        controller.signal,
      );
      setConfigured(true);
    } catch (error) {
      if ((error as Error).name !== "AbortError" && !streamed) {
        const reply = await askFahim({
          question,
          language,
          grade: active.grade,
          subject: active.subject,
          mode: active.tutorMode,
          history,
          sourceContext: vaultContext,
          conversationId: active.id,
          clientMessageId: assistantId,
        });
        patchMessage(assistantId, {
          text: reply.answer,
          mode: reply.mode,
          sources: reply.sources,
          generationId: reply.generationId,
        });
        if (reply.mode === "ai") setConfigured(true);
      }
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  };

  const regenerate = (messageId: string) => {
    const messageIndex = active.messages.findIndex(
      (message) => message.id === messageId,
    );
    const priorQuestion = active.messages
      .slice(0, messageIndex)
      .reverse()
      .find((message) => message.role === "user");
    if (priorQuestion)
      void submit(undefined, priorQuestion.text, {
        replaceAssistantId: messageId,
        appendUser: false,
      });
  };
  const continueResponse = () => {
    const instruction =
      language === "ar"
        ? "تابع الإجابة السابقة من حيث توقفت دون تكرارها، وأضف مثالًا تطبيقيًا ثم سؤالًا قصيرًا للتحقق من فهمي."
        : "Continue the previous response without repeating it. Add a practical example and one short check-for-understanding question.";
    void submit(undefined, instruction, { appendUser: false });
  };

  const speak = (text: string) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      text.replace(/[#*_`[\]]/g, " "),
    );
    utterance.lang = language === "ar" ? "ar-EG" : "en-US";
    utterance.rate = 0.95;
    speechSynthesis.speak(utterance);
  };
  const voice = () => {
    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setComposerNotice(t.voiceUnavailable);
      return;
    }
    setComposerNotice("");
    const recognition = new Recognition();
    recognition.lang = language === "ar" ? "ar-EG" : "en-US";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      setInput(event.results[0][0].transcript);
      inputRef.current?.focus();
    };
    recognition.onerror = () => setComposerNotice(t.voiceFailed);
    recognition.start();
  };

  if (!active) return <main className="min-h-[80vh] bg-[var(--surface)]" />;
  const freshConversation = active.messages.length === 1 && active.messages[0]?.role === "assistant";
  const suggestions = language === "ar"
    ? [
        active.subject ? `اشرح لي أهم فكرة في ${active.subject} بمثال قريب من الواقع.` : "اشرح لي مفهومًا صعبًا بمثال قريب من الواقع.",
        "اختبر فهمي بثلاثة أسئلة متدرجة، ولا تعرض الحل قبل محاولتي.",
        "ابنِ لي خطة مذاكرة قصيرة وحدد ما أراجعه أولًا.",
        "ساعدني أشرح الفكرة بطريقتي، ثم صحح أي فجوة في فهمي.",
      ]
    : [
        active.subject ? `Explain the most important idea in ${active.subject} with a practical example.` : "Explain a difficult concept with a practical example.",
        "Check my understanding with three progressive questions. Wait for my attempt before showing the answer.",
        "Build a short study plan and tell me what to review first.",
        "Help me teach the idea back in my own words, then correct any gap.",
      ];
  const sidebarPanel = (
    <aside className="chat-sidebar">
      <div className="chat-sidebar-head">
        <div className="chat-sidebar-title">
          <span><MessagesSquare aria-hidden="true" /></span>
          <div><strong>{t.history}</strong><small>{conversations.length} {t.conversations}</small></div>
        </div>
        <button
          onClick={addConversation}
          className="chat-new-button"
        >
          <span className="flex items-center gap-2">
            <MessageSquarePlus className="h-4 w-4" />
            {t.newChat}
          </span>
          <kbd>
            Ctrl Shift O
          </kbd>
        </button>
        <label className="chat-search">
          <Search aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.search}
            aria-label={t.search}
          />
        </label>
        <div className="chat-history-filters" aria-label={t.history}>
          <button type="button" aria-pressed={historyFilter === "all"} onClick={() => setHistoryFilter("all")}>{t.all}</button>
          <button type="button" aria-pressed={historyFilter === "pinned"} onClick={() => setHistoryFilter("pinned")}><Pin aria-hidden="true" />{t.pinned}</button>
        </div>
      </div>
      <div className="chat-history-list">
        {visible.map((conversation) => (
          <div
            key={conversation.id}
            className={`chat-history-item ${conversation.id === activeId ? "active" : ""}`}
          >
            <button
              onClick={() => {
                setActiveId(conversation.id);
                setMobileSidebar(false);
              }}
              className="chat-history-main"
            >
              <span className="flex items-center gap-2">
                <span className="truncate text-sm font-extrabold">
                  {conversation.title}
                </span>
                {conversation.pinned && (
                  <Pin className="h-3.5 w-3.5 shrink-0 fill-current" />
                )}
              </span>
              <span className="chat-history-meta">
                {conversation.subject ||
                  modeLabels[language][conversation.tutorMode]}{" "}
                <span aria-hidden="true">·</span> {Math.max(0, conversation.messages.length - 1)} {t.messages}
              </span>
            </button>
            <button
              className="chat-history-delete"
              onClick={() => removeConversation(conversation.id)}
              aria-label={t.delete}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {!visible.length && (
          <div className="chat-empty-history"><HelpCircle aria-hidden="true" /><p>{t.empty}</p></div>
        )}
      </div>
      <div className="chat-sidebar-status">
        <span
          className={configured === null ? "checking" : configured ? "online" : "offline"}
        >
          <span
            aria-hidden="true"
          />
          {configured === null ? t.checking : configured ? t.connected : t.offline}
        </span>
        {t.privacy}
      </div>
    </aside>
  );

  return (
    <main className="fahim-chat">
      {/* The immersive tutor had no top-level heading, so assistive tech had no page title. */}
      <h1 className="sr-only">{language === "ar" ? "مساعد فَهيم التعليمي" : "Fahim learning assistant"}</h1>
      <div className={`chat-shell ${sidebar ? "with-sidebar" : "without-sidebar"}`}>
        {sidebar && (
          <div className="hidden min-h-0 lg:block">{sidebarPanel}</div>
        )}
        {mobileSidebar && (
          <div
            className="chat-mobile-scrim"
            onMouseDown={(event) => {
              if (event.currentTarget === event.target) setMobileSidebar(false);
            }}
          >
            <div className="chat-mobile-panel">
              {sidebarPanel}
            </div>
            <button
              onClick={() => setMobileSidebar(false)}
              className="chat-mobile-close"
              aria-label={language === "ar" ? "إغلاق سجل المحادثات" : "Close conversation history"}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <section className="chat-stage">
          <header className="chat-topbar">
            <button
              onClick={() =>
                window.innerWidth < 1024
                  ? setMobileSidebar(true)
                  : setSidebar((value) => !value)
              }
              className="chat-icon-button"
              aria-label={language === "ar" ? "إظهار أو إخفاء سجل المحادثات" : "Toggle conversation history"}
            >
              {sidebar ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
            <div className="chat-title-block">
              <input
                aria-label={t.rename}
                value={active.title}
                onChange={(event) =>
                  updateActive((item) => ({
                    ...item,
                    title: event.target.value.slice(0, 80),
                  }))
                }
                className="chat-title-input"
              />
              <p>
                <ShieldCheck aria-hidden="true" />
                {active.subject || (language === "ar" ? "جلسة تعلّم خاصة" : "Private learning session")}
              </p>
            </div>
            <span className={`chat-connection-badge ${configured === null ? "checking" : configured ? "online" : "offline"}`}>
              <span aria-hidden="true" />{configured === null ? t.checking : configured ? t.connected : t.offline}
            </span>
            <button
              onClick={() =>
                updateActive((item) => ({ ...item, pinned: !item.pinned }))
              }
              className={`chat-icon-button ${active.pinned ? "active" : ""}`}
              aria-label={t.pin}
            >
              <Pin
                className={`h-4 w-4 ${active.pinned ? "fill-current" : ""}`}
              />
            </button>
            <button
              onClick={() =>
                downloadText(
                  `${active.title}.md`,
                  exportConversationMarkdown(active),
                  "text/markdown;charset=utf-8",
                )
              }
              className="chat-icon-button"
              aria-label={t.export}
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={() => removeConversation(active.id)}
              className="chat-icon-button danger"
              aria-label={t.delete}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </header>
          <div ref={scrollRef} className="chat-transcript" aria-live="polite">
            <div className="chat-transcript-inner">
              {freshConversation ? (
                <TutorWelcome language={language} t={t} suggestions={suggestions} onChoose={(value) => void submit(undefined, value)} />
              ) : active.messages.map((message, messageIndex) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  language={language}
                  t={t}
                  copied={copied === message.id}
                  disabled={loading}
                  canRegenerate={active.messages
                    .slice(0, messageIndex)
                    .some((item) => item.role === "user")}
                  onCopy={async () => {
                    await navigator.clipboard.writeText(message.text);
                    setCopied(message.id);
                    window.setTimeout(() => setCopied(""), 1200);
                  }}
                  onFavorite={() =>
                    patchMessage(message.id, { favorite: !message.favorite })
                  }
                  onFeedback={(feedback) =>
                    patchMessage(message.id, { feedback })
                  }
                  onSpeak={() => speak(message.text)}
                  onEdit={() => {
                    setInput(message.text);
                    inputRef.current?.focus();
                  }}
                  onRegenerate={() => regenerate(message.id)}
                  onContinue={continueResponse}
                />
              ))}
              {loading &&
                active.messages[active.messages.length - 1]?.text === "" && (
                  <div className="chat-thinking">
                    <span className="chat-assistant-mark">
                      <img src="/brand/fahim-icon.svg" alt="" />
                    </span>
                    <div className="chat-thinking-card">
                      <span className="flex items-center gap-1.5">
                        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[var(--nile)]" />
                        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[var(--nile)]" />
                        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[var(--nile)]" />
                      </span>
                      <span className="chat-thinking-label">
                        {t.thinking}
                      </span>
                    </div>
                  </div>
                )}
            </div>
          </div>
          <div className="chat-composer-dock">
            <div className="chat-composer-inner">
              <div className="chat-mode-row" aria-label={language === "ar" ? "نمط المساعدة" : "Tutor mode"}>
                {MODES.map((item) => (
                  <button
                    key={item}
                    onClick={() =>
                      updateActive((conversation) => ({
                        ...conversation,
                        tutorMode: item,
                      }))
                    }
                    className={active.tutorMode === item ? "active" : ""}
                    aria-pressed={active.tutorMode === item}
                  >
                    {modeLabels[language][item]}
                  </button>
                ))}
              </div>
              <form
                onSubmit={submit}
                className="chat-composer"
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                      event.preventDefault();
                      void submit();
                    }
                  }}
                  rows={2}
                  maxLength={4000}
                  placeholder={t.placeholder}
                  aria-label={t.placeholder}
                />
                <div className="chat-composer-tools">
                  <div className="chat-context-controls">
                    <button
                      type="button"
                      onClick={voice}
                      className="chat-tool-button"
                      aria-label={language === "ar" ? "إملاء صوتي" : "Voice input"}
                    >
                      <Mic className="h-4 w-4" />
                    </button>
                    <label className="chat-context-select">
                      <BookOpenText aria-hidden="true" />
                      <input
                      value={active.subject}
                      onChange={(event) =>
                        updateActive((item) => ({
                          ...item,
                          subject: event.target.value.slice(0, 60),
                        }))
                      }
                      placeholder={t.noSubject}
                      aria-label={t.subject}
                      />
                    </label>
                    <label className="chat-context-select grade-select">
                      <select value={active.grade} aria-label={t.level} onChange={(event) => updateActive((item) => ({ ...item, grade: event.target.value }))}>
                        <option value="">{t.gradePlaceholder}</option>
                        {gradeOptions[language].map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                      </select>
                      <ChevronDown aria-hidden="true" />
                    </label>
                    <Link to="/knowledge-vault" className="chat-tool-button" aria-label={t.openVault} title={t.openVault}><LibraryBig /></Link>
                  </div>
                  {loading ? (
                    <button
                      type="button"
                      onClick={stop}
                      className="chat-stop-button"
                    >
                      <Square className="h-3.5 w-3.5 fill-current" />
                      <span>{t.stop}</span>
                    </button>
                  ) : (
                    <button
                      disabled={input.trim().length < 3}
                      className="chat-send-button"
                    >
                      <Send className="h-4 w-4" />
                      <span>{t.send}</span>
                    </button>
                  )}
                </div>
              </form>
              <div className="chat-composer-foot"><span>{t.privacy}</span><bdi>{input.length}/4000</bdi></div>
              {composerNotice && <p className="chat-composer-notice" role="status">{composerNotice}</p>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function TutorWelcome({
  language,
  t,
  suggestions,
  onChoose,
}: {
  language: Language;
  t: typeof copy.ar | typeof copy.en;
  suggestions: string[];
  onChoose: (value: string) => void;
}) {
  const benefits = [
    [ShieldCheck, t.evidence],
    [Wand2, t.adaptive],
    [BookOpenText, t.practice],
  ] as const;
  return (
    <section className="chat-welcome" aria-labelledby="chat-welcome-title">
      <div className="chat-welcome-brand"><img src="/brand/fahim-icon.svg" alt="" /><span>{language === "ar" ? "مساحة فَهيم للتعلّم" : "Fahim learning space"}</span></div>
      <h2 id="chat-welcome-title">{t.readyTitle}</h2>
      <p>{t.readyBody}</p>
      <div className="chat-welcome-benefits">
        {benefits.map(([Icon, label]) => <span key={label}><Icon aria-hidden="true" />{label}</span>)}
      </div>
      <div className="chat-suggestion-grid">
        {suggestions.map((suggestion, index) => (
          <button type="button" key={suggestion} onClick={() => onChoose(suggestion)}>
            <span>0{index + 1}</span>
            <strong>{suggestion}</strong>
            <Sparkles aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
}

function MessageBubble({
  message,
  language,
  t,
  copied,
  disabled,
  canRegenerate,
  onCopy,
  onFavorite,
  onFeedback,
  onSpeak,
  onEdit,
  onRegenerate,
  onContinue,
}: {
  message: ChatMessage;
  language: Language;
  t: typeof copy.ar | typeof copy.en;
  copied: boolean;
  disabled: boolean;
  canRegenerate: boolean;
  onCopy: () => void;
  onFavorite: () => void;
  onFeedback: (value: "up" | "down") => void;
  onSpeak: () => void;
  onEdit: () => void;
  onRegenerate: () => void;
  onContinue: () => void;
}) {
  const user = message.role === "user";
  if (!message.text) return null;
  return (
    <article
      className={`chat-message ${user ? "from-user" : "from-fahim"}`}
    >
      <span
        className={user ? "chat-user-mark" : "chat-assistant-mark"}
      >
        {user ? language === "ar" ? "أ" : "Y" : <img src="/brand/fahim-icon.svg" alt="" />}
      </span>
      <div
        className="chat-message-content"
      >
        <div className="chat-message-author">
            <span>{user ? t.learner : t.assistant}</span>
            {!user && <span className="chat-learning-engine">
              {language === "ar" ? "محرك التعلّم" : "Learning engine"}
            </span>}
            {message.mode === "unavailable" && (
              <span className="chat-unavailable">
                {t.local}
              </span>
            )}
        </div>
        {user ? (
          <p className="chat-user-copy">
            {message.text}
          </p>
        ) : (
          <div className="tutor-response-block"><RichMessage text={message.text} language={language} /></div>
        )}
        {Boolean(message.sources?.length) && (
          <div className="chat-sources">
            <p>
              <ShieldCheck aria-hidden="true" />
              {t.sources}
            </p>
            <div className="chat-source-list">
              {message.sources?.map((source: TutorSource, index) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="chat-source-card"
                >
                  <span className="chat-source-card-head">
                    <span>
                      {language === "ar"
                        ? `مرجع ${source.citationId || index + 1}`
                        : `Source ${source.citationId || index + 1}`}
                    </span>
                    <span className="fahim-source-badge !min-h-6 !px-2 !py-1">
                      {displayLabel(
                        source.authority || source.sourceType,
                        language,
                      )}
                    </span>
                  </span>
                  <strong>
                    {source.title}
                  </strong>
                  <small>
                    {source.description}
                  </small>
                  {source.verifiedAt && (
                    <span className="chat-source-verified">
                      <Check aria-hidden="true" />{language === "ar" ? "آخر تحقق" : "Last verified"}: {source.verifiedAt}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}
        <div
          className="chat-message-actions"
          aria-label={t.responseTools}
        >
          {!user && message.generationId && (
            <Link
              to={`/generation/${message.generationId}`}
              title={language === "ar" ? "سجل الإجابة" : "Generation record"}
              aria-label={
                language === "ar" ? "سجل الإجابة" : "Generation record"
              }
              className="chat-action-button"
            >
              <ShieldCheck />
            </Link>
          )}
          <Action label={copied ? t.copied : t.copy} onClick={onCopy}>
            {copied ? <Check /> : <Copy />}
          </Action>
          {user ? (
            <Action label={t.edit} onClick={onEdit}>
              <Edit3 />
            </Action>
          ) : (
            <>
              <Action label={t.listen} onClick={onSpeak}>
                <Volume2 />
              </Action>
              <Action
                label={t.favorite}
                onClick={onFavorite}
                active={message.favorite}
              >
                <Star className={message.favorite ? "fill-current" : ""} />
              </Action>
              {canRegenerate && (
                <Action
                  label={t.regenerate}
                  onClick={onRegenerate}
                  disabled={disabled}
                >
                  <RefreshCw />
                </Action>
              )}
              <Action
                label={t.continue}
                onClick={onContinue}
                disabled={disabled}
              >
                <BrainCircuit />
              </Action>
              <Action
                label={t.helpful}
                onClick={() => onFeedback("up")}
                active={message.feedback === "up"}
              >
                <ThumbsUp />
              </Action>
              <Action
                label={t.notHelpful}
                onClick={() => onFeedback("down")}
                active={message.feedback === "down"}
              >
                <ThumbsDown />
              </Action>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function Action({
  label,
  onClick,
  active,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactElement;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`chat-action-button ${active ? "active" : ""}`}
    >
      {children}
    </button>
  );
}

declare global {
  interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult;
  }
  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
  }
  interface SpeechRecognitionInstance {
    lang: string;
    interimResults: boolean;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: () => void;
    start: () => void;
  }
  interface SpeechRecognitionConstructor {
    new (): SpeechRecognitionInstance;
  }
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}
