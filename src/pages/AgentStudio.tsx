import { FormEvent, useCallback, useRef, useState } from 'react';
import { Activity, Brain, CheckCircle2, Compass, FileSearch, GraduationCap, ListChecks, Loader2, Play, Send, Sparkles, Target, TimerReset } from 'lucide-react';
import { streamAgent, type AgentResult, type AgentState, type AgentStepEvent } from '@/lib/agentClient';
import { masteryLabel as bktMasteryLabel } from '@/lib/learning/bkt';

type Phase = 'idle' | 'running' | 'awaiting' | 'done';

interface TraceEntry {
  turn: number;
  index: number;
  tool: string;
  thought?: string;
  observation?: Record<string, unknown>;
}

interface PendingDiagnostic { question: string; options: string[]; token: string; }

const copy = {
  ar: {
    eyebrow: 'وكيل فَهيم', title: 'الوكيل المُعلِّم المستقل',
    body: 'وكيل حقيقي يقرر خطوته التالية بنفسه: يقرأ ذاكرتك، يشخّص بسؤال، يصحّح ويحدّث إتقانك (BKT)، يشرح من مصدر موثّق، ثم يجدول مراجعتك (FSRS). كل خطوة ظاهرة أمامك.',
    goalLabel: 'المفهوم أو الهدف التعليمي', goalPlaceholder: 'مثال: قانون نيوتن الثاني', subject: 'المادة', grade: 'المستوى',
    run: 'شغّل الوكيل', running: 'الوكيل يعمل…', trace: 'خطوات الوكيل الحيّة', waiting: 'الوكيل ينتظر إجابتك',
    yourAnswer: 'إجابتك', submit: 'أرسل للوكيل', explainPrompt: 'اكتب فهمك بكلماتك', mastery: 'إتقان المفهوم',
    ability: 'القدرة التكيفية (θ)', attempts: 'المحاولات', schedule: 'المراجعة القادمة', sources: 'المصادر الموثوقة',
    summary: 'خلاصة الجلسة', done: 'اكتملت الجولة', memory: 'ذاكرة دائمة: يُحفظ إتقانك وجدول مراجعتك في حسابك.',
    honest: 'الإتقان تقدير احتمالي (BKT) قابل للمراجعة، وليس حكمًا نهائيًا.', empty: 'اكتب هدفًا وابدأ لترى الوكيل يخطّط ويتصرّف.',
    days: 'يوم', newRun: 'جولة جديدة',
  },
  en: {
    eyebrow: 'Fahim Agent', title: 'The autonomous tutoring agent',
    body: 'A real agent that decides its own next step: it reads your memory, diagnoses with a question, grades and updates your mastery (BKT), teaches from a verified source, then schedules your review (FSRS). Every step is visible.',
    goalLabel: 'Concept or learning goal', goalPlaceholder: 'e.g. Newton\'s second law', subject: 'Subject', grade: 'Level',
    run: 'Run the agent', running: 'Agent working…', trace: 'Live agent trace', waiting: 'The agent is waiting for you',
    yourAnswer: 'Your answer', submit: 'Send to agent', explainPrompt: 'Explain in your own words', mastery: 'Concept mastery',
    ability: 'Adaptive ability (θ)', attempts: 'Attempts', schedule: 'Next review', sources: 'Verified sources',
    summary: 'Session summary', done: 'Session complete', memory: 'Durable memory: your mastery and review schedule are saved to your account.',
    honest: 'Mastery is a revisable probability estimate (BKT), not a final verdict.', empty: 'Enter a goal and start to watch the agent plan and act.',
    days: 'days', newRun: 'New run',
  },
} as const;

const TOOL_META: Record<string, { ar: string; en: string; icon: typeof Brain }> = {
  get_learner_state: { ar: 'قراءة ذاكرة المتعلّم', en: 'Read learner memory', icon: Brain },
  search_verified_sources: { ar: 'بحث في مصادر موثوقة', en: 'Search verified sources', icon: FileSearch },
  generate_diagnostic: { ar: 'توليد سؤال تشخيصي', en: 'Generate diagnostic', icon: ListChecks },
  ask_learner: { ar: 'طرح سؤال على المتعلّم', en: 'Ask the learner', icon: Send },
  assess_answer: { ar: 'تصحيح وتحديث الإتقان', en: 'Assess and update mastery', icon: CheckCircle2 },
  diagnose_misconception: { ar: 'تشخيص المفهوم الخاطئ', en: 'Diagnose misconception', icon: Target },
  explain_concept: { ar: 'شرح تدخّلي مبني على مصدر', en: 'Grounded intervention', icon: GraduationCap },
  select_next_item: { ar: 'اختيار الصعوبة التالية', en: 'Select next difficulty', icon: Compass },
  schedule_review: { ar: 'جدولة المراجعة (FSRS)', en: 'Schedule review (FSRS)', icon: TimerReset },
  record_evidence: { ar: 'تسجيل الدليل', en: 'Record evidence', icon: Activity },
  finish: { ar: 'إنهاء الجلسة', en: 'Finish session', icon: Sparkles },
};

