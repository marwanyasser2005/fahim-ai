import {
  estimateAICostMicrousd,
  getAIStatus,
  getRoutingFingerprint,
  hfModelCascade,
  pipeLearningAIStream,
  readLearningAIResponse,
  requestLearningAI,
  GatewayUnavailableError,
  TASKS,
  executeGatewayTask,
  getGatewayStatus,
  isHFConfigured,
  routeForTask,
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

const TASK_ALIASES = {
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
};

export default async function handler(request, response) {
  const requestId = applyApiHeaders(request, response);
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return send(response, 405, { error: 'Method not allowed' });
  }
  if (!isSameOrigin(request)) return send(response, 403, { error: 'Origin not allowed' });

  let body;
  try {
    body = parseJsonBody(request, { maxBytes: 64_000 });
  } catch (error) {
    if (error instanceof RequestBodyError) return send(response, error.status, { error: error.message });
    return send(response, 400, { error: 'Invalid JSON body.' });
  }

  const rawTask = String(body.task || '').trim().toLowerCase();
  const task = TASK_ALIASES[rawTask] || TASK_ALIASES[String(rawTask).slice(0, 24)] || null;
  if (!task) {
    return send(response, 400, {
      error: 'Unknown task.',
      supported: Object.values(TASKS),
    });
  }

  const isLocal = routeForTask(task).kind === 'local';
  const namespace = isLocal ? `ai-${task}` : `ai-provider-${task}`;
  const rate = await consumeRateLimit(request, {
    namespace,
    limit: isLocal ? 300 : 60,
    windowMs: 10 * 60 * 1000,
  });
  if (!rate.allowed) return rejectRateLimit(response, rate, send);
  response.setHeader('X-RateLimit-Remaining', String(rate.remaining));

  if (!isLocal) {
    const status = getGatewayStatus();
    if (!status.configured) {
      return send(response, 503, {
        error: 'AI is not configured yet.',
        gateway: { configured: false },
      });
    }
    try {
      await requireAuthenticatedUser(request);
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof ServerConfigurationError) {
        return send(response, error.status, { error: error.message });
      }
      return send(response, 500, { error: 'Authentication could not be verified.' });
    }
  }

  // The function is capped at 60s; local tasks finish in milliseconds, so the
  // real budget goes to provider cascades — and the cascade itself must never
  // outlive the function.
  const deadlineAt = isLocal ? Date.now() + 5_000 : Date.now() + 50_000;

  try {
    const result = await executeGatewayTask({
      ...body,
      task,
      onDelta: undefined,
      deadlineAt,
    }, { deadlineAt });
    response.setHeader('X-Fahim-Task', task);
    if (routeForTask(task).kind === 'local') {
      response.setHeader('X-Fahim-Zero-Tokens', 'true');
    }
    return send(response, 200, { ok: true, ...publicResult(result, isLocal) });
  } catch (error) {
    if (error instanceof GatewayUnavailableError) {
      logEvent('ai_gateway_unavailable', {
        requestId,
        task,
        code: error.code,
        attempts: error.attempts,
      });
      if (error.code === 'providers-exhausted') {
        return send(response, 502, { ok: false, error: 'The learning assistant is temporarily unavailable.' });
      }
      if (error.code === 'embeddings-unavailable') {
        return send(response, 503, { ok: false, error: 'Embedding/rerank service is not available on this deployment.' });
      }
      return send(response, 503, { ok: false, error: String(error.message || 'AI task unavailable').slice(0, 300) });
    }
    logEvent('ai_gateway_error', { requestId, task, code: error?.name || 'unexpected' });
    return send(response, 500, { ok: false, error: 'The AI gateway could not process the request.' });
  }
}

export {
  TASKS,
  estimateAICostMicrousd,
  getAIStatus,
  getGatewayStatus,
  getRoutingFingerprint,
  hfModelCascade,
  isHFConfigured,
  pipeLearningAIStream,
  readLearningAIResponse,
  requestLearningAI,
  routeForTask,
};
