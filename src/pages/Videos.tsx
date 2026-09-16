import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Captions,
  Eye,
  ListFilter,
  Loader2,
  Play,
  Search,
  BrainCircuit,
  Star,
  Youtube,
} from "lucide-react";
import {
  searchVideos,
  type EducationalVideo,
  type VideoSearchOptions,
} from "@/lib/videoSearch";
import { recordStudyAction } from "@/lib/studyProgress";
import type { Language } from "@/App";
import VideoLearningStudio from "@/components/VideoLearningStudio";
import { supabase } from "@/lib/supabase/client";

type ExclusiveVideo = { id: string; title_ar: string; title_en: string; description_ar: string; description_en: string; subject: string; education_level: string; storage_path: string; poster_path: string | null; duration_seconds: number | null; signedUrl: string; posterUrl?: string };

const copy = {
  ar: {
    eyebrow: "استوديو الفيديو التعليمي",
    title: "شاهد، دوّن، واسأل—دون مغادرة فَهيم.",
    body: "بحث YouTube تعليمي مرتب لجودة التعلم، مع تشغيل مضمّن وملاحظات وتفاعل مع فَهيم عند أي لحظة.",
    placeholder: "مثال: التفاضل للصف الثالث الثانوي",
    search: "بحث",
    captions: "مترجم",
    empty: "ابحث عن درس لتبدأ تجربة مشاهدة نشطة.",
    unavailable:
      "تعذر الوصول إلى بحث YouTube الآن. تحقق من مفتاح الخادم ثم أعد المحاولة.",
    safe: "نتائج قابلة للتضمين • فلترة صارمة • YouTube Data API v3",
    filters: "الفلاتر",
    all: "الكل",
    short: "قصير",
    medium: "متوسط",
    long: "طويل",
    relevance: "الأكثر صلة",
    popular: "الأكثر مشاهدة",
    newest: "الأحدث",
    watch: "شاهد الآن",
    views: "مشاهدة",
    notes: "ملاحظات الدرس",
    noteHint: "اكتب فكرة، سؤالًا، أو خلاصة عند اللحظة الحالية…",
    saveNote: "حفظ الملاحظة",
    bookmark: "حفظ اللحظة",
    ask: "اسأل فَهيم عن هذه اللحظة",
    quiz: "اختبار من الفيديو",
    flashcards: "بطاقات مراجعة",
    minimize: "تصغير المشغل",
    close: "إغلاق",
    noNotes: "لا توجد ملاحظات بعد.",
    related: "نتائج مرتبطة",
  },
  en: {
    eyebrow: "Video learning studio",
    title: "Watch, take notes, and ask—without leaving Fahim.",
    body: "YouTube education search ranked for learning quality, with embedded playback, timestamp notes, and Fahim at every moment.",
    placeholder: "Example: differentiation for grade 12",
    search: "Search",
    captions: "Captioned",
    empty: "Search for a lesson to begin an active viewing session.",
    unavailable:
      "YouTube search is unavailable. Verify the server key and try again.",
    safe: "Embeddable results • strict filtering • YouTube Data API v3",
    filters: "Filters",
    all: "All",
    short: "Short",
    medium: "Medium",
    long: "Long",
    relevance: "Most relevant",
    popular: "Most viewed",
    newest: "Newest",
    watch: "Watch now",
    views: "views",
    notes: "Lesson notes",
    noteHint: "Capture an idea, question, or takeaway at this moment…",
    saveNote: "Save note",
    bookmark: "Bookmark moment",
    ask: "Ask Fahim about this moment",
    quiz: "Quiz from video",
    flashcards: "Make flashcards",
    minimize: "Minimize player",
    close: "Close",
    noNotes: "No notes yet.",
    related: "Related results",
  },
} as const;