// AGENT_STUDIO_BODY_PLACEHOLDER
export default function AgentStudio({ language }: { language: 'ar' | 'en' }) {
  const t = copy[language];
  const rtl = language === 'ar';
  const [goal, setGoal] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [trace, setTrace] = useState<TraceEntry[]>([]);
  const [pending, setPending] = useState<PendingDiagnostic | null>(null);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [explanation, setExplanation] = useState<string>('');
  const [nextReview, setNextReview] = useState<{ intervalDays: number; nextReviewAt: string } | null>(null);
  const [error, setError] = useState('');
  const [freeText, setFreeText] = useState('');
  const turnRef = useRef(0);
  const stateRef = useRef<AgentState | null>(null);

  const runTurn = useCallback(async (learnerInput: { itemToken?: string; answerIndex?: number; text?: string } | null) => {
    turnRef.current += 1;
    const turn = turnRef.current;
    setPhase('running');
    setError('');
    setPending(null);
    try {
      await streamAgent(
        { goal, concept: goal, subject, grade, language, learnerInput, priorState: stateRef.current },
        {
          onStep: (step: AgentStepEvent) => setTrace((current) => [...current, { turn, index: step.index, tool: step.tool, thought: step.thought }]),
          onObservation: ({ index, tool, observation }) => {
            setTrace((current) => current.map((entry) => (entry.turn === turn && entry.index === index && entry.tool === tool ? { ...entry, observation } : entry)));
            if (tool === 'generate_diagnostic' && Array.isArray(observation.options)) {
              setPending({ question: String(observation.question || ''), options: (observation.options as string[]).map(String), token: String(observation.token || '') });
            }
            if (tool === 'explain_concept' && typeof observation.explanation === 'string') setExplanation(observation.explanation);
            if (tool === 'schedule_review' && observation.nextReviewAt) setNextReview({ intervalDays: Number(observation.intervalDays) || 0, nextReviewAt: String(observation.nextReviewAt) });
          },
          onResult: (res: AgentResult) => {
            setResult(res);
            stateRef.current = res.state;
            setPhase(res.awaiting ? 'awaiting' : 'done');
          },
        },
      );
    } catch (streamError) {
      setError(streamError instanceof Error ? streamError.message : 'error');
      setPhase(result ? 'awaiting' : 'idle');
    }
  }, [goal, subject, grade, language, result]);

  const start = (event: FormEvent) => { event.preventDefault(); if (goal.trim().length < 3) return; turnRef.current = 0; stateRef.current = null; setTrace([]); setResult(null); setExplanation(''); setNextReview(null); void runTurn(null); };
  const answerChoice = (index: number) => { if (pending) void runTurn({ itemToken: pending.token, answerIndex: index }); };
  const answerText = (event: FormEvent) => { event.preventDefault(); if (freeText.trim().length < 2) return; const text = freeText; setFreeText(''); void runTurn({ text }); };
  const masteryPct = result ? Math.round(result.mastery * 100) : 0;
  const dateFmt = new Intl.DateTimeFormat(rtl ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' });

  return (
    <main className="min-h-[80vh] bg-[var(--surface)] pb-20">
      <section className="fahim-band-hero relative overflow-hidden border-b border-[var(--band)] bg-[var(--band)] px-4 py-16 text-white sm:px-6 lg:py-20">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true" style={{ backgroundImage: 'radial-gradient(circle at 85% 12%, color-mix(in srgb, var(--nile) 22%, transparent), transparent 24rem), radial-gradient(circle at 10% 90%, color-mix(in srgb, var(--saffron) 13%, transparent), transparent 20rem)' }} />
        <div className="relative mx-auto max-w-7xl">
          <p className="flex w-fit items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-[var(--saffron)]"><Sparkles className="h-4 w-4" />{t.eyebrow}</p>
          <h1 className="atlas-display mt-8 max-w-3xl text-4xl text-white sm:text-6xl">{t.title}</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[#B9C6D4] sm:text-lg">{t.body}</p>
          <form onSubmit={start} className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block"><span className="mb-1 block text-xs font-bold text-[#B9C6D4]">{t.goalLabel}</span><input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder={t.goalPlaceholder} className="h-12 w-full rounded-xl border border-white/15 bg-white/[.06] px-3 text-sm font-semibold text-white placeholder:text-white/40" /></label>
              <label className="block"><span className="mb-1 block text-xs font-bold text-[#B9C6D4]">{t.subject}</span><input value={subject} onChange={(e) => setSubject(e.target.value)} className="h-12 w-full rounded-xl border border-white/15 bg-white/[.06] px-3 text-sm font-semibold text-white" /></label>
              <label className="block"><span className="mb-1 block text-xs font-bold text-[#B9C6D4]">{t.grade}</span><input value={grade} onChange={(e) => setGrade(e.target.value)} className="h-12 w-full rounded-xl border border-white/15 bg-white/[.06] px-3 text-sm font-semibold text-white" /></label>
            </div>
            <button disabled={goal.trim().length < 3 || phase === 'running'} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-black text-[#14213d] shadow-[3px_3px_0_var(--saffron)] transition hover:-translate-y-0.5 disabled:opacity-40">
              {phase === 'running' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}{phase === 'running' ? t.running : t.run}
            </button>
          </form>
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
          <section aria-label={t.trace} className="min-w-0">
            {trace.length === 0 && phase === 'idle' ? (
              <div className="grid min-h-[20rem] place-items-center rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--panel)] px-6 py-12 text-center">
                <div>
                  <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-[color-mix(in_srgb,var(--nile)_10%,var(--panel))] text-[var(--nile)]"><Compass className="h-8 w-8" /></span>
                  <p className="mx-auto mt-5 max-w-md text-base leading-8 text-[var(--muted)]">{t.empty}</p>
                </div>
              </div>
            ) : (
              <ol className="space-y-3">
                {trace.map((entry) => {
                  const meta = TOOL_META[entry.tool] || { ar: entry.tool, en: entry.tool, icon: Activity };
                  const Icon = meta.icon;
                  const obs = entry.observation || {};
                  return (
                    <li key={`${entry.turn}-${entry.index}-${entry.tool}`} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--shadow-sm)]">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--soft)] text-[var(--nile)]"><Icon className="h-4 w-4" strokeWidth={1.9} /></span>
                        <p className="text-sm font-black text-[var(--text)]">{meta[language]}</p>
                        <span className="ms-auto text-xs font-bold tabular-nums text-[var(--muted)]">#{entry.index}</span>
                      </div>
                      {entry.thought && <p className="mt-2 text-xs font-semibold leading-6 text-[var(--muted)]">{entry.thought}</p>}
                      {'masteryAfter' in obs && <p className="mt-2 text-sm font-bold text-[var(--text)]">{obs.correct ? '✓' : '✗'} {Math.round(Number(obs.masteryBefore) * 100)}% → {Math.round(Number(obs.masteryAfter) * 100)}%</p>}
                      {'label' in obs && !('masteryAfter' in obs) && <p className="mt-2 text-sm font-bold text-[var(--text)]">{String(obs.label)}</p>}
                      {'intervalDays' in obs && <p className="mt-2 text-sm font-bold text-[var(--text)]">{Number(obs.intervalDays)} {t.days}</p>}
                      {'recommendedDifficulty' in obs && <p className="mt-2 text-sm font-bold text-[var(--text)]">{String(obs.recommendedDifficulty)}</p>}
                    </li>
                  );
                })}
              </ol>
            )}

            {phase === 'awaiting' && result?.prompt && (
              <div className="mt-6 rounded-2xl border-s-4 border-[var(--nile)] bg-[color-mix(in_srgb,var(--nile)_7%,var(--panel))] p-5 shadow-[var(--shadow-sm)]">
                <p className="text-xs font-black text-[var(--nile)]">{t.waiting}</p>
                <p className="mt-2 whitespace-pre-wrap text-base font-bold leading-8 text-[var(--text)]">{result.prompt}</p>
                {pending && result.expects === 'choice' ? (
                  <div className="mt-4 grid gap-2.5">
                    {pending.options.map((option, index) => (
                      <button key={index} type="button" onClick={() => answerChoice(index)} className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-start text-sm font-bold text-[var(--text)] transition hover:border-[var(--nile)] hover:bg-[var(--soft)]">{option}</button>
                    ))}
                  </div>
                ) : (
                  <form onSubmit={answerText} className="mt-4 grid gap-2.5">
                    <textarea value={freeText} onChange={(e) => setFreeText(e.target.value)} rows={3} placeholder={t.explainPrompt} className="atlas-field" />
                    <button className="atlas-primary justify-center" disabled={freeText.trim().length < 2}><Send className="h-4 w-4" />{t.submit}</button>
                  </form>
                )}
              </div>
            )}

            {explanation && (
              <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow-sm)]">
                <p className="flex items-center gap-2 text-xs font-black text-[var(--nile)]"><GraduationCap className="h-4 w-4" />{TOOL_META.explain_concept[language]}</p>
                <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-8 text-[var(--text)]">{explanation}</p>
              </div>
            )}

            {phase === 'done' && result?.summary && (
              <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow-sm)]">
                <p className="flex items-center gap-2 text-xs font-black text-[var(--nile)]"><CheckCircle2 className="h-4 w-4" />{t.done}</p>
                <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-8 text-[var(--text)]">{result.summary}</p>
                <button type="button" onClick={() => { setPhase('idle'); setTrace([]); setResult(null); setExplanation(''); setNextReview(null); turnRef.current = 0; stateRef.current = null; }} className="atlas-secondary mt-4"><TimerReset className="h-4 w-4" />{t.newRun}</button>
              </div>
            )}
            {error && <p className="mt-4 rounded-xl border border-[var(--danger)] bg-[color-mix(in_srgb,var(--danger)_8%,var(--panel))] px-4 py-3 text-sm font-bold text-[var(--danger)]">{error}</p>}
          </section>{/* LEFT_PLACEHOLDER_END */}
          <aside aria-label={t.mastery} className="lg:sticky lg:top-[calc(var(--nav-height)+1.25rem)] lg:self-start">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow-sm)]">
              <p className="flex items-center gap-2 text-xs font-black text-[var(--muted)]"><Brain className="h-4 w-4 text-[var(--nile)]" />{t.mastery}</p>
              <p className="mt-3 flex items-baseline gap-2"><span className="text-4xl font-black tabular-nums text-[var(--text)]">{masteryPct}%</span><span className="text-sm font-bold text-[var(--nile)]">{result ? bktMasteryLabel(result.mastery, rtl) : '—'}</span></p>
              <span className="mt-3 block h-2 overflow-hidden rounded-full bg-[var(--soft)]"><span className="block h-full rounded-full bg-[var(--nile)] transition-all" style={{ width: `${masteryPct}%` }} /></span>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[var(--soft)] p-3"><p className="text-xs font-bold text-[var(--muted)]">{t.ability}</p><p className="mt-1 text-lg font-black tabular-nums text-[var(--text)]">{result ? (Math.round(result.ability * 100) / 100).toFixed(2) : '—'}</p></div>
                <div className="rounded-xl bg-[var(--soft)] p-3"><p className="text-xs font-bold text-[var(--muted)]">{t.attempts}</p><p className="mt-1 text-lg font-black tabular-nums text-[var(--text)]">{result?.attempts ?? 0}</p></div>
              </div>
              {nextReview && (
                <div className="mt-4 flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2.5">
                  <span className="flex items-center gap-2 text-xs font-bold text-[var(--muted)]"><TimerReset className="h-4 w-4 text-[var(--saffron)]" />{t.schedule}</span>
                  <span className="text-sm font-black tabular-nums text-[var(--text)]">{dateFmt.format(new Date(nextReview.nextReviewAt))} · {nextReview.intervalDays}{rtl ? 'ي' : 'd'}</span>
                </div>
              )}
            </div>
            {result?.state?.sources && result.state.sources.length > 0 && (
              <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow-sm)]">
                <p className="flex items-center gap-2 text-xs font-black text-[var(--muted)]"><FileSearch className="h-4 w-4 text-[var(--nile)]" />{t.sources}</p>
                <ul className="mt-3 space-y-2">
                  {result.state.sources.map((source) => (
                    <li key={source.citationId}><a href={source.url} target="_blank" rel="noreferrer" className="flex items-start gap-2 text-sm font-bold text-[var(--text)] hover:text-[var(--nile)]"><span className="rounded bg-[var(--soft)] px-1.5 text-xs font-black text-[var(--nile)]">{source.citationId}</span><span className="line-clamp-2 leading-6">{source.title}</span></a></li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mt-4 rounded-xl bg-[var(--soft)] px-4 py-3 text-xs font-semibold leading-6 text-[var(--muted)]">{t.memory}</p>
            <p className="mt-2 px-1 text-xs font-semibold leading-6 text-[var(--muted)]">{t.honest}</p>
          </aside>{/* ASIDE_PLACEHOLDER_END */}
        </div>
      </div>
    </main>
  );
}

