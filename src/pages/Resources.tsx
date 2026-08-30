import { useMemo, useState } from 'react';
import { BookOpenCheck, ExternalLink, Filter, Landmark, Search, ShieldCheck } from 'lucide-react';
import verifiedSources from '@/data/verifiedSources.json';

interface ResourcesProps { language: 'ar' | 'en'; }
type Category = 'all' | 'curriculum' | 'research' | 'platform' | 'career';

const copy = {
  ar: {
    tag: 'سجل مصادر فَهيم',
    title: 'مصادر مصرية وعربية واضحة الملكية والنطاق.',
    body: 'كل مصدر يعرض الجهة المالكة ونوع الاعتماد ونطاق المراحل وتاريخ آخر تحقق يدوي. فَهيم يوجهك إلى المصدر الأصلي ولا يدّعي اعتمادًا رسميًا.',
    search: 'ابحث: فيزياء، الصف الثالث الثانوي، برمجة…',
    categories: { all: 'الكل', curriculum: 'المناهج', research: 'البحث', platform: 'منصات', career: 'المهارات' },
    open: 'فتح المصدر الأصلي',
    verified: 'تم التحقق',
    coverage: 'نطاق الاستخدام',
    empty: 'لا توجد نتيجة مطابقة.',
    notice: 'السجل دليل وصول وليس بديلًا عن الكتاب أو قرار الوزارة. راجع العام الدراسي والصف وتاريخ النشر داخل المصدر الأصلي.',
    authority: { official: 'جهة رسمية', institutional: 'مؤسسة تعليمية', publisher: 'ناشر تعليمي', 'open-education': 'تعليم مفتوح' },
  },
  en: {
    tag: 'Fahim source registry',
    title: 'Egyptian and Arabic sources with clear ownership and scope.',
    body: 'Every entry shows its owner, authority type, stage coverage, and last manual verification date. Fahim routes to originals without claiming official accreditation.',
    search: 'Search: physics, grade 12, programming…',
    categories: { all: 'All', curriculum: 'Curriculum', research: 'Research', platform: 'Platforms', career: 'Skills' },
    open: 'Open original source',
    verified: 'Verified',
    coverage: 'Coverage',
    empty: 'No matching result.',
    notice: 'This registry is a discovery guide, not a replacement for the textbook or Ministry decisions. Verify the academic year and publication date on the original source.',
    authority: { official: 'Official entity', institutional: 'Education institution', publisher: 'Education publisher', 'open-education': 'Open education' },
  },
} as const;

export default function Resources({ language }: ResourcesProps) {
  const t = copy[language];
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const categories: Category[] = ['all', 'curriculum', 'research', 'platform', 'career'];
  const normalized = query.trim().toLowerCase();
  const visible = useMemo(() => verifiedSources.filter((item) => {
    const matchesCategory = category === 'all' || item.category === category;
    const searchable = `${item.title[language]} ${item.description[language]} ${item.owner[language]} ${item.keywords.join(' ')} ${item.subjects.join(' ')}`.toLowerCase();
    return matchesCategory && (!normalized || searchable.includes(normalized));
  }), [category, language, normalized]);

  return <main className="min-h-[72vh] bg-[var(--surface)] pb-20">
    <section className="atlas-grid border-b border-[var(--border)] bg-[var(--paper)] py-14 dark:bg-[#0b1116] sm:py-20">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="atlas-kicker"><BookOpenCheck className="h-4 w-4" />{t.tag}</p>
        <h1 className="atlas-display mt-5 text-4xl sm:text-6xl">{t.title}</h1>
        <p className="mt-5 leading-8 text-[var(--muted)]">{t.body}</p>
      </div>

    </div></section><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="atlas-panel mt-9 flex flex-col gap-4 p-4 md:flex-row md:items-center">
        <label className="flex flex-1 items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--soft)] px-4 py-3">
          <Search className="h-4 w-4 text-[var(--muted)]" aria-hidden="true" />
          <span className="sr-only">{t.search}</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm font-semibold text-[var(--text)] outline-none" placeholder={t.search} />
        </label>
        <div className="flex items-center gap-2 overflow-x-auto" role="group" aria-label={language === 'ar' ? 'تصفية المصادر' : 'Filter sources'}>
          <Filter className="h-4 w-4 shrink-0 text-[var(--muted)]" aria-hidden="true" />
          {categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} aria-pressed={category === item} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-black ${category === item ? 'bg-[var(--lapis)] text-white' : 'bg-[var(--soft)] text-[var(--muted)] hover:text-[var(--text)]'}`}>{t.categories[item]}</button>)}
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {visible.map((item) => <article key={item.id} className="premium-card flex flex-col p-6 transition hover:-translate-y-1 hover:border-[var(--nile)] hover:shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-md bg-[var(--paper)] text-[var(--lapis)]"><Landmark className="h-5 w-5" /></span>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-1 text-[11px] font-black text-teal-800 dark:bg-teal-500/10 dark:text-teal-200"><ShieldCheck className="h-3.5 w-3.5" />{t.authority[item.authority as keyof typeof t.authority]}</span>
          </div>
          <h2 className="mt-5 text-xl font-black text-[var(--text)]">{item.title[language]}</h2>
          <p className="mt-3 flex-1 text-sm leading-7 text-[var(--muted)]">{item.description[language]}</p>
          <dl className="mt-5 grid gap-2 rounded-2xl bg-[var(--soft)] p-4 text-xs">
            <div className="flex items-center justify-between gap-3"><dt className="font-black text-[var(--muted)]">{language === 'ar' ? 'الجهة' : 'Owner'}</dt><dd className="text-end font-bold text-[var(--text)]">{item.owner[language]}</dd></div>
            <div className="flex items-center justify-between gap-3"><dt className="font-black text-[var(--muted)]">{t.coverage}</dt><dd className="text-end font-bold text-[var(--text)]">{item.stages.join(' · ')}</dd></div>
            <div className="flex items-center justify-between gap-3"><dt className="font-black text-[var(--muted)]">{t.verified}</dt><dd className="font-bold text-teal-700 dark:text-teal-300"><time dateTime={item.verifiedAt}>{item.verifiedAt}</time></dd></div>
          </dl>
          <a href={item.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--lapis)] px-4 py-3 text-sm font-black text-white hover:bg-[var(--nile)]">{t.open}<ExternalLink className="h-4 w-4" /></a>
        </article>)}
      </div>
      {!visible.length && <p className="mt-12 text-center text-sm text-[var(--muted)]">{t.empty}</p>}
      <aside className="mt-10 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold leading-7 text-amber-950 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">{t.notice}</aside>
    </div>
  </main>;
}
