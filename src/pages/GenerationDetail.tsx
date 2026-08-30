import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Bot, Clock3, Database, ExternalLink, Loader2, ShieldCheck } from 'lucide-react';
import RichMessage from '@/components/RichMessage';
import { supabase } from '@/lib/supabase/client';
import type { TutorSource } from '@/lib/aiTutor';

type GenerationRecord = {
  id: string;
  status: 'pending' | 'streaming' | 'complete' | 'error';
  result_text: string | null;
  sources: TutorSource[] | null;
  input_tokens: number | null;
  output_tokens: number | null;
  estimated_cost_microusd: number | null;
  cache_hit: boolean;
  error_code: string | null;
  created_at: string;
  completed_at: string | null;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function GenerationDetail({ language }: { language: 'ar' | 'en' }) {
  const { generationId = '' } = useParams();
  const [record, setRecord] = useState<GenerationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const rtl = language === 'ar';

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!supabase || !uuidPattern.test(generationId)) {
        if (mounted) {
          setError(rtl ? 'معرّف الإجابة غير صالح أو خدمة السجل غير مهيأة.' : 'The generation ID is invalid or the registry is not configured.');
          setLoading(false);
        }
        return;
      }
      const { data, error: requestError } = await supabase
        .from('ai_generations')
        .select('id,status,result_text,sources,input_tokens,output_tokens,estimated_cost_microusd,cache_hit,error_code,created_at,completed_at')
        .eq('id', generationId)
        .maybeSingle();
      if (!mounted) return;
      if (requestError) setError(rtl ? 'تعذر تحميل سجل الإجابة. قد لا تملك صلاحية الوصول إليه.' : 'The generation record could not be loaded. You may not have access to it.');
      else if (!data) setError(rtl ? 'لم نجد هذه الإجابة في سجلك.' : 'This generation was not found in your history.');
      else setRecord(data as GenerationRecord);
      setLoading(false);
    };
    void load();
    return () => { mounted = false; };
  }, [generationId, rtl]);

  const cost = useMemo(() => {
    if (!record?.estimated_cost_microusd) return '$0.000000';
    return `$${(record.estimated_cost_microusd / 1_000_000).toFixed(6)}`;
  }, [record?.estimated_cost_microusd]);

  if (loading) return <main className="grid min-h-[70vh] place-items-center" aria-busy="true"><Loader2 className="h-7 w-7 animate-spin text-[var(--nile)]" /></main>;

  return <main className="min-h-[75vh] bg-[var(--surface)] px-4 py-12 sm:px-6"><div className="mx-auto max-w-4xl">
    <Link to="/ask-fahim" className="inline-flex items-center gap-2 text-xs font-black text-[var(--nile)]"><ArrowLeft className="h-4 w-4 rtl:rotate-180" />{rtl ? 'العودة إلى فَهيم' : 'Back to Fahim'}</Link>
    {error ? <section className="mt-7 border border-amber-400 bg-amber-50 p-7 text-amber-950 dark:bg-amber-950/20 dark:text-amber-100"><AlertTriangle className="h-7 w-7" /><h1 className="mt-4 text-2xl font-black">{rtl ? 'السجل غير متاح' : 'Record unavailable'}</h1><p className="mt-3 text-sm leading-7">{error}</p></section> : record && <>
      <header className="mt-7 border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[6px_6px_0_var(--saffron)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="atlas-kicker w-fit"><ShieldCheck className="h-4 w-4" />{rtl ? 'سجل AI خاص وموثّق' : 'Private AI generation record'}</p><h1 className="mt-4 text-3xl font-black">{rtl ? 'أثر الإجابة' : 'Generation trace'}</h1><p className="mt-2 break-all font-mono text-[10px] text-[var(--muted)]">{record.id}</p></div><StatusBadge status={record.status} language={language} /></div>
        <dl className="mt-7 grid gap-px bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-4">
          <Metric icon={<Bot />} label={rtl ? 'المحرك' : 'Engine'} value={rtl ? 'محرك فَهيم للتعلّم' : 'Fahim Learning Engine'} />
          <Metric icon={<Database />} label={rtl ? 'الاستهلاك' : 'Tokens'} value={`${record.input_tokens || 0} + ${record.output_tokens || 0}`} />
          <Metric icon={<Clock3 />} label={rtl ? 'وقت الإنشاء' : 'Created'} value={new Intl.DateTimeFormat(rtl ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(record.created_at))} />
          <Metric icon={<ShieldCheck />} label={rtl ? 'التكلفة التقديرية' : 'Estimated cost'} value={cost} />
        </dl>
        <p className="mt-4 text-[10px] leading-5 text-[var(--muted)]">{record.cache_hit ? (rtl ? 'تمت استعادة هذه الإجابة من ذاكرة مؤقتة خاصة بحسابك؛ لم تُحتسب رموز جديدة.' : 'This answer was served from your private cache; no new tokens were charged.') : (rtl ? 'القيمة تقديرية للمراقبة التشغيلية وليست فاتورة للمستخدم.' : 'Cost is an operational estimate, not a user invoice.')}</p>
      </header>
      <section className="mt-7 border border-[var(--border)] bg-[var(--panel)] p-6 sm:p-8"><h2 className="mb-5 text-sm font-black">{rtl ? 'الإجابة المحفوظة' : 'Persisted answer'}</h2>{record.result_text ? <RichMessage text={record.result_text} /> : <p className="text-sm leading-7 text-[var(--muted)]">{record.status === 'error' ? `${rtl ? 'فشل التوليد برمز' : 'Generation failed with code'}: ${record.error_code || 'provider_error'}` : (rtl ? 'الإجابة لم تكتمل بعد.' : 'The answer has not completed yet.')}</p>}</section>
      {Boolean(record.sources?.length) && <section className="mt-7"><h2 className="text-sm font-black">{rtl ? 'المصادر المرتبطة' : 'Linked sources'}</h2><div className="mt-3 grid gap-3 sm:grid-cols-2">{record.sources?.map((source, index) => <a key={`${source.url}-${index}`} href={source.url} target="_blank" rel="noreferrer" className="border border-[var(--border)] bg-[var(--panel)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--nile)]"><span className="flex items-center justify-between gap-3 text-[10px] font-black text-[var(--nile)]"><span>[{source.citationId || index + 1}]</span><ExternalLink className="h-3.5 w-3.5" /></span><strong className="mt-2 block text-xs">{source.title}</strong><span className="mt-1 line-clamp-2 text-[10px] leading-5 text-[var(--muted)]">{source.description}</span></a>)}</div></section>}
    </>}
  </div></main>;
}

function StatusBadge({ status, language }: { status: GenerationRecord['status']; language: 'ar' | 'en' }) {
  const labels = language === 'ar' ? { pending: 'قيد الانتظار', streaming: 'جارٍ التوليد', complete: 'مكتملة', error: 'فشلت' } : { pending: 'Pending', streaming: 'Streaming', complete: 'Complete', error: 'Failed' };
  const tone = status === 'complete' ? 'bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-200' : status === 'error' ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200';
  return <span className={`px-3 py-2 text-[10px] font-black ${tone}`}>{labels[status]}</span>;
}

function Metric({ icon, label, value }: { icon: React.ReactElement; label: string; value: string }) {
  return <div className="bg-[var(--panel)] p-4"><span className="flex items-center gap-2 text-[9px] font-black text-[var(--muted)] [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}{label}</span><strong className="mt-2 block truncate text-xs" title={value}>{value}</strong></div>;
}