export default function Videos({ language }: { language: Language }) {
  const t = copy[language];
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const [options, setOptions] = useState<VideoSearchOptions>({
    captioned: false,
    duration: "any",
    order: "relevance",
    language,
  });
  const [items, setItems] = useState<EducationalVideo[]>([]);
  const [selected, setSelected] = useState<EducationalVideo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [originals, setOriginals] = useState<ExclusiveVideo[]>([]);
  const [playingOriginal, setPlayingOriginal] = useState<ExclusiveVideo | null>(null);

  useEffect(() => {
    if (!supabase) return;
    void supabase.from('exclusive_videos').select('*').eq('is_published', true).order('published_at', { ascending: false }).limit(8).then(async ({ data }) => {
      const rows = (data || []) as Omit<ExclusiveVideo, 'signedUrl'>[];
      const signed = await Promise.all(rows.map(async (row) => {
        const [{ data: videoData }, posterResult] = await Promise.all([
          supabase!.storage.from('exclusive-videos').createSignedUrl(row.storage_path, 3600),
          row.poster_path ? supabase!.storage.from('exclusive-videos').createSignedUrl(row.poster_path, 3600) : Promise.resolve({ data: null }),
        ]);
        return { ...row, signedUrl: videoData?.signedUrl || '', posterUrl: posterResult.data?.signedUrl || undefined };
      }));
      setOriginals(signed.filter((item) => item.signedUrl));
    });
  }, []);

  const runSearch = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.trim().length < 2) return;
      setLoading(true);
      setError("");
      try {
        setItems(await searchVideos(searchQuery.trim(), options));
        recordStudyAction("video", searchQuery);
      } catch {
        setItems([]);
        setError(t.unavailable);
      } finally {
        setLoading(false);
      }
    },
    [options, t.unavailable],
  );
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await runSearch(query);
  };
  useEffect(() => {
    const incoming = params.get("q");
    if (incoming && incoming.length > 1) void runSearch(incoming);
  }, [params, runSearch]);
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en", {
        notation: "compact",
        maximumFractionDigits: 1,
      }),
    [language],
  );

  return (
    <main className="min-h-[78vh] bg-[var(--surface)] py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-black text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300">
            <Youtube className="h-4 w-4" />
            {t.eyebrow}
          </p>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
            {t.title}
          </h1>
          <p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">
            {t.body}
          </p>
        </div>
        {originals.length > 0 && <section className="mt-10 border border-[var(--band)] bg-[var(--panel)] p-4 shadow-[6px_6px_0_var(--saffron)] sm:p-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="atlas-kicker"><Star className="h-4 w-4" />FAHIM ORIGINALS</p><h2 className="mt-3 text-2xl font-black">{language === 'ar' ? 'دروس حصرية من داخل فَهيم' : 'Exclusive lessons made for Fahim'}</h2><p className="mt-2 text-sm text-[var(--muted)]">{language === 'ar' ? 'محتوى يراجعه فريق المنصة ويُشغّل دون مغادرة مساحة التعلم.' : 'Platform-reviewed content that plays without leaving your learning space.'}</p></div></div>{playingOriginal && <div className="mt-6 overflow-hidden border border-[var(--band)] bg-black"><video src={playingOriginal.signedUrl} poster={playingOriginal.posterUrl} controls playsInline className="aspect-video w-full" onPlay={() => recordStudyAction('video', playingOriginal.title_en)} /></div>}<div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{originals.map((video) => <button type="button" key={video.id} onClick={() => setPlayingOriginal(video)} className={`group overflow-hidden border text-start transition hover:-translate-y-1 ${playingOriginal?.id === video.id ? 'border-[var(--vermilion)] shadow-[4px_4px_0_var(--saffron)]' : 'border-[var(--border)]'}`}><div className="relative aspect-video bg-[var(--brand-solid)]">{video.posterUrl ? <img src={video.posterUrl} alt="" loading="lazy" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-white"><Play className="h-8 w-8" /></div>}<span className="absolute bottom-2 end-2 bg-black/80 px-2 py-1 text-[10px] font-black text-white">{video.duration_seconds ? `${Math.ceil(video.duration_seconds / 60)} min` : 'FAHIM'}</span></div><div className="p-3"><b className="line-clamp-2 text-sm leading-6">{video[`title_${language}`]}</b><span className="mt-2 block text-[10px] font-bold text-[var(--muted)]">{video.subject} · {video.education_level}</span></div></button>)}</div></section>}
        <form
          onSubmit={submit}
          className="mx-auto mt-9 max-w-5xl rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-950/5 dark:border-white/10 dark:bg-white/[.04]"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <Search className="absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                maxLength={120}
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pe-4 ps-12 text-sm font-semibold outline-none focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--brand-primary)_18%,transparent)] dark:border-white/10 dark:bg-black/20 dark:focus:ring-[color-mix(in_srgb,var(--brand-primary)_18%,transparent)]"
                placeholder={t.placeholder}
              />
            </label>
            <button
              disabled={loading || query.trim().length < 2}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 text-sm font-black text-white hover:bg-red-700 disabled:bg-slate-300 dark:disabled:bg-slate-700"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {t.search}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-black">
            <span className="me-1 flex items-center gap-1 text-slate-400">
              <ListFilter className="h-3.5 w-3.5" />
              {t.filters}
            </span>
            <Toggle
              active={options.captioned}
              onClick={() =>
                setOptions((value) => ({
                  ...value,
                  captioned: !value.captioned,
                }))
              }
            >
              <Captions className="h-3 w-3" />
              {t.captions}
            </Toggle>
            {(["any", "short", "medium", "long"] as const).map((value) => (
              <Toggle
                key={value}
                active={options.duration === value}
                onClick={() =>
                  setOptions((item) => ({ ...item, duration: value }))
                }
              >
                {t[value === "any" ? "all" : value]}
              </Toggle>
            ))}
            <span className="mx-1 h-4 w-px bg-slate-200 dark:bg-white/10" />
            {(["relevance", "viewCount", "date"] as const).map((value) => (
              <Toggle
                key={value}
                active={options.order === value}
                onClick={() =>
                  setOptions((item) => ({ ...item, order: value }))
                }
              >
                {value === "relevance"
                  ? t.relevance
                  : value === "viewCount"
                    ? t.popular
                    : t.newest}
              </Toggle>
            ))}
          </div>
        </form>
        <p className="mx-auto mt-4 flex max-w-4xl items-center justify-center gap-2 text-xs font-bold text-slate-500">
          <BrainCircuit className="h-4 w-4 text-teal-600" />
          {t.safe}
        </p>
        {error && (
          <div
            role="alert"
            className="mx-auto mt-8 max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center text-sm font-bold text-amber-900 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200"
          >
            {error}
          </div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="mx-auto mt-16 grid max-w-xl place-items-center rounded-[2rem] border border-dashed border-slate-300 px-6 py-14 text-center dark:border-white/10">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10">
              <Play className="h-6 w-6" />
            </span>
            <p className="mt-5 text-sm font-bold text-slate-500">{t.empty}</p>
          </div>
        )}
        {items.length > 0 && (
          <>
            <h2 className="mt-12 text-xl font-black">
              {t.related}
              <span className="ms-2 text-xs text-slate-400">
                ({items.length})
              </span>
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/[.04]"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(item);
                      recordStudyAction("video", item.title);
                    }}
                    className="relative block aspect-video w-full overflow-hidden bg-slate-200 text-start"
                  >
                    <img
                      src={item.thumbnail}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 grid place-items-center bg-slate-950/20 transition group-hover:bg-slate-950/10">
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-red-600 shadow-lg">
                        <Play className="h-5 w-5 fill-current" />
                      </span>
                    </span>
                    {item.duration && (
                      <span className="absolute bottom-2 end-2 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {item.duration}
                      </span>
                    )}
                  </button>
                  <div className="p-5">
                    <p className="text-xs font-black text-red-600 dark:text-red-400">
                      {item.channel}
                    </p>
                    <h3 className="mt-2 line-clamp-2 text-base font-black leading-7">
                      {item.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                      {item.description}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {item.viewCount != null && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500">
                          <Eye className="h-3 w-3" />
                          {formatter.format(item.viewCount)} {t.views}
                        </span>
                      )}
                      {item.hasCaptions && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-1 text-[9px] font-bold text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                          <Captions className="h-3 w-3" />
                          CC
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelected(item);
                        recordStudyAction("video", item.title);
                      }}
                      className="mt-4 inline-flex items-center gap-1 text-xs font-black text-[var(--brand-secondary)] dark:text-[var(--brand-primary)]"
                    >
                      <Play className="h-3.5 w-3.5" />
                      {t.watch}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
      {selected && (
        <VideoLearningStudio
          video={selected}
          related={items}
          language={language}
          onClose={() => setSelected(null)}
          onSelect={setSelected}
        />
      )}
    </main>
  );
}

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 ${active ? "bg-[var(--brand-solid)] text-white" : "bg-slate-100 text-slate-600 dark:bg-white/[.06] dark:text-slate-300"}`}
    >
      {children}
    </button>
  );
}
