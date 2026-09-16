import { AIProviderExhaustedError, estimateAICostMicrousd, getAIStatus, getRoutingFingerprint, hfModelCascade, pipeLearningAIStream, readLearningAIResponse, requestHFEmbeddings, requestLearningAI } from './ai-routing.mjs';
import { bktObserve, bktExpectedCorrect, fsrsIsDue, fsrsSchedule, irtObserve, irtProbability, newBktState, newIrtState, selectNextItem } from './learning.mjs';

/**
 * Fahim Hugging Face AI Gateway — task routing layer.
 *
 * The frontend never sees model or provider names. It asks for a task and
 * this module picks the cheapest correct tool:
 *
 *   - Deterministic local algorithms (BKT / IRT / FSRS): zero tokens, always.
 *   - Chat / vision / reasoning / safety: the shared provider cascade —
 *     Hugging Face router first when HF_TOKEN is set (FREE-first route,
 *     then cheap, then strong), then the legacy routes, so Fahim keeps
 *     working when any single provider depletes or fails.
 *   - Guard: model-first with local rules as the emergency floor, because
 *     safety must never take the door down when a provider is out.
 *
 * Every response keeps the public contract: no provider or model names leak
 * into client-visible fields beyond the neutral `provider`/`model` route
 * tags already used by chat.mjs/quiz.mjs.
 */

export const TASKS = Object.freeze({
  CHAT: 'chat',
  VISION: 'vision',
  GUARD: 'guard',
  EMBED: 'embed',
  RERANK: 'rerank',
  SPEECH: 'speech_to_text',
  MASTERY: 'mastery_update',
  IRT: 'irt_probability',
  REVIEW: 'review_schedule',
});

function localGuard(text) {
  // Emergency rules only: when the safety model is reachable it is the
  // authority; these keep the door closed when that provider is down.
  const blocked = [
    /api[_\s-]?key\b/i,
    /secret[_\s-]?key\b/i,
    /(?:ignore|disregard|override)\s+(all\s+)?(?:previous|prior|above|earlier)\s+(instructions?|rules?|context)/i,
    /system\s+(prompt|instructions)/i,
    /reveal\s+(the\s+)?(hidden|internal)\s+(instructions?|prompts?|rules?)/i,
    /\b(supabase|vercel|service_?role|jwt|bearer)\s+[a-z0-9+/-_]{16,}/i,
  ];
  const value = String(text || '');
  const isUnsafe = blocked.some((pattern) => pattern.test(value));
  return { label: isUnsafe ? 'Unsafe' : 'Safe', source: 'local-rules' };
}

export function isHFConfigured() {
  return Boolean(process.env.HF_TOKEN);
}

/** Neutral status for /api/health — provider/model names are intentionally absent. */
export function getGatewayStatus() {
  const shared = getAIStatus();
  return {
    configured: shared.configured,
    providerCount: shared.providerCount,
    redundancyConfigured: shared.redundancyConfigured,
    freeFirst: String(process.env.HF_FREE_FIRST || '').toLowerCase() === 'true',
    localAlgorithms: Object.freeze({ bkt: true, irt: true, fsrs: true }),
  };
}

export function routeForTask(task, { reasoning = false, vision = false } = {}) {
  switch (task) {
    case TASKS.MASTERY:
      return { kind: 'local', algorithm: 'bkt' };
    case TASKS.IRT:
      return { kind: 'local', algorithm: 'irt' };
    case TASKS.REVIEW:
      return { kind: 'local', algorithm: 'fsrs' };
    case TASKS.GUARD:
      return { kind: 'guard' };
    case TASKS.EMBED:
    case TASKS.RERANK:
      return { kind: 'embedding' };
    default:
      return {
        kind: 'provider',
        cascade: reasoning ? ['free', 'chatReasoning'] : ['free', 'chatFast', 'chatReasoning'],
        vision,
      };
  }
}

/**
 * Execute one gateway task. Local tasks never touch a provider; provider
 * tasks run through the shared cascade with the deadline budget so a slow
 * failover can never outlive the hosting function.
 */
