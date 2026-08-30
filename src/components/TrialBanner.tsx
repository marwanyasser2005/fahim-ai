import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock3, Gauge } from 'lucide-react';
import { useProductAccess } from '@/contexts/ProductAccessContext';

export default function TrialBanner({ language }: { language: 'ar' | 'en' }) {
  const access = useProductAccess();
  if (!access.onboardingComplete || (access.status !== 'trialing' && access.status !== 'free')) return null;
  const Arrow = language === 'ar' ? ArrowLeft : ArrowRight;
  const trial = access.status === 'trialing';
  return <aside className="border-b border-[#14213D]/15 bg-[#F2B84B] text-[#14213D]" aria-label={language === 'ar' ? 'حالة الخطة' : 'Plan status'}>
    <div className="mx-auto flex min-h-10 max-w-[100rem] flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-2 text-[11px] font-black sm:justify-between sm:px-6 lg:px-8">
      <span className="flex items-center gap-2">{trial ? <Clock3 className="h-4 w-4" /> : <Gauge className="h-4 w-4" />}{trial ? (language === 'ar' ? `تجربتك الكاملة: ${access.trialDaysRemaining} يومًا متبقيًا` : `Full trial: ${access.trialDaysRemaining} days left`) : (language === 'ar' ? 'أنت الآن على الخطة المجانية' : 'You are on the Free plan')}</span>
      <span>{access.aiSessionsRemaining !== null ? (language === 'ar' ? `${access.aiSessionsRemaining} جلسة ذكية متاحة` : `${access.aiSessionsRemaining} AI sessions available`) : (language === 'ar' ? 'الاستخدام العادل ظاهر داخل الحساب' : 'Fair use is visible in your account')}</span>
      <Link to="/pricing" className="inline-flex min-h-11 items-center gap-1 border-b border-[#14213D]">{language === 'ar' ? 'إدارة الخطة' : 'Manage plan'}<Arrow className="h-3.5 w-3.5" /></Link>
    </div>
  </aside>;
}
