import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  BadgeCheck,
  BookOpen,
  Check,
  CircleDollarSign,
  ExternalLink,
  Film,
  FileBadge2,
  Headphones,
  LayoutDashboard,
  Loader2,
  MessageCircle,
  Plus,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { displayLabel } from "@/lib/displayLabels";
import type { Language } from "@/App";
import type {
  PaymentMethod,
  PaymentProof,
  PaymentStatus,
} from "@/lib/manualCommerce";

type Tab = "overview" | "payments" | "content" | "credentials" | "support" | "users";
type ManagedUser = {
  id: string;
  email: string;
  full_name: string;
  role: "student" | "teacher" | "instructor" | "moderator" | "admin";
  created_at?: string;
};
type Ticket = {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  last_message_at: string;
};
type Message = {
  id: string;
  ticket_id: string;
  sender_role: "customer" | "admin";
  body: string;
  created_at: string;
};
type Video = {
  id: string;
  title_ar: string;
  title_en: string;
  subject: string;
  education_level: string;
  is_published: boolean;
  storage_path: string;
  created_at: string;
};
type Resource = {
  id: string;
  title_ar: string;
  title_en: string;
  resource_type: string;
  canonical_url: string | null;
  status: string;
  authority: string;
  created_at: string;
};
type Health = {
  ok?: boolean;
  aiConfigured?: boolean;
  aiProviderCount?: number;
  aiRedundancyConfigured?: boolean;
  youtubeConfigured?: boolean;
  billingProvider?: string;
};

const decisionLabels: Record<
  Exclude<PaymentStatus, "pending" | "canceled">,
  { ar: string; en: string }
> = {
  under_review: { ar: "بدء المراجعة", en: "Start review" },
  approved: { ar: "قبول وتفعيل", en: "Approve & activate" },
  rejected: { ar: "رفض", en: "Reject" },
  resubmission_required: { ar: "طلب إثبات جديد", en: "Request resubmission" },
};