export async function executeGatewayTask(request, { deadlineAt = Number.POSITIVE_INFINITY } = {}) {
  const task = request?.task;
  const route = routeForTask(task, { reasoning: request?.mode === 'reasoning' || request?.reasoning === true, vision: request?.attachments?.length > 0 || task === TASKS.VISION });

  switch (route.kind) {
    case 'local':
      return { task, ...runLocalTask(task, request) };
    case 'guard':
      return { task, ...(await runGuard(request, deadlineAt)) };
    case 'embedding':
      return { task, ...(await runEmbeddingTask(task, request, deadlineAt)) };
    default:
      return { task, ...(await runProviderTask(route, request, deadlineAt)) };
  }
}

function cosineSimilarity(left, right) {
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    dot += left[index] * right[index];
    leftNorm += left[index] * left[index];
    rightNorm += right[index] * right[index];
  }
  return leftNorm && rightNorm ? dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm)) : 0;
}

async function runEmbeddingTask(task, request, deadlineAt) {
  if (!isHFConfigured()) {
    throw new GatewayUnavailableError('embeddings-unavailable', 'The semantic retrieval service is not configured.');
  }
  try {
    if (task === TASKS.EMBED) {
      const inputs = Array.isArray(request.inputs) ? request.inputs : [request.input || request.message];
      const { vectors, provider, model } = await requestHFEmbeddings(inputs, { deadlineAt });
      return { embeddings: vectors, dimensions: vectors[0]?.length || 0, usage: { inputTokens: 0, outputTokens: 0 }, provider, model };
    }
    const query = String(request.query || '').trim().slice(0, 2000);
    const documents = (Array.isArray(request.documents) ? request.documents : [])
      .map((document, index) => ({ id: String(document?.id ?? index).slice(0, 100), text: String(document?.text ?? document ?? '').trim().slice(0, 4000), index }))
      .filter((document) => document.text)
      .slice(0, 20);
    if (!query || !documents.length) throw new Error('Rerank requires a query and at least one document.');
    const { vectors, provider, model } = await requestHFEmbeddings([
      `query: ${query}`,
      ...documents.map((document) => `passage: ${document.text}`),
    ], { deadlineAt });
    const [queryVector, ...documentVectors] = vectors;
    const rankings = documents
      .map((document, index) => ({ id: document.id, index: document.index, score: round3(cosineSimilarity(queryVector, documentVectors[index])) }))
      .sort((left, right) => right.score - left.score);
    return { rankings, usage: { inputTokens: 0, outputTokens: 0 }, provider, model };
  } catch (error) {
    if (error instanceof GatewayUnavailableError) throw error;
    throw new GatewayUnavailableError('embeddings-unavailable', 'The semantic retrieval service is temporarily unavailable.');
  }
}

function runLocalTask(task, request) {
  switch (task) {
    case TASKS.MASTERY: {
      const correct = Boolean(request.correct);
      const priorMastery = typeof request.priorMastery === 'number' ? request.priorMastery : null;
      const state = priorMastery === null ? null : {
        mastery: priorMastery,
        attempts: Number.isFinite(request.attempts) ? request.attempts : 0,
        correct: Number.isFinite(request.correctCount) ? request.correctCount : 0,
      };
      const result = bktObserve(state, correct);
      return {
        algorithm: 'bkt',
        prior: round3(result.before),
        posteriorBeforeLearning: round3(result.posterior),
        mastery: round3(result.after),
        expectedNext: round3(bktExpectedCorrect(result.state)),
        state: result.state,
      };
    }
    case TASKS.IRT: {
      const ability = typeof request.theta === 'number' ? request.theta : newIrtState().ability;
      const difficulty = typeof request.difficulty === 'number' ? request.difficulty : 0;
      const discrimination = typeof request.discrimination === 'number' ? request.discrimination : 1;
      if (request.next !== undefined && Array.isArray(request.items) && request.items.length) {
        const items = request.items.map((item) => ({
          id: String(item?.id ?? '').slice(0, 64),
          difficulty: Number(item?.difficulty ?? 0),
          discrimination: Number(item?.discrimination ?? 1),
        }));
        const next = selectNextItem(ability, items);
        return {
          algorithm: 'irt',
          ability: round3(ability),
          nextItem: next?.id ?? null,
          nextProbability: next ? round3(irtProbability(ability, next)) : null,
        };
      }
      return {
        algorithm: 'irt',
        ability: round3(ability),
        difficulty,
        probability: round3(irtProbability(ability, { difficulty, discrimination })),
      };
    }
    case TASKS.REVIEW: {
      const rating = ['again', 'hard', 'good', 'easy'].includes(request.rating) ? request.rating : 'good';
      const card = request.card && typeof request.card === 'object' ? request.card : null;
      const result = fsrsSchedule(card, rating);
      return { algorithm: 'fsrs', ...result, dueNow: card ? fsrsIsDue(result.nextReviewAt) : false };
    }
    default:
      throw new GatewayUnavailableError('unknown-local-task', 'Unknown local task.');
  }
}

