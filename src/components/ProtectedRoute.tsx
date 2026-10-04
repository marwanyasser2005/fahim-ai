import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProductAccess } from '@/contexts/ProductAccessContext';
import { OPEN_JUDGE_MODE } from '@/config/productMode';

export default function ProtectedRoute({ children, requireOnboarding = true }: { children: React.ReactNode; requireOnboarding?: boolean }) {
  const { user, loading, configured, bootstrapError, retryOpenSession } = useAuth();
  const access = useProductAccess();
  const location = useLocation();

  // The auth check is the only hard gate. Product access is revalidated in the
  // background, so once a learner is known to be onboarded the page keeps
  // rendering instead of flashing back to a spinner on every token refresh.
  if (loading) {
    return <main className="grid min-h-[70vh] place-items-center" aria-busy="true">
      <Loader2 className="h-7 w-7 animate-spin text-[var(--nile)]" />
    </main>;
  }
  if (!configured || !user) {
    if (OPEN_JUDGE_MODE) {
      return <main className="grid min-h-[70vh] place-items-center px-4">
        <section className="max-w-lg border border-[var(--border)] bg-[var(--panel)] p-7 text-center shadow-[var(--shadow-lg)]">
          <h1 className="text-xl font-black text-[var(--text)]">{document.documentElement.lang === 'ar' ? 'تعذر بدء جلسة الاستكشاف' : 'Open session unavailable'}</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{bootstrapError || (document.documentElement.lang === 'ar' ? 'تحقق من الاتصال ثم حاول مجددًا. لن نطلب بريدًا أو كلمة مرور.' : 'Check your connection and retry. No email or password is required.')}</p>
          <button type="button" onClick={() => void retryOpenSession()} className="atlas-primary mt-5">{document.documentElement.lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}</button>
        </section>
      </main>;
    }
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  if (!OPEN_JUDGE_MODE && requireOnboarding && !access.onboardingComplete) {
    if (access.loading) {
      return <main className="grid min-h-[70vh] place-items-center" aria-busy="true">
        <Loader2 className="h-7 w-7 animate-spin text-[var(--nile)]" />
      </main>;
    }
    return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />;
  }
  return children;
}
