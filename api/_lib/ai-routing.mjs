const OFFICIAL_AGENT_ROUTER_BASE_URL = 'https://co.agentrouter.org/v1';
const DEFAULT_AGENT_ROUTER_MODEL = 'glm-5.1';
const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';
const DEFAULT_GEMINI_FALLBACK_MODEL = 'gemini-3.5-flash-lite';
const RETRYABLE_STATUSES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

/* Hugging Face router — one token, many providers. The router itself resolves
   `:cheapest` / `:fastest` / `:publicai` routing suffixes and 402s when the
   account's monthly inference credits deplete; in that case the cascade below
   moves on to the next configured provider instead of failing the learner. */
const DEFAULT_HF_BASE_URL = 'https://router.huggingface.co/v1';
const DEFAULT_HF_MODELS = Object.freeze({
  free: 'swiss-ai/Apertus-v1.5-8B:publicai',
  chatFast: 'Qwen/Qwen3-4B-Instruct-2507:cheapest',
  chatReasoning: 'Qwen/Qwen3-8B:cheapest',
  vision: 'Qwen/Qwen3-VL-30B-A3B-Instruct:cheapest',
  guard: 'meta-llama/Llama-Guard-4-12B:cheapest',
});
const RETRYABLE_HF_STATUSES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

export class AIProviderExhaustedError extends Error {
  constructor(attempts = []) {
    super('All configured AI routes are unavailable.');
    this.name = 'AIProviderExhaustedError';
    this.attempts = attempts;
  }
}

function cleanBaseUrl(value) {
  const raw = String(value || OFFICIAL_AGENT_ROUTER_BASE_URL).trim().replace(/\/+$/, '');
  let parsed;
  try { parsed = new URL(raw); }
  catch { throw new Error('AGENT_ROUTER_BASE_URL must be a valid HTTPS URL.'); }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
    throw new Error('AGENT_ROUTER_BASE_URL must use HTTPS without embedded credentials.');
  }
  return parsed.toString().replace(/\/$/, '');
}

function agentRouterKey() {
  return process.env.AGENT_ROUTER_API_KEY || process.env.AGENTROUTER_API_KEY || '';
}

function hfKey() {
  return process.env.HF_TOKEN || '';
}

function hfModels() {
  // Router-verified model names (checked against /v1/models on 2026-09-16).
  // HF_MODEL_* environment variables remain the override surface, so swapping
  // to Qwen4 / Gemma5 / Apertus2 later is a config change, not a code change.
  return {
    free: process.env.HF_MODEL_FREE || DEFAULT_HF_MODELS.free,
    chatFast: process.env.HF_MODEL_CHAT_FAST || DEFAULT_HF_MODELS.chatFast,
    chatReasoning: process.env.HF_MODEL_CHAT_REASONING || DEFAULT_HF_MODELS.chatReasoning,
    vision: process.env.HF_MODEL_VISION_FREE || process.env.HF_MODEL_VISION_FALLBACK || DEFAULT_HF_MODELS.vision,
    guard: process.env.HF_MODEL_GUARD || DEFAULT_HF_MODELS.guard,
  };
}

function hfModelCascade() {
  const models = hfModels();
  const configured = String(process.env.HF_MODEL_CASCADE || 'free,chatFast,chatReasoning').split(',').map((value) => value.trim()).filter(Boolean);
  const ordered = configured.map((key) => models[key]).filter(Boolean);
  return [...new Set([...ordered, models.free, models.chatFast, models.chatReasoning].filter(Boolean))];
}

export { hfModelCascade };

function routeCandidates() {
  const configured = {
    'agent-router': Boolean(agentRouterKey()),
    gemini: Boolean(process.env.GEMINI_API_KEY),
    hf: Boolean(hfKey()),
  };
  const freeFirst = String(process.env.HF_FREE_FIRST || '').toLowerCase() === 'true';
  const defaultOrder = freeFirst ? 'hf,agent-router,gemini' : 'agent-router,gemini,hf';
  const requested = String(process.env.AI_PROVIDER_ORDER || defaultOrder)
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter((value) => Object.hasOwn(configured, value));
  return [...new Set([...requested, 'agent-router', 'gemini', 'hf'])].filter((value) => configured[value]);
}

