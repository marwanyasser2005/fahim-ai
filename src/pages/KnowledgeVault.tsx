import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  File,
  FileSearch,
  HardDrive,
  Languages,
  Loader2,
  LockKeyhole,
  Search,
  BrainCircuit,
  Trash2,
  UploadCloud,
  FileCheck2,
} from "lucide-react";
import {
  importVaultFile,
  loadVaultSources,
  removeVaultSource,
  searchVault,
  type VaultHit,
  type VaultSource,
} from "@/lib/knowledgeVault";

const copy = {
  ar: {
    eyebrow: "خزانة المعرفة",
    title: "ملفاتك عندك، وفَهيم يلاقي الجزء اللي محتاجه.",
    body: "ضيف كتاب PDF، ملف نصّي، أو ترجمة فيديو SRT وVTT. فَهيم بيقرأ النص على جهازك ويلاقي المقاطع الأقرب لسؤالك بالعربي والإنجليزي. الملف نفسه مش بيترفع للخادم.",
    upload: "أضف مصادر",
    supported: "PDF · TXT · MD · CSV · JSON · HTML · SRT · VTT، حتى 15MB",
    privacy: "معالجة محلية وIndexedDB. لا ترفع الملفات إلى فَهيم في هذا الإصدار.",
    search: "ابحث داخل مصادرك",
    placeholder: "ما الفرق بين الانقسام المتساوي والمنصف؟",
    ask: "اسأل فَهيم بهذه الأدلة",
    sources: "مصادرك",
    chunks: "مقطع مفهرس",
    empty: "لم تضف مصدرًا بعد.",
    noHits: "لا توجد مقاطع كافية الصلة. جرّب مصطلحًا أدق أو اسأل بالعربية أو الإنجليزية.",
    delete: "حذف المصدر",
    importing: "استخراج وفهرسة الملف…",
    tooLarge: "حجم الملف أكبر من 15MB.",
    unsupported: "نوع الملف غير مدعوم.",
    failed: "تعذر قراءة الملف. قد يكون محميًا أو تالفًا.",
    ocrRequired:
      "هذا PDF مصوّر ولا يحتوي طبقة نص. حفاظًا على الخصوصية لم نرسله تلقائيًا لخدمة OCR خارجية؛ استخدم نسخة نصية قابلة للبحث.",
    localRag: "استرجاع محلي قابل للتفسير",
    result: "أدلة مسترجعة",
    characters: "حرف",
    askHint: "المطابقة مش ضمان لصحة المحتوى. لما تختار اسأل فَهيم أو جلسة فهم، المقاطع المختارة بس بتتبعت للـAI؛ الوكيل بيحفظها في سجل الجلسة، مش الملف كله.",
  },
  en: {
    eyebrow: "Knowledge vault",
    title: "Your study material stays with you, and retrieval explains why it matched.",
    body: "Add a PDF, text document, or SRT/VTT video captions. Fahim reads it on your device and finds passages relevant to your question in Arabic or English. The file itself is not uploaded.",
    upload: "Add sources",
    supported: "PDF · TXT · MD · CSV · JSON · HTML · SRT · VTT, up to 15MB",
    privacy: "Local processing and IndexedDB. Files are not uploaded to Fahim in this release.",
    search: "Search your sources",
    placeholder: "What is the difference between mitosis and meiosis?",
    ask: "Ask Fahim with this evidence",
    sources: "Your sources",
    chunks: "indexed chunks",
    empty: "You have not added a source yet.",
    noHits: "No passage is relevant enough. Try a more precise term or search in Arabic or English.",
    delete: "Delete source",
    importing: "Extracting and indexing…",
    tooLarge: "The file is larger than 15MB.",
    unsupported: "This file type is not supported.",
    failed: "The file could not be read. It may be protected or damaged.",
    ocrRequired:
      "This is an image-only PDF with no text layer. To protect privacy, Fahim did not silently send it to an external OCR service; use a searchable text copy.",
    localRag: "Explainable local retrieval",
    result: "Retrieved evidence",
    characters: "characters",
    askHint: "Match strength does not certify the content. Choosing Ask Fahim or a learning session sends only selected excerpts to the AI. The agent saves those excerpts in the session, not the whole file.",
  },
} as const;

