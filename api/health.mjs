import { applyApiHeaders } from './_lib/security.mjs';
import { getAIStatus } from './_lib/ai-routing.mjs';

export default function handler(request, response) {
  const requestId = applyApiHeaders(request, response);
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed' });
  }
  const ai = getAIStatus();
  response.status(200).json({
    ok: true,
    status: 'ready',
    release: 'fahim-verified-learning-os-7',
    requestId,
    timestamp: new Date().toISOString(),
    aiConfigured: ai.configured,
    aiProviderCount: ai.providerCount,
    aiRedundancyConfigured: ai.redundancyConfigured,
    youtubeConfigured: Boolean(process.env.YOUTUBE_API_KEY),
    quizSecurityConfigured: Boolean((process.env.QUIZ_TOKEN_SECRET || process.env.QUIZ_SIGNING_SECRET)?.length >= 32),
    supabaseConfigured: Boolean((process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) && (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY)),
    serverAuthorizationConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    billingProvider: 'manual-review',
    billingConfigured: Boolean((process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) && process.env.SUPABASE_SERVICE_ROLE_KEY),
  });
}
