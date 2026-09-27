import { authenticatedFetch } from '@/lib/supabase/client';

export interface AgentSource { citationId: string; title: string; authority?: string; url?: string; }
export interface AgentPendingItem { token: string; skill?: string; difficulty?: 'easy' | 'medium' | 'hard'; }
export interface AgentState {
  conceptKey: string;
  pendingItem?: AgentPendingItem | null;
  sources?: AgentSource[] | null;
  misconception?: { category: string; label: string } | null;
}
export interface AgentLearnerInput { itemToken?: string; answerIndex?: number; text?: string; }

export interface AgentRequest {
  goal: string;
  concept?: string;
  subject?: string;
  grade?: string;
  language: 'ar' | 'en';
  learnerInput?: AgentLearnerInput | null;
  priorState?: AgentState | null;
}

export interface AgentStepEvent { index: number; thought?: string; tool: string; args: Record<string, unknown>; }
export interface AgentObservationEvent { index: number; tool: string; observation: Record<string, unknown>; }
export interface AgentResult {
  conceptKey: string;
  awaiting: boolean;
  prompt: string | null;
  expects: 'choice' | 'text' | null;
  item: { token: string } | null;
  summary: string | null;
  mastery: number;
  masteryLabel: string;
  ability: number;
  attempts: number;
  state: AgentState;
}

export type AgentStreamEvent =
  | { type: 'meta'; generationId: string; conceptKey: string }
  | ({ type: 'step' } & AgentStepEvent)
  | ({ type: 'observation' } & AgentObservationEvent)
  | { type: 'result'; result: AgentResult }
  | { type: 'done' }
  | { type: 'error'; error: string };

export interface AgentHandlers {
  onMeta?: (generationId: string, conceptKey: string) => void;
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
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line) as AgentStreamEvent;
      if (event.type === 'meta') handlers.onMeta?.(event.generationId, event.conceptKey);
      else if (event.type === 'step') handlers.onStep?.(event);
      else if (event.type === 'observation') handlers.onObservation?.(event);
      else if (event.type === 'result') handlers.onResult?.(event.result);
      else if (event.type === 'error') throw new Error(event.error);
    }
  }
}
