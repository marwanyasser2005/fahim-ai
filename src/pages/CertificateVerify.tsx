import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, BadgeCheck, ExternalLink, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import CertificateArtwork, { type PublicCredential } from '@/components/certificates/CertificateArtwork';

export default function CertificateVerify({ language }: { language: 'ar' | 'en' }) {
  const { certificateId = '' } = useParams();
  const [credential, setCredential] = useState<PublicCredential | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const rtl = language === 'ar';

  useEffect(() => {
    let active = true;
    const verify = async () => {
      if (!supabase || !/^(?:[0-9a-f-]{36}|FAH-\d{4}-[A-F0-9]{8,20})$/i.test(certificateId)) {
        if (active) { setError(rtl ? 'رابط التحقق غير صالح أو خدمة التحقق غير مهيأة.' : 'The verification link is invalid or verification is not configured.'); setLoading(false); }
        return;
      }
      const { data, error: requestError } = await supabase.rpc('verify_certificate_v3', { certificate_identifier: certificateId });
      if (!active) return;
      if (requestError) setError(rtl ? 'تعذر الاتصال بسجل الشهادات.' : 'Could not reach the credential registry.');
      else if (!data) setError(rtl ? 'لم نجد شهادة صادرة بهذا المعرّف.' : 'No issued credential was found for this identifier.');
      else setCredential(data as PublicCredential);
      setLoading(false);
    };
    void verify();
    return () => { active = false; };
  }, [certificateId, rtl]);

  return <main className="min-h-[75vh] bg-[var(--surface)] px-4 py-16 sm:px-6"><div className="mx-auto max-w-7xl">
    <p className="atlas-kicker w-fit"><BadgeCheck className="h-4 w-4" />{rtl ? 'سجل التحقق العام' : 'Public verification registry'}</p>
    {loading ? <div className="mt-8 grid min-h-72 place-items-center rounded-[2rem] border border-[var(--border)] bg-[var(--panel)]" aria-busy="true"><Loader2 className="h-7 w-7 animate-spin text-[var(--nile)]" /></div> : error ? <section className="mt-8 rounded-[2rem] border border-[var(--warning-border)] bg-[var(--warning-surface)] p-8 text-[var(--warning-text)]"><AlertTriangle className="h-8 w-8" /><h1 className="mt-5 text-2xl font-black">{rtl ? 'تعذر التحقق' : 'Verification unavailable'}</h1><p className="mt-3 text-sm leading-7">{error}</p></section> : credential && <div className="mt-8">
      {/* The signature is recomputed from the stored record on every verification, so a
          tampered or unsigned row is reported here instead of being echoed as valid. */}
      <div className={`mb-3 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black ${credential.status === 'issued' ? 'border-[color-mix(in_srgb,var(--evidence)_35%,var(--border))] bg-[color-mix(in_srgb,var(--evidence)_10%,var(--panel))] text-[var(--evidence)]' : 'border-[var(--danger-border)] bg-[var(--danger-surface)] text-[var(--danger-text)]'}`}><BadgeCheck className="h-5 w-5" />{credential.status === 'revoked' ? (rtl ? 'تم إلغاء هذه الشهادة.' : 'This credential was revoked.') : credential.signature_valid ? (rtl ? 'الشهادة صادرة وتوقيعها مطابق لسجل فَهيم.' : 'Issued credential with a matching registry signature.') : (rtl ? 'السجل موجود، لكن صحة الشهادة غير مؤكدة لحد ما نتحقق من التوقيع.' : 'Record found, but authenticity is unconfirmed until the signature is verified.')}</div>
      <div className={`mb-5 flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs font-black ${credential.signature_valid ? 'border-[var(--border)] bg-[var(--panel)] text-[var(--muted)]' : 'border-[var(--danger-border)] bg-[var(--danger-surface)] text-[var(--danger-text)]'}`}>
        {credential.signature_valid ? <ShieldCheck className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
        {credential.signature_valid
          ? (rtl ? 'التوقيع الرقمي مطابق (HMAC-SHA256).' : 'Digital signature matches (HMAC-SHA256).')
          : (rtl ? 'تعذر التحقق من التوقيع الرقمي لهذا السجل.' : 'The digital signature of this record could not be verified.')}
      </div>
      <section className="mb-6 grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 sm:grid-cols-3" aria-label={rtl ? 'متطلبات الإصدار' : 'Issuance evidence'}>
        <div><p className="text-xs text-[var(--muted)]">{rtl ? 'الدروس المكتملة' : 'Completed lessons'}</p><p className="mt-2 text-lg font-bold"><bdi>{credential.evidence?.completedLessons ?? '—'} / {credential.evidence?.totalLessons ?? '—'}</bdi></p></div>
        <div><p className="text-xs text-[var(--muted)]">{rtl ? 'نتيجة التقييم المسجّل' : 'Recorded assessment score'}</p><p className="mt-2 text-lg font-bold">{credential.evidence?.finalAssessmentScore != null ? `${credential.evidence.finalAssessmentScore}%` : '—'}</p></div>
        <div><p className="text-xs text-[var(--muted)]">{rtl ? 'تاريخ الإصدار' : 'Issued on'}</p><p className="mt-2 text-lg font-bold">{new Intl.DateTimeFormat(rtl ? 'ar-EG' : 'en-GB', { dateStyle: 'medium' }).format(new Date(credential.issued_at))}</p></div>
        <p className="text-sm leading-7 text-[var(--muted)] sm:col-span-3">{rtl ? 'دي شهادة إتمام من فَهيم، مش اعتماد حكومي أو حكم نهائي على قدرتك. صحة التوقيع تثبت تطابق السجل، مش جودة المحتوى التعليمي.' : 'This is a Fahim completion credential, not government accreditation or a final judgment of ability. A valid signature proves record integrity, not educational content quality.'}</p>
      </section>
      <CertificateArtwork credential={credential} language={language} />
    </div>}
    <Link to="/" className="mt-8 inline-flex items-center gap-2 text-xs font-black text-[var(--nile)]">{rtl ? 'تعرف على فَهيم' : 'Learn about Fahim'}<ExternalLink className="h-3.5 w-3.5" /></Link>
  </div></main>;
}
