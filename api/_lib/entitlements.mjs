/**
 * AI session entitlement gate — centralized so chat, quiz, and the agent share one policy.
 *
 * While payment/billing is being finalized, every learner gets unlimited top-tier ("Pro")
 * access: FAHIM_UNLIMITED_ACCESS defaults to on, so consumption is never blocked and nothing
 * is metered. Set FAHIM_UNLIMITED_ACCESS=false (in Vercel env) to re-enable per-plan metering
 * through consume_entitlement_v1 — no code change needed to flip it back.
 */

export function unlimitedAccessEnabled() {
  return String(process.env.FAHIM_UNLIMITED_ACCESS ?? 'true').trim().toLowerCase() !== 'false';
}

/**
 * Reserve one AI session for the current user.
 * Returns { allowed, metered, configError }:
 *   - allowed:    proceed with the AI call.
 *   - metered:    a real entitlement was consumed (so a failure should refund it).
 *   - configError: entitlements are misconfigured (surface 503).
 */
export async function consumeAiSession(authClient) {
  if (unlimitedAccessEnabled()) return { allowed: true, metered: false };
  const { data, error } = await authClient.rpc('consume_entitlement_v1', { target_key: 'ai_sessions_month', amount: 1 });
  if (error) return { allowed: false, metered: false, configError: true };
  return { allowed: Boolean(data), metered: true };
}

/** Refund a previously consumed session — a no-op when access was unlimited/unmetered. */
export async function refundAiSession(client, userId, metered) {
  if (!metered) return;
  try {
    await client.rpc('refund_entitlement_v1', { target_user: userId, target_key: 'ai_sessions_month', amount: 1 });
  } catch {
    // A failed refund must never take down the request path.
  }
}
