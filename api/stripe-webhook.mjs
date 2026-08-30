import { applyApiHeaders } from './_lib/security.mjs';

export default function handler(request, response) {
  const requestId = applyApiHeaders(request, response);
  response.setHeader('Cache-Control', 'no-store');
  return response.status(410).json({ error: 'Provider billing is retired. Manual payment review is active.', code: 'PROVIDER_BILLING_RETIRED', requestId });
}
