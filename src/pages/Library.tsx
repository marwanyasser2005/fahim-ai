import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowUpLeft, ArrowUpRight, BadgeCheck, BookOpen, Building2, Captions, ExternalLink, FileSearch, Filter, GraduationCap, Loader2, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { searchKnowledge, type KnowledgeResult, type KnowledgeSearchOptions } from '@/lib/knowledgeSearch';
import { recordStudyAction } from '@/lib/studyProgress';

interface LibraryProps { language: 'ar' | 'en'; }
const copy = {
  ar: {
    eyebrow: 'مرصد المعرفة', title: 'ابحث في أكثر من طبقة معرفة.', body: 'محرك واحد يجمع المصادر المصرية المتحقق منها، الموسوعات المفتوحة، والفهرسة البحثية من OpenAlex وCrossref—ثم يرتبها حسب فائدتها للتعلّم لا حسب الشهرة فقط.',
    placeholder: 'ابحث: قانون نيوتن، المناعة، تصميم قواعد البيانات…', search: 'ابحث', all: 'الكل', official: 'مصادر مصر', encyclopedia: 'موسوعات', research: 'أبحاث', open: 'وصول مفتوح', year: 'من سنة', filters: 'مرشحات البحث',
    empty: 'اكتب مفهومًا أو سؤالًا لتبدأ. كل نتيجة تعود للمصدر الأصلي.', noResults: 'لم نجد نتيجة مناسبة بهذه المرشحات.', source: 'افتح المصدر', score: 'ملاءمة للتعلّم', citations: 'استشهاد', partial: 'بعض مزودي البحث لم يستجيبوا؛ النتائج المعروضة من المصادر المتاحة.', note: 'فَهيم يعرض بيانات وصفية ومقتطفات قصيرة فقط. تحقّق من المصدر الأصلي، ولا تعتبر ترتيب النتيجة اعتمادًا رسميًا.', results: 'نتيجة', providers: 'المصادر المتصلة', error: 'تعذر الوصول إلى محرك البحث الآن. حاول لاحقًا.'
  },
  en: {
    eyebrow: 'Knowledge observatory', title: 'Search across layers of knowledge.', body: 'One engine combines verified Egyptian destinations, open encyclopedias, and scholarly indexes from OpenAlex and Crossref—ranked for learning value, not popularity alone.',
    placeholder: 'Search: Newton’s law, immunity, database design…', search: 'Search', all: 'All', official: 'Egypt sources', encyclopedia: 'Encyclopedias', research: 'Research', open: 'Open access', year: 'From year', filters: 'Search filters',
    empty: 'Enter a concept or question to begin. Every result leads to its original source.', noResults: 'No suitable result matched these filters.', source: 'Open source', score: 'Learning fit', citations: 'citations', partial: 'Some search providers did not respond; these results come from available sources.', note: 'Fahim shows metadata and short excerpts only. Verify the original source; ranking is not an official endorsement.', results: 'results', providers: 'Connected sources', error: 'The search engine is unavailable right now. Please try again.'
  },
} as const;

const sourceMeta = {
  official: { ar: 'رسمي/مؤسسي', en: 'Official/institutional', icon: Building2, className: 'bg-[#F2B84B]/18 text-[#7a4b00]' },
  wikipedia: { ar: 'موسوعة مفتوحة', en: 'Open encyclopedia', icon: BookOpen, className: 'bg-[#0F766E]/12 text-[#0F766E]' },
  openalex: { ar: 'فهرس بحثي', en: 'Research index', icon: GraduationCap, className: 'bg-[#173F5F]/12 text-[#173F5F] dark:text-blue-200' },
  crossref: { ar: 'بيانات ناشر', en: 'Publisher metadata', icon: BadgeCheck, className: 'bg-[#D95D39]/12 text-[#b64224] dark:text-orange-200' },
} as const;

