import { applyApiHeaders } from './_lib/security.mjs';

// Hosted checkout is intentionally disabled. Subscription activation now uses
// private payment evidence plus the audited admin decision RPC in Supabase.
export default function handler(request, response) {
  const requestId = applyApiHeaders(request, response);
  response.setHeader('Cache-Control', 'no-store');
  return response.status(410).json({
    error: 'Hosted checkout is disabled. Use the verified payment proof workflow.',
    code: 'MANUAL_PAYMENT_REVIEW_ACTIVE',
    requestId,
  });
}
