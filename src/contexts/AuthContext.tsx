import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { authenticatedFetch, getFreshSession, isSupabaseConfigured, supabase } from '@/lib/supabase/client';
import { setUserScope } from '@/lib/userScope';
import { OPEN_JUDGE_MODE } from '@/config/productMode';

type AuthResult = { error?: string; needsVerification?: boolean };

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  bootstrapError: string | null;
  retryOpenSession: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (name: string, email: string, password: string) => Promise<AuthResult>;
  resendVerification: (email: string) => Promise<AuthResult>;
  sendMagicLink: (email: string) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  signInWithOAuth: (provider: 'google' | 'github' | 'azure') => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
let anonymousBootstrap: Promise<Session> | null = null;

function getSupabase() {
  return Promise.resolve(isSupabaseConfigured ? supabase : null);
}

async function createOpenSession(): Promise<Session> {
  const client = await getSupabase();
  if (!client) throw new Error('Supabase is not configured.');
  if (!anonymousBootstrap) {
    anonymousBootstrap = client.auth.signInAnonymously({
      options: {
        data: {
          full_name: 'Fahim Explorer',
          role: 'student',
          open_judge_mode: true,
        },
      },
    }).then(({ data, error }) => {
      if (error || !data.session) throw error || new Error('Anonymous session was not created.');
      return data.session;
    }).finally(() => { anonymousBootstrap = null; });
  }
  return anonymousBootstrap;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  useEffect(() => {
    setUserScope(session?.user?.id ?? null);
  }, [session?.user?.id]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    let active = true;
    let unsubscribe: (() => void) | undefined;
    void getSupabase().then(async (supabase) => {
      if (!supabase || !active) {
        if (active) setLoading(false);
        return;
      }
      const listener = supabase.auth.onAuthStateChange((event, nextSession) => {
        if (!active) return;
        setSession(nextSession);
        if (nextSession) {
          setBootstrapError(null);
        } else if (OPEN_JUDGE_MODE && event === 'SIGNED_OUT') {
          setLoading(true);
          void createOpenSession()
            .then((replacement) => {
              if (!active) return;
              setSession(replacement);
              setBootstrapError(null);
            })
            .catch((error) => {
              if (!active) return;
              setBootstrapError(error instanceof Error ? error.message : 'Open session could not be recreated.');
            })
            .finally(() => { if (active) setLoading(false); });
          return;
        }
        setLoading(false);
      });
      unsubscribe = () => listener.data.subscription.unsubscribe();
      try {
        const { session: freshSession } = await getFreshSession();
        const resolved = freshSession || (OPEN_JUDGE_MODE ? await createOpenSession() : null);
        if (!active) return;
        setSession(resolved);
        setBootstrapError(null);
      } catch (error) {
        if (!active) return;
        setSession(null);
        setBootstrapError(error instanceof Error ? error.message : 'Open session could not be created.');
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const retryOpenSession = useCallback(async () => {
    if (!OPEN_JUDGE_MODE) return;
    setLoading(true);
    setBootstrapError(null);
    try {
      const nextSession = await createOpenSession();
      setSession(nextSession);
    } catch (error) {
      setBootstrapError(error instanceof Error ? error.message : 'Open session could not be created.');
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const supabase = await getSupabase();
    if (!supabase) return { error: 'Authentication is not configured.' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string): Promise<AuthResult> => {
    const supabase = await getSupabase();
    if (!supabase) return { error: 'Authentication is not configured.' };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, role: 'student' },
        emailRedirectTo: `${window.location.origin}/onboarding`,
      },
    });
    if (error) return { error: error.message };
    return { needsVerification: !data.session };
  }, []);

  const resendVerification = useCallback(async (email: string): Promise<AuthResult> => {
    const supabase = await getSupabase();
    if (!supabase) return { error: 'Authentication is not configured.' };
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/onboarding` },
    });
    return error ? { error: error.message } : {};
  }, []);

  const sendMagicLink = useCallback(async (email: string): Promise<AuthResult> => {
    const supabase = await getSupabase();
    if (!supabase) return { error: 'Authentication is not configured.' };
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    return error ? { error: error.message } : {};
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    const supabase = await getSupabase();
    if (!supabase) return { error: 'Authentication is not configured.' };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return error ? { error: error.message } : {};
  }, []);

  const updatePassword = useCallback(async (password: string): Promise<AuthResult> => {
    try {
      const response = await authenticatedFetch('/api/auth-recovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'update', password }),
      });
      const payload = await response.json() as { error?: string };
      return response.ok ? {} : { error: payload.error || 'Password recovery failed safely.' };
    } catch (requestError) {
      return { error: requestError instanceof Error ? requestError.message : 'Password recovery failed safely.' };
    }
  }, []);

  const signInWithOAuth = useCallback(async (provider: 'google' | 'github' | 'azure'): Promise<AuthResult> => {
    const supabase = await getSupabase();
    if (!supabase) return { error: 'Authentication is not configured.' };
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        scopes: provider === 'azure' ? 'email openid profile' : undefined,
      },
    });
    return error ? { error: error.message } : {};
  }, []);

  const signOut = useCallback(async () => {
    const supabase = await getSupabase();
    await supabase?.auth.signOut();
    if (OPEN_JUDGE_MODE) {
      try {
        setSession(await createOpenSession());
      } catch (error) {
        setBootstrapError(error instanceof Error ? error.message : 'Open session could not be recreated.');
      }
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    session,
    loading,
    configured: isSupabaseConfigured,
    bootstrapError,
    retryOpenSession,
    signIn,
    signUp,
    resendVerification,
    sendMagicLink,
    resetPassword,
    updatePassword,
    signInWithOAuth,
    signOut,
  }), [bootstrapError, loading, resendVerification, resetPassword, retryOpenSession, sendMagicLink, session, signIn, signInWithOAuth, signOut, signUp, updatePassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