export default function Library({ language }: LibraryProps) {
  const t = copy[language];
  const Arrow = language === 'ar' ? ArrowUpLeft : ArrowUpRight;
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [options, setOptions] = useState<KnowledgeSearchOptions>({ source: 'all', openAccess: false });
  const [items, setItems] = useState<KnowledgeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [meta, setMeta] = useState<{ tookMs?: number; partial?: boolean; providers: string[] }>({ providers: [] });
  const formatter = useMemo(() => new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en', { notation: 'compact' }), [language]);
  const runSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) return;
    setLoading(true); setError('');
    try {
      const result = await searchKnowledge(searchQuery.trim(), language, options);
      setItems(result.items); setMeta({ tookMs: result.tookMs, partial: result.partial, providers: result.providers }); recordStudyAction('source', searchQuery);
    } catch { setItems([]); setError(t.error); }
    finally { setLoading(false); }
  }, [language, options, t.error]);
  const submit = async (event: FormEvent) => { event.preventDefault(); await runSearch(query); };
  useEffect(() => { const incoming = params.get('q'); if (incoming && incoming.length > 1) void runSearch(incoming); }, [params, runSearch]);

  return <main className="min-h-[78vh] bg-[var(--surface)] pb-20">
    <section className="atlas-grid border-b border-[var(--border)] bg-[var(--paper)] py-14 dark:bg-[#0b1116] sm:py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="max-w-4xl"><p className="atlas-kicker"><FileSearch className="h-4 w-4" />{t.eyebrow}</p><h1 className="atlas-display mt-5 max-w-4xl text-4xl sm:text-6xl">{t.title}</h1><p className="mt-5 max-w-3xl text-base leading-8 text-[var(--muted)]">{t.body}</p></div>
      <form onSubmit={submit} className="atlas-search mt-9 max-w-5xl"><label className="relative flex-1"><Search className="absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted)]" /><span className="sr-only">{t.search}</span><input value={query} onChange={(event) => setQuery(event.target.value)} maxLength={180} className="h-16 w-full bg-transparent pe-4 ps-12 text-base font-bold text-[var(--text)] outline-none" placeholder={t.placeholder} /></label><button disabled={loading || query.trim().length < 2} className="atlas-search-button">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{t.search}</button></form>
      <div className="mt-4 flex max-w-5xl flex-wrap items-center gap-2"><span className="me-1 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]"><Filter className="h-3.5 w-3.5" />{t.filters}</span>{(['all', 'official', 'encyclopedia', 'research'] as const).map((source) => <button type="button" key={source} onClick={() => setOptions((value) => ({ ...value, source }))} className={`atlas-filter ${options.source === source ? 'atlas-filter-active' : ''}`}>{t[source]}</button>)}<button type="button" onClick={() => setOptions((value) => ({ ...value, openAccess: !value.openAccess }))} className={`atlas-filter ${options.openAccess ? 'atlas-filter-active' : ''}`}><Captions className="h-3.5 w-3.5" />{t.open}</button><label className="atlas-filter"><span>{t.year}</span><input type="number" min="1900" max={new Date().getFullYear()} value={options.yearFrom || ''} onChange={(event) => setOptions((value) => ({ ...value, yearFrom: Number(event.target.value) || undefined }))} className="w-16 bg-transparent text-center outline-none" placeholder="2020" /></label></div>
    </div></section>

    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <p className="mt-5 flex max-w-4xl items-start gap-2 text-xs leading-6 text-[var(--muted)]"><ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-[#0F766E]" />{t.note}</p>
      {error ? <div role="alert" className="atlas-notice mt-8 border-[#D95D39]/30 bg-[#D95D39]/8 text-[#9c321b]">{error}</div> : null}
      {meta.partial ? <div role="status" className="atlas-notice mt-8 border-[#F2B84B]/35 bg-[#F2B84B]/12 text-[#6b4500]">{t.partial}</div> : null}
      {!loading && !error && items.length === 0 ? <section className="mt-12 grid min-h-64 place-items-center border-y border-dashed border-[var(--border)] text-center"><div><span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-[var(--border)] text-[#0F766E]"><Search className="h-6 w-6" /></span><p className="mt-4 max-w-lg text-sm font-bold text-[var(--muted)]">{query ? t.noResults : t.empty}</p></div></section> : null}
      {items.length > 0 ? <><div className="mt-10 flex flex-wrap items-end justify-between gap-4 border-b-2 border-[var(--text)] pb-3"><div><p className="text-[10px] font-black uppercase tracking-[.22em] text-[#D95D39]">{t.results}</p><h2 className="mt-1 text-2xl font-black text-[var(--text)]">{items.length} {t.results}</h2></div><div className="text-end text-[10px] font-bold text-[var(--muted)]"><p>{t.providers}: {meta.providers.join(' · ')}</p>{meta.tookMs ? <p className="mt-1">{meta.tookMs} ms</p> : null}</div></div>
        <div className="divide-y divide-[var(--border)]">{items.map((item, index) => { const source = sourceMeta[item.source]; const Icon = source.icon; return <article key={item.id} className="content-auto group grid gap-5 py-7 md:grid-cols-[3rem_1fr_auto] md:items-start"><span className="atlas-index">{String(index + 1).padStart(2, '0')}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`inline-flex items-center gap-1.5 px-2 py-1 text-[9px] font-black ${source.className}`}><Icon className="h-3 w-3" />{source[language]}</span>{item.year ? <span className="text-[10px] font-bold text-[var(--muted)]">{item.year}</span> : null}{item.openAccess ? <span className="text-[9px] font-black text-[#0F766E]">OPEN</span> : null}{item.verifiedAt ? <span className="inline-flex items-center gap-1 text-[9px] font-black text-[#0F766E]"><BadgeCheck className="h-3 w-3" />{item.verifiedAt}</span> : null}</div><h3 className="mt-3 max-w-4xl text-xl font-black leading-8 text-[var(--text)]">{item.title}</h3>{item.description ? <p className="mt-1 text-xs font-bold text-[#173F5F] dark:text-blue-200">{item.description}</p> : null}{item.excerpt ? <p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--muted)]">{item.excerpt}</p> : null}<div className="mt-4 flex flex-wrap gap-3 text-[10px] font-black"><span className="inline-flex items-center gap-1 text-[#D95D39]"><Sparkles className="h-3.5 w-3.5" />{t.score} {item.learningScore}%</span>{item.citations ? <span className="text-[var(--muted)]">{formatter.format(item.citations)} {t.citations}</span> : null}</div></div><a href={item.url} target="_blank" rel="noreferrer" onClick={() => recordStudyAction('source', item.title)} className="inline-flex items-center gap-2 self-center border-b border-[var(--text)] pb-1 text-xs font-black text-[var(--text)] transition group-hover:border-[#D95D39] group-hover:text-[#D95D39]">{t.source}<Arrow className="h-4 w-4" /><ExternalLink className="sr-only" /></a></article>; })}</div></> : null}
    </div>
  </main>;
}
