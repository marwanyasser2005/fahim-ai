/**
 * Fahim Agent — HTTP handler (sub-route of /api/ai).
 *
 * Exposed as /api/agent via a vercel.json rewrite to /api/ai?route=agent, so it adds ZERO new
 * serverless functions (the deploy is at the Hobby 12-function ceiling). It reuses the same
 * security, auth, entitlement-metering, and NDJSON-streaming contract as /api/chat, and streams
 * the agent's plan→act→observe trace to the client as it happens.
 */

import { randomUUID } from 'node:crypto';
import { getAIStatus, estimateAICostMicrousd } from '../ai-routing.mjs';
import { AuthenticationError, createAdminClient, requireAuthenticatedUser, ServerConfigurationError } from '../supabase-auth.mjs';
import {
  applyApiHeaders,
  consumeRateLimit,
  isSameOrigin,
  logEvent,
  parseJsonBody,
  rejectRateLimit,
  RequestBodyError,
} from '../security.mjs';
import { runAgentTurn } from './orchestrator.mjs';
import { createAgentSession, loadAgentSession, saveAgentSession } from './memory.mjs';
import { consumeAiSession, refundAiSession } from '../entitlements.mjs';

function send(response, status, body) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.writeHead(status);
  response.end(JSON.stringify(body));
}

function ndjson(response, value) {
  response.write(`${JSON.stringify(value)}\n`);
}

