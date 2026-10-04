import { useEffect, useMemo, useRef, useState } from 'react';
import { Moon, PlaySquare, School, Search, Sun, ClipboardCheck, Route } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProfileRole } from '@/hooks/useProfileRole';
import { productNav, publicNav } from '@/lib/appNavigation';
import type { Language, Theme } from '@/App';

type Props = { language: Language; theme: Theme; setTheme: (theme: Theme) => void };

type PaletteItem = { path: string; ar: string; en: string; hintAr?: string; hintEn?: string; icon: typeof Search };

export default function CommandPalette({ language, theme, setTheme }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const { isStaff } = useProfileRole();
  const ar = language === 'ar';
  const labels = ar
    ? { placeholder: 'ابحث عن صفحة أو أداة…', nav: 'التنقل', actions: 'إجراءات', theme: 'تبديل المظهر' }
    : { placeholder: 'Search pages and actions…', nav: 'Navigation', actions: 'Actions', theme: 'Toggle appearance' };

  const routes = useMemo<PaletteItem[]>(() => {
    const shared: PaletteItem[] = [...productNav, ...publicNav]
      .filter((entry) => entry.role === 'all' || isStaff)
      .map((entry) => ({
        path: entry.to,
        ar: entry.ar,
        en: entry.en,
        hintAr: entry.hintAr,
        hintEn: entry.hintEn,
        icon: entry.icon,
      }));
    const extras: PaletteItem[] = [
      { path: '/quiz-lab', ar: 'مختبر التقييم', en: 'Assessment lab', icon: ClipboardCheck },
      { path: '/videos', ar: 'الفيديوهات التعليمية', en: 'Learning videos', icon: PlaySquare },
      { path: '/studio', ar: 'استوديو الفصول والمشروعات', en: 'Class and project studio', icon: School },
      { path: '/personal-paths', ar: 'أنشئ مسارك بالذكاء الاصطناعي', en: 'Build an AI learning path', icon: Route },
    ];
    return [...shared, ...extras];
  }, [isStaff]);

  const filtered = routes.filter((entry) => {
    const needle = query.toLowerCase();
    return entry.ar.includes(query) || entry.en.toLowerCase().includes(needle);
  });

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setOpen((value) => !value); }
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  useEffect(() => { if (open) window.setTimeout(() => inputRef.current?.focus(), 50); else setQuery(''); }, [open]);
  const go = (path: string) => { navigate(path); setOpen(false); };

  return <><button type="button" onClick={() => setOpen(true)} className="hidden h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--soft)] px-3 text-xs font-bold text-[var(--muted)] transition hover:border-[var(--brand-primary)] lg:flex"><Search className="h-4 w-4" /><span>{ar ? 'بحث سريع' : 'Quick search'}</span><kbd className="ms-3 rounded-sm border border-[var(--border)] bg-[var(--panel)] px-1.5 py-0.5 text-[9px]">Ctrl K</kbd></button>
    {open && <div className="palette-backdrop fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/45 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={() => setOpen(false)}><div role="dialog" aria-modal="true" aria-label={ar ? 'البحث السريع' : 'Quick search'} onMouseDown={(event) => event.stopPropagation()} className="palette-panel w-full max-w-xl overflow-hidden rounded-[1.6rem] border border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow-xl)]">
      <label className="flex items-center gap-3 border-b border-[var(--border)] px-5"><Search className="h-5 w-5 text-[var(--muted)]" /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={labels.placeholder} className="h-16 flex-1 bg-transparent text-sm font-bold text-[var(--text)] outline-none" /><kbd className="rounded-lg border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--muted)]">ESC</kbd></label>
      <div className="max-h-[55vh] overflow-y-auto p-2"><p className="px-3 py-2 text-[10px] font-black uppercase tracking-[.2em] text-[var(--muted)]">{labels.nav}</p>{filtered.map((entry) => <button type="button" key={entry.path + entry.en} onClick={() => go(entry.path)} title={ar ? entry.hintAr : entry.hintEn} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-start text-sm font-black text-[var(--text)] hover:bg-[var(--soft)]"><span className="grid h-9 w-9 place-items-center rounded-md bg-[var(--paper)] text-[var(--brand-primary)]"><entry.icon className="h-4 w-4" /></span>{ar ? entry.ar : entry.en}</button>)}{filtered.length === 0 && <p className="p-8 text-center text-sm text-[var(--muted)]">{ar ? 'لا توجد نتائج.' : 'No results.'}</p>}<p className="mt-2 px-3 py-2 text-[10px] font-black uppercase tracking-[.2em] text-[var(--muted)]">{labels.actions}</p><button type="button" onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); setOpen(false); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-start text-sm font-black text-[var(--text)] hover:bg-[var(--soft)]"><span className="grid h-9 w-9 place-items-center rounded-md bg-[var(--soft)]">{theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</span>{labels.theme}</button></div>
    </div></div>}</>;
}