export function getAIStatus() {
  const routes = routeCandidates();
  return {
    configured: routes.length > 0,
    providerCount: routes.length,
    redundancyConfigured: routes.length > 1,
  };
}

export function getRoutingFingerprint() {
  const models = hfModels();
  return routeCandidates().map((provider) => {
    if (provider === 'agent-router') {
      return `${provider}:${process.env.AGENT_ROUTER_MODEL || DEFAULT_AGENT_ROUTER_MODEL}:${process.env.AGENT_ROUTER_FALLBACK_MODEL || ''}`;
    }
    if (provider === 'hf') {
      return `${provider}:${process.env.HF_MODEL_CASCADE ? 'custom' : 'default'}:${[models.free, models.chatFast, models.chatReasoning].join('|')}`;
    }
    return `${provider}:${process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL}:${process.env.GEMINI_FALLBACK_MODEL || DEFAULT_GEMINI_FALLBACK_MODEL}`;
  }).join('|');
}

function normalizeMessages(messages) {
  return (Array.isArray(messages) ? messages : [])
    .map((message) => ({
      role: message?.role === 'assistant' ? 'assistant' : 'user',
      content: String(message?.content || '').trim(),
    }))
    .filter((message) => message.content);
}

function geminiPayload({ system, messages, maxOutputTokens, structured }) {
  const payload = {
    system_instruction: { parts: [{ text: String(system || '') }] },
    contents: normalizeMessages(messages).map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    })),
    generationConfig: {
      maxOutputTokens,
      ...(structured ? { responseMimeType: 'application/json' } : {}),
    },
    safetySettings: [
      'HARM_CATEGORY_HARASSMENT',
      'HARM_CATEGORY_HATE_SPEECH',
      'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      'HARM_CATEGORY_DANGEROUS_CONTENT',
    ].map((category) => ({ category, threshold: 'BLOCK_MEDIUM_AND_ABOVE' })),
  };
  return payload;
}

async function callGemini({ model, system, messages, maxOutputTokens, structured, stream, timeoutMs }) {
  const method = stream ? 'streamGenerateContent?alt=sse' : 'generateContent';
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify(geminiPayload({ system, messages, maxOutputTokens, structured })),
    signal: AbortSignal.timeout(timeoutMs),
  });
}

async function callAgentRouter({ model, system, messages, maxOutputTokens, structured, stream, timeoutMs }) {
  const baseUrl = cleanBaseUrl(process.env.AGENT_ROUTER_BASE_URL);
  return fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${agentRouterKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: String(system || '') },
        ...normalizeMessages(messages),
      ],
      max_tokens: maxOutputTokens,
      stream,
      ...(stream ? { stream_options: { include_usage: true } } : {}),
      ...(structured ? { response_format: { type: 'json_object' } } : {}),
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
}

function providerModels(provider) {
  if (provider === 'agent-router') {
    return [...new Set([
      process.env.AGENT_ROUTER_MODEL || DEFAULT_AGENT_ROUTER_MODEL,
      process.env.AGENT_ROUTER_FALLBACK_MODEL,
    ].filter(Boolean))];
  }
  if (provider === 'hf') {
    return hfModelCascade();
  }
  return [...new Set([
    process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
    process.env.GEMINI_FALLBACK_MODEL || DEFAULT_GEMINI_FALLBACK_MODEL,
  ].filter(Boolean))];
}

async function safeDiscard(response) {
  try { await response.body?.cancel(); }
  catch { /* The failed provider response is intentionally discarded. */ }
}

