import { applyApiHeaders, isSameOrigin, logEvent } from './_lib/security.mjs';
import { getAIStatus } from './_lib/ai-routing.mjs';

const RELEASE = 'fahim-verified-learning-os-8';

/**
 * Two probes, because one endpoint cannot answer both questions.
 *
 * `mode=live` is a liveness check: the function is running and configured. It performs no I/O.
 * `mode=ready` additionally proves the dependencies answer, and returns 503 when they do not.
 *
 * The previous single endpoint always returned `ok: true, status: 'ready'` — it reported a
 * healthy service during a total Supabase or provider outage, so it could not drive an alert.
 *
 * Configuration booleans are returned only to a caller presenting the service-role secret.
 * Without a token they would describe the deployment's private setup to anyone who asks.
 */
export default async function handler(request, response) {
  const requestId = applyApiHeaders(request, response);
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const url = new URL(String(request.url || '/'), 'https://localhost');
  const mode = url.searchParams.get('mode') === 'ready' ? 'ready' : 'live';
  const ai = getAIStatus();

  const base = {
    release: RELEASE,
    requestId,
    timestamp: new Date().toISOString(),
    mode,
    ok: true,
    aiConfigured: ai.configured,
  };

  if (mode === 'live') {
    return response.status(200).json({ ...base, status: 'live' });
  }

  const supabaseUrl = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const anonKey = String(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();

  const checks = {
    database: await probeDatabase(supabaseUrl, serviceKey || anonKey),
    ai: ai.configured ? 'configured' : 'not_configured',
    quizSigning: (process.env.QUIZ_TOKEN_SECRET || process.env.QUIZ_SIGNING_SECRET || '').length >= 32 ? 'configured' : 'not_configured',
  };

  const dependenciesReady = checks.database === 'reachable';
  const configured = checks.ai === 'configured' && checks.quizSigning === 'configured';
  const ready = dependenciesReady && configured;

  // The operator health panel is same-origin; anything else must present the service secret.
  const authorized = isSameOrigin(request)
    || (Boolean(serviceKey) && String(request.headers?.authorization || '') === `Bearer ${serviceKey}`);
  const detail = authorized
    ? {
      aiProviderCount: ai.providerCount,
      aiRedundancyConfigured: ai.redundancyConfigured,
      youtubeConfigured: Boolean(process.env.YOUTUBE_API_KEY),
      serverAuthorizationConfigured: Boolean(serviceKey),
      // The tutor agent needs both a live provider and the sealed-diagnostic signing secret.
      agentReady: checks.ai === 'configured' && checks.quizSigning === 'configured',
      billingProvider: 'manual-review',
    }
    : {};

  if (!ready) {
    logEvent('health_not_ready', { requestId, checks });
  }

  return response.status(ready ? 200 : 503).json({
    ...base,
    ok: ready,
    status: ready ? 'ready' : 'not_ready',
    checks,
    ...detail,
  });
}

/** One cheap read against PostgREST with a hard timeout, so readiness never hangs. */
async function probeDatabase(url, key) {
  if (!url || !key) return 'not_configured';
  try {
    const result = await fetch(`${url}/rest/v1/plans?select=code&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(2_500),
    });
    return result.ok ? 'reachable' : `http_${result.status}`;
  } catch {
    return 'unreachable';
  }
}
