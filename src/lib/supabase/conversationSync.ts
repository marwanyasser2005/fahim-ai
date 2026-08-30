import { supabase } from '@/lib/supabase/client';
import type { ChatMessage, Conversation } from '@/lib/conversations';

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

type CloudMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: ChatMessage['sources'];
  attachments?: { type?: string; generationId?: string }[];
  is_favorite?: boolean;
  feedback?: -1 | 1 | null;
  created_at: string;
};
type CloudConversation = {
  id: string;
  title: string;
  folder: string;
  subject: string;
  learner_level: string;
  mode: Conversation['tutorMode'];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  chat_history?: CloudMessage[];
};

export async function loadCloudConversations(ownerId: string): Promise<Conversation[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('conversations')
    .select('id,title,folder,subject,learner_level,mode,is_pinned,created_at,updated_at,chat_history(id,role,content,citations,attachments,is_favorite,feedback,created_at)')
    .eq('user_id', ownerId)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false })
    .limit(100);
  if (error || !data) return [];
  return (data as CloudConversation[]).map((item) => ({
    id: item.id,
    title: item.title,
    folder: item.folder || '',
    pinned: item.is_pinned,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    grade: item.learner_level || '',
    subject: item.subject || '',
    tutorMode: item.mode || 'explain',
    messages: (item.chat_history || []).sort((a, b) => a.created_at.localeCompare(b.created_at)).map((message) => ({
      id: message.id,
      role: message.role,
      text: message.content,
      createdAt: message.created_at,
      mode: message.role === 'assistant' ? 'ai' : undefined,
      sources: message.citations || [],
      generationId: message.attachments?.find((item) => item.type === 'ai_generation')?.generationId,
      favorite: message.is_favorite,
      feedback: message.feedback === 1 ? 'up' : message.feedback === -1 ? 'down' : undefined,
    })),
  }));
}

export async function syncCloudConversations(items: Conversation[], ownerId: string) {
  if (!supabase) return;
  const eligible = items.filter((item) => isUuid(item.id));
  if (!eligible.length) return;
  const conversationRows = eligible.map((item) => ({
    id: item.id,
    user_id: ownerId,
    title: item.title,
    folder: item.folder || '',
    subject: item.subject || '',
    learner_level: item.grade || '',
    mode: item.tutorMode,
    is_pinned: item.pinned,
    is_archived: false,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  }));
  const { error } = await supabase.from('conversations').upsert(conversationRows, { onConflict: 'id' });
  if (error) return;
  const messages = eligible.flatMap((item) => item.messages.filter((message) => isUuid(message.id) && message.text.trim()).map((message) => ({
    id: message.id,
    conversation_id: item.id,
    user_id: ownerId,
    role: message.role,
    content: message.text,
    citations: message.sources || [],
    attachments: message.generationId ? [{ type: 'ai_generation', generationId: message.generationId }] : [],
    is_favorite: Boolean(message.favorite),
    feedback: message.feedback === 'up' ? 1 : message.feedback === 'down' ? -1 : null,
    created_at: message.createdAt,
  })));
  if (messages.length) await supabase.from('chat_history').upsert(messages, { onConflict: 'id' });
}

export async function deleteCloudConversation(id: string, ownerId: string) {
  if (!supabase || !isUuid(id)) return;
  await supabase.from('conversations').delete().eq('id', id).eq('user_id', ownerId);
}