function cleanHFBaseUrl(value) {
  const raw = String(value || DEFAULT_HF_BASE_URL).trim().replace(/\/+$/, '');
  let parsed;
  try { parsed = new URL(raw); }
  catch { throw new Error('HF_BASE_URL must be a valid HTTPS URL.'); }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
    throw new Error('HF_BASE_URL must use HTTPS without embedded credentials.');
  }
  return parsed.toString().replace(/\/$/, '');
}

function hfContentParts(messages) {
  // The HF router speaks OpenAI chat/completions; multimodal turns arrive as
  // content parts only when the caller supplies image input.
  return normalizeMessages(messages).map((message) => ({ role: message.role, content: message.content }));
}

async function callHF({ model, system, messages, maxOutputTokens, structured, stream, timeoutMs }) {
  const baseUrl = cleanHFBaseUrl(process.env.HF_BASE_URL);
  return fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${hfKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: String(system || '') },
        ...hfContentParts(messages),
      ],
      max_tokens: maxOutputTokens,
      stream,
      ...(stream ? { stream_options: { include_usage: true } } : {}),
      ...(structured ? { response_format: { type: 'json_object' } } : {}),
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
}

export async function requestHFEmbeddings(inputs, { deadlineAt = Number.POSITIVE_INFINITY } = {}) {
  if (!hfKey()) throw new AIProviderExhaustedError([{ provider: 'hf', status: 503 }]);
  const values = (Array.isArray(inputs) ? inputs : [inputs])
    .map((value) => String(value || '').trim().slice(0, 4000))
    .filter(Boolean)
    .slice(0, 24);
  if (!values.length) throw new Error('At least one non-empty embedding input is required.');
  const remainingMs = deadlineAt - Date.now();
  if (remainingMs <= 750) throw new AIProviderExhaustedError([{ provider: 'hf', status: 408 }]);
  const model = process.env.HF_EMBEDDING_MODEL || 'intfloat/multilingual-e5-large';
  const response = await fetch(`${cleanHFBaseUrl(process.env.HF_BASE_URL)}/hf-inference/models/${model}/pipeline/feature-extraction`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${hfKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: values, normalize: true, truncate: true, truncation_direction: 'right' }),
    signal: AbortSignal.timeout(Math.max(750, Math.min(20_000, remainingMs))),
  });
  if (!response.ok) {
    await safeDiscard(response);
    throw new AIProviderExhaustedError([{ provider: 'hf', status: response.status }]);
  }
  const payload = await response.json();
  const vectors = Array.isArray(payload?.[0]) ? payload : [payload];
  if (vectors.length !== values.length || vectors.some((vector) => !Array.isArray(vector) || !vector.length)) {
    throw new Error('The embedding provider returned an invalid vector shape.');
  }
  return { vectors, provider: 'hf', model };
}

export async function requestLearningAI({ system, messages, maxOutputTokens = 2400, structured = false, stream = false, deadlineAt = Number.POSITIVE_INFINITY }) {
  const routes = routeCandidates();
  if (!routes.length) throw new AIProviderExhaustedError([{ provider: 'none', status: 503 }]);
  const attempts = [];
  providerLoop: for (const provider of routes) {
    const models = providerModels(provider);
    for (let index = 0; index < models.length; index += 1) {
      const remainingMs = deadlineAt - Date.now();
      if (remainingMs <= 750) break providerLoop;
      const timeoutMs = Math.max(500, Math.min(stream ? 30_000 : 24_000, remainingMs - 250));
      const model = models[index];
      try {
        const response = provider === 'agent-router'
          ? await callAgentRouter({ model, system, messages, maxOutputTokens, structured, stream, timeoutMs })
          : provider === 'hf'
            ? await callHF({ model, system, messages, maxOutputTokens, structured, stream, timeoutMs })
            : await callGemini({ model, system, messages, maxOutputTokens, structured, stream, timeoutMs });
        if (response.ok) return { response, provider, model, protocol: provider === 'gemini' ? 'gemini' : 'openai' };
        // 402 means the HF account's monthly included credits are depleted;
        // the cascade moves on rather than burning the whole deadline.
        attempts.push({ provider, model, status: response.status });
        await safeDiscard(response);
        const hasProviderFallback = index < models.length - 1;
        const retryable = provider === 'hf'
          ? (RETRYABLE_HF_STATUSES.has(response.status) || response.status === 402)
          : RETRYABLE_STATUSES.has(response.status);
        if (!hasProviderFallback && !retryable) break;
      } catch (error) {
        attempts.push({ provider, model, status: 0, code: error?.name || 'network_error' });
      }
    }
  }
  throw new AIProviderExhaustedError(attempts);
}

