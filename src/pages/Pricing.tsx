import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Check, Clock3, Copy, FileCheck2, Loader2, ReceiptText, ShieldCheck, UploadCloud, WalletCards } from 'lucide-react';
import { publicPlans, type PlanCode } from '@/config/plans';
import { useAuth } from '@/contexts/AuthContext';
import { useProductAccess } from '@/contexts/ProductAccessContext';
import { listMyPaymentProofs, listPaymentMethods, resubmitPaymentProof, submitPaymentProof, type PaymentMethod, type PaymentProof, type PaymentStatus } from '@/lib/manualCommerce';

type Language = 'ar' | 'en';
const paid = (code: PlanCode): code is Exclude<PlanCode, 'free'> => code !== 'free';

const statusCopy: Record<PaymentStatus, { ar: string; en: string; tone: string }> = {
  pending: { ar: 'بانتظار المراجعة', en: 'Waiting for review', tone: 'bg-amber-100 text-amber-900' },
  under_review: { ar: 'قيد المراجعة الآن', en: 'Under review', tone: 'bg-blue-100 text-blue-900' },
  approved: { ar: 'تم التفعيل', en: 'Activated', tone: 'bg-emerald-100 text-emerald-900' },
  rejected: { ar: 'مرفوض — يمكن إعادة الإرسال', en: 'Rejected — resubmission available', tone: 'bg-rose-100 text-rose-900' },
  resubmission_required: { ar: 'مطلوب إثبات أوضح', en: 'Clearer proof requested', tone: 'bg-orange-100 text-orange-900' },
  canceled: { ar: 'ملغي', en: 'Canceled', tone: 'bg-slate-200 text-slate-800' },
};

