import { ArrowLeft, ArrowRight, Compass, Home, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Language } from '@/App';

export default function NotFound({ language }: { language: Language }) {
  const Arrow = language === 'ar' ? ArrowLeft : ArrowRight;
  return <main className="atlas-grid grid min-h-[72vh] place-items-center border-b border-[var(--border)] bg-[var(--paper)] px-4 py-16 dark:bg-[#0b1116]">
    <div className="max-w-2xl border border-[var(--band)] bg-[var(--panel)] p-8 text-center shadow-[9px_9px_0_var(--saffron)] sm:p-12">
      <span className="mx-auto grid h-16 w-16 place-items-center border border-[var(--band)] bg-[var(--paper)] text-[var(--nile)]"><Compass className="h-8 w-8" /></span>
      <p className="atlas-section-number mt-7">ERROR / 404</p>
      <h1 className="atlas-display mt-4 text-4xl">{language === 'ar' ? 'الصفحة دي مش في مسار التعلّم.' : 'This page is not on the learning path.'}</h1>
      <p className="mt-4 leading-8 text-[var(--muted)]">{language === 'ar' ? 'الرابط قديم أو غير صحيح. ارجع للرئيسية أو افتح مساحة التعلّم للوصول للأداة المطلوبة.' : 'The link may be outdated or incorrect. Return home or open the learning workspace to find the right tool.'}</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link to="/" className="atlas-primary justify-center"><Home className="h-4 w-4" />{language === 'ar' ? 'الرئيسية' : 'Home'}<Arrow className="h-4 w-4" /></Link><Link to="/workspace" className="atlas-secondary justify-center"><Search className="h-4 w-4" />{language === 'ar' ? 'مساحة التعلّم' : 'Learning workspace'}</Link></div>
    </div>
  </main>;
}