export default function Admin({ language }: { language: Language }) {
  const rtl = language === "ar";
  const { user } = useAuth();
  const tokenRole = String(user?.app_metadata?.role || "student");
  const [allowed, setAllowed] = useState(tokenRole === "admin");
  const [roleLoading, setRoleLoading] = useState(
    Boolean(user && tokenRole !== "admin"),
  );
  const [tab, setTab] = useState<Tab>("overview");
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [health, setHealth] = useState<Health>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!user || !supabase || tokenRole === "admin") {
      setRoleLoading(false);
      return;
    }
    void supabase
      .from("user_roles")
      .select("roles!inner(key)")
      .eq("user_id", user.id)
      .then(({ data }) => {
        const rows = (data || []) as unknown as {
          roles: { key: string } | { key: string }[];
        }[];
        setAllowed(
          rows.some((row) =>
            Array.isArray(row.roles)
              ? row.roles.some((role) => role.key === "admin")
              : row.roles?.key === "admin",
          ),
        );
        setRoleLoading(false);
      });
  }, [tokenRole, user]);

  const refresh = async () => {
    if (!supabase || !allowed) return;
    setLoading(true);
    setError("");
    const [
      userResult,
      proofResult,
      methodResult,
      ticketResult,
      videoResult,
      resourceResult,
      healthResult,
    ] = await Promise.all([
      supabase
        .from("users")
        .select("id,email,full_name,role,created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("manual_payment_proofs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("manual_payment_methods")
        .select("*")
        .order("display_order"),
      supabase
        .from("support_tickets")
        .select("*")
        .order("last_message_at", { ascending: false })
        .limit(200),
      supabase
        .from("exclusive_videos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("managed_learning_resources")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      fetch("/api/health")
        .then((response) => response.json())
        .catch(() => ({})),
    ]);
    const firstError = [
      userResult.error,
      proofResult.error,
      methodResult.error,
      ticketResult.error,
      videoResult.error,
      resourceResult.error,
    ].find(Boolean);
    if (firstError) setError(firstError.message);
    setUsers((userResult.data || []) as ManagedUser[]);
    setProofs((proofResult.data || []) as PaymentProof[]);
    setMethods((methodResult.data || []) as PaymentMethod[]);
    setTickets((ticketResult.data || []) as Ticket[]);
    setVideos((videoResult.data || []) as Video[]);
    setResources((resourceResult.data || []) as Resource[]);
    setHealth(healthResult as Health);
    setLoading(false);
  };
  useEffect(() => {
    if (!roleLoading && allowed) void refresh();
    else if (!roleLoading) setLoading(false);
  }, [allowed, roleLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  if (roleLoading)
    return (
      <main className="grid min-h-[72vh] place-items-center">
        <Loader2 className="h-7 w-7 animate-spin text-[var(--nile)]" />
      </main>
    );
  if (!allowed)
    return (
      <main className="grid min-h-[72vh] place-items-center bg-[var(--surface)] px-4">
        <div className="max-w-lg text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center bg-[var(--danger-surface)] text-[var(--danger-text)]">
            <ShieldAlert className="h-8 w-8" />
          </span>
          <h1 className="mt-6 text-3xl font-black">
            {rtl ? "غير مصرح بالدخول" : "Access denied"}
          </h1>
          <p className="mt-3 leading-7 text-[var(--muted)]">
            {rtl
              ? "لوحة العمليات متاحة فقط للإدارة الموثقة من قاعدة البيانات."
              : "The operations console is available only to database-verified administrators."}
          </p>
        </div>
      </main>
    );

  const tabs: {
    key: Tab;
    icon: typeof Activity;
    ar: string;
    en: string;
    count?: number;
  }[] = [
    { key: "overview", icon: LayoutDashboard, ar: "نظرة عامة", en: "Overview" },
    {
      key: "payments",
      icon: CircleDollarSign,
      ar: "المدفوعات",
      en: "Payments",
      count: proofs.filter((proof) =>
        ["pending", "under_review"].includes(proof.status),
      ).length,
    },
    { key: "content", icon: BookOpen, ar: "المحتوى", en: "Content" },
    { key: "credentials", icon: FileBadge2, ar: "شهادات الإتمام", en: "Completion credentials" },
    {
      key: "support",
      icon: Headphones,
      ar: "الدعم",
      en: "Support",
      count: tickets.filter(
        (ticket) => !["resolved", "closed"].includes(ticket.status),
      ).length,
    },
    { key: "users", icon: Users, ar: "المستخدمون", en: "Users" },
  ];

  return (
    <main className="min-h-[82vh] bg-[var(--surface)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="atlas-admin-header">
          <div>
            <p className="atlas-kicker">
              <ShieldCheck className="h-4 w-4" />
              FAHIM OPERATIONS
            </p>
            <h1 className="atlas-display mt-4 text-4xl sm:text-5xl">
              {rtl ? "غرفة تشغيل فَهيم" : "Fahim operations room"}
            </h1>
            <p className="mt-3 max-w-2xl leading-7 text-[var(--muted)]">
              {rtl
                ? "قرارات دفع ومحتوى ودعم قابلة للتتبع—بدون تفعيل صامت أو بيانات وهمية."
                : "Traceable payment, content, and support decisions—without silent activation or fake data."}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-black">
            <span
              className={`h-2.5 w-2.5 rounded-full ${health.ok ? "bg-[var(--success)]" : "bg-[var(--warning)]"}`}
            />
            {health.ok
              ? rtl
                ? "الخدمات متصلة"
                : "Services connected"
              : rtl
                ? "راجع الخدمات"
                : "Review services"}
          </div>
        </header>
        <nav
          className="atlas-admin-tabs mt-5"
          aria-label={rtl ? "أقسام الإدارة" : "Admin sections"}
        >
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`atlas-tab flex items-center gap-2 ${tab === item.key ? "atlas-tab-active" : ""}`}
            >
              <item.icon className="h-4 w-4" />
              {item[language]}
              {Boolean(item.count) && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--saffron)] px-1 text-[10px] text-[#14213D]">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>
        {error && (
          <div
            role="alert"
            className="mt-5 border border-[var(--danger-border)] bg-[var(--danger-surface)] p-4 text-sm font-bold text-[var(--danger-text)]"
          >
            {error}
          </div>
        )}
        {notice && (
          <div
            role="status"
            className="mt-5 border border-[var(--success-border)] bg-[var(--success-surface)] p-4 text-sm font-bold text-[var(--success-text)]"
          >
            {notice}
          </div>
        )}
        {loading ? (
          <div className="mt-6 grid h-80 place-items-center border border-[var(--border)] bg-[var(--panel)]">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>
        ) : (
          <div className="mt-6">
            {tab === "overview" && (
              <Overview
                rtl={rtl}
                health={health}
                proofs={proofs}
                tickets={tickets}
                videos={videos}
                users={users}
                setTab={setTab}
              />
            )}
            {tab === "payments" && (
              <Payments
                language={language}
                userId={user!.id}
                proofs={proofs}
                methods={methods}
                onChanged={refresh}
                setError={setError}
                setNotice={setNotice}
              />
            )}
            {tab === "content" && (
              <Content
                language={language}
                userId={user!.id}
                videos={videos}
                resources={resources}
                onChanged={refresh}
                setError={setError}
                setNotice={setNotice}
              />
            )}
            {tab === "credentials" && (
              <CredentialOperations language={language} users={users} />
            )}
            {tab === "support" && (
              <SupportDesk
                language={language}
                userId={user!.id}
                tickets={tickets}
                onChanged={refresh}
                setError={setError}
              />
            )}
            {tab === "users" && (
              <UserManagement
                language={language}
                users={users}
                setUsers={setUsers}
                setError={setError}
              />
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function Overview({
  rtl,
  health,
  proofs,
  tickets,
  videos,
  users,
  setTab,
}: {
  rtl: boolean;
  health: Health;
  proofs: PaymentProof[];
  tickets: Ticket[];
  videos: Video[];
  users: ManagedUser[];
  setTab: (tab: Tab) => void;
}) {
  const cards = [
    {
      icon: CircleDollarSign,
      value: proofs.filter((p) =>
        ["pending", "under_review"].includes(p.status),
      ).length,
      label: rtl ? "دفعات تنتظر قرارًا" : "Payments awaiting decision",
      tab: "payments" as Tab,
    },
    {
      icon: Headphones,
      value: tickets.filter((t) => !["resolved", "closed"].includes(t.status))
        .length,
      label: rtl ? "طلبات دعم مفتوحة" : "Open support requests",
      tab: "support" as Tab,
    },
    {
      icon: Film,
      value: videos.filter((v) => v.is_published).length,
      label: rtl ? "فيديوهات حصرية منشورة" : "Published exclusive videos",
      tab: "content" as Tab,
    },
    {
      icon: Users,
      value: users.length,
      label: rtl ? "حسابات محملة" : "Loaded accounts",
      tab: "users" as Tab,
    },
  ];
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={() => setTab(card.tab)}
            className="atlas-metric text-start"
          >
            <card.icon className="h-5 w-5 text-[var(--vermilion)]" />
            <strong className="mt-8 block text-4xl font-black">
              {card.value}
            </strong>
            <span className="mt-2 block text-xs font-bold text-[var(--muted)]">
              {card.label}
            </span>
          </button>
        ))}
      </div>
      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <article className="atlas-panel p-6">
          <p className="atlas-section-number">SYSTEM SIGNALS</p>
          <div className="mt-5 grid gap-3">
            {[
              [
                rtl ? "محرك الذكاء الاصطناعي" : "AI engine",
                health.aiConfigured,
              ],
              [
                rtl ? "توجيه احتياطي" : "Provider redundancy",
                health.aiRedundancyConfigured,
              ],
              [rtl ? "بحث الفيديو" : "Video search", health.youtubeConfigured],
            ].map(([label, ok]) => (
              <div
                key={String(label)}
                className="flex items-center justify-between border-b border-[var(--border)] pb-3 text-sm font-bold"
              >
                <span>{String(label)}</span>
                <span className={ok ? "text-emerald-700" : "text-amber-700"}>
                  {ok
                    ? rtl
                      ? "متصل"
                      : "Connected"
                    : rtl
                      ? "يحتاج إعدادًا"
                      : "Needs setup"}
                </span>
              </div>
            ))}
          </div>
        </article>
        <article className="atlas-panel p-6">
          <p className="atlas-section-number">OPERATING PRINCIPLE</p>
          <h2 className="mt-4 text-2xl font-black">
            {rtl ? "القرار قبل التفعيل" : "Decision before activation"}
          </h2>
          <p className="mt-3 leading-8 text-[var(--muted)]">
            {rtl
              ? "التفعيل لا يحدث لمجرد رفع صورة. راجع المرجع والقيمة والملف، دوّن سبب الرفض، واترك للطالب طريقًا واضحًا لإعادة الإرسال."
              : "Uploading an image never activates access. Verify reference, amount, and evidence; record rejection reasons; and give the learner a clear resubmission path."}
          </p>
        </article>
      </section>
    </>
  );
}

function Payments({
  language,
  userId,
  proofs,
  methods,
  onChanged,
  setError,
  setNotice,
}: {
  language: Language;
  userId: string;
  proofs: PaymentProof[];
  methods: PaymentMethod[];
  onChanged: () => Promise<void>;
  setError: (v: string) => void;
  setNotice: (v: string) => void;
}) {
  const rtl = language === "ar";
  const [selected, setSelected] = useState<PaymentProof | null>(
    proofs[0] || null,
  );
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [methodForm, setMethodForm] = useState({
    channel: "instapay",
    label_ar: "",
    label_en: "",
    account_reference: "",
    account_holder: "",
    instructions_ar: "",
    instructions_en: "",
  });
  useEffect(() => {
    if (!selected || !supabase) {
      setProofUrl("");
      return;
    }
    void supabase.storage
      .from("payment-proofs")
      .createSignedUrl(selected.proof_storage_path, 900)
      .then(({ data }) => setProofUrl(data?.signedUrl || ""));
  }, [selected]);
  const review = async (decision: keyof typeof decisionLabels) => {
    if (!supabase || !selected) return;
    setBusy(decision);
    setError("");
    const { error } = await supabase.rpc("review_manual_payment_v1", {
      target_proof: selected.id,
      decision,
      decision_note: note.trim(),
    });
    if (error) setError(error.message);
    else {
      setNotice(
        rtl
          ? "تم تسجيل القرار وتحديث صلاحيات الحساب."
          : "Decision recorded and account access updated.",
      );
      setSelected(null);
      setNote("");
      await onChanged();
    }
    setBusy("");
  };
  const addMethod = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy("method");
    const { error } = await supabase
      .from("manual_payment_methods")
      .insert({ ...methodForm, created_by: userId, is_active: true });
    if (error) setError(error.message);
    else {
      setMethodForm({
        channel: "instapay",
        label_ar: "",
        label_en: "",
        account_reference: "",
        account_holder: "",
        instructions_ar: "",
        instructions_en: "",
      });
      setNotice(rtl ? "تم نشر وسيلة الدفع." : "Payment method published.");
      await onChanged();
    }
    setBusy("");
  };
  const toggleMethod = async (method: PaymentMethod) => {
    if (!supabase) return;
    const { error } = await supabase
      .from("manual_payment_methods")
      .update({ is_active: !method.is_active })
      .eq("id", method.id);
    if (error) setError(error.message);
    else await onChanged();
  };
  return (
    <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
      <section className="atlas-panel overflow-hidden">
        <div className="border-b border-[var(--border)] p-5">
          <p className="atlas-section-number">REVIEW QUEUE</p>
          <h2 className="mt-2 text-xl font-black">
            {rtl ? "إثباتات الدفع" : "Payment evidence"}
          </h2>
        </div>
        {proofs.length === 0 ? (
          <Empty
            icon={CircleDollarSign}
            text={rtl ? "لا توجد إثباتات للمراجعة." : "No evidence to review."}
          />
        ) : (
          <div className="grid lg:grid-cols-[.9fr_1.1fr]">
            <div className="max-h-[620px] overflow-y-auto border-e border-[var(--border)]">
              {proofs.map((proof) => (
                <button
                  key={proof.id}
                  type="button"
                  onClick={() => {
                    setSelected(proof);
                    setNote(proof.review_note);
                  }}
                  className={`w-full border-b border-[var(--border)] p-4 text-start ${selected?.id === proof.id ? "bg-[var(--paper)] shadow-[inset_3px_0_0_var(--vermilion)]" : "hover:bg-[var(--paper)]"}`}
                >
                  <span className="text-[10px] font-black uppercase text-[var(--vermilion)]">
                    {displayLabel(proof.status, language)}
                  </span>
                  <strong className="mt-2 block text-sm">
                    {proof.payer_name} · {proof.amount_egp} EGP
                  </strong>
                  <span className="mt-1 block text-xs text-[var(--muted)]">
                    <bdi>{proof.transfer_reference}</bdi>
                  </span>
                </button>
              ))}
            </div>
            {selected && (
              <div className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black">
                      {selected.payer_name}
                    </h3>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      <bdi>{selected.payer_phone}</bdi> · {displayLabel(selected.plan_code, language)}
                    </p>
                  </div>
                  {proofUrl && (
                    <a
                      href={proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="atlas-secondary"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {rtl ? "فتح الإثبات" : "Open proof"}
                    </a>
                  )}
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
                  <div className="border p-3">
                    <dt className="text-[var(--muted)]">
                      {rtl ? "القيمة" : "Amount"}
                    </dt>
                    <dd className="mt-1 font-black">
                      {selected.amount_egp} EGP
                    </dd>
                  </div>
                  <div className="border p-3">
                    <dt className="text-[var(--muted)]">
                      {rtl ? "المرجع" : "Reference"}
                    </dt>
                    <dd className="mt-1 font-black">
                      <bdi>{selected.transfer_reference}</bdi>
                    </dd>
                  </div>
                </dl>
                <label className="mt-5 block">
                  <span className="atlas-label mb-2">
                    {rtl ? "ملاحظة القرار" : "Decision note"}
                  </span>
                  <textarea
                    className="atlas-field min-h-24"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder={
                      rtl
                        ? "السبب مطلوب عند الرفض أو طلب إعادة الإرسال"
                        : "A reason is required for rejection or resubmission"
                    }
                  />
                </label>
                {selected.status !== "approved" && (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {(
                      Object.keys(
                        decisionLabels,
                      ) as (keyof typeof decisionLabels)[]
                    ).map((decision) => (
                      <button
                        key={decision}
                        type="button"
                        disabled={Boolean(busy)}
                        onClick={() => void review(decision)}
                        className={`${decision === "approved" ? "atlas-primary" : "atlas-secondary"} justify-center`}
                      >
                        {busy === decision ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : decision === "approved" ? (
                          <Check className="h-4 w-4" />
                        ) : decision === "rejected" ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <BadgeCheck className="h-4 w-4" />
                        )}
                        {decisionLabels[decision][language]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>
      <aside className="space-y-5">
        <form onSubmit={addMethod} className="atlas-panel p-5">
          <p className="atlas-section-number">PAYMENT CHANNEL</p>
          <h2 className="mt-2 text-xl font-black">
            {rtl ? "إضافة وسيلة تحويل" : "Add transfer method"}
          </h2>
          <div className="mt-5 grid gap-3">
            <select
              className="atlas-field min-h-11"
              value={methodForm.channel}
              onChange={(e) =>
                setMethodForm((v) => ({ ...v, channel: e.target.value }))
              }
            >
              {[
                "instapay",
                "vodafone_cash",
                "bank_transfer",
                "cash_deposit",
                "other",
              ].map((v) => (
                <option key={v} value={v}>{displayLabel(v, language)}</option>
              ))}
            </select>
            {(
              [
                "label_ar",
                "label_en",
                "account_reference",
                "account_holder",
              ] as const
            ).map((key) => (
              <input
                key={key}
                className="atlas-field min-h-11"
                required
                placeholder={key.replace("_", " ")}
                value={methodForm[key]}
                onChange={(e) =>
                  setMethodForm((v) => ({ ...v, [key]: e.target.value }))
                }
              />
            ))}
            <textarea
              className="atlas-field"
              placeholder="تعليمات بالعربية"
              value={methodForm.instructions_ar}
              onChange={(e) =>
                setMethodForm((v) => ({
                  ...v,
                  instructions_ar: e.target.value,
                }))
              }
            />
            <textarea
              className="atlas-field"
              placeholder="Instructions in English"
              value={methodForm.instructions_en}
              onChange={(e) =>
                setMethodForm((v) => ({
                  ...v,
                  instructions_en: e.target.value,
                }))
              }
            />
            <button
              disabled={busy === "method"}
              className="atlas-primary justify-center"
            >
              <Plus className="h-4 w-4" />
              {rtl ? "نشر الوسيلة" : "Publish method"}
            </button>
          </div>
        </form>
        <div className="atlas-panel p-5">
          <h3 className="font-black">
            {rtl ? "الوسائل المنشورة" : "Published methods"}
          </h3>
          <div className="mt-3 space-y-2">
            {methods.map((method) => (
              <button
                type="button"
                key={method.id}
                onClick={() => void toggleMethod(method)}
                className="flex w-full items-center justify-between border p-3 text-start text-xs"
              >
                <span>
                  <b className="block">{method[`label_${language}`]}</b>
                  <bdi>{method.account_reference}</bdi>
                </span>
                <span
                  className={
                    method.is_active ? "text-emerald-700" : "text-slate-500"
                  }
                >
                  {method.is_active
                    ? rtl
                      ? "نشطة"
                      : "Active"
                    : rtl
                      ? "موقوفة"
                      : "Paused"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

function Content({
  language,
  userId,
  videos,
  resources,
  onChanged,
  setError,
  setNotice,
}: {
  language: Language;
  userId: string;
  videos: Video[];
  resources: Resource[];
  onChanged: () => Promise<void>;
  setError: (v: string) => void;
  setNotice: (v: string) => void;
}) {
  const rtl = language === "ar";
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [video, setVideo] = useState({
    title_ar: "",
    title_en: "",
    description_ar: "",
    description_en: "",
    subject: "",
    education_level: "",
    language: "ar",
  });
  const [resource, setResource] = useState({
    title_ar: "",
    title_en: "",
    description_ar: "",
    description_en: "",
    resource_type: "official_source",
    canonical_url: "",
    subject: "",
    education_level: "",
    authority: "",
    license: "",
  });
  const uploadVideo = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !videoFile) return;
    if (
      !["video/mp4", "video/webm"].includes(videoFile.type) ||
      videoFile.size > 1024 * 1024 * 1024
    ) {
      setError(
        rtl
          ? "الفيديو يجب أن يكون MP4 أو WebM وأقل من 1GB."
          : "Video must be MP4 or WebM under 1 GB.",
      );
      return;
    }
    setBusy(true);
    const path = `${userId}/${crypto.randomUUID()}-${videoFile.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const uploaded = await supabase.storage
      .from("exclusive-videos")
      .upload(path, videoFile, { upsert: false });
    if (uploaded.error) setError(uploaded.error.message);
    else {
      const inserted = await supabase
        .from("exclusive_videos")
        .insert({
          ...video,
          storage_path: path,
          created_by: userId,
          is_published: false,
        });
      if (inserted.error) {
        setError(inserted.error.message);
        await supabase.storage.from("exclusive-videos").remove([path]);
      } else {
        setNotice(
          rtl
            ? "رُفع الفيديو كمسودة آمنة."
            : "Video uploaded as a secure draft.",
        );
        setVideo({
          title_ar: "",
          title_en: "",
          description_ar: "",
          description_en: "",
          subject: "",
          education_level: "",
          language: "ar",
        });
        setVideoFile(null);
        await onChanged();
      }
    }
    setBusy(false);
  };
  const addResource = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase
      .from("managed_learning_resources")
      .insert({
        ...resource,
        created_by: userId,
        canonical_url: resource.canonical_url.trim(),
        status: "draft",
      });
    if (error) setError(error.message);
    else {
      setNotice(
        rtl
          ? "أُضيف المصدر للمراجعة قبل النشر."
          : "Source added for review before publishing.",
      );
      setResource({
        title_ar: "",
        title_en: "",
        description_ar: "",
        description_en: "",
        resource_type: "official_source",
        canonical_url: "",
        subject: "",
        education_level: "",
        authority: "",
        license: "",
      });
      await onChanged();
    }
    setBusy(false);
  };
  const toggleVideo = async (item: Video) => {
    if (!supabase) return;
    const next = !item.is_published;
    const { error } = await supabase
      .from("exclusive_videos")
      .update({
        is_published: next,
        published_at: next ? new Date().toISOString() : null,
      })
      .eq("id", item.id);
    if (error) setError(error.message);
    else await onChanged();
  };
  const publishResource = async (item: Resource) => {
    if (!supabase) return;
    const next = item.status === "published" ? "archived" : "published";
    const { error } = await supabase
      .from("managed_learning_resources")
      .update({
        status: next,
        reviewed_by: userId,
        published_at: next === "published" ? new Date().toISOString() : null,
      })
      .eq("id", item.id);
    if (error) setError(error.message);
    else await onChanged();
  };
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="atlas-panel p-5 sm:p-6">
        <p className="atlas-section-number">FAHIM ORIGINALS</p>
        <h2 className="mt-2 text-2xl font-black">
          {rtl ? "فيديو حصري" : "Exclusive video"}
        </h2>
        <form onSubmit={uploadVideo} className="mt-5 grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              ["title_ar", "title_en", "subject", "education_level"] as const
            ).map((key) => (
              <input
                key={key}
                required
                className="atlas-field min-h-11"
                placeholder={key.replace("_", " ")}
                value={video[key]}
                onChange={(e) =>
                  setVideo((v) => ({ ...v, [key]: e.target.value }))
                }
              />
            ))}
          </div>
          <textarea
            className="atlas-field"
            placeholder="الوصف بالعربية"
            value={video.description_ar}
            onChange={(e) =>
              setVideo((v) => ({ ...v, description_ar: e.target.value }))
            }
          />
          <textarea
            className="atlas-field"
            placeholder="Description in English"
            value={video.description_en}
            onChange={(e) =>
              setVideo((v) => ({ ...v, description_en: e.target.value }))
            }
          />
          <label className="atlas-upload">
            <UploadCloud className="h-5 w-5" />
            <span className="text-sm font-bold">
              {videoFile?.name ||
                (rtl ? "اختر MP4 أو WebM" : "Choose MP4 or WebM")}
            </span>
            <input
              type="file"
              className="sr-only"
              accept="video/mp4,video/webm"
              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              required
            />
          </label>
          <button
            disabled={busy || !videoFile}
            className="atlas-primary justify-center"
          >
            <Film className="h-4 w-4" />
            {rtl ? "رفع كمسودة" : "Upload draft"}
          </button>
        </form>
        <div className="mt-6 space-y-2">
          {videos.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 border p-3"
            >
              <div>
                <b className="block text-sm">{item[`title_${language}`]}</b>
                <span className="text-xs text-[var(--muted)]">
                  {item.subject} · {item.education_level}
                </span>
              </div>
              <button
                onClick={() => void toggleVideo(item)}
                className={`px-3 py-2 text-xs font-black ${item.is_published ? "bg-[var(--success-surface)] text-[var(--success-text)]" : "bg-[var(--warning-surface)] text-[var(--warning-text)]"}`}
              >
                {item.is_published
                  ? rtl
                    ? "منشور"
                    : "Published"
                  : rtl
                    ? "انشر"
                    : "Publish"}
              </button>
            </div>
          ))}
        </div>
      </section>
      <section className="atlas-panel p-5 sm:p-6">
        <p className="atlas-section-number">SOURCE REGISTRY</p>
        <h2 className="mt-2 text-2xl font-black">
          {rtl ? "مصدر تعليمي موثوق" : "Trusted learning source"}
        </h2>
        <form onSubmit={addResource} className="mt-5 grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                "title_ar",
                "title_en",
                "subject",
                "education_level",
                "authority",
                "license",
              ] as const
            ).map((key) => (
              <input
                key={key}
                required={["title_ar", "title_en"].includes(key)}
                className="atlas-field min-h-11"
                placeholder={key.replace("_", " ")}
                value={resource[key]}
                onChange={(e) =>
                  setResource((v) => ({ ...v, [key]: e.target.value }))
                }
              />
            ))}
          </div>
          <input
            className="atlas-field min-h-11"
            type="url"
            required
            placeholder="https://official-source.example"
            value={resource.canonical_url}
            onChange={(e) =>
              setResource((v) => ({ ...v, canonical_url: e.target.value }))
            }
          />
          <textarea
            className="atlas-field"
            placeholder="الوصف بالعربية"
            value={resource.description_ar}
            onChange={(e) =>
              setResource((v) => ({ ...v, description_ar: e.target.value }))
            }
          />
          <textarea
            className="atlas-field"
            placeholder="Description in English"
            value={resource.description_en}
            onChange={(e) =>
              setResource((v) => ({ ...v, description_en: e.target.value }))
            }
          />
          <button disabled={busy} className="atlas-primary justify-center">
            <Plus className="h-4 w-4" />
            {rtl ? "إضافة للمراجعة" : "Add for review"}
          </button>
        </form>
        <div className="mt-6 space-y-2">
          {resources.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 border p-3"
            >
              <div>
                <b className="block text-sm">{item[`title_${language}`]}</b>
                <span className="text-xs text-[var(--muted)]">
                  {displayLabel(item.authority || item.resource_type, language)}
                </span>
              </div>
              <button
                onClick={() => void publishResource(item)}
                className={`px-3 py-2 text-xs font-black ${item.status === "published" ? "bg-[var(--success-surface)] text-[var(--success-text)]" : "bg-[var(--warning-surface)] text-[var(--warning-text)]"}`}
              >
                {item.status === "published"
                  ? rtl
                    ? "أرشفة"
                    : "Archive"
                  : rtl
                    ? "نشر"
                    : "Publish"}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SupportDesk({
  language,
  userId,
  tickets,
  onChanged,
  setError,
}: {
  language: Language;
  userId: string;
  tickets: Ticket[];
  onChanged: () => Promise<void>;
  setError: (v: string) => void;
}) {
  const rtl = language === "ar";
  const [active, setActive] = useState<Ticket | null>(tickets[0] || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  useEffect(() => {
    if (!supabase || !active) {
      setMessages([]);
      return;
    }
    void supabase
      .from("support_messages")
      .select("*")
      .eq("ticket_id", active.id)
      .order("created_at")
      .then(({ data, error }) =>
        error
          ? setError(error.message)
          : setMessages((data || []) as Message[]),
      );
  }, [active, setError]);
  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !active || !reply.trim()) return;
    setSending(true);
    const { error } = await supabase
      .from("support_messages")
      .insert({
        ticket_id: active.id,
        sender_id: userId,
        sender_role: "admin",
        body: reply.trim(),
      });
    if (error) setError(error.message);
    else {
      setReply("");
      const { data } = await supabase
        .from("support_messages")
        .select("*")
        .eq("ticket_id", active.id)
        .order("created_at");
      setMessages((data || []) as Message[]);
      await onChanged();
    }
    setSending(false);
  };
  const resolve = async () => {
    if (!supabase || !active) return;
    const { error } = await supabase
      .from("support_tickets")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
        assigned_to: userId,
      })
      .eq("id", active.id);
    if (error) setError(error.message);
    else {
      setActive(null);
      await onChanged();
    }
  };
  return (
    <div className="grid min-h-[620px] overflow-hidden border border-[var(--band)] bg-[var(--panel)] lg:grid-cols-[340px_1fr]">
      <aside className="border-e border-[var(--border)]">
        {tickets.length === 0 ? (
          <Empty
            icon={Headphones}
            text={rtl ? "لا توجد تذاكر دعم." : "No support tickets."}
          />
        ) : (
          tickets.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              onClick={() => setActive(ticket)}
              className={`w-full border-b p-4 text-start ${active?.id === ticket.id ? "bg-[var(--paper)] shadow-[inset_3px_0_0_var(--vermilion)]" : ""}`}
            >
              <b className="line-clamp-1 text-sm">{ticket.subject}</b>
              <span className="mt-2 flex justify-between text-[10px] text-[var(--muted)]">
                <span>{displayLabel(ticket.priority, language)}</span>
                <span>{displayLabel(ticket.status, language)}</span>
              </span>
            </button>
          ))
        )}
      </aside>
      <section className="flex flex-col">
        {active ? (
          <>
            <header className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="font-black">{active.subject}</h2>
                <p className="text-xs text-[var(--muted)]">
                  {active.category} · {active.status}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void resolve()}
                className="atlas-secondary"
              >
                <Check className="h-4 w-4" />
                {rtl ? "حل الطلب" : "Resolve"}
              </button>
            </header>
            <div className="flex-1 space-y-3 overflow-y-auto bg-[var(--paper)]/60 p-5">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={`max-w-[85%] border p-4 ${message.sender_role === "admin" ? "ms-auto bg-[var(--panel)]" : "me-auto border-[color-mix(in_srgb,var(--nile)_35%,var(--border))] bg-[color-mix(in_srgb,var(--nile)_9%,var(--panel))] text-[var(--text)]"}`}
                >
                  <b className="text-[10px] uppercase opacity-60">
                    {displayLabel(message.sender_role, language)}
                  </b>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7">
                    {message.body}
                  </p>
                </article>
              ))}
            </div>
            <form onSubmit={send} className="flex gap-3 border-t p-4">
              <textarea
                className="atlas-field flex-1"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                required
              />
              <button disabled={sending} className="atlas-primary px-5">
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
          </>
        ) : (
          <Empty
            icon={MessageCircle}
            text={rtl ? "اختر تذكرة لبدء الرد." : "Select a ticket to begin."}
          />
        )}
      </section>
    </div>
  );
}

function UserManagement({
  language,
  users,
  setUsers,
  setError,
}: {
  language: Language;
  users: ManagedUser[];
  setUsers: (users: ManagedUser[]) => void;
  setError: (v: string) => void;
}) {
  const rtl = language === "ar";
  const [query, setQuery] = useState("");
  const visible = useMemo(
    () =>
      users.filter((item) =>
        `${item.full_name} ${item.email} ${item.role}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query, users],
  );
  const updateRole = async (id: string, nextRole: ManagedUser["role"]) => {
    if (!supabase) return;
    const previous = users;
    setUsers(
      users.map((item) =>
        item.id === id ? { ...item, role: nextRole } : item,
      ),
    );
    const normalizedRole = nextRole === "teacher" ? "instructor" : nextRole;
    const { error } = await supabase.rpc("set_user_role", {
      target_user_id: id,
      new_role_key: normalizedRole,
    });
    if (error) {
      setUsers(previous);
      setError(error.message);
    }
  };
  return (
    <section className="atlas-panel overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b p-5">
        <div>
          <p className="atlas-section-number">ACCESS CONTROL</p>
          <h2 className="mt-2 text-xl font-black">
            {rtl ? "المستخدمون والأدوار" : "Users and roles"}
          </h2>
        </div>
        <label className="relative">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            className="atlas-field min-h-11 ps-10"
            placeholder={rtl ? "ابحث…" : "Search…"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-start text-sm">
          <thead className="bg-[var(--paper)] text-xs text-[var(--muted)]">
            <tr>
              <th className="p-4 text-start">{rtl ? "الاسم" : "Name"}</th>
              <th className="p-4 text-start">Email</th>
              <th className="p-4 text-start">{rtl ? "الدور" : "Role"}</th>
              <th className="p-4 text-start">
                {rtl ? "تاريخ الانضمام" : "Joined"}
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-4 font-black">{item.full_name || "—"}</td>
                <td className="p-4">
                  <bdi>{item.email}</bdi>
                </td>
                <td className="p-4">
                  <select
                    aria-label={`${item.full_name} role`}
                    value={item.role}
                    onChange={(e) =>
                      void updateRole(
                        item.id,
                        e.target.value as ManagedUser["role"],
                      )
                    }
                    className="atlas-field min-h-10 max-w-40"
                  >
                    {["student", "instructor", "moderator", "admin"].map(
                      (role) => (
                        <option key={role} value={role}>{displayLabel(role, language)}</option>
                      ),
                    )}
                  </select>
                </td>
                <td className="p-4 text-[var(--muted)]">
                  {item.created_at
                    ? new Intl.DateTimeFormat(rtl ? "ar-EG" : "en-GB").format(
                        new Date(item.created_at),
                      )
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

type CredentialCourse = { id: string; title: string | { ar?: string; en?: string }; is_published: boolean };
type IssuedCredential = {
  id: string;
  user_id: string;
  course_id: string;
  certificate_number: string;
  status: "issued" | "revoked" | "draft";
  issued_at: string;
  issuer_name: string;
  evidence_snapshot?: { completionPercent?: number; finalAssessmentScore?: number };
};

function CredentialOperations({ language, users }: { language: Language; users: ManagedUser[] }) {
  const rtl = language === "ar";
  const [courses, setCourses] = useState<CredentialCourse[]>([]);
  const [credentials, setCredentials] = useState<IssuedCredential[]>([]);
  const [learnerId, setLearnerId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [score, setScore] = useState("70");
  const [reviewNote, setReviewNote] = useState("");
  const [newCourseAr, setNewCourseAr] = useState("");
  const [newCourseEn, setNewCourseEn] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const request = async (method: "GET" | "POST", body?: Record<string, unknown>) => {
    if (!supabase) throw new Error(rtl ? "خدمة الحسابات غير مهيأة." : "Account service is not configured.");
    const { data, error: sessionError } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (sessionError || !token) throw new Error(rtl ? "انتهت الجلسة. سجّل الدخول مرة أخرى." : "Your session expired. Sign in again.");
    const response = await fetch("/api/certificates", {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = await response.json() as { error?: string; courses?: CredentialCourse[]; certificates?: IssuedCredential[]; certificate?: IssuedCredential; course?: CredentialCourse; verifyPath?: string; alreadyIssued?: boolean };
    if (!response.ok) throw new Error(payload.error || (rtl ? "تعذرت العملية." : "The operation failed."));
    return payload;
  };

  const refresh = async () => {
    setLoading(true); setError("");
    try {
      const payload = await request("GET");
      const nextCourses = payload.courses || [];
      setCourses(nextCourses);
      setCredentials(payload.certificates || []);
      setLearnerId((current) => current || users.find((item) => item.role === "student")?.id || users[0]?.id || "");
      setCourseId((current) => current || nextCourses[0]?.id || "");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally { setLoading(false); }
  };

  useEffect(() => { void refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const issue = async (event: FormEvent) => {
    event.preventDefault(); setSubmitting(true); setError(""); setNotice("");
    try {
      const payload = await request("POST", { learnerId, courseId, completionPercent: 100, finalAssessmentScore: Number(score), reviewNote });
      setNotice(payload.alreadyIssued
        ? (rtl ? "الشهادة صادرة بالفعل؛ لم يتم إنشاء سجل مكرر." : "The credential was already issued; no duplicate was created.")
        : (rtl ? "تم إصدار شهادة الإتمام وإضافتها إلى سجل التحقق العام." : "The completion credential was issued and added to the public registry."));
      setReviewNote("");
      await refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally { setSubmitting(false); }
  };

  const createCourse = async () => {
    setSubmitting(true); setError(""); setNotice("");
    try {
      const payload = await request("POST", { action: "create_course", titleAr: newCourseAr, titleEn: newCourseEn, description: rtl ? "مسار معتمد داخليًا لإصدار شهادة إتمام من فَهيم." : "An internally reviewed Fahim completion-credential track." });
      if (payload.course) setCourseId(payload.course.id);
      setNewCourseAr(""); setNewCourseEn("");
      setNotice(rtl ? "تم إنشاء المسار المنشور ويمكن استخدامه الآن في إصدار الشهادة." : "The published course was created and can now issue a credential.");
      await refresh();
      if (payload.course) setCourseId(payload.course.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally { setSubmitting(false); }
  };

  const courseTitle = (course?: CredentialCourse) => typeof course?.title === "string" ? course.title : course?.title?.[language] || course?.title?.ar || course?.title?.en || "—";
  const userName = (id: string) => users.find((item) => item.id === id)?.full_name || users.find((item) => item.id === id)?.email || id;

  return <section className="grid gap-5 xl:grid-cols-[.72fr_1.28fr]">
    <form onSubmit={(event) => void issue(event)} className="atlas-panel p-5 sm:p-6">
      <p className="atlas-section-number">COMPLETION CREDENTIAL</p>
      <h2 className="mt-2 text-xl font-black">{rtl ? "إصدار شهادة إتمام" : "Issue completion credential"}</h2>
      <p className="mt-3 text-xs leading-6 text-[var(--muted)]">{rtl ? "سجل قابل للتحقق صادر من فَهيم بعد اكتمال المسار والتقييم. لا يمثل اعتمادًا أكاديميًا أو حكوميًا." : "A verifiable Fahim record issued after course completion and assessment. It is not academic or government accreditation."}</p>
      <div className="mt-5 border border-[var(--border)] bg-[var(--soft)] p-4"><p className="atlas-label">{rtl ? "أضف مسارًا للشهادات عند الحاجة" : "Add a credential course when needed"}</p><div className="mt-3 grid gap-2 sm:grid-cols-2"><input className="atlas-field min-h-11" value={newCourseAr} onChange={(event) => setNewCourseAr(event.target.value)} placeholder="اسم المسار بالعربية" /><input className="atlas-field min-h-11" dir="ltr" value={newCourseEn} onChange={(event) => setNewCourseEn(event.target.value)} placeholder="Course title in English" /></div><button type="button" onClick={() => void createCourse()} disabled={submitting || newCourseAr.trim().length < 3 || newCourseEn.trim().length < 3} className="atlas-secondary mt-3 w-full justify-center disabled:opacity-40"><Plus className="h-4 w-4" />{rtl ? "إنشاء ونشر المسار" : "Create and publish course"}</button></div>
      <label className="mt-5 block"><span className="atlas-label">{rtl ? "المتعلم" : "Learner"}</span><select className="atlas-field mt-2 min-h-12" value={learnerId} onChange={(event) => setLearnerId(event.target.value)} required>{users.map((item) => <option key={item.id} value={item.id}>{item.full_name || item.email}</option>)}</select></label>
      <label className="mt-4 block"><span className="atlas-label">{rtl ? "المسار المنشور" : "Published course"}</span><select className="atlas-field mt-2 min-h-12" value={courseId} onChange={(event) => setCourseId(event.target.value)} required><option value="">{rtl ? "اختر مسارًا" : "Choose a course"}</option>{courses.map((course) => <option key={course.id} value={course.id}>{courseTitle(course)}</option>)}</select></label>
      <div className="mt-4 grid gap-3 sm:grid-cols-2"><label><span className="atlas-label">{rtl ? "نسبة الإكمال" : "Completion"}</span><input className="atlas-field mt-2 min-h-12" value="100%" readOnly /></label><label><span className="atlas-label">{rtl ? "درجة التقييم النهائي" : "Final assessment"}</span><input className="atlas-field mt-2 min-h-12" type="number" min="70" max="100" value={score} onChange={(event) => setScore(event.target.value)} required /></label></div>
      <label className="mt-4 block"><span className="atlas-label">{rtl ? "ملاحظة المراجع" : "Reviewer note"}</span><textarea className="atlas-field mt-2" rows={4} minLength={8} maxLength={1000} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder={rtl ? "ما الذي راجعته قبل الإصدار؟" : "What did you review before issuance?"} required /></label>
      {error && <p role="alert" className="mt-4 border border-[var(--danger-border)] bg-[var(--danger-surface)] p-3 text-xs font-bold text-[var(--danger-text)]">{error}</p>}
      {notice && <p role="status" className="mt-4 border border-[var(--success-border)] bg-[var(--success-surface)] p-3 text-xs font-bold text-[var(--success-text)]">{notice}</p>}
      <button type="submit" disabled={submitting || loading || !learnerId || !courseId} className="atlas-primary mt-5 w-full justify-center disabled:cursor-not-allowed disabled:opacity-50">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileBadge2 className="h-4 w-4" />}{rtl ? "تحقق وأصدر" : "Verify and issue"}</button>
    </form>
    <div className="atlas-panel overflow-hidden">
      <header className="flex items-center justify-between gap-4 border-b p-5"><div><p className="atlas-section-number">PUBLIC REGISTRY</p><h2 className="mt-2 text-xl font-black">{rtl ? "الشهادات الصادرة" : "Issued credentials"}</h2></div><button type="button" onClick={() => void refresh()} className="icon-button" aria-label={rtl ? "تحديث" : "Refresh"}><Activity className="h-4 w-4" /></button></header>
      {loading ? <div className="grid min-h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div> : credentials.length === 0 ? <Empty icon={FileBadge2} text={rtl ? "لا توجد شهادات صادرة بعد." : "No credentials have been issued yet."} /> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-[var(--paper)] text-xs text-[var(--muted)]"><tr><th className="p-4 text-start">{rtl ? "المتعلم" : "Learner"}</th><th className="p-4 text-start">{rtl ? "المسار" : "Course"}</th><th className="p-4 text-start">{rtl ? "الدرجة" : "Score"}</th><th className="p-4 text-start">{rtl ? "الحالة" : "Status"}</th><th className="p-4 text-start">{rtl ? "التحقق" : "Verify"}</th></tr></thead><tbody>{credentials.map((credential) => <tr key={credential.id} className="border-t"><td className="p-4 font-black">{userName(credential.user_id)}</td><td className="p-4">{courseTitle(courses.find((course) => course.id === credential.course_id))}</td><td className="p-4"><bdi>{credential.evidence_snapshot?.finalAssessmentScore ?? "—"}%</bdi></td><td className="p-4">{displayLabel(credential.status, language)}</td><td className="p-4"><a href={`/verify/${credential.id}`} target="_blank" rel="noreferrer" className="text-link">{rtl ? "افتح السجل" : "Open record"}<ExternalLink className="h-3.5 w-3.5" /></a></td></tr>)}</tbody></table></div>}
    </div>
  </section>;
}

function Empty({ icon: Icon, text }: { icon: typeof Activity; text: string }) {
  return (
    <div className="grid min-h-48 place-items-center p-8 text-center text-sm font-bold text-[var(--muted)]">
      <div>
        <Icon className="mx-auto mb-3 h-8 w-8" />
        {text}
      </div>
    </div>
  );
}
