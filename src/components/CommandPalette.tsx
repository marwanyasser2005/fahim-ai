import { useEffect, useMemo, useRef, useState } from 'react';
import { Archive, Bot, BookOpen, BrainCircuit, Compass, Gauge, GraduationCap, Home, Layers3, LibraryBig, LogIn, Moon, PlaySquare, School, Search, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { Language, Theme } from '@/App';

type Props = { language: Language; theme: Theme; setTheme: (theme: Theme) => void };
export default function CommandPalette({ language, theme, setTheme }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const labels = language === 'ar'
    ? { placeholder: 'ابحث عن صفحة أو أداة…', nav: 'التنقل', actions: 'إجراءات', theme: 'تبديل المظهر' }
    : { placeholder: 'Search pages and actions…', nav: 'Navigation', actions: 'Actions', theme: 'Toggle appearance' };
  const routes = useMemo(() => [
    ['/', language === 'ar' ? 'الرئيسية' : 'Home', Home],
    ['/workspace', language === 'ar' ? 'مساحة التعلّم' : 'Learning workspace', Compass],
    ['/ask-fahim', language === 'ar' ? 'اسأل فَهيم' : 'Ask Fahim', Bot],
    ['/quiz-lab', language === 'ar' ? 'مختبر الإتقان' : 'Mastery lab', BrainCircuit],
    ['/videos', language === 'ar' ? 'الفيديوهات التعليمية' : 'Learning videos', PlaySquare],
    ['/library', language === 'ar' ? 'مكتبة المعرفة' : 'Knowledge library', LibraryBig],
    ['/resources', language === 'ar' ? 'مصادر مصر' : 'Egypt resources', BookOpen],
    ['/dashboard', language === 'ar' ? 'لوحة التعلّم' : 'Dashboard', Gauge],
    ['/courses', language === 'ar' ? 'المسارات' : 'Courses', GraduationCap],
    ['/knowledge-vault', language === 'ar' ? 'خزانة المعرفة والملفات' : 'Knowledge vault and files', Archive],
    ['/review', language === 'ar' ? 'المراجعة المتباعدة' : 'Spaced review', Layers3],
    ['/studio', language === 'ar' ? 'استوديو الفصول والمشروعات' : 'Class and project studio', School],
    ['/teacher', language === 'ar' ? 'غرفة قيادة المعلم ومعمل الأثر' : 'Teacher command room and impact lab', School],
    [user ? '/dashboard' : '/login', user ? (language === 'ar' ? 'ملفي' : 'My profile') : (language === 'ar' ? 'تسجيل الدخول' : 'Sign in'), LogIn],
  ] as const, [language, user]);
  const filtered = routes.filter(([, label]) => label.toLowerCase().includes(query.toLowerCase()));

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

  return <><button type="button" onClick={() => setOpen(true)} className="hidden h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--soft)] px-3 text-xs font-bold text-[var(--muted)] transition hover:border-[var(--lapis)] lg:flex"><Search className="h-4 w-4" /><span>{language === 'ar' ? 'بحث سريع' : 'Quick search'}</span><kbd className="ms-3 rounded-sm border border-[var(--border)] bg-[var(--panel)] px-1.5 py-0.5 text-[9px]">Ctrl K</kbd></button>
    {open && <div className="palette-backdrop fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/45 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={() => setOpen(false)}><div onMouseDown={(event) => event.stopPropagation()} className="palette-panel w-full max-w-xl overflow-hidden rounded-[1.6rem] border border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow-xl)]">
      <label className="flex items-center gap-3 border-b border-[var(--border)] px-5"><Search className="h-5 w-5 text-[var(--muted)]" /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={labels.placeholder} className="h-16 flex-1 bg-transparent text-sm font-bold text-[var(--text)] outline-none" /><kbd className="rounded-lg border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--muted)]">ESC</kbd></label>
      <div className="max-h-[55vh] overflow-y-auto p-2"><p className="px-3 py-2 text-[10px] font-black uppercase tracking-[.2em] text-[var(--muted)]">{labels.nav}</p>{filtered.map(([path, label, Icon]) => <button type="button" key={path + label} onClick={() => go(path)} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-start text-sm font-black text-[var(--text)] hover:bg-[var(--soft)]"><span className="grid h-9 w-9 place-items-center rounded-md bg-[var(--paper)] text-[var(--lapis)]"><Icon className="h-4 w-4" /></span>{label}</button>)}{filtered.length === 0 && <p className="p-8 text-center text-sm text-[var(--muted)]">{language === 'ar' ? 'لا توجد نتائج.' : 'No results.'}</p>}<p className="mt-2 px-3 py-2 text-[10px] font-black uppercase tracking-[.2em] text-[var(--muted)]">{labels.actions}</p><button type="button" onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); setOpen(false); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-start text-sm font-black text-[var(--text)] hover:bg-[var(--soft)]"><span className="grid h-9 w-9 place-items-center rounded-md bg-[var(--soft)]">{theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</span>{labels.theme}</button></div>
    </div></div>}</>;
}
