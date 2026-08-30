import { applyApiHeaders, consumeRateLimit, isSameOrigin, parseJsonBody, rejectRateLimit } from './_lib/security.mjs';
import { AuthenticationError, ServerConfigurationError, createAdminClient, requireAuthenticatedUser } from './_lib/supabase-auth.mjs';

function send(response, status, body) {
  return response.status(status).json(body);
}

function validPassword(value) {
  return typeof value === 'string'
    && value.length >= 10
    && value.length <= 128
    && /\p{L}/u.test(value)
    && /\d/.test(value);
}

export default async function handler(request, response) {
  applyApiHeaders(request, response);
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return send(response, 405, { error: 'Method not allowed.' });
  }

  try {
    const rate = await consumeRateLimit(request, { namespace: 'auth-recovery', limit: 12, windowMs: 10 * 60 * 1_000 });
    if (!rate.allowed) return rejectRateLimit(response, rate, send);
    if (!isSameOrigin(request)) return send(response, 403, { error: 'Cross-site request rejected.' });

    const { user } = await requireAuthenticatedUser(request);
    const admin = createAdminClient();
    const body = parseJsonBody(request, { maxBytes: 2_000 });
    const { data: windowStatus, error: statusError } = await admin.rpc('recovery_window_for_user_v1', { target_user: user.id });
    if (statusError || !windowStatus) throw new ServerConfigurationError('Recovery validation is unavailable.');

    if (!windowStatus.eligible) {
      return send(response, 410, {
        error: 'This recovery link has expired. Request a new link to continue.',
        code: 'RECOVERY_WINDOW_EXPIRED',
        expiresAt: windowStatus.expiresAt || null,
      });
    }

    if (body.action === 'status') {
      return send(response, 200, { eligible: true, requestedAt: windowStatus.requestedAt, expiresAt: windowStatus.expiresAt });
    }

    if (body.action !== 'update' || !validPassword(body.password)) {
      return send(response, 400, { error: 'Use a password of 10–128 characters containing letters and numbers.' });
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, { password: body.password });
    if (updateError) throw updateError;

    await admin.from('audit_logs').insert({
      actor_id: user.id,
      action: 'auth.password_recovered',
      entity_type: 'user',
      entity_id: user.id,
      metadata: { recovery_policy: 'ten_minute_window_v1' },
    });

    return send(response, 200, { updated: true });
  } catch (error) {
    const status = error instanceof AuthenticationError || error instanceof ServerConfigurationError ? error.status : Number(error?.status) || 500;
    return send(response, status, { error: status >= 500 ? 'Password recovery failed safely. Request a new link and try again.' : error.message });
  }
}
