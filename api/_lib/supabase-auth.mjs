import { createClient } from '@supabase/supabase-js';

function supabaseUrl() {
  return String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
}

function supabaseAnonKey() {
  return String(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
}

export function createAdminClient() {
  const url = supabaseUrl();
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!url || !key) throw new ServerConfigurationError('Supabase server credentials are not configured.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function requireAuthenticatedUser(request) {
  const url = supabaseUrl();
  const anonKey = supabaseAnonKey();
  if (!url || !anonKey) throw new ServerConfigurationError('Supabase authentication is not configured.');
  const authorization = String(request.headers?.authorization || '');
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) throw new AuthenticationError('Authentication required.');
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new AuthenticationError('Invalid or expired session.');
  return { user: data.user, client, token };
}

export class AuthenticationError extends Error {
  constructor(message) { super(message); this.name = 'AuthenticationError'; this.status = 401; }
}

export class ServerConfigurationError extends Error {
  constructor(message) { super(message); this.name = 'ServerConfigurationError'; this.status = 503; }
}
