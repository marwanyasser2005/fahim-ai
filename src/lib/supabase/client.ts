import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const AUTH_SESSION_EXPIRED = 'auth_session_expired';
export const AUTH_REFRESH_FAILED = 'auth_refresh_failed';

type SessionFailure = typeof AUTH_SESSION_EXPIRED | typeof AUTH_REFRESH_FAILED;
export type FreshSessionResult = { session: Session | null; error: SessionFailure | null };

const SESSION_REFRESH_WINDOW_MS = 90_000;
let supabaseClient: SupabaseClient | null = null;
let refreshPromise: Promise<FreshSessionResult> | null = null;

function requestUrl(input: RequestInfo | URL) {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function isAuthRequest(input: RequestInfo | URL) {
  return /\/auth\/v1\//i.test(requestUrl(input));
}

export function isExpiredJwtError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const value = error as { code?: unknown; message?: unknown; status?: unknown };
  const message = `${String(value.code ?? '')} ${String(value.message ?? '')}`;
  return /jwt\s*(?:has\s*)?expired|token\s*expired|invalid\s+claim.*exp/i.test(message);
}

export function isSessionExpiring(session: Pick<Session, 'expires_at'>, now = Date.now()) {
  return !session.expires_at || session.expires_at * 1000 <= now + SESSION_REFRESH_WINDOW_MS;
}

function invalidRefreshToken(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const value = error as { code?: unknown; message?: unknown };
  return /refresh[_\s-]?token|session.*(?:missing|not found)/i.test(`${String(value.code ?? '')} ${String(value.message ?? '')}`);
}

async function clearLocalSession() {
  await supabaseClient?.auth.signOut({ scope: 'local' }).catch(() => undefined);
}

async function refreshSessionOnce(): Promise<FreshSessionResult> {
  if (!supabaseClient) return { session: null, error: AUTH_SESSION_EXPIRED };
  if (!refreshPromise) {
    const activeRefresh = supabaseClient.auth.refreshSession()
      .then(async ({ data, error }): Promise<FreshSessionResult> => {
        if (data.session && !error) return { session: data.session, error: null };
        if (invalidRefreshToken(error)) {
          await clearLocalSession();
          return { session: null, error: AUTH_SESSION_EXPIRED };
        }
        return { session: null, error: AUTH_REFRESH_FAILED };
      })
      .catch(() => ({ session: null, error: AUTH_REFRESH_FAILED } as FreshSessionResult))
      .finally(() => { refreshPromise = null; });
    refreshPromise = activeRefresh;
    return activeRefresh;
  }
  const activeRefresh = refreshPromise;
  return activeRefresh;
}

export async function getFreshSession(options: { force?: boolean } = {}): Promise<FreshSessionResult> {
  if (!supabaseClient) return { session: null, error: AUTH_SESSION_EXPIRED };
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    if (invalidRefreshToken(error)) await clearLocalSession();
    return { session: null, error: invalidRefreshToken(error) ? AUTH_SESSION_EXPIRED : AUTH_REFRESH_FAILED };
  }
  if (!data.session) return { session: null, error: AUTH_SESSION_EXPIRED };
  if (!options.force && !isSessionExpiring(data.session)) return { session: data.session, error: null };
  return refreshSessionOnce();
}

async function responseHasExpiredJwt(response: Response) {
  if (response.status !== 401) return false;
  const challenge = response.headers.get('www-authenticate') || '';
  if (/jwt\s*(?:has\s*)?expired|token\s*expired/i.test(challenge)) return true;
  const body = await response.clone().text().catch(() => '');
  return /jwt\s*(?:has\s*)?expired|token\s*expired|invalid\s+claim.*exp/i.test(body);
}

async function fetchWithSessionRecovery(input: RequestInfo | URL, init?: RequestInit) {
  const retryInput = input instanceof Request ? input.clone() : input;
  const response = await fetch(input, init);
  if (isAuthRequest(input) || !(await responseHasExpiredJwt(response))) return response;

  const refreshed = await refreshSessionOnce();
  if (!refreshed.session?.access_token) return response;
  const headers = new Headers(init?.headers ?? (retryInput instanceof Request ? retryInput.headers : undefined));
  headers.set('Authorization', `Bearer ${refreshed.session.access_token}`);
  return fetch(retryInput, { ...init, headers });
}

supabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      global: { fetch: fetchWithSessionRecovery },
    })
  : null;

export const supabase = supabaseClient;

export type AuthProviders = {
  email: boolean;
  google: boolean;
  github: boolean;
  azure: boolean;
};

export async function getAuthProviders(): Promise<AuthProviders> {
  const fallback = { email: true, google: false, github: false, azure: false };
  if (!supabaseUrl || !supabaseAnonKey) return { ...fallback, email: false };

  try {
    const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/settings`, {
      headers: { apikey: supabaseAnonKey },
    });
    if (!response.ok) return fallback;
    const payload = await response.json() as { external?: Partial<AuthProviders> };
    return {
      email: Boolean(payload.external?.email),
      google: Boolean(payload.external?.google),
      github: Boolean(payload.external?.github),
      azure: Boolean(payload.external?.azure),
    };
  } catch {
    return fallback;
  }
}