export default function Pricing({ language }: { language: Language }) {
  const rtl = language === 'ar';
  const { user } = useAuth();
  const access = useProductAccess();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [selected, setSelected] = useState<Exclude<PlanCode, 'free'> | null>(null);
  const [resubmitting, setResubmitting] = useState<PaymentProof | null>(null);
  const [fullName, setFullName] = useState(String(user?.user_metadata?.full_name || ''));
  const [phone, setPhone] = useState('');
  const [reference, setReference] = useState('');
  const [methodId, setMethodId] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(Boolean(user));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [nextMethods, nextProofs] = await Promise.all([listPaymentMethods(), listMyPaymentProofs(user.id)]);
      setMethods(nextMethods); setProofs(nextProofs); setMethodId((value) => value || nextMethods[0]?.id || '');
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Could not load payment operations.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const chosenPlan = useMemo(() => publicPlans.find((plan) => plan.code === (resubmitting?.plan_code || selected)), [resubmitting, selected]);
  const chosenMethod = methods.find((method) => method.id === methodId);
  const resetForm = () => { setSelected(null); setResubmitting(null); setReference(''); setNote(''); setFile(null); setSuccess(''); };

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setSuccess('');
    if (!user || !file || !methodId || (!selected && !resubmitting)) return;
    const cleanPhone = phone.replace(/\s/g, '');
    if (fullName.trim().length < 2 || !/^01[0125][0-9]{8}$/.test(cleanPhone) || reference.trim().length < 3) {
      setError(rtl ? 'راجع الاسم ورقم الموبايل المصري والرقم المرجعي للتحويل.' : 'Check the name, Egyptian mobile number, and transfer reference.'); return;
    }
    setSubmitting(true);
    try {
      if (resubmitting) await resubmitPaymentProof({ proof: resubmitting, userId: user.id, reference, note, file });
      else await submitPaymentProof({ userId: user.id, planCode: selected!, methodId, payerName: fullName, payerPhone: cleanPhone, reference, note, file });
      setSuccess(rtl ? 'وصل الإثبات بأمان. ستظهر نتيجة المراجعة هنا وداخل إشعارات حسابك.' : 'Proof received securely. The decision will appear here and in your notifications.');
      setSelected(null); setResubmitting(null); setReference(''); setNote(''); setFile(null); await load();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Submission failed.';
      setError(message === 'proof_size' ? (rtl ? 'الملف أكبر من 8 ميجابايت.' : 'The file exceeds 8 MB.') : message === 'proof_type' ? (rtl ? 'ارفع JPG أو PNG أو WebP أو PDF فقط.' : 'Upload JPG, PNG, WebP, or PDF only.') : message);
    } finally { setSubmitting(false); }
  };

  return <main className="bg-[var(--surface)]">
    <section className="atlas-hero relative overflow-hidden border-b border-[var(--ink)] px-4 py-16 sm:px-6 lg:py-24">
      <div className="atlas-grid absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-6xl text-center"><p className="atlas-kicker mx-auto w-fit"><WalletCards className="h-4 w-4" />{rtl ? 'تسعير مصري بلا مفاجآت' : 'Egypt-first, surprise-free pricing'}</p><h1 className="atlas-display mx-auto mt-6 max-w-4xl text-5xl sm:text-7xl">{rtl ? 'اتعلم شهرًا كاملًا قبل أن تدفع جنيهًا واحدًا.' : 'Learn for a full month before paying a pound.'}</h1><p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[var(--muted)]">{rtl ? '30 يومًا مجانية دون بطاقة أو خصم تلقائي. بعدها حوّل بالطريقة المعلنة وارفع الإثبات؛ فريق فَهيم يراجعه بسجل واضح ويُفعّل حسابك.' : '30 free days, no card and no automatic charge. Then transfer using a published method, upload proof, and Fahim reviews it through an auditable process.'}</p><div className="mt-7 flex flex-wrap justify-center gap-3 text-xs font-black text-[#14213D]"><span className="atlas-chip bg-[#F2B84B]"><Clock3 className="h-4 w-4" />{rtl ? '30 يومًا مجانًا' : '30 days free'}</span><span className="atlas-chip bg-[#DCEDE9]"><ShieldCheck className="h-4 w-4" />{rtl ? 'لا خصم تلقائي' : 'No auto-charge'}</span><span className="atlas-chip bg-[#F7DDD4]"><BadgeCheck className="h-4 w-4" />{rtl ? 'مراجعة بشرية موثقة' : 'Audited human review'}</span></div></div>
    </section>

    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="grid gap-5 lg:grid-cols-3">{publicPlans.map((plan) => {
        const featured = plan.code === 'plus_annual';
        const current = access.planCode === plan.code || (plan.code === 'free' && access.status === 'free');
        return <article key={plan.code} className={`atlas-plan relative flex flex-col p-6 sm:p-8 ${featured ? 'atlas-plan-featured' : ''}`}>
          {featured && <span className="absolute end-5 top-0 -translate-y-1/2 bg-[#F2B84B] px-3 py-1 text-[10px] font-black text-[#14213D]">{rtl ? 'أفضل قيمة' : 'BEST VALUE'}</span>}
          <p className="atlas-section-number">{plan.launchPrice ? (rtl ? 'سعر الإطلاق' : 'LAUNCH PRICE') : (rtl ? 'ابدأ بلا تكلفة' : 'START FREE')}</p><h2 className="mt-4 text-2xl font-black">{plan.name[language]}</h2><div className="mt-6 flex items-end gap-2"><strong className="text-5xl font-black">{plan.priceEgp}</strong><span className="pb-1 text-sm font-bold opacity-70">{rtl ? 'جنيه' : 'EGP'}{plan.billingPeriod !== 'none' ? ` / ${plan.billingPeriod === 'month' ? (rtl ? 'شهر' : 'month') : (rtl ? 'سنة' : 'year')}` : ''}</span></div>
          <ul className="mt-7 flex-1 space-y-3">{plan.features.map((feature) => <li key={feature.en} className="flex items-start gap-3 text-sm leading-7 opacity-80"><span className="mt-1 grid h-5 w-5 shrink-0 place-items-center bg-[#DCEDE9] text-[#0F766E]"><Check className="h-3 w-3" /></span>{feature[language]}</li>)}</ul>
          {current ? <span className="mt-8 flex min-h-12 items-center justify-center border border-current/20 text-sm font-black">{rtl ? 'خطتك الحالية' : 'Current plan'}</span> : !user ? <Link to="/register" state={{ from: '/pricing' }} className="atlas-primary mt-8 justify-center">{rtl ? 'ابدأ التجربة المجانية' : 'Start free trial'}</Link> : !access.onboardingComplete ? <Link to="/onboarding" className="atlas-primary mt-8 justify-center">{rtl ? 'أكمل الإعداد وابدأ' : 'Complete setup and start'}</Link> : paid(plan.code) ? <button type="button" onClick={() => { setSelected(plan.code as Exclude<PlanCode, 'free'>); setResubmitting(null); }} className="atlas-primary mt-8 justify-center"><ReceiptText className="h-4 w-4" />{rtl ? 'ارفع إثبات الدفع' : 'Upload payment proof'}</button> : null}
        </article>;
      })}</div>

      {user && <section className="mt-14"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="atlas-section-number">PAYMENT LEDGER</p><h2 className="mt-2 text-3xl font-black">{rtl ? 'طلبات اشتراكك' : 'Your subscription requests'}</h2></div><Link to="/support" className="atlas-secondary">{rtl ? 'تحتاج مساعدة؟' : 'Need help?'}</Link></div>
        {loading ? <div className="mt-5 grid h-32 place-items-center border border-[var(--border)]"><Loader2 className="h-6 w-6 animate-spin" /></div> : proofs.length === 0 ? <div className="atlas-empty mt-5"><FileCheck2 className="h-7 w-7" /><strong>{rtl ? 'لا توجد طلبات بعد' : 'No requests yet'}</strong><span>{rtl ? 'اختر خطة مدفوعة، حوّل القيمة، ثم أرسل الإثبات من النموذج الآمن.' : 'Choose a paid plan, make the transfer, then submit proof through the secure form.'}</span></div> : <div className="mt-5 grid gap-3">{proofs.map((proof) => <article key={proof.id} className="atlas-ledger-row"><div><span className={`inline-flex px-2.5 py-1 text-[10px] font-black ${statusCopy[proof.status].tone}`}>{statusCopy[proof.status][language]}</span><h3 className="mt-3 font-black">{publicPlans.find((plan) => plan.code === proof.plan_code)?.name[language]} · {proof.amount_egp} {rtl ? 'جنيه' : 'EGP'}</h3><p className="mt-1 text-xs text-[var(--muted)]">{rtl ? 'مرجع' : 'Reference'}: <bdi>{proof.transfer_reference}</bdi> · {new Intl.DateTimeFormat(rtl ? 'ar-EG' : 'en-GB', { dateStyle: 'medium' }).format(new Date(proof.created_at))}</p>{proof.review_note && <p className="mt-3 border-s-2 border-[var(--vermilion)] ps-3 text-sm leading-7">{proof.review_note}</p>}</div>{['rejected', 'resubmission_required'].includes(proof.status) && <button type="button" className="atlas-secondary shrink-0" onClick={() => { setResubmitting(proof); setSelected(null); setMethodId(proof.payment_method_id); setReference(proof.transfer_reference); setNote(proof.user_note); }}>{rtl ? 'إعادة الإرسال' : 'Resubmit'}</button>}</article>)}</div>}
      </section>}

      {(selected || resubmitting) && <form onSubmit={submit} className="atlas-checkout mx-auto mt-12 max-w-4xl">
        <div className="flex items-start justify-between gap-5"><div><p className="atlas-section-number">VERIFIED TRANSFER</p><h2 className="mt-2 text-2xl font-black">{resubmitting ? (rtl ? 'إرسال إثبات جديد' : 'Submit clearer proof') : `${rtl ? 'تفعيل' : 'Activate'} ${chosenPlan?.name[language]}`}</h2><p className="mt-2 text-sm leading-7 text-[var(--muted)]">{rtl ? 'لا تُفعّل الخطة من الصورة وحدها. يطابق الأدمن المرجع والقيمة ثم يسجل القرار.' : 'An image alone never activates access. An admin verifies the reference and amount, then records the decision.'}</p></div><button type="button" onClick={resetForm} className="text-xs font-black text-[var(--muted)]">{rtl ? 'إغلاق' : 'Close'}</button></div>
        {methods.length === 0 ? <div role="status" className="atlas-notice mt-6 border-amber-400 bg-amber-50 text-amber-950"><strong>{rtl ? 'وسائل التحويل غير منشورة بعد.' : 'Transfer methods are not published yet.'}</strong><p className="mt-1 font-normal">{rtl ? 'لن نعرض رقمًا تجريبيًا أو غير موثق. تواصل مع الدعم، أو انتظر حتى يضيف الأدمن وسيلة دفع نشطة.' : 'We will never show a demo or unverified account. Contact support or wait for an admin to publish an active method.'}</p></div> : <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2"><label><span className="atlas-label mb-2">{rtl ? 'وسيلة التحويل' : 'Transfer method'}</span><select className="atlas-field min-h-12" value={methodId} onChange={(event) => setMethodId(event.target.value)}>{methods.map((method) => <option key={method.id} value={method.id}>{method[`label_${language}`]}</option>)}</select></label><div className="border border-[var(--border)] bg-[var(--paper)] p-4"><span className="atlas-label">{rtl ? 'حوّل إلى' : 'Transfer to'}</span><strong className="mt-2 flex items-center justify-between gap-2 text-lg"><bdi>{chosenMethod?.account_reference}</bdi><button type="button" aria-label={rtl ? 'نسخ الرقم' : 'Copy reference'} onClick={() => void navigator.clipboard.writeText(chosenMethod?.account_reference || '')}><Copy className="h-4 w-4" /></button></strong><p className="mt-1 text-xs text-[var(--muted)]">{chosenMethod?.account_holder}</p></div></div>
          {chosenMethod && <p className="mt-3 text-xs leading-7 text-[var(--muted)]">{chosenMethod[`instructions_${language}`]}</p>}
          <div className="mt-5 grid gap-4 sm:grid-cols-2"><label><span className="atlas-label mb-2">{rtl ? 'اسم صاحب التحويل' : 'Payer name'}</span><input className="atlas-field min-h-12" autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} required /></label><label><span className="atlas-label mb-2">{rtl ? 'رقم الموبايل' : 'Mobile number'}</span><input className="atlas-field min-h-12" dir="ltr" inputMode="tel" placeholder="01xxxxxxxxx" value={phone} onChange={(event) => setPhone(event.target.value)} required /></label><label><span className="atlas-label mb-2">{rtl ? 'الرقم المرجعي للعملية' : 'Transfer reference'}</span><input className="atlas-field min-h-12" dir="ltr" value={reference} onChange={(event) => setReference(event.target.value)} required minLength={3} maxLength={120} /></label><label className="atlas-upload"><UploadCloud className="h-6 w-6" /><span><b className="block text-sm">{file?.name || (rtl ? 'صورة أو PDF للإثبات' : 'Proof image or PDF')}</b><small className="text-[var(--muted)]">JPG, PNG, WebP, PDF · 8MB</small></span><input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} required /></label></div>
          <label className="mt-4 block"><span className="atlas-label mb-2">{rtl ? 'ملاحظة للمراجع (اختياري)' : 'Note for the reviewer (optional)'}</span><textarea className="atlas-field min-h-24" value={note} onChange={(event) => setNote(event.target.value)} maxLength={1200} /></label>
          {error && <div role="alert" className="mt-4 border border-rose-300 bg-rose-50 p-3 text-sm font-bold text-rose-800">{error}</div>}
          <button disabled={submitting || !file} className="atlas-primary mt-6 w-full justify-center disabled:opacity-50">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}{rtl ? 'إرسال للمراجعة الآمنة' : 'Send for secure review'}</button>
        </>}
      </form>}
      {success && <div role="status" className="mx-auto mt-6 max-w-4xl border border-emerald-400 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">{success}</div>}
    </section>
  </main>;
}
