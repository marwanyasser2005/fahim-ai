import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  Headphones,
  Loader2,
  MessageCircle,
  Plus,
  Send,
} from "lucide-react";
import type { Language } from "@/App";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { displayLabel } from "@/lib/displayLabels";

type Ticket = {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  last_message_at: string;
  created_at: string;
};
type Message = {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: "customer" | "admin";
  body: string;
  created_at: string;
};

export default function Support({ language }: { language: Language }) {
  const rtl = language === "ar";
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeId, setActiveId] = useState("");
  const [creating, setCreating] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const loadTickets = async () => {
    if (!supabase || !user) return;
    const { data, error: queryError } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("last_message_at", { ascending: false });
    if (queryError) setError(queryError.message);
    else {
      const next = (data || []) as Ticket[];
      setTickets(next);
      setActiveId((current) => current || next[0]?.id || "");
    }
    setLoading(false);
  };
  const loadMessages = async (ticketId: string) => {
    if (!supabase || !ticketId) {
      setMessages([]);
      return;
    }
    const { data, error: queryError } = await supabase
      .from("support_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at");
    if (queryError) setError(queryError.message);
    else setMessages((data || []) as Message[]);
  };
  useEffect(() => {
    void loadTickets();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    void loadMessages(activeId);
  }, [activeId]);
  useEffect(() => {
    if (!supabase || !activeId) return;
    const channel = supabase
      .channel(`support:${activeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `ticket_id=eq.${activeId}`,
        },
        (payload) =>
          setMessages((items) =>
            items.some((item) => item.id === (payload.new as Message).id)
              ? items
              : [...items, payload.new as Message],
          ),
      )
      .subscribe();
    return () => {
      void supabase?.removeChannel(channel);
    };
  }, [activeId]);

  const active = tickets.find((ticket) => ticket.id === activeId);
  const grouped = useMemo(
    () => messages.filter((message) => message.ticket_id === activeId),
    [activeId, messages],
  );

  const createTicket = async (event: FormEvent) => {
    event.preventDefault();
    if (
      !supabase ||
      !user ||
      subject.trim().length < 4 ||
      body.trim().length < 1
    )
      return;
    setSending(true);
    setError("");
    const ticketResult = await supabase
      .from("support_tickets")
      .insert({ user_id: user.id, subject: subject.trim(), category })
      .select("*")
      .single();
    if (ticketResult.error) {
      setError(ticketResult.error.message);
      setSending(false);
      return;
    }
    const messageResult = await supabase
      .from("support_messages")
      .insert({
        ticket_id: ticketResult.data.id,
        sender_id: user.id,
        sender_role: "customer",
        body: body.trim(),
      });
    if (messageResult.error) setError(messageResult.error.message);
    else {
      setSubject("");
      setBody("");
      setCreating(false);
      setActiveId(ticketResult.data.id);
      await loadTickets();
    }
    setSending(false);
  };
  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !user || !activeId || !body.trim()) return;
    setSending(true);
    setError("");
    const { error: sendError } = await supabase
      .from("support_messages")
      .insert({
        ticket_id: activeId,
        sender_id: user.id,
        sender_role: "customer",
        body: body.trim(),
      });
    if (sendError) setError(sendError.message);
    else {
      setBody("");
      await Promise.all([loadMessages(activeId), loadTickets()]);
    }
    setSending(false);
  };

  return (
    <main className="min-h-[80vh] bg-[var(--surface)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="atlas-panel overflow-hidden p-6 sm:p-9">
          <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="atlas-kicker">
                <Headphones className="h-4 w-4" />
                {rtl ? "دعم من أشخاص حقيقيين" : "Human support, in context"}
              </p>
              <h1 className="atlas-display mt-5 text-4xl sm:text-6xl">
                {rtl
                  ? "محادثة واحدة حتى تُحل المشكلة."
                  : "One thread until the issue is solved."}
              </h1>
              <p className="mt-4 max-w-2xl leading-8 text-[var(--muted)]">
                {rtl
                  ? "اسأل عن التعلم أو الحساب أو إثبات الدفع. رسائلك مرتبطة بتذكرتك ولا تضيع بين قنوات مختلفة."
                  : "Ask about learning, your account, or payment proof. Every reply stays attached to the same accountable ticket."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCreating(true);
                setActiveId("");
                setBody("");
              }}
              className="atlas-primary justify-center"
            >
              <Plus className="h-4 w-4" />
              {rtl ? "طلب دعم جديد" : "New request"}
            </button>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="mt-5 border border-[var(--danger-border)] bg-[var(--danger-surface)] p-4 text-sm font-bold text-[var(--danger-text)]"
          >
            {error}
          </div>
        )}
        <div className="mt-6 grid min-h-[560px] overflow-hidden border border-[var(--ink)] bg-[var(--panel)] lg:grid-cols-[340px_1fr]">
          <aside className="border-b border-[var(--border)] lg:border-b-0 lg:border-e">
            <div className="border-b border-[var(--border)] p-4">
              <h2 className="font-black">
                {rtl ? "المحادثات" : "Conversations"}
              </h2>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {tickets.length} {rtl ? "طلب" : "requests"}
              </p>
            </div>
            {loading ? (
              <div className="grid h-40 place-items-center">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-7 text-center text-sm leading-7 text-[var(--muted)]">
                <MessageCircle className="mx-auto mb-3 h-7 w-7" />
                {rtl
                  ? "لا توجد طلبات دعم حتى الآن."
                  : "No support requests yet."}
              </div>
            ) : (
              <div className="max-h-[250px] overflow-y-auto lg:max-h-[500px]">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => {
                      setCreating(false);
                      setActiveId(ticket.id);
                      setBody("");
                    }}
                    className={`w-full border-b border-[var(--border)] p-4 text-start transition hover:bg-[var(--paper)] ${activeId === ticket.id ? "bg-[var(--paper)] shadow-[inset_3px_0_0_var(--vermilion)]" : ""}`}
                  >
                    <span className="line-clamp-1 text-sm font-black">
                      {ticket.subject}
                    </span>
                    <span className="mt-2 flex items-center justify-between gap-2 text-[10px] font-bold text-[var(--muted)]">
                      <span>{displayLabel(ticket.category, language)}</span>
                      <span>{displayLabel(ticket.status, language)}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </aside>
          <section className="flex min-h-[430px] flex-col">
            {creating ? (
              <form
                onSubmit={createTicket}
                className="m-auto w-full max-w-2xl p-6 sm:p-10"
              >
                <p className="atlas-section-number">
                  {rtl ? "طلب دعم جديد" : "New support request"}
                </p>
                <h2 className="mt-3 text-2xl font-black">
                  {rtl
                    ? "صف المشكلة من البداية"
                    : "Describe the issue from the start"}
                </h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <label className="sm:col-span-2">
                    <span className="atlas-label mb-2">
                      {rtl ? "العنوان" : "Subject"}
                    </span>
                    <input
                      className="atlas-field min-h-12"
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      minLength={4}
                      maxLength={160}
                      required
                    />
                  </label>
                  <label>
                    <span className="atlas-label mb-2">
                      {rtl ? "التصنيف" : "Category"}
                    </span>
                    <select
                      className="atlas-field min-h-12"
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                    >
                      {[
                        "general",
                        "billing",
                        "technical",
                        "learning",
                        "content",
                        "privacy",
                      ].map((item) => (
                        <option key={item} value={item}>
                          {displayLabel(item, language)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="mt-4 block">
                  <span className="atlas-label mb-2">
                    {rtl ? "التفاصيل" : "Details"}
                  </span>
                  <textarea
                    className="atlas-field min-h-36"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    maxLength={8000}
                    required
                  />
                </label>
                <button
                  disabled={sending}
                  className="atlas-primary mt-5 justify-center"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {rtl ? "إرسال الطلب" : "Send request"}
                </button>
              </form>
            ) : active ? (
              <>
                <div className="border-b border-[var(--border)] p-5">
                  <h2 className="font-black">{active.subject}</h2>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {displayLabel(active.category, language)} ·{" "}
                    {displayLabel(active.status, language)}
                  </p>
                </div>
                <div className="flex-1 space-y-4 overflow-y-auto bg-[var(--paper)]/50 p-5 sm:p-7">
                  {grouped.map((message) => (
                    <article
                      key={message.id}
                      className={`max-w-[88%] border p-4 ${message.sender_role === "admin" ? "me-auto border-[color-mix(in_srgb,var(--nile)_35%,var(--border))] bg-[color-mix(in_srgb,var(--nile)_9%,var(--panel))] text-[var(--text)]" : "ms-auto border-[var(--ink)] bg-[var(--panel)]"}`}
                    >
                      <p className="text-[10px] font-black uppercase tracking-wider opacity-60">
                        {message.sender_role === "admin"
                          ? rtl
                            ? "فريق فَهيم"
                            : "Fahim team"
                          : rtl
                            ? "أنت"
                            : "You"}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7">
                        {message.body}
                      </p>
                      <time className="mt-2 block text-[10px] opacity-50">
                        {new Intl.DateTimeFormat(rtl ? "ar-EG" : "en-GB", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(message.created_at))}
                      </time>
                    </article>
                  ))}
                </div>
                {!["resolved", "closed"].includes(active.status) ? (
                  <form
                    onSubmit={send}
                    className="flex gap-3 border-t border-[var(--border)] p-4"
                  >
                    <label className="sr-only" htmlFor="support-reply">
                      {rtl ? "ردك" : "Your reply"}
                    </label>
                    <textarea
                      id="support-reply"
                      rows={2}
                      className="atlas-field flex-1"
                      placeholder={rtl ? "اكتب ردك…" : "Write your reply…"}
                      value={body}
                      onChange={(event) => setBody(event.target.value)}
                      required
                    />
                    <button
                      disabled={sending || !body.trim()}
                      className="atlas-primary self-stretch px-5"
                      aria-label={rtl ? "إرسال" : "Send"}
                    >
                      {sending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center justify-center gap-2 border-t p-4 text-sm font-bold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    {rtl ? "تم حل هذا الطلب" : "This request is resolved"}
                  </div>
                )}
              </>
            ) : (
              <div className="m-auto max-w-md p-8 text-center text-[var(--muted)]">
                <MessageCircle className="mx-auto h-10 w-10" />
                <h2 className="mt-5 text-xl font-black text-[var(--text)]">
                  {rtl
                    ? "اختر محادثة أو ابدأ طلبًا جديدًا"
                    : "Choose a conversation or start a new request"}
                </h2>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
