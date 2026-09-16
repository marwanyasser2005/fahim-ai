import {
  estimateAICostMicrousd,
  executeGatewayTask,
  GatewayUnavailableError,
  getGatewayStatus,
  getRoutingFingerprint,
  hfModelCascade,
  isHFConfigured,
  pipeLearningAIStream,
  readLearningAIResponse,
  requestLearningAI,
  routeForTask,
  TASKS,
} from './_lib/hf-gateway.mjs';
import {
  applyApiHeaders,
  consumeRateLimit,
  isSameOrigin,
  logEvent,
  parseJsonBody,
  rejectRateLimit,
  RequestBodyError,
} from './_lib/security.mjs';
import { AuthenticationError, requireAuthenticatedUser, ServerConfigurationError } from './_lib/supabase-auth.mjs';

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

function send(response, status, body) {
  response.writeHead(status, JSON_HEADERS);
  response.end(JSON.stringify(body));
}

function publicResult(result, isLocal) {
  const { provider: _provider, model: _model, cost: _cost, ...safe } = result;
  return {
    ...safe,
    route: {
      tier: isLocal ? 0 : 2,
      engine: isLocal ? 'deterministic-learning' : 'managed-learning-ai',
    },
  };
}

const TASK_ALIASES = Object.freeze({
  chat: TASKS.CHAT,
  tutor: TASKS.CHAT,
  vision: TASKS.VISION,
  guard: TASKS.GUARD,
  safety: TASKS.GUARD,
  moderate: TASKS.GUARD,
  embed: TASKS.EMBED,
  embedding: TASKS.EMBED,
  rerank: TASKS.RERANK,
  rerank_query: TASKS.RERANK,
  speech_to_text: TASKS.SPEECH,
  transcribe: TASKS.SPEECH,
  asr: TASKS.SPEECH,
  mastery_update: TASKS.MASTERY,
  irt_probability: TASKS.IRT,
  review_schedule: TASKS.REVIEW,
});

function normalizeTask(raw) {
  const key = String(raw || '').trim().toLowerCase();
  return TASK_ALIASES[key] || null;
}

/**
 * Fahim AI Gateway — one endpoint, provider-neutral.
 *
 * The client says "what do I need" (a task), never "which model". Task
 * selection lives in the gateway:
 *
 *   chat / vision / speech_to_text / guard / embed / rerank  → provider cascade
 *   mastery_update / irt_probability / review_schedule       → local BKT / IRT / FSRS, zero tokens
 *
 * Local algorithm responses carry `zeroTokens: true` so observability can
 * measure the fraction of requests the deterministic tier absorbs (spec §97:
 * paid-API fallback must stay under 10% of requests).
 */
export default async function handler(request, response) {
  const requestId = applyApiHeaders(request, response);
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return send(response, 405, { error: 'Method not allowed' });
  }
  if (!isSameOrigin(request)) return send(response, 403, { error: 'Origin not allowed' });

  let body;
  try {
    body = parseJsonBody(request, { maxBytes: 96_000 });
  } catch (error) {
    if (error instanceof RequestBodyError) return send(response, error.status, { error: error.message });
    return send(response, 400, { error: 'Invalid JSON body.' });
  }

  const task = normalizeTask(body.task);
  if (!task) {
    return send(response, 400, {
      error: `Unknown or missing task. Supported: ${[...new Set(Object.values(TASKS))].join(', ')}.`,
    });
  }

  const routeInfo = routeForTask(task);
  const isLocal = routeInfo.kind === 'local';
  const rate = await consumeRateLimit(request, {
    namespace: `ai-gateway:${isLocal ? 'local' : 'provider'}`,
    limit: isLocal ? 600 : 120,
    windowMs: 10 * 60 * 1000,
  });
  if (!rate.allowed) return rejectRateLimit(response, rate, send, 'Too many AI gateway requests. Try again later.');
  response.setHeader('X-RateLimit-Remaining', String(rate.remaining));

  if (routeInfo.kind === 'provider') {
    const status = getGatewayStatus();
    if (!status.configured) return send(response, 503, { error: 'AI is not configured yet.', zeroTokens: false });
  }
  if (!isLocal) {
    try {
      await requireAuthenticatedUser(request);
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof ServerConfigurationError) {
        return send(response, error.status, { error: error.message });
      }
      return send(response, 500, { error: 'Authentication could not be verified.' });
    }
  }

  // The function is capped at 60s by vercel.json. Local tasks finish in
  // milliseconds; provider cascades get the remaining budget minus guardrail.
  const deadlineAt = isLocal ? Date.now() + 5_000 : Date.now() + 48_000;
  const startedAt = Date.now();

  try {
    const result = await executeGatewayTask({
      task,
      ...body,
    }, { deadlineAt });

    const zeroTokens = isLocal;
    response.setHeader('X-Fahim-Gateway', task);
    if (zeroTokens) response.setHeader('X-Fahim-Zero-Tokens', 'true');

    logEvent('ai_gateway_task', {
      requestId,
      task,
      provider: result.provider || (isLocal ? 'local' : 'unknown'),
      model: result.model || (isLocal ? result.algorithm || 'n/a' : 'n/a'),
      zeroTokens,
      cacheHit: Boolean(result.cacheHit),
      fallbackUsed: Boolean(result.fallbackUsed),
      latencyMs: Date.now() - startedAt,
      inputTokens: Number(result.usage?.inputTokens || 0),
      outputTokens: Number(result.usage?.outputTokens || 0),
      costMicrousd: result.cost ?? null,
      routingFingerprint: getRoutingFingerprint(),
    });

    return send(response, 200, {
      ok: true,
      task,
      ...publicResult(result, isLocal),
      zeroTokens,
    });
  } catch (error) {
    if (error instanceof GatewayUnavailableError) {
      logEvent('ai_gateway_unavailable', {
        requestId,
        task,
        code: error.code,
        attempts: error.attempts,
      });
      if (error.code === 'providers-exhausted') {
        return send(response, 502, { ok: false, error: 'The learning assistant is temporarily unavailable. No canned answer was substituted.' });
      }
      if (error.code === 'embeddings-unavailable') {
        return send(response, 503, { ok: false, error: 'Embedding and rerank services are not available on this deployment. Reranking falls back to embedding-cosine in the retriever.' });
      }
      return send(response, 503, { ok: false, error: String(error.message || 'AI task unavailable').slice(0, 300) });
    }
    logEvent('ai_gateway_error', { requestId, task, code: error?.name || 'unexpected' });
    return send(response, 500, { ok: false, error: 'The AI gateway could not process the request.' });
  }
}

export { TASKS, estimateAICostMicrousd, getGatewayStatus, hfModelCascade, isHFConfigured, pipeLearningAIStream, readLearningAIResponse, requestLearningAI, routeForTask };
