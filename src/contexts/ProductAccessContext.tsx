import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AUTH_SESSION_EXPIRED, getFreshSession, isExpiredJwtError, supabase } from '@/lib/supabase/client';
import type { PlanCode } from '@/config/plans';

export type AccessStatus = 'guest' | 'loading' | 'trialing' | 'active' | 'free' | 'setup_required';

export type ProductAccess = {
  onboardingComplete: boolean;
  status: AccessStatus;
  planCode: PlanCode;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  trialDaysRemaining: number;
  aiSessionsRemaining: number | null;
  canUseCore: boolean;
  error: string | null;
};

type OnboardingInput = {
  persona: 'student' | 'teacher' | 'parent' | 'professional' | 'other';
  educationLevel: string;
  primarySubject: string;
  currentLevel: string;
  learningGoal: string;
  targetDate: string | null;
  preferredLanguage: 'ar' | 'en' | 'both';
  learningStyle: 'guided' | 'practice' | 'visual' | 'mixed';
};

type ProductAccessContextValue = ProductAccess & {
  loading: boolean;
  refresh: () => Promise<void>;
  completeOnboarding: (input: OnboardingInput) => Promise<{ error?: string }>;
};

const ONBOARDING_SERVICE_UNAVAILABLE = 'onboarding_service_unavailable';

function normalizeOnboardingError(error: { code?: string; message?: string }) {
  const message = error.message ?? '';
  if (isExpiredJwtError(error)) return AUTH_SESSION_EXPIRED;
  if (error.code === 'PGRST202' || /schema cache|complete_onboarding_v1/i.test(message)) {
    return ONBOARDING_SERVICE_UNAVAILABLE;
  }
  return message || 'onboarding_failed';
}

const guestAccess: ProductAccess = {
  onboardingComplete: false,
  status: 'guest',
  planCode: 'free',
  trialStartedAt: null,
  trialEndsAt: null,
  trialDaysRemaining: 0,
  aiSessionsRemaining: null,
  canUseCore: false,
  error: null,
};

const ProductAccessContext = createContext<ProductAccessContextValue | null>(null);

function normalizeAccess(payload: unknown): ProductAccess {
  const value = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
  const plan = value.plan_code === 'plus_monthly' || value.plan_code === 'plus_annual' ? value.plan_code : 'free';
  const status = ['trialing', 'active', 'free'].includes(String(value.status)) ? value.status as AccessStatus : 'free';
  return {
    onboardingComplete: Boolean(value.onboarding_complete),
    status,
    planCode: plan,
    trialStartedAt: typeof value.trial_started_at === 'string' ? value.trial_started_at : null,
    trialEndsAt: typeof value.trial_ends_at === 'string' ? value.trial_ends_at : null,
    trialDaysRemaining: Math.max(0, Number(value.trial_days_remaining) || 0),
    aiSessionsRemaining: Number.isFinite(Number(value.ai_sessions_remaining)) ? Math.max(0, Number(value.ai_sessions_remaining)) : null,
    canUseCore: Boolean(value.can_use_core),
    error: null,
  };
}

export function ProductAccessProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading, configured } = useAuth();
  const [access, setAccess] = useState<ProductAccess>(guestAccess);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (authLoading) return;
    if (!configured || !user || !supabase) {
      setAccess(guestAccess);
      setLoading(false);
      return;
    }
    setLoading(true);
    const auth = await getFreshSession();
    if (!auth.session) {
      setAccess({ ...guestAccess, status: 'setup_required', error: auth.error });
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.rpc('current_access_v1');
    if (error) {
      setAccess({ ...guestAccess, status: 'setup_required', error: isExpiredJwtError(error) ? AUTH_SESSION_EXPIRED : 'Product access is temporarily unavailable.' });
    } else {
      setAccess(normalizeAccess(data));
    }
    setLoading(false);
  }, [authLoading, configured, user]);

  useEffect(() => { void refresh(); }, [refresh]);

  const completeOnboarding = useCallback(async (input: OnboardingInput) => {
    if (!supabase || !user) return { error: 'Authentication is required.' };
    const auth = await getFreshSession();
    if (!auth.session) return { error: auth.error || AUTH_SESSION_EXPIRED };
    const { error } = await supabase.rpc('complete_onboarding_v1', {
      profile_input: {
        persona: input.persona,
        education_level: input.educationLevel,
        primary_subject: input.primarySubject,
        current_level: input.currentLevel,
        learning_goal: input.learningGoal,
        target_date: input.targetDate,
        preferred_language: input.preferredLanguage,
        learning_style: input.learningStyle,
      },
    });
    if (error) return { error: normalizeOnboardingError(error) };
    await refresh();
    return {};
  }, [refresh, user]);

  const value = useMemo<ProductAccessContextValue>(() => ({ ...access, loading: loading || authLoading, refresh, completeOnboarding }), [access, authLoading, completeOnboarding, loading, refresh]);
  return <ProductAccessContext.Provider value={value}>{children}</ProductAccessContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProductAccess() {
  const context = useContext(ProductAccessContext);
  if (!context) throw new Error('useProductAccess must be used inside ProductAccessProvider');
  return context;
}
