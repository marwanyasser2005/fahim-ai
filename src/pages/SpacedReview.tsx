import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlarmClock, BrainCircuit, Check, ChevronLeft, ChevronRight, Clock3, Layers3, Plus, RotateCcw, Trash2, TrendingUp, X } from 'lucide-react';
import { createReviewCard, dueReviewCards, loadReviewCards, removeReviewCard, type ReviewCard as ReviewCardType, type ReviewGrade } from '@/lib/spacedReview';
import { recordReviewOutcome, syncEvidenceToReviewCards } from '@/lib/reviewBridge';
import { hydrateReviewCardsFromCloud, syncReviewCards } from '@/lib/supabase/reviewSync';
import { recordStudyAction } from '@/lib/studyProgress';
import MemoryTimeline from '@/components/learning/MemoryTimeline';

const copy = {
  ar: { eyebrow: 'ذاكرة فَهيم', title: 'مراجعتك الآن', body: 'جدولة متباعدة حقيقية: كل تقييم يغيّر موعد البطاقة وصعوبتها. بطاقتك جاهزة، أجب من الذاكرة أولًا.', due: 'مستحق الآن', tomorrow: 'خلال 24 ساعة', mature: 'ذاكرة مستقرة', total: 'إجمالي البطاقات', add: 'بطاقة جديدة', front: 'السؤال أو المفهوم', back: 'الإجابة المختصرة', subject: 'المادة', save: 'حفظ البطاقة', cancel: 'إلغاء', reveal: 'اكشف الإجابة', again: 'نسيت', hard: 'صعب', good: 'جيد', easy: 'سهل', empty: 'لا توجد مراجعات مستحقة الآن.', emptyBody: 'أضف بطاقة جديدة أو عد في موعد المراجعة القادم.', all: 'كل البطاقات', interval: 'الفاصل', days: 'يوم', delete: 'حذف', answer: 'الإجابة', method: 'خوارزمية تكيفية مستوحاة من SM-2 مع خطوات تعلم قصيرة.', session: 'جلسة المذاكرة', done: 'أنهيت جلسة اليوم', doneBody: 'راجعت كل البطاقات المستحقة. عُد لاحقًا في موعد المراجعة القادم.', backToday: 'عد لليوم', topicFound: 'بطاقة مراجعتك المجدولة', progress: 'من الجلسة', scheduled: 'مجدولة من تقييمك', howTo: 'أجب من الذاكرة، ثم قيّم نفسك بصدق.' },
  en: { eyebrow: 'Fahim memory', title: 'Your review now', body: 'Real spaced scheduling: every rating changes the card’s next due date and difficulty. Your card is ready—answer from memory first.', due: 'Due now', tomorrow: 'Next 24 hours', mature: 'Stable memory', total: 'Total cards', add: 'New card', front: 'Question or concept', back: 'Concise answer', subject: 'Subject', save: 'Save card', cancel: 'Cancel', reveal: 'Reveal answer', again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy', empty: 'Nothing is due right now.', emptyBody: 'Add a new card or return at the next scheduled review.', all: 'All cards', interval: 'Interval', days: 'days', delete: 'Delete', answer: 'Answer', method: 'Adaptive scheduling inspired by SM-2 with short learning steps.', session: 'Study session', done: 'Today’s session complete', doneBody: 'You reviewed every due card. Return at the next scheduled review.', backToday: 'Back to Today', topicFound: 'Your scheduled review card', progress: 'of session', scheduled: 'Scheduled from your assessment', howTo: 'Answer from memory, then rate yourself honestly.' },
} as const;

const grades: { key: ReviewGrade; className: string }[] = [
  { key: 'again', className: 'bg-[var(--danger-solid)] text-[var(--on-solid)]' },
  { key: 'hard', className: 'bg-[var(--warning-solid)] text-[var(--on-solid)]' },
  { key: 'good', className: 'bg-[var(--evidence-solid)] text-[var(--on-solid)]' },
  { key: 'easy', className: 'bg-[var(--brand-solid)] text-[var(--on-solid)]' },
];

export default function SpacedReview({ language }: { language: 'ar' | 'en' }) {
  const t = copy[language];
  const rtl = language === 'ar';
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
    let active = true;
    void (async () => {
      // Adopt reviews taken on another device before rendering the session.
      await hydrateReviewCardsFromCloud();
      if (!active) return;
      const synced = syncEvidenceToReviewCards();
      setCards(synced);
      setActiveId((current) => {
        if (current) return current;
        const normalized = topic.trim().toLowerCase();
        const topicCard = normalized
          ? synced.find((card) => new Date(card.dueAt) <= new Date() && (card.front.toLowerCase().includes(normalized) || card.subject.toLowerCase().includes(normalized)))
          : undefined;
        return (topicCard || dueReviewCards()[0])?.id || '';
      });
    })();
    return () => { active = false; };
  }, [topic]);

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
    // Closes the learning loop: this writes the measured recall back to the evidence session.
    recordReviewOutcome(active.id, value);
    void syncReviewCards();
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

  const ArrowBack = rtl ? ChevronRight : ChevronLeft;
  const dateFormat = new Intl.DateTimeFormat(rtl ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const metrics = [
    { label: t.due, value: stats.due, icon: AlarmClock, attention: stats.due > 0 },
    { label: t.tomorrow, value: stats.tomorrow, icon: Clock3, attention: false },
    { label: t.mature, value: stats.mature, icon: TrendingUp, attention: false },
    { label: t.total, value: stats.total, icon: Layers3, attention: false },
  ];

  return (
    <main className="min-h-[80vh] bg-[var(--surface)] pb-20">
      {/* ——— Hero ——— */}
      <section className="fahim-band-hero relative overflow-hidden border-b border-[var(--band)] bg-[var(--band)] px-4 py-16 text-white sm:px-6 lg:py-20">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 85% 12%, color-mix(in srgb, var(--nile) 22%, transparent), transparent 24rem), radial-gradient(circle at 10% 90%, color-mix(in srgb, var(--saffron) 13%, transparent), transparent 20rem)',
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-7xl">
          <p className="flex w-fit items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-[var(--saffron)]">
            <BrainCircuit className="h-4 w-4" />
            {t.eyebrow}
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="min-w-0">
              <h1 className="atlas-display max-w-3xl text-4xl text-white sm:text-6xl">{t.title}</h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-[#B9C6D4] sm:text-lg">{t.body}</p>
              <p className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[.06] px-3.5 py-2 text-sm font-semibold text-[#C8D3DF]">
                <RotateCcw className="h-4 w-4 text-[var(--saffron)]" />
                {t.method}
              </p>
            </div>

            <div className="flex flex-col items-stretch gap-3 sm:flex-row lg:flex-col">
              <button
                type="button"
                onClick={() => setAdding((value) => !value)}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-transparent bg-white px-5 py-3 text-sm font-black text-[#14213d] shadow-[3px_3px_0_var(--saffron)] transition hover:-translate-y-0.5"
              >
                {adding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {adding ? t.cancel : t.add}
              </button>
              {due.length > 0 && (
                <div className="min-w-[14rem] rounded-xl border border-white/12 bg-white/[.06] px-4 py-3">
                  <p className="text-xs font-bold text-[#B9C6D4]">{t.session}</p>
                  <p className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-black tabular-nums text-white">
                      {reviewedInSession}/{due.length}
                    </span>
                    <span className="text-xs font-bold text-[#B9C6D4]">{t.progress}</span>
                  </p>
                  <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white/15">
                    <span className="block h-full rounded-full bg-[var(--saffron)] transition-all" style={{ width: `${sessionProgress}%` }} />
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        {/* ——— Metrics ——— */}
        {stats.total > 0 && (
          <section className="grid overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow-sm)] sm:grid-cols-4">
            {metrics.map(({ label, value, icon: Icon, attention }, index) => (
              <div
                key={label}
                className={`flex flex-col gap-3 p-5 ${index ? 'border-t border-[var(--border)] sm:border-s sm:border-t-0' : ''}`}
              >
                <span
                  className={`grid h-10 w-10 place-items-center rounded-xl ${attention ? 'bg-[color-mix(in_srgb,var(--vermilion)_12%,var(--panel))] text-[var(--vermilion)]' : 'bg-[var(--soft)] text-[var(--nile)]'}`}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.9} />
                </span>
                <p className="text-3xl font-black tabular-nums leading-none text-[var(--text)]">{value}</p>
                <p className="text-sm font-bold text-[var(--muted)]">{label}</p>
              </div>
            ))}
          </section>
        )}

        {/* ——— New card form ——— */}
        {adding && (
          <form
            onSubmit={add}
            className="mt-8 grid gap-5 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow-sm)] md:grid-cols-2"
          >
            <div className="flex items-center justify-between md:col-span-2">
              <h2 className="text-base font-black text-[var(--text)]">{t.add}</h2>
              <button type="button" onClick={() => setAdding(false)} className="icon-button" aria-label={t.cancel}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <label className="block">
              <span className="atlas-label">{t.front}</span>
              <textarea value={front} onChange={(event) => setFront(event.target.value)} rows={3} className="atlas-field mt-2" />
            </label>
            <label className="block">
              <span className="atlas-label">{t.back}</span>
              <textarea value={back} onChange={(event) => setBack(event.target.value)} rows={3} className="atlas-field mt-2" />
            </label>
            <label className="block">
              <span className="atlas-label">{t.subject}</span>
              <input value={subject} onChange={(event) => setSubject(event.target.value)} className="atlas-field mt-2 h-12" />
            </label>
            <button disabled={front.trim().length < 2 || back.trim().length < 2} className="atlas-primary justify-center self-end disabled:opacity-40">
              <Check className="h-4 w-4" />
              {t.save}
            </button>
          </form>
        )}

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_20rem]">
          {/* ——— Review card ——— */}
          <section aria-label={t.session}>
            {active && !sessionDone ? (
              <article className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow-lg)] sm:p-10 lg:sticky lg:top-[calc(var(--nav-height)+1.25rem)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[color-mix(in_srgb,var(--nile)_10%,var(--panel))] px-3.5 py-1.5 text-xs font-black text-[var(--nile)]">
                    <Layers3 className="h-4 w-4" />
                    {active.subject || t.eyebrow}
                  </span>
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-[var(--muted)]">
                    <Clock3 className="h-4 w-4" />
                    {dateFormat.format(new Date(active.dueAt))}
                  </span>
                </div>

                <h2 className="mt-10 max-w-3xl text-2xl font-black leading-[1.6] text-[var(--text)] sm:text-3xl sm:leading-[1.55]">
                  {active.front}
                </h2>

                <p className="mt-5 text-sm font-semibold text-[var(--muted)]">{t.howTo}</p>

                {revealed ? (
                  <div className="mt-9 rounded-xl border-s-4 border-[var(--nile)] bg-[color-mix(in_srgb,var(--nile)_8%,var(--panel))] p-5">
                    <p className="flex items-center gap-2 text-xs font-black text-[var(--nile)]">
                      <Check className="h-4 w-4" />
                      {t.answer}
                    </p>
                    <p className="mt-3 whitespace-pre-wrap text-base font-bold leading-9 text-[var(--text)]">{active.back}</p>
                  </div>
                ) : (
                  <button type="button" onClick={() => setRevealed(true)} className="atlas-primary mt-9">
                    <RotateCcw className="h-4 w-4" />
                    {t.reveal}
                  </button>
                )}

                {revealed && (
                  <div className="mt-8">
                    <p className="text-xs font-black text-[var(--muted)]">{t.session}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                      {grades.map((item) => (
                        <button
                          type="button"
                          key={item.key}
                          onClick={() => grade(item.key)}
                          className={`min-h-12 rounded-xl px-4 py-3 text-sm font-black transition hover:brightness-110 ${item.className}`}
                        >
                          {t[item.key]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            ) : sessionDone || due.length === 0 ? (
              <div className="grid min-h-[24rem] place-items-center rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--panel)] px-6 py-12 text-center">
                <div>
                  <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-[color-mix(in_srgb,var(--nile)_10%,var(--panel))] text-[var(--nile)]">
                    <Check className="h-8 w-8" strokeWidth={2} />
                  </span>
                  <h2 className="mt-5 text-2xl font-black text-[var(--text)]">{sessionDone ? t.done : t.empty}</h2>
                  <p className="mx-auto mt-3 max-w-md text-base leading-8 text-[var(--muted)]">{sessionDone ? t.doneBody : t.emptyBody}</p>
                  {sessionDone && (
                    <button type="button" onClick={() => setSessionDone(false)} className="atlas-secondary mt-7">
                      <ArrowBack className="h-4 w-4" />
                      {t.backToday}
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </section>

          {/* ——— All cards ——— */}
          <aside aria-label={t.all}>
            <div className="flex items-center justify-between border-b-2 border-[var(--border-strong)] pb-4">
              <h2 className="text-base font-black text-[var(--text)]">{t.all}</h2>
              <span className="rounded-full bg-[var(--soft)] px-2.5 py-1 text-xs font-black tabular-nums text-[var(--vermilion)]">{cards.length}</span>
            </div>
            <div className="max-h-[34rem] divide-y divide-[var(--border)] overflow-y-auto">
              {cards.map((card) => (
                <article key={card.id} className="group flex gap-3 py-4">
                  <button
                    type="button"
                    onClick={() => { setActiveId(card.id); setRevealed(false); setSessionDone(false); }}
                    className="min-w-0 flex-1 text-start"
                  >
                    <p className="line-clamp-2 text-sm font-bold leading-7 text-[var(--text)]">{card.front}</p>
                    <p className="mt-1.5 text-xs font-semibold text-[var(--muted)]">
                      {t.interval}: <span className="tabular-nums">{card.intervalDays}</span> {t.days}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(card.id)}
                    title={t.delete}
                    aria-label={t.delete}
                    className="grid h-9 w-9 shrink-0 place-items-center self-center rounded-lg text-[var(--muted)] opacity-0 transition hover:bg-[color-mix(in_srgb,var(--danger)_12%,var(--panel))] hover:text-[var(--danger)] focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </article>
              ))}
            </div>
          </aside>
        </div>

        <MemoryTimeline cards={cards} language={language} onSelect={(id) => { setActiveId(id); setRevealed(false); setSessionDone(false); window.scrollTo({ top: 0, behavior: 'auto' }); }} />
      </div>
    </main>
  );
}
