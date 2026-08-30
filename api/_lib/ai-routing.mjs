const OFFICIAL_AGENT_ROUTER_BASE_URL = 'https://co.agentrouter.org/v1';
const DEFAULT_AGENT_ROUTER_MODEL = 'glm-5.1';
const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';
const DEFAULT_GEMINI_FALLBACK_MODEL = 'gemini-3.5-flash-lite';
const RETRYABLE_STATUSES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

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

function routeCandidates() {
  const configured = {
    'agent-router': Boolean(agentRouterKey()),
    gemini: Boolean(process.env.GEMINI_API_KEY),
  };
  const requested = String(process.env.AI_PROVIDER_ORDER || 'agent-router,gemini')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter((value) => Object.hasOwn(configured, value));
  return [...new Set([...requested, 'agent-router', 'gemini'])].filter((value) => configured[value]);
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
  return routeCandidates().map((provider) => {
    if (provider === 'agent-router') {
      return `${provider}:${process.env.AGENT_ROUTER_MODEL || DEFAULT_AGENT_ROUTER_MODEL}:${process.env.AGENT_ROUTER_FALLBACK_MODEL || ''}`;
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
  return [...new Set([
    process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
    process.env.GEMINI_FALLBACK_MODEL || DEFAULT_GEMINI_FALLBACK_MODEL,
  ].filter(Boolean))];
}

async function safeDiscard(response) {
  try { await response.body?.cancel(); }
  catch { /* The failed provider response is intentionally discarded. */ }
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
          : await callGemini({ model, system, messages, maxOutputTokens, structured, stream, timeoutMs });
        if (response.ok) return { response, provider, model, protocol: provider === 'agent-router' ? 'openai' : 'gemini' };
        attempts.push({ provider, model, status: response.status });
        await safeDiscard(response);
        const hasProviderFallback = index < models.length - 1;
        if (!hasProviderFallback && !RETRYABLE_STATUSES.has(response.status)) break;
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
  const prefix = provider === 'agent-router' ? 'AGENT_ROUTER' : 'GEMINI';
  const inputRate = Number(process.env[`${prefix}_INPUT_USD_PER_MILLION_TOKENS`] || process.env.AI_INPUT_USD_PER_MILLION_TOKENS);
  const outputRate = Number(process.env[`${prefix}_OUTPUT_USD_PER_MILLION_TOKENS`] || process.env.AI_OUTPUT_USD_PER_MILLION_TOKENS);
  if (!Number.isFinite(inputRate) || !Number.isFinite(outputRate) || inputRate < 0 || outputRate < 0) return null;
  return Math.round(Number(usage?.inputTokens || 0) * inputRate + Number(usage?.outputTokens || 0) * outputRate);
}

export const AI_ROUTING_DEFAULTS = Object.freeze({
  agentRouterBaseUrl: OFFICIAL_AGENT_ROUTER_BASE_URL,
  agentRouterModel: DEFAULT_AGENT_ROUTER_MODEL,
  geminiModel: DEFAULT_GEMINI_MODEL,
});
