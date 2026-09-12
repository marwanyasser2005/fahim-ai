import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Bot,
  Check,
  Copy,
  Download,
  Edit3,
  Menu,
  MessageSquarePlus,
  Mic,
  PanelLeftClose,
  Pin,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
  Star,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Volume2,
  X,
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
      "أهلًا! أنا فَهيم. أخبرني ماذا تتعلم وأين توقفت، وسنبني الفهم خطوة بخطوة.\n\nيمكنني **الشرح بالأمثلة**، إعداد اختبار أو بطاقات، وبناء خطة تعلم عملية.",
    newChat: "محادثة جديدة",
    search: "ابحث في المحادثات",
    empty: "ابدأ محادثة جديدة",
    placeholder: "اسأل عن أي مفهوم أو اطلب اختبارًا أو خطة…",
    level: "المرحلة",
    subject: "المادة",
    noSubject: "المادة (اختياري)",
    send: "إرسال",
    thinking: "فَهيم يبني الإجابة",
    stop: "إيقاف",
    today: "اليوم",
    history: "المحادثات",
    connected: "متصل",
    offline: "خدمة AI غير متاحة",
    privacy: "راجع المعلومات المهمة ولا تشارك بيانات شخصية.",
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
  },
  en: {
    intro:
      "Hi! I’m Fahim. Tell me what you are learning and where you got stuck, and we will build understanding step by step.\n\nI can **teach with examples**, create quizzes or flashcards, and build a practical learning plan.",
    newChat: "New conversation",
    search: "Search conversations",
    empty: "Start a new conversation",
    placeholder: "Ask about a concept, request a quiz, or build a plan…",
    level: "Level",
    subject: "Subject",
    noSubject: "Subject (optional)",
    send: "Send",
    thinking: "Fahim is building the answer",
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
  },
} as const;

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
  const [loading, setLoading] = useState(false);
  const [sidebar, setSidebar] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [copied, setCopied] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);
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
    [conversations, query],
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
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.lang = language === "ar" ? "ar-EG" : "en-US";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      setInput(event.results[0][0].transcript);
      inputRef.current?.focus();
    };
    recognition.start();
  };

  if (!active) return <main className="min-h-[80vh] bg-[var(--surface)]" />;
  const sidebarPanel = (
    <aside className="flex h-full flex-col border-e border-slate-200 bg-slate-50/90 dark:border-white/10 dark:bg-[#0c1018]">
      <div className="p-3">
        <button
          onClick={addConversation}
          className="flex h-11 w-full items-center justify-between rounded-lg bg-[var(--lapis)] px-3 text-xs font-black text-white hover:bg-[var(--nile)]"
        >
          <span className="flex items-center gap-2">
            <MessageSquarePlus className="h-4 w-4" />
            {t.newChat}
          </span>
          <kbd className="rounded-sm bg-white/10 px-1.5 py-0.5 text-[9px]">
            ⇧⌘O
          </kbd>
        </button>
        <label className="relative mt-3 block">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.search}
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--panel)] pe-3 ps-9 text-xs font-bold outline-none focus:border-[var(--lapis)]"
          />
        </label>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        <p className="px-2 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
          {t.history}
        </p>
        {visible.map((conversation) => (
          <div
            key={conversation.id}
            className={`group relative mb-1 flex items-center rounded-xl ${conversation.id === activeId ? "bg-teal-100 text-teal-950 dark:bg-teal-500/15 dark:text-teal-100" : "hover:bg-slate-200/70 dark:hover:bg-white/5"}`}
          >
            <button
              onClick={() => {
                setActiveId(conversation.id);
                setMobileSidebar(false);
              }}
              className="min-w-0 flex-1 px-3 py-2.5 text-start"
            >
              <span className="flex items-center gap-2">
                <span className="truncate text-xs font-black">
                  {conversation.title}
                </span>
                {conversation.pinned && (
                  <Pin className="h-3 w-3 shrink-0 fill-current text-[var(--vermilion)]" />
                )}
              </span>
              <span className="mt-1 block truncate text-[9px] text-slate-500">
                {conversation.subject ||
                  modeLabels[language][conversation.tutorMode]}{" "}
                • {conversation.messages.length - 1} messages
              </span>
            </button>
            <button
              className="me-1 grid h-7 w-7 place-items-center rounded-lg opacity-0 hover:bg-white/60 group-hover:opacity-100 dark:hover:bg-white/10"
              onClick={() => removeConversation(conversation.id)}
              aria-label={t.delete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {!visible.length && (
          <p className="px-3 py-10 text-center text-xs text-slate-500">
            {t.empty}
          </p>
        )}
      </div>
      <div className="border-t border-slate-200 p-3 text-[10px] leading-5 text-slate-500 dark:border-white/10">
        <span
          className={`mb-1 flex items-center gap-1.5 font-black ${configured ? "text-teal-600" : "text-amber-600"}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${configured ? "bg-teal-500" : "bg-amber-500"}`}
          />
          {configured ? t.connected : t.offline}
        </span>
        {t.privacy}
      </div>
    </aside>
  );

  return (
    <main className="h-[calc(100vh-65px)] min-h-[42rem] overflow-hidden bg-[var(--surface)]">
      <div
        className={`mx-auto grid h-full max-w-[100rem] ${sidebar ? "lg:grid-cols-[17rem_1fr]" : "grid-cols-1"}`}
      >
        {sidebar && (
          <div className="hidden min-h-0 lg:block">{sidebarPanel}</div>
        )}
        {mobileSidebar && (
          <div
            className="fixed inset-0 z-[80] bg-slate-950/50 backdrop-blur-sm lg:hidden"
            onMouseDown={(event) => {
              if (event.currentTarget === event.target) setMobileSidebar(false);
            }}
          >
            <div className="h-full w-[min(86vw,20rem)] shadow-2xl">
              {sidebarPanel}
            </div>
            <button
              onClick={() => setMobileSidebar(false)}
              className="absolute end-4 top-4 grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-950"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <section className="flex min-h-0 min-w-0 flex-col">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white/75 px-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b0f17]/80 sm:px-5">
            <button
              onClick={() =>
                window.innerWidth < 1024
                  ? setMobileSidebar(true)
                  : setSidebar((value) => !value)
              }
              className="grid h-9 w-9 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/5"
              aria-label="Toggle conversations"
            >
              {sidebar ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
            <div className="min-w-0 flex-1">
              <input
                aria-label={t.rename}
                value={active.title}
                onChange={(event) =>
                  updateActive((item) => ({
                    ...item,
                    title: event.target.value.slice(0, 80),
                  }))
                }
                className="w-full truncate bg-transparent text-sm font-black outline-none"
              />
              <p className="truncate text-[10px] text-slate-500">
                {active.subject ||
                  (language === "ar"
                    ? "جلسة تعلم شخصية"
                    : "Personal learning session")}
              </p>
            </div>
            <button
              onClick={() =>
                updateActive((item) => ({ ...item, pinned: !item.pinned }))
              }
              className={`grid h-9 w-9 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 ${active.pinned ? "text-[var(--vermilion)]" : "text-slate-400"}`}
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
              className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
              aria-label={t.export}
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={() => removeConversation(active.id)}
              className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
              aria-label={t.delete}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </header>
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
              {active.messages.map((message, messageIndex) => (
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
                  <div className="flex gap-3 py-5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[var(--lapis)] text-white">
                      <Bot className="h-4 w-4" />
                    </span>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[.04]">
                      <span className="flex items-center gap-1.5">
                        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[var(--nile)]" />
                        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[var(--nile)]" />
                        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[var(--nile)]" />
                      </span>
                      <span className="mt-2 block text-[10px] font-bold text-slate-400">
                        {t.thinking}
                      </span>
                    </div>
                  </div>
                )}
            </div>
          </div>
          <div className="shrink-0 border-t border-slate-200 bg-white/85 px-3 pb-3 pt-2 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b0f17]/90 sm:px-6 sm:pb-4">
            <div className="mx-auto max-w-4xl">
              <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
                {MODES.map((item) => (
                  <button
                    key={item}
                    onClick={() =>
                      updateActive((conversation) => ({
                        ...conversation,
                        tutorMode: item,
                      }))
                    }
                    className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] font-black transition ${active.tutorMode === item ? "bg-[var(--lapis)] text-white" : "bg-slate-100 text-slate-600 hover:bg-teal-50 dark:bg-white/[.06] dark:text-slate-300"}`}
                  >
                    {modeLabels[language][item]}
                  </button>
                ))}
              </div>
              <form
                onSubmit={submit}
                className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-2 shadow-[var(--shadow-lg)] focus-within:border-[var(--lapis)]"
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void submit();
                    }
                  }}
                  rows={2}
                  maxLength={4000}
                  placeholder={t.placeholder}
                  className="max-h-40 min-h-[48px] w-full resize-none bg-transparent px-3 py-2 text-sm leading-6 outline-none"
                />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={voice}
                      className="grid h-9 w-9 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--soft)]"
                      aria-label="Voice input"
                    >
                      <Mic className="h-4 w-4" />
                    </button>
                    <input
                      value={active.subject}
                      onChange={(event) =>
                        updateActive((item) => ({
                          ...item,
                          subject: event.target.value.slice(0, 60),
                        }))
                      }
                      placeholder={t.noSubject}
                      className="h-9 w-28 rounded-lg bg-[var(--soft)] px-3 text-[10px] font-bold outline-none focus:w-40 sm:w-36"
                    />
                  </div>
                  {loading ? (
                    <button
                      type="button"
                      onClick={stop}
                      className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--ink)] px-4 text-xs font-black text-white"
                    >
                      <Square className="h-3.5 w-3.5 fill-current" />
                      {t.stop}
                    </button>
                  ) : (
                    <button
                      disabled={input.trim().length < 3}
                      className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--vermilion)] px-4 text-xs font-black text-white hover:brightness-95 disabled:bg-slate-300 dark:disabled:bg-slate-700"
                    >
                      <Send className="h-4 w-4" />
                      {t.send}
                    </button>
                  )}
                </div>
              </form>
              <p className="mt-2 text-center text-[9px] text-slate-400">
                {t.privacy}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
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
      className={`group flex gap-3 py-5 ${user ? "flex-row-reverse" : ""}`}
    >
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-black ${user ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-[var(--lapis)] text-white"}`}
      >
        {user ? language === "ar" ? "أ" : "Y" : <Bot className="h-4 w-4" />}
      </span>
      <div
        className={`min-w-0 max-w-[calc(100%-3rem)] ${user ? "rounded-2xl rounded-se-md bg-slate-100 px-4 py-3 dark:bg-white/[.07]" : "flex-1"}`}
      >
        {!user && (
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-black">Fahim AI</span>
            <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[8px] font-black text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
              {language === "ar" ? "محرك التعلّم" : "Learning engine"}
            </span>
            {message.mode === "unavailable" && (
              <span className="rounded-full bg-[var(--warning-surface)] px-2 py-0.5 text-[8px] font-black text-[var(--warning-text)]">
                {t.local}
              </span>
            )}
          </div>
        )}
        {user ? (
          <p className="whitespace-pre-wrap text-sm leading-7">
            {message.text}
          </p>
        ) : (
          <div className="tutor-response-block"><RichMessage text={message.text} /></div>
        )}
        {Boolean(message.sources?.length) && (
          <div className="mt-5 border-t border-slate-200 pt-4 dark:border-white/10">
            <p className="mb-3 text-xs font-black text-slate-500">
              {t.sources}
            </p>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {message.sources?.map((source: TutorSource, index) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-[14rem] max-w-[18rem] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-400 hover:shadow-md dark:border-white/10 dark:bg-white/[.04]"
                >
                  <span className="flex items-center justify-between gap-2 text-xs font-black text-teal-800 dark:text-teal-300">
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
                  <span className="mt-3 block truncate text-sm font-black">
                    {source.title}
                  </span>
                  <span className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                    {source.description}
                  </span>
                  {source.verifiedAt && (
                    <span className="mt-3 block text-xs font-bold text-teal-700 dark:text-teal-300">
                      {language === "ar" ? "آخر تحقق" : "Last verified"} ·{" "}
                      {source.verifiedAt}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}
        <div
          className={`mt-3 flex items-center gap-0.5 text-slate-400 ${user ? "justify-end" : ""}`}
        >
          {!user && message.generationId && (
            <Link
              to={`/generation/${message.generationId}`}
              title={language === "ar" ? "سجل الإجابة" : "Generation record"}
              aria-label={
                language === "ar" ? "سجل الإجابة" : "Generation record"
              }
              className="grid h-7 w-7 place-items-center rounded-lg transition hover:bg-slate-100 hover:text-[var(--nile)] dark:hover:bg-white/[.06] [&>svg]:h-3.5 [&>svg]:w-3.5"
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
                <Sparkles />
              </Action>
              <Action
                label="Helpful"
                onClick={() => onFeedback("up")}
                active={message.feedback === "up"}
              >
                <ThumbsUp />
              </Action>
              <Action
                label="Not helpful"
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
      className={`grid h-7 w-7 place-items-center rounded-lg transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-35 dark:hover:bg-white/[.06] dark:hover:text-white [&>svg]:h-3.5 [&>svg]:w-3.5 ${active ? "text-[var(--vermilion)]" : ""}`}
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
