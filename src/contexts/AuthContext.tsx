import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getFreshSession, isSupabaseConfigured, supabase } from '@/lib/supabase/client';
import { setUserScope } from '@/lib/userScope';

type AuthResult = { error?: string; needsVerification?: boolean };

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
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
function getSupabase() {
  return Promise.resolve(isSupabaseConfigured ? supabase : null);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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
      const { session: freshSession } = await getFreshSession();
      if (!active) return;
      setSession(freshSession);
      setLoading(false);
      const listener = supabase.auth.onAuthStateChange((_event, nextSession) => {
        if (!active) return;
        setSession(nextSession);
        setLoading(false);
      });
      unsubscribe = () => listener.data.subscription.unsubscribe();
    });
    return () => {
      active = false;
      unsubscribe?.();
    };
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
    const fresh = await getFreshSession();
    if (!fresh.session) return { error: fresh.error || 'Authentication is required.' };
    const response = await fetch('/api/auth-recovery', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${fresh.session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'update', password }),
    });
    const payload = await response.json() as { error?: string };
    return response.ok ? {} : { error: payload.error || 'Password recovery failed safely.' };
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
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    session,
    loading,
    configured: isSupabaseConfigured,
    signIn,
    signUp,
    resendVerification,
    sendMagicLink,
    resetPassword,
    updatePassword,
    signInWithOAuth,
    signOut,
  }), [loading, resendVerification, resetPassword, sendMagicLink, session, signIn, signInWithOAuth, signOut, signUp, updatePassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
