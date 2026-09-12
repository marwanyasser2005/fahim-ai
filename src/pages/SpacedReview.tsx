import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlarmClock, BrainCircuit, Check, ChevronLeft, ChevronRight, Clock3, Layers3, Plus, RotateCcw, Trash2, TrendingUp, X } from 'lucide-react';
import { createReviewCard, dueReviewCards, gradeReviewCard, loadReviewCards, removeReviewCard, type ReviewCard as ReviewCardType, type ReviewGrade } from '@/lib/spacedReview';
import { syncEvidenceToReviewCards } from '@/lib/reviewBridge';
import { recordStudyAction } from '@/lib/studyProgress';
import MemoryTimeline from '@/components/learning/MemoryTimeline';

const copy = {
  ar: { eyebrow: 'ذاكرة فَهيم', title: 'مراجعتك الآن', body: 'جدولة متباعدة حقيقية: كل تقييم يغيّر موعد البطاقة وصعوبتها. بطاقتك جاهزة، أجب من الذاكرة أولًا.', due: 'مستحق الآن', tomorrow: 'خلال 24 ساعة', mature: 'ذاكرة مستقرة', total: 'إجمالي البطاقات', add: 'بطاقة جديدة', front: 'السؤال أو المفهوم', back: 'الإجابة المختصرة', subject: 'المادة', save: 'حفظ البطاقة', cancel: 'إلغاء', reveal: 'اكشف الإجابة', again: 'نسيت', hard: 'صعب', good: 'جيد', easy: 'سهل', empty: 'لا توجد مراجعات مستحقة الآن.', emptyBody: 'أضف بطاقة جديدة أو عد في موعد المراجعة القادم.', all: 'كل البطاقات', interval: 'الفاصل', days: 'يوم', delete: 'حذف', answer: 'الإجابة', method: 'خوارزمية تكيفية مستوحاة من SM-2 مع خطوات تعلم قصيرة.', session: 'جلسة المذاكرة', done: 'أنهيت جلسة اليوم', doneBody: 'راجعت كل البطاقات المستحقة. عُد لاحقًا في موعد المراجعة القادم.', backToday: 'عد لليوم', topicFound: 'بطاقة مراجعتك المجدولة', progress: 'من الجلسة', scheduled: 'مجدولة من تقييمك' },
  en: { eyebrow: 'Fahim memory', title: 'Your review now', body: 'Real spaced scheduling: every rating changes the card’s next due date and difficulty. Your card is ready—answer from memory first.', due: 'Due now', tomorrow: 'Next 24 hours', mature: 'Stable memory', total: 'Total cards', add: 'New card', front: 'Question or concept', back: 'Concise answer', subject: 'Subject', save: 'Save card', cancel: 'Cancel', reveal: 'Reveal answer', again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy', empty: 'Nothing is due right now.', emptyBody: 'Add a new card or return at the next scheduled review.', all: 'All cards', interval: 'Interval', days: 'days', delete: 'Delete', answer: 'Answer', method: 'Adaptive scheduling inspired by SM-2 with short learning steps.', session: 'Study session', done: 'Today’s session complete', doneBody: 'You reviewed every due card. Return at the next scheduled review.', backToday: 'Back to Today', topicFound: 'Your scheduled review card', progress: 'of session', scheduled: 'Scheduled from your assessment' },
} as const;

const grades: { key: ReviewGrade; className: string }[] = [
  { key: 'again', className: 'bg-[var(--danger)] text-white' },
  { key: 'hard', className: 'bg-[var(--warning)] text-[#14213D]' },
  { key: 'good', className: 'bg-[var(--nile)] text-white' },
  { key: 'easy', className: 'bg-[var(--lapis)] text-white' },
];

export default function SpacedReview({ language }: { language: 'ar' | 'en' }) {
  const t = copy[language];
  const [searchParams] = useSearchParams();
  const topic = searchParams.get('topic') || '';
  const [cards, setCards] = useState<ReviewCardType[]>(() => syncEvidenceToReviewCards());
  const [sessionDone, setSessionDone] = useState(false);
  const [activeId, setActiveId] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [adding, setAdding] = useState(false);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [subject, setSubject] = useState('');

  const stats = useMemo(() => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 86_400_000);
    return {
      total: cards.length,
      due: cards.filter((card) => new Date(card.dueAt) <= now).length,
      tomorrow: cards.filter((card) => { const date = new Date(card.dueAt); return date > now && date <= tomorrow; }).length,
      mature: cards.filter((card) => card.intervalDays >= 21).length,
    };
  }, [cards]);

  const due = useMemo(() => cards.filter((card) => new Date(card.dueAt) <= new Date()).sort((a, b) => a.dueAt.localeCompare(b.dueAt)), [cards]);

  // Pick the starting card: ?topic= match first, then earliest due.
  useEffect(() => {
    const synced = syncEvidenceToReviewCards();
    setCards(synced);
    if (activeId) return;
    const normalized = topic.trim().toLowerCase();
    const topicCard = normalized
      ? synced.find((card) => new Date(card.dueAt) <= new Date() && (card.front.toLowerCase().includes(normalized) || card.subject.toLowerCase().includes(normalized)))
      : undefined;
    const first = topicCard || dueReviewCards()[0];
    if (first) setActiveId(first.id);
  }, [topic, activeId]);

  const active = cards.find((card) => card.id === activeId) || due[0];
  const reviewedInSession = due.length - dueReviewCards().length;
  const sessionProgress = due.length ? Math.min(100, Math.round((reviewedInSession / due.length) * 100)) : 0;

  const add = (event: FormEvent) => {
    event.preventDefault();
    if (front.trim().length < 2 || back.trim().length < 2) return;
    const card = createReviewCard(front, back, subject);
    setCards(loadReviewCards());
    setActiveId(card.id);
    setFront('');
    setBack('');
    setAdding(false);
    setRevealed(false);
  };

  const grade = (value: ReviewGrade) => {
    if (!active) return;
    gradeReviewCard(active.id, value);
    recordStudyAction('session', active.subject || active.front);
    const remaining = dueReviewCards().filter((card) => card.id !== active.id);
    setCards(loadReviewCards());
    if (remaining.length) {
      setActiveId(remaining[0].id);
      setRevealed(false);
    } else {
      setActiveId('');
      setRevealed(false);
      setSessionDone(true);
    }
  };

  const remove = (id: string) => {
    removeReviewCard(id);
    const next = loadReviewCards();
    setCards(next);
    if (activeId === id) setActiveId(next.find((card) => new Date(card.dueAt) <= new Date())?.id || '');
  };

  const ArrowBack = language === 'ar' ? ChevronRight : ChevronLeft;

  return <main className="min-h-[80vh] bg-[var(--surface)] pb-20">
    <section className="atlas-grid border-b border-[var(--border)] bg-[var(--paper)] py-12 sm:py-16"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <p className="atlas-kicker"><BrainCircuit className="h-4 w-4" />{t.eyebrow}</p>
      <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <h1 className="atlas-display max-w-4xl text-4xl sm:text-5xl">{t.title}</h1>
          <p className="mt-4 max-w-3xl leading-8 text-[var(--muted)]">{t.body}</p>
          <p className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--nile)]"><BrainCircuit className="h-3.5 w-3.5" />{t.method}</p>
        </div>
        <button type="button" onClick={() => setAdding((value) => !value)} className="atlas-secondary"><Plus className="h-4 w-4" />{t.add}</button>
      </div>
    </div></section>

    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
      {due.length > 0 && <div className="mb-6"><div className="flex items-center justify-between text-xs font-black text-[var(--muted)]"><span>{t.session}</span><span>{reviewedInSession}/{due.length} {t.progress}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--soft)]"><div className="h-full rounded-full bg-[var(--nile)] transition-all" style={{ width: `${sessionProgress}%` }} /></div></div>}

      {stats.due + stats.tomorrow + stats.mature > 0 && <section className="grid border-y border-[var(--border)] sm:grid-cols-4">{[[t.due, stats.due, AlarmClock], [t.tomorrow, stats.tomorrow, Clock3], [t.mature, stats.mature, TrendingUp], [t.total, stats.total, Layers3]].map(([labelText, value, Icon], index) => { const MetricIcon = Icon as typeof AlarmClock; return <div key={String(labelText)} className={`p-5 ${index ? 'border-t border-[var(--border)] sm:border-s sm:border-t-0' : ''}`}><MetricIcon className="h-4 w-4 text-[var(--vermilion)]" /><p className="mt-5 text-3xl font-black text-[var(--text)]">{String(value)}</p><p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">{String(labelText)}</p></div>; })}</section>}

      {adding && <form onSubmit={add} className="mt-8 grid gap-4 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--panel)] p-5 md:grid-cols-2">
        <div className="md:col-span-2 flex items-center justify-between"><strong className="text-sm font-black text-[var(--text)]">{t.add}</strong><button type="button" onClick={() => setAdding(false)} className="icon-button" aria-label={t.cancel}><X className="h-4 w-4" /></button></div>
        <label><span className="atlas-label">{t.front}</span><textarea value={front} onChange={(event) => setFront(event.target.value)} rows={3} className="atlas-field mt-2" /></label>
        <label><span className="atlas-label">{t.back}</span><textarea value={back} onChange={(event) => setBack(event.target.value)} rows={3} className="atlas-field mt-2" /></label>
        <label><span className="atlas-label">{t.subject}</span><input value={subject} onChange={(event) => setSubject(event.target.value)} className="atlas-field mt-2 h-12" /></label>
        <button disabled={front.trim().length < 2 || back.trim().length < 2} className="atlas-primary self-end justify-center disabled:opacity-40"><Check className="h-4 w-4" />{t.save}</button>
      </form>}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <section aria-label={t.session}>
          {active && !sessionDone ? <article className="sticky top-24 min-h-[24rem] rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow-lg)] sm:p-10">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-[color-mix(in_srgb,var(--nile)_10%,var(--panel))] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--nile)]">{active.subject || t.eyebrow}</span>
              <span className="text-[10px] font-bold text-[var(--muted)]">{new Date(active.dueAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-GB')}</span>
            </div>
            <h2 className="mt-12 max-w-3xl text-2xl font-black leading-10 text-[var(--text)] sm:text-3xl">{active.front}</h2>
            {revealed
              ? <div className="mt-10 border-s-4 border-[var(--nile)] bg-[color-mix(in_srgb,var(--nile)_9%,var(--panel))] p-5"><p className="text-[10px] font-black uppercase tracking-widest text-[var(--nile)]">{t.answer}</p><p className="mt-3 whitespace-pre-wrap text-base font-bold leading-8 text-[var(--text)]">{active.back}</p></div>
              : <button type="button" onClick={() => setRevealed(true)} className="atlas-primary mt-12"><RotateCcw className="h-4 w-4" />{t.reveal}</button>}
            {revealed && <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4">{grades.map((item) => <button type="button" key={item.key} onClick={() => grade(item.key)} className={`min-h-11 rounded-[var(--radius-control)] px-4 py-3 text-xs font-black transition hover:brightness-110 ${item.className}`}>{t[item.key]}</button>)}</div>}
          </article>
          : sessionDone || due.length === 0 ? <div className="grid min-h-[24rem] place-items-center rounded-[var(--radius-card)] border border-dashed border-[var(--border)] bg-[var(--panel)] text-center">
            <div>
              <Check className="mx-auto h-10 w-10 text-[var(--nile)]" />
              <h2 className="mt-4 text-xl font-black text-[var(--text)]">{sessionDone ? t.done : t.empty}</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">{sessionDone ? t.doneBody : t.emptyBody}</p>
              {sessionDone && <button type="button" onClick={() => setSessionDone(false)} className="atlas-secondary mt-6"><ArrowBack className="h-4 w-4" />{t.backToday}</button>}
            </div>
          </div> : null}
        </section>

        <aside aria-label={t.all}>
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3"><h2 className="text-sm font-black text-[var(--text)]">{t.all}</h2><span className="text-[10px] font-black text-[var(--vermilion)]">{cards.length}</span></div>
          <div className="max-h-[34rem] divide-y divide-[var(--border)] overflow-y-auto">{cards.map((card) => <article key={card.id} className="py-4"><div className="flex gap-3">
            <button type="button" onClick={() => { setActiveId(card.id); setRevealed(false); setSessionDone(false); }} className="min-w-0 flex-1 text-start">
              <p className="line-clamp-2 text-xs font-black leading-5 text-[var(--text)]">{card.front}</p>
              <p className="mt-1 text-[9px] font-bold text-[var(--muted)]">{t.interval}: {card.intervalDays} {t.days}</p>
            </button>
            <button type="button" onClick={() => remove(card.id)} title={t.delete} aria-label={t.delete} className="text-[var(--muted)] hover:text-[var(--danger)]"><Trash2 className="h-3.5 w-3.5" /></button>
          </div></article>)}</div>
        </aside>
      </div>

      <MemoryTimeline cards={cards} language={language} onSelect={(id) => { setActiveId(id); setRevealed(false); setSessionDone(false); window.scrollTo({ top: 0, behavior: 'auto' }); }} />
    </div>
  </main>;
}
