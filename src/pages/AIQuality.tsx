import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, FlaskConical, Info, Loader2, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

type Report = { version: string; generatedAt: string; total: number; passed: number; providerCalls: number; humanParticipants: number; results: { id: string; language: string; subject: string; passed: boolean }[] };
type LiveReport = { generatedAt: string; availability?: string; total: number; passed: number; calls: number; humanParticipants: number; estimatedCostMicrousd: number | null; regressions: string[]; cases: { id: string; passed: boolean; latencyMs: number; error?: string }[] };

export default function AIQuality({ language }: { language: 'ar' | 'en' }) {
  const ar = language === 'ar';
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState(false);
  const [live, setLive] = useState<LiveReport | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void fetch('/quality/benchmark.json', { signal: controller.signal }).then((response) => { if (!response.ok) throw new Error('report_unavailable'); return response.json(); }).then(setReport).catch(() => { if (!controller.signal.aborted) setError(true); });
    void fetch('/quality/live-benchmark.json', { signal: controller.signal }).then(response => response.ok ? response.json() : null).then(setLive).catch(() => undefined);
    return () => controller.abort();
  }, []);
  return <main className="bg-[var(--surface)] px-4 py-12 sm:px-6"><div className="mx-auto max-w-6xl">
    <p className="atlas-kicker"><FlaskConical className="h-4 w-4" />{ar ? 'الجودة بالأدلة' : 'Quality, with evidence'}</p>
    <h1 className="atlas-display mt-5 text-3xl sm:text-5xl">{ar ? 'إيه اللي اختبرناه فعلًا؟' : 'What have we actually tested?'}</h1>
    <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted)]">{ar ? 'بنختبر قواعد الجودة آليًا، وبنفصل نتائج الاختبار عن دقة النموذج والأثر على التعلّم. نجاح القواعد مش شهادة بصحة كل إجابة.' : 'We test quality rules automatically and separate test results from model accuracy and learning impact. Passing the rules does not certify every answer.'}</p>
    <section className="mt-7 rounded-2xl border border-[var(--warning-border)] bg-[var(--warning-surface)] p-5 text-[var(--warning-text)]"><Info className="h-5 w-5" /><p className="mt-2 text-sm leading-7">{ar ? 'الاختبار الحالي: 6 مجالات × لغتين × 10 حالات للبنية والاستشهاد. المصادر صناعية؛ لم يُستدعَ نموذج حي، ولم يشارك طلاب. دقة العلم، صحة دعم الادعاء، وتحسّن التعلّم لسه غير مقاسة هنا.' : 'Current test: 6 subjects × 2 languages × 10 structural and citation variants. Sources are synthetic; no live model calls or learner participants. Scientific accuracy, semantic claim support, and learning gains remain unmeasured here.'}</p></section>
    {error ? <p role="alert" className="mt-6">{ar ? 'مش قادرين نفتح تقرير الجودة دلوقتي.' : 'The quality report is unavailable.'}</p> : !report ? <Loader2 className="mt-8 h-6 w-6 animate-spin" aria-label={ar ? 'تحميل التقرير' : 'Loading report'} /> : <>
      <div className="mt-7 grid gap-4 sm:grid-cols-3">{[
        [CheckCircle2, ar ? 'قواعد نجحت' : 'Contract checks passed', `${report.passed}/${report.total}`],
        [Activity, ar ? 'استدعاءات نموذج حي' : 'Live model calls', String(report.providerCalls)],
        [ShieldCheck, ar ? 'مشاركون حقيقيون' : 'Real participants', String(report.humanParticipants)],
      ].map(([Icon, label, value]) => <div key={String(label)} className="premium-card p-5"><Icon className="h-5 w-5 text-[var(--nile)]" /><p className="mt-4 text-3xl font-black tabular-nums">{String(value)}</p><p className="mt-2 text-sm text-[var(--muted)]">{String(label)}</p></div>)}</div>
      <p className="mt-4 text-xs text-[var(--muted)]"><bdi>{report.version}</bdi> · {new Intl.DateTimeFormat(ar ? 'ar-EG' : 'en-GB', { dateStyle: 'medium' }).format(new Date(report.generatedAt))}</p>
      <details className="premium-card mt-7 p-5"><summary className="cursor-pointer text-base font-bold">{ar ? 'افتح نتائج الحالات' : 'Inspect case results'}</summary><ul className="mt-4 grid gap-2 sm:grid-cols-2">{report.results.map((entry) => <li key={entry.id} className="flex min-w-0 items-center gap-2 rounded-lg bg-[var(--soft)] p-3 text-xs"><CheckCircle2 className={`h-4 w-4 shrink-0 ${entry.passed ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`} /><bdi className="break-all">{entry.id}</bdi></li>)}</ul></details>
    </>}
    {live && <section className="premium-card mt-7 p-5 sm:p-7"><h2 className="text-xl font-bold">{ar ? 'اختبار ردود فعلية — بمراجعة آلية' : 'Live responses — model-reviewed'}</h2><p className="mt-3 text-sm leading-7 text-[var(--muted)]">{live.calls === 0 ? (ar ? 'مزود التقييم غير متاح. الدقة غير مقاسة، مش صفر.' : 'Evaluation provider unavailable. Accuracy is unmeasured, not zero.') : (ar ? `${live.passed} من ${live.total} حالات نجحت، عبر ${live.calls} طلبات توليد وتحكيم. الأسئلة مصطنعة، والحَكَم نموذج AI قابل للخطأ وممكن يشترك في المزود نفسه. النتيجة مش أثر تعليمي ولا ضمان لصحة كل إجابة.` : `${live.passed} of ${live.total} cases passed across ${live.calls} generation and review calls. Prompts are synthetic; the judge is a fallible AI model and may share the provider. This is not a learning-impact measurement or a guarantee of every answer.`)}</p><p className="mt-3 text-xs text-[var(--muted)]">{ar ? 'تكلفة التشغيل:' : 'Run cost:'} {live.estimatedCostMicrousd == null ? (ar ? 'غير مقاسة عبر الواجهة العامة' : 'Not exposed by the public API') : `$${(live.estimatedCostMicrousd / 1_000_000).toFixed(4)}`} · {ar ? 'مشاركون حقيقيون:' : 'Human participants:'} {live.humanParticipants}</p><details className="mt-4"><summary className="cursor-pointer text-sm font-bold">{ar ? 'الحالات والوقت لكل حالة' : 'Cases and elapsed time'}</summary><ul className="mt-3 space-y-2">{live.cases.map(entry => <li key={entry.id} className="text-xs leading-6"><bdi>{entry.id}</bdi> · {entry.latencyMs} ms · {entry.error ? (ar ? 'تعذّر التنفيذ' : 'Could not run') : entry.passed ? (ar ? 'نجح' : 'Passed') : (ar ? 'محتاج مراجعة' : 'Needs review')}</li>)}</ul></details><a href="/quality/live-benchmark.json" download className="atlas-secondary mt-4 min-h-11">{ar ? 'نزّل تقرير الردود الفعلية' : 'Download live-response report'}</a></section>}
    <div className="mt-7 flex flex-wrap gap-3"><a href="/quality/benchmark.json" className="atlas-secondary min-h-11" download>{ar ? 'نزّل التقرير JSON' : 'Download JSON report'}</a><Link to="/agent" className="atlas-primary min-h-11">{ar ? 'جرّب جلسة فَهيم' : 'Try a Fahim session'}</Link><Link to="/evidence" className="atlas-secondary min-h-11">{ar ? 'شوف باقي أدلة المشروع' : 'Explore project evidence'}</Link></div>
  </div></main>;
}