function openAIText(value) {
  if (typeof value === 'string') return value;
  if (!Array.isArray(value)) return '';
  return value.map((part) => typeof part === 'string' ? part : String(part?.text || '')).join('');
}

function normalizedUsage(data, protocol) {
  if (protocol === 'gemini') {
    return {
      inputTokens: Number(data?.usageMetadata?.promptTokenCount || 0),
      outputTokens: Number(data?.usageMetadata?.candidatesTokenCount || 0),
    };
  }
  return {
    inputTokens: Number(data?.usage?.prompt_tokens || data?.usage?.input_tokens || 0),
    outputTokens: Number(data?.usage?.completion_tokens || data?.usage?.output_tokens || 0),
  };
}

export async function readLearningAIResponse(route) {
  const data = await route.response.json();
  const text = route.protocol === 'gemini'
    ? data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim()
    : openAIText(data.choices?.[0]?.message?.content).trim();
  return { text, usage: normalizedUsage(data, route.protocol) };
}

function parseSseBlock(block) {
  return block
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .join('');
}

function streamDelta(event, protocol) {
  if (protocol === 'gemini') {
    return event.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
  }
  return openAIText(event.choices?.[0]?.delta?.content);
}

export async function pipeLearningAIStream(route, onDelta) {
  if (!route.response.body) throw new Error('The AI route returned no stream.');
  const reader = route.response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  let usage = { inputTokens: 0, outputTokens: 0 };
  const consume = (block) => {
    const raw = parseSseBlock(block);
    if (!raw || raw === '[DONE]') return;
    try {
      const event = JSON.parse(raw);
      const delta = streamDelta(event, route.protocol);
      if (delta) {
        text += delta;
        onDelta(delta);
      }
      const currentUsage = normalizedUsage(event, route.protocol);
      if (currentUsage.inputTokens || currentUsage.outputTokens) usage = currentUsage;
    } catch {
      // Provider keep-alives and incomplete events are ignored safely.
    }
  };
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() || '';
    blocks.forEach(consume);
  }
  if (buffer.trim()) consume(buffer);
  return { text, usage };
}

export function estimateAICostMicrousd(usage, provider) {
  const prefix = provider === 'agent-router' ? 'AGENT_ROUTER' : provider === 'hf' ? 'HF' : 'GEMINI';
  const inputRate = Number(process.env[`${prefix}_INPUT_USD_PER_MILLION_TOKENS`] || process.env.AI_INPUT_USD_PER_MILLION_TOKENS);
  const outputRate = Number(process.env[`${prefix}_OUTPUT_USD_PER_MILLION_TOKENS`] || process.env.AI_OUTPUT_USD_PER_MILLION_TOKENS);
  if (!Number.isFinite(inputRate) || !Number.isFinite(outputRate) || inputRate < 0 || outputRate < 0) return null;
  return Math.round(Number(usage?.inputTokens || 0) * inputRate + Number(usage?.outputTokens || 0) * outputRate);
}

export const AI_ROUTING_DEFAULTS = Object.freeze({
  agentRouterBaseUrl: OFFICIAL_AGENT_ROUTER_BASE_URL,
  agentRouterModel: DEFAULT_AGENT_ROUTER_MODEL,
  geminiModel: DEFAULT_GEMINI_MODEL,
  hfBaseUrl: DEFAULT_HF_BASE_URL,
  hfModels: DEFAULT_HF_MODELS,
});