const reasonCopy = {
  exact_phrase: { ar: "عبارة مطابقة", en: "Exact phrase" },
  bilingual_bridge: { ar: "جسر عربي/إنجليزي", en: "Bilingual bridge" },
  term_coverage: { ar: "تغطية المصطلحات", en: "Term coverage" },
  rare_term: { ar: "مصطلح مميز", en: "Distinctive term" },
} as const;

const confidenceCopy = {
  high: { ar: "مطابقة قوية", en: "Strong match" },
  medium: { ar: "مطابقة متوسطة", en: "Medium match" },
  exploratory: { ar: "استكشافية", en: "Exploratory" },
} as const;

export default function KnowledgeVault({ language }: { language: "ar" | "en" }) {
  const t = copy[language];
  const navigate = useNavigate();
  const rtl = language === "ar";
  const Arrow = rtl ? ArrowLeft : ArrowRight;
  const numberFormat = useMemo(
    () => new Intl.NumberFormat(rtl ? "ar-EG" : "en"),
    [rtl]
  );

  const [sources, setSources] = useState<VaultSource[]>([]);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<VaultHit[]>([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadVaultSources().then(setSources);
  }, []);

  const totalChunks = useMemo(
    () => sources.reduce((sum, source) => sum + source.chunks.length, 0),
    [sources]
  );

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files || [])];
    if (!files.length) return;
    setImporting(true);
    setError("");
    try {
      for (const file of files) await importVaultFile(file);
      setSources(await loadVaultSources());
    } catch (reason) {
      const code = (reason as Error).message;
      setError(
        code === "file-too-large"
          ? t.tooLarge
          : code === "unsupported-file"
          ? t.unsupported
          : code === "ocr-required"
          ? t.ocrRequired
          : t.failed
      );
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setHits(searchVault(sources, query));
  };

  const ask = (agent = false) => {
    const context = hits.slice(0, 5).map((hit, index) => ({
      id: hit.chunk.sourceId,
      citationId: `U${index + 1}`,
      title: `${hit.chunk.sourceName} · ${hit.location}`,
      text: hit.chunk.text.slice(0, 900),
    }));
    sessionStorage.setItem("fahim-vault-handoff", JSON.stringify(context));
    navigate(agent ? `/agent?vault=1&goal=${encodeURIComponent(query)}` : `/ask-fahim?vault=1&q=${encodeURIComponent(query)}`);
  };

  const remove = async (id: string) => {
    await removeVaultSource(id);
    setSources((items) => items.filter((item) => item.id !== id));
    setHits((items) => items.filter((item) => item.chunk.sourceId !== id));
  };

  return (
    <main className="min-h-[80vh] bg-[var(--surface)] pb-20">
      {/* ——— Hero ——— */}
      <section className="fahim-band-hero relative overflow-hidden border-b border-[var(--band)] bg-[var(--band)] px-4 py-10 text-white sm:px-6 lg:py-14">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 88% 10%, color-mix(in srgb, var(--nile) 20%, transparent), transparent 24rem), radial-gradient(circle at 10% 90%, color-mix(in srgb, var(--saffron) 12%, transparent), transparent 20rem)",
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-7xl">
          <p className="flex w-fit items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-[var(--saffron)]">
            <Archive className="h-4 w-4" />
            {t.eyebrow}
          </p>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1.3fr_.7fr] lg:items-center">
            <div>
              <h1 className="atlas-display max-w-3xl text-4xl text-white sm:text-5xl">
                {t.title}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#B9C6D4] sm:text-lg">
                {t.body}
              </p>
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-white/12 bg-white/[.06] p-4 backdrop-blur-sm">
                <LockKeyhole
                  className="mt-0.5 h-5 w-5 shrink-0 text-[var(--nile)]"
                  strokeWidth={1.75}
                />
                <div>
                  <p className="text-sm font-bold text-white">{t.privacy}</p>
                </div>
              </div>
            </div>

            {/* Upload tile */}
            <label className="group relative flex cursor-pointer flex-col gap-4 overflow-hidden rounded-3xl border border-white/12 bg-white/[.06] p-7 backdrop-blur-sm transition-transform duration-200 hover:-translate-y-1 hover:bg-white/[.09] lg:w-full">
              <input
                type="file"
                multiple
                accept=".pdf,.txt,.md,.csv,.json,.html,.htm,.srt,.vtt"
                onChange={upload}
                className="sr-only"
              />
              <span className="flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--saffron)] text-[#14213D] shadow-lg">
                  <UploadCloud className="h-6 w-6" strokeWidth={1.75} />
                </span>
                {importing ? (
                  <Loader2 className="h-5 w-5 animate-spin text-[var(--nile)]" />
                ) : null}
              </span>
              <span>
                <strong className="block text-lg font-black text-white">
                  {importing ? t.importing : t.upload}
                </strong>
                <small className="mt-1.5 block text-sm text-[#B9C6D4]">
                  {t.supported}
                </small>
              </span>
              <span
                className="pointer-events-none absolute bottom-0 h-[3px] w-0 bg-[var(--saffron)] transition-all duration-300 group-hover:w-full"
                aria-hidden="true"
              />
            </label>
          </div>
        </div>
      </section>

      {/* ——— Workspace ——— */}
      <div className="mx-auto grid max-w-7xl gap-8 px-4 pt-12 sm:px-6 lg:grid-cols-[20rem_1fr] lg:px-8">
        {/* Sources sidebar */}
        <aside>
          <div className="flex items-center justify-between border-b-2 border-[var(--border-strong)] pb-4">
            <h2 className="flex items-center gap-2 text-base font-black text-[var(--text)]">
              <File className="h-[1.125rem] w-[1.125rem] text-[var(--nile)]" />
              {t.sources}
            </h2>
            <span className="text-xs font-black text-[var(--vermilion)]">
              {sources.length} · {numberFormat.format(totalChunks)} {t.chunks}
            </span>
          </div>

          {sources.length ? (
            <div className="divide-y divide-[var(--border)]">
              {sources.map((source) => (
                <article
                  key={source.id}
                  className="group flex gap-3.5 py-4 transition-colors hover:bg-[var(--soft)]/50"
                >
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--nile)_10%,var(--panel))] text-[var(--nile)]">
                    <FileCheck2 className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-[var(--text)]">
                      {source.name}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
                      {numberFormat.format(source.chunks.length)} {t.chunks} ·{" "}
                      {numberFormat.format(source.characterCount)}{" "}
                      {t.characters}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void remove(source.id)}
                    aria-label={t.delete}
                    title={t.delete}
                    className="grid h-8 w-8 place-items-center self-center rounded-lg text-[var(--muted)] opacity-0 transition hover:bg-[color-mix(in_srgb,var(--vermilion)_12%,var(--panel))] hover:text-[var(--vermilion)] group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="grid place-items-center rounded-2xl border-2 border-dashed border-[var(--border)] py-14 text-center">
              <HardDrive className="h-8 w-8 text-[var(--muted)]" strokeWidth={1.5} />
              <p className="mt-3 max-w-[16rem] text-sm font-bold text-[var(--muted)]">
                {t.empty}
              </p>
            </div>
          )}
        </aside>

        {/* Search + results */}
        <section className="min-w-0">
          <form onSubmit={submit} className="atlas-search">
            <label className="relative flex-1">
              <FileSearch className="absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted)]" />
              <span className="sr-only">{t.search}</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.placeholder}
                className="h-16 w-full bg-transparent pe-4 ps-12 text-base font-bold text-[var(--text)] outline-none"
              />
            </label>
            <button
              type="submit"
              disabled={query.trim().length < 3 || !sources.length}
              className="atlas-search-button"
            >
              <Search className="h-4 w-4" />
              {t.search}
            </button>
          </form>

          {error ? (
            <div
              role="alert"
              className="atlas-notice mt-5 border-[var(--danger-solid)]/40 bg-[var(--danger-surface)] text-[var(--danger-text)]"
            >
              {error}
            </div>
          ) : null}

          {hits.length ? (
            <>
              <div className="mt-9 flex flex-wrap items-center justify-between gap-4 border-b-2 border-[var(--border-strong)] pb-5">
                <div>
                  <p className="flex items-center gap-2 text-xs font-black text-[var(--vermilion)]">
                    <Languages className="h-4 w-4" />
                    {t.localRag}
                  </p>
                  <h2 className="mt-1.5 text-2xl font-black text-[var(--text)]">
                    {hits.length} {t.result}
                  </h2>
                  <p className="mt-1.5 text-sm text-[var(--muted)]">{t.askHint}</p>
                </div>
                <button
                  type="button"
                  onClick={() => ask()}
                  className="inline-flex min-h-12 items-center gap-2.5 rounded-xl bg-[#173F5F] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#0F766E] sm:shadow-[3px_3px_0_#F2B84B]"
                >
                  <BrainCircuit className="h-[1.125rem] w-[1.125rem]" />
                  {t.ask}
                  <Arrow className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => ask(true)} className="atlas-secondary min-h-12"><BookOpenCheck className="h-4 w-4" />{rtl ? 'ابدأ جلسة فهم بالمقاطع دي' : 'Learn with these excerpts'}</button>
              </div>

              <div className="divide-y divide-[var(--border)]">
                {hits.map((hit, index) => (
                  <article
                    key={hit.chunk.id}
                    className="group grid gap-5 py-7 sm:grid-cols-[3rem_1fr]"
                  >
                    <span className="atlas-index mt-1">U{index + 1}</span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <p className="text-sm font-black text-[var(--nile)]">
                          {hit.chunk.sourceName}
                        </p>
                        <span className="rounded-full bg-[var(--soft)] px-2.5 py-1 text-xs font-bold text-[var(--muted)]">
                          {hit.location}
                        </span>
                        <span
                          className={`vault-confidence vault-confidence-${hit.confidence}`}
                        >
                          <BadgeCheck className="h-3.5 w-3.5" />
                          {confidenceCopy[hit.confidence][language]}
                        </span>
                      </div>

                      <div className="mt-3.5 flex flex-wrap gap-2">
                        {hit.reasons.map((reason) => (
                          <span key={reason} className="vault-reason">
                            {reason === "bilingual_bridge" ? (
                              <Languages className="h-3 w-3" />
                            ) : null}
                            {reasonCopy[reason][language]}
                          </span>
                        ))}
                        <span className="vault-reason">
                          {Math.round(hit.coverage * 100)}%{" "}
                          {rtl ? "تغطية السؤال" : "query coverage"}
                        </span>
                      </div>

                      <p className="mt-4 whitespace-pre-wrap rounded-xl border-s-[3px] border-[var(--saffron)] bg-[var(--soft)]/60 p-4 text-[15px] leading-8 text-[var(--text)]">
                        {hit.excerpt}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : query.length > 2 ? (
            <div className="mt-14 grid min-h-[14rem] place-items-center rounded-2xl border-2 border-dashed border-[var(--border)] px-6 py-10 text-center">
              <div>
                <BookOpenCheck className="mx-auto h-8 w-8 text-[var(--muted)]" strokeWidth={1.5} />
                <p className="mx-auto mt-4 max-w-md text-sm font-bold leading-7 text-[var(--muted)]">
                  {t.noHits}
                </p>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