function sanitizeLearnerInput(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const out = {};
  if (typeof raw.itemToken === 'string' && raw.itemToken.length <= 4000) out.itemToken = raw.itemToken;
  if (Number.isInteger(raw.answerIndex) && raw.answerIndex >= 0 && raw.answerIndex <= 3) out.answerIndex = raw.answerIndex;
  if (typeof raw.text === 'string' && raw.text.length <= 4000) out.text = raw.text;
  return Object.keys(out).length ? out : null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function agentHandler(request, response) {
  const requestId = applyApiHeaders(request, response);
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return send(response, 405, { error: 'Method not allowed' });
  }
  if (!isSameOrigin(request)) return send(response, 403, { error: 'Origin not allowed' });

  const rate = await consumeRateLimit(request, { namespace: 'agent', limit: 40, windowMs: 10 * 60 * 1000 });
  if (!rate.allowed) return rejectRateLimit(response, rate, send, 'Too many agent requests. Try again later.');
  response.setHeader('X-RateLimit-Remaining', String(rate.remaining));

  let auth;
  let admin;
  try {
    auth = await requireAuthenticatedUser(request);
    admin = createAdminClient();
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof ServerConfigurationError) return send(response, error.status, { error: error.message });
    return send(response, 500, { error: 'Authentication could not be verified.' });
  }
  if (!getAIStatus().configured) return send(response, 503, { error: 'AI is not configured yet.' });
  const secret = process.env.QUIZ_TOKEN_SECRET || process.env.QUIZ_SIGNING_SECRET;
  if (!secret || secret.length < 32) return send(response, 503, { error: 'Secure diagnostics are not configured.' });

  let body;
  try { body = parseJsonBody(request, { maxBytes: 32_000 }); }
  catch (error) {
    if (error instanceof RequestBodyError) return send(response, error.status, { error: error.message });
    return send(response, 400, { error: 'Invalid JSON body.' });
  }

  const requestedSessionId = UUID_RE.test(String(body.sessionId || '')) ? String(body.sessionId) : '';
  let session = requestedSessionId ? await loadAgentSession(admin, auth.user.id, requestedSessionId) : null;
  if (requestedSessionId && !session) return send(response, 404, { error: 'This learning session was not found or is no longer available.' });

  let goal = String(session?.goal || body.goal || body.concept || '').trim().slice(0, 400);
  let concept = String(session?.concept_key || body.concept || body.goal || '').trim().slice(0, 240);
  if (goal.length < 3) return send(response, 400, { error: 'A learning goal or concept is required.' });
  const language = (session?.language || body.language) === 'en' ? 'en' : 'ar';
  const subject = String(session?.subject || body.subject || '').slice(0, 80);
  const grade = String(session?.grade || body.grade || '').slice(0, 80);
  const learnerInput = sanitizeLearnerInput(body.learnerInput);
  const gate = await consumeAiSession(auth.client);
  if (gate.configError) return send(response, 503, { error: 'AI entitlements are not configured.' });
  if (!gate.allowed) return send(response, 429, { error: 'Your AI session allowance is exhausted. Review your plan or wait for the next reset.' });
  if (!session) {
    session = await createAgentSession(admin, auth.user.id, { conceptKey: concept, goal, subject, grade, language });
    if (!session) {
      await refundAiSession(auth.client, auth.user.id, gate.metered);
      return send(response, 503, { error: 'The secure agent session store is not ready. Please try again shortly.' });
    }
    goal = session.goal;
    concept = session.concept_key;
  }
  const priorState = session.state && typeof session.state === 'object' && Object.keys(session.state).length ? session.state : null;
  const stream = body.stream === true;
  const deadlineAt = Date.now() + 45_000;

  const generationId = randomUUID();
  const { error: generationInsertError } = await admin.from('ai_generations').insert({
    id: generationId,
    user_id: auth.user.id,
    task_type: 'agent',
    provider: 'fahim_router',
    model: 'agent-loop',
    prompt_text: goal.slice(0, 12000),
    status: stream ? 'streaming' : 'pending',
  }).then((result) => result, () => ({ error: new Error('generation_insert_failed') }));
  // The learning checkpoint is authoritative; observability must never break resumability.
  // Only attach the FK when the optional generation log row was actually accepted.
  const persistedGenerationId = generationInsertError ? null : generationId;
  if (generationInsertError) logEvent('agent_generation_log_skipped', { requestId, code: generationInsertError.code || 'insert_failed' });

  if (stream) {
    response.writeHead(200, {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Accel-Buffering': 'no',
    });
    ndjson(response, { type: 'meta', generationId, sessionId: session.id, conceptKey: concept });
  }

  try {
    const result = await runAgentTurn({
      admin,
      userId: auth.user.id,
      language,
      subject,
      grade,
      secret,
      goal,
      concept,
      learnerInput,
      priorState,
      deadlineAt,
      // A result makes the UI interactive. Hold it until the encrypted checkpoint has been
      // durably saved, otherwise a fast learner answer can race the database write.
      emit: stream ? (event) => {
        if (event.type === 'result') return;
        ndjson(response, event);
      } : undefined,
    });

    const usage = result.usage || { inputTokens: 0, outputTokens: 0 };
    const [, checkpointSave] = await Promise.all([
      admin.from('ai_generations').update({
        status: 'complete',
        model: 'agent-loop',
        result_text: (result.summary || result.prompt || '').slice(0, 12000),
        input_tokens: usage.inputTokens,
        output_tokens: usage.outputTokens,
        estimated_cost_microusd: estimateAICostMicrousd(usage, 'agent-router'),
        completed_at: new Date().toISOString(),
      }).eq('id', generationId).then(() => {}, () => {}),
      saveAgentSession(admin, auth.user.id, session.id, {
        state: result.checkpoint,
        stage: result.stage,
        status: result.awaiting ? 'awaiting' : 'completed',
        mastery: result.mastery,
        generationId: persistedGenerationId,
        completed: !result.awaiting,
      }),
    ]);

    if (!checkpointSave?.persisted) {
      await refundAiSession(auth.client, auth.user.id, gate.metered);
      if (stream) {
        ndjson(response, { type: 'error', error: language === 'ar' ? 'تعذّر حفظ حالة الجلسة بأمان. أعد المحاولة دون فقد أي رصيد.' : 'The session could not be saved safely. Try again; no allowance was consumed.' });
        return response.end();
      }
      return send(response, 503, { error: 'The secure agent checkpoint could not be saved. Please try again.' });
    }

    logEvent('agent_turn', { requestId, steps: result.steps?.length || 0, awaiting: result.awaiting, terminal: result.terminalTool, mastery: Math.round(result.mastery * 100) });

    if (stream) {
      ndjson(response, {
        type: 'result',
        result: { ...result, steps: undefined, checkpoint: undefined, sessionId: session.id },
      });
      ndjson(response, { type: 'done' });
      return response.end();
    }
    return send(response, 200, {
      ok: true,
      generationId,
      sessionId: session.id,
      conceptKey: result.conceptKey,
      awaiting: result.awaiting,
      prompt: result.prompt,
      expects: result.expects,
      item: result.item,
      summary: result.summary,
      mastery: result.mastery,
      masteryLabel: result.masteryLabel,
      ability: result.ability,
      attempts: result.attempts,
      steps: result.steps,
      state: result.state,
      stage: result.stage,
      confidence: result.confidence,
    });
  } catch (error) {
    logEvent('agent_turn_failed', { requestId, code: error?.name || 'error' });
    await admin.from('ai_generations').update({ status: 'error', error_code: error?.name || 'agent_error', completed_at: new Date().toISOString() }).eq('id', generationId).then(() => {}, () => {});
    await refundAiSession(auth.client, auth.user.id, gate.metered);
    if (!response.headersSent) return send(response, 502, { error: 'The learning agent is temporarily unavailable.' });
    ndjson(response, { type: 'error', error: 'The agent run was interrupted.' });
    return response.end();
  }
}