async function runGuard(request, deadlineAt) {
  const message = String(request.message || '').slice(0, 4000);
  const modelConfigured = isHFConfigured() && process.env.HF_GUARD_MODEL;
  if (modelConfigured) {
    try {
      const route = await requestLearningAI({
        system: 'You classify learner input for safety. Reply with exactly one label and nothing else: Safe, Controversial, or Unsafe.',
        messages: [{ role: 'user', content: message }],
        maxOutputTokens: 16,
        deadlineAt,
      });
      const { text } = await readLearningAIResponse(route);
      const normalized = text.toLowerCase();
      const label = normalized.includes('unsafe') ? 'Unsafe' : normalized.includes('controversial') ? 'Controversial' : 'Safe';
      return { blocked: label === 'Unsafe', label, source: 'guard-model' };
    } catch {
      // Provider down — fall through to the local rules. Safety must never
      // take the door down with it.
    }
  }
  const local = localGuard(message);
  return { blocked: local.label === 'Unsafe', ...local };
}

async function runProviderTask(route, request, deadlineAt) {
  const system = String(request.system || 'You are FAHIM, a verified learning tutor. Ground every claim in the supplied context and never invent sources.');
  const rawMessages = Array.isArray(request.messages) && request.messages.length
    ? request.messages
    : [{ role: 'user', content: String(request.message || '') }];
  const messages = rawMessages
    .map((item) => ({ role: item?.role === 'assistant' ? 'assistant' : 'user', content: String(item?.content || '') }))
    .filter((item) => item.content)
    .slice(-16);
  const structured = Boolean(request.structured);
  const stream = Boolean(request.stream);

  try {
    const providerRoute = await requestLearningAI({
      system,
      messages,
      maxOutputTokens: typeof request.maxOutputTokens === 'number' ? Math.max(64, Math.min(8000, request.maxOutputTokens)) : 2400,
      structured,
      stream,
      deadlineAt,
    });
    if (stream && typeof request.onDelta === 'function') {
      const { text, usage } = await pipeLearningAIStream(providerRoute, request.onDelta);
      return {
        answer: text,
        usage,
        provider: providerRoute.provider,
        model: providerRoute.model,
        cost: estimateAICostMicrousd(usage, providerRoute.provider),
      };
    }
    const { text, usage } = await readLearningAIResponse(providerRoute);
    return {
      answer: text,
      structured: structured ? parseJsonLoose(text) : undefined,
      usage,
      provider: providerRoute.provider,
      model: providerRoute.model,
      cost: estimateAICostMicrousd(usage, providerRoute.provider),
    };
  } catch (error) {
    if (error instanceof AIProviderExhaustedError) {
      throw new GatewayUnavailableError('providers-exhausted', 'All AI routes are unavailable.', error.attempts?.length || 0);
    }
    throw new GatewayUnavailableError('provider-error', 'The AI provider could not complete the task.', 0);
  }
}

function parseJsonLoose(raw) {
  const text = String(raw || '').trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function round3(value) {
  return Math.round(Number(value) * 1000) / 1000;
}

export class GatewayUnavailableError extends Error {
  constructor(code, message, attempts = 0) {
    super(message);
    this.name = 'GatewayUnavailableError';
    this.code = code;
    this.attempts = attempts;
  }
}

// Re-export the items imported from ai-routing.mjs and learning.mjs so that
// api/ai.mjs can consume the whole gateway surface from a single module.
// The symbols declared and exported inline above (TASKS, isHFConfigured,
// getGatewayStatus, routeForTask, executeGatewayTask, GatewayUnavailableError)
// are already exported at their declarations and must NOT be re-exported here.
export {
  AIProviderExhaustedError,
  estimateAICostMicrousd,
  getAIStatus,
  getRoutingFingerprint,
  hfModelCascade,
  pipeLearningAIStream,
  readLearningAIResponse,
  requestLearningAI,
  requestHFEmbeddings,
  newBktState,
  newIrtState,
};
