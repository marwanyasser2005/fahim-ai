import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProductAccess } from '@/contexts/ProductAccessContext';

export default function ProtectedRoute({ children, requireOnboarding = true }: { children: React.ReactNode; requireOnboarding?: boolean }) {
  const { user, loading, configured } = useAuth();
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
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  if (requireOnboarding && !access.onboardingComplete) {
    if (access.loading) {
      return <main className="grid min-h-[70vh] place-items-center" aria-busy="true">
        <Loader2 className="h-7 w-7 animate-spin text-[var(--nile)]" />
      </main>;
    }
    return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />;
  }
  return children;
}
