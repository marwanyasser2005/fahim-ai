import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, BadgeCheck, ExternalLink, Loader2 } from 'lucide-react';
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
      const { data, error: requestError } = await supabase.rpc('verify_certificate_v2', { certificate_identifier: certificateId });
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
    {loading ? <div className="mt-8 grid min-h-72 place-items-center rounded-[2rem] border border-[var(--border)] bg-[var(--panel)]" aria-busy="true"><Loader2 className="h-7 w-7 animate-spin text-[#0F766E]" /></div> : error ? <section className="mt-8 rounded-[2rem] border border-amber-400 bg-amber-50 p-8 text-amber-950"><AlertTriangle className="h-8 w-8" /><h1 className="mt-5 text-2xl font-black">{rtl ? 'تعذر التحقق' : 'Verification unavailable'}</h1><p className="mt-3 text-sm leading-7">{error}</p></section> : credential && <div className="mt-8"><div className={`mb-5 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black ${credential.status === 'issued' ? 'border-teal-500/30 bg-teal-50 text-teal-900' : 'border-rose-500/30 bg-rose-50 text-rose-900'}`}><BadgeCheck className="h-5 w-5" />{credential.status === 'issued' ? (rtl ? 'السجل صالح ومتطابق مع قاعدة بيانات فَهيم.' : 'The record is valid and matches Fahim’s registry.') : (rtl ? 'تم إلغاء هذه الشهادة.' : 'This credential was revoked.')}</div><CertificateArtwork credential={credential} language={language} /></div>}
    <Link to="/" className="mt-8 inline-flex items-center gap-2 text-xs font-black text-[#0F766E]">{rtl ? 'تعرف على فَهيم' : 'Learn about Fahim'}<ExternalLink className="h-3.5 w-3.5" /></Link>
  </div></main>;
}
