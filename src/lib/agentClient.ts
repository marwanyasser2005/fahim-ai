import { authenticatedFetch } from '@/lib/supabase/client';

export type AgentStage = 'discover' | 'diagnose' | 'teach' | 'prove' | 'remember' | 'complete';
export interface AgentSource { citationId: string; title: string; authority?: string; kind?: string; excerpt?: string; owner?: string; verifiedAt?: string | null; url?: string; }
export interface AgentState {
  conceptKey: string;
  sources?: AgentSource[] | null;
  misconception?: { category: string; label: string } | null;
  explanation?: string;
  review?: { due?: string; nextReviewAt?: string; intervalDays?: number } | null;
}
export interface AgentLearnerInput { answerIndex?: number; text?: string; reasoning?: string; }

export interface AgentRequest {
  goal: string;
  concept?: string;
  subject?: string;
  grade?: string;
  language: 'ar' | 'en';
  sessionId?: string | null;
  learnerInput?: AgentLearnerInput | null;
  sourceContext?: { id: string; title: string; text: string }[];
}

export interface AgentStepEvent { index: number; reasonCode?: string; phase?: AgentStage; tool: string; args: Record<string, unknown>; }
export interface AgentObservationEvent { index: number; phase?: AgentStage; tool: string; observation: Record<string, unknown>; }
export interface AgentResult {
  sessionId: string;
  conceptKey: string;
  awaiting: boolean;
  prompt: string | null;
  expects: 'choice' | 'text' | null;
  item: { question?: string; options?: string[]; skill?: string; difficulty?: 'easy' | 'medium' | 'hard' } | null;
  summary: string | null;
  mastery: number;
  masteryLabel: string;
  ability: number;
  attempts: number;
  stage: AgentStage;
  confidence: number;
  state: AgentState;
}

export type AgentStreamEvent =
  | { type: 'meta'; generationId: string; sessionId: string; conceptKey: string }
  | ({ type: 'step' } & AgentStepEvent)
  | ({ type: 'observation' } & AgentObservationEvent)
  | { type: 'result'; result: AgentResult }
  | { type: 'done' }
  | { type: 'error'; error: string };

export interface AgentHandlers {
  onMeta?: (generationId: string, sessionId: string, conceptKey: string) => void;
  onStep?: (step: AgentStepEvent) => void;
  onObservation?: (observation: AgentObservationEvent) => void;
  onResult?: (result: AgentResult) => void;
}

/**
 * Stream one agent turn as newline-delimited JSON, surfacing the live plan→act→observe trace.
 * Mirrors streamFahim so it shares the app's session-recovery fetch and Bearer injection.
 */
export async function streamAgent(request: AgentRequest, handlers: AgentHandlers, signal?: AbortSignal): Promise<void> {
  const response = await authenticatedFetch('/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...request, stream: true }),
    signal,
  });
  if (!response.ok || !response.body) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error || 'The learning agent is unavailable');
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const dispatch = (line: string) => {
    if (!line.trim()) return;
    const event = JSON.parse(line) as AgentStreamEvent;
    if (event.type === 'meta') handlers.onMeta?.(event.generationId, event.sessionId, event.conceptKey);
    else if (event.type === 'step') handlers.onStep?.(event);
    else if (event.type === 'observation') handlers.onObservation?.(event);
    else if (event.type === 'result') handlers.onResult?.(event.result);
    else if (event.type === 'error') throw new Error(event.error);
  };
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      dispatch(line);
    }
  }
  buffer += decoder.decode();
  if (buffer.trim()) dispatch(buffer);
}
