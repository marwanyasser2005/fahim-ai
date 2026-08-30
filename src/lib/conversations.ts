import type { TutorMode, TutorSource } from '@/lib/aiTutor';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
  mode?: 'ai' | 'unavailable';
  generationId?: string;
  sources?: TutorSource[];
  favorite?: boolean;
  feedback?: 'up' | 'down';
};

export type Conversation = {
  id: string;
  title: string;
  folder: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  grade: string;
  subject: string;
  tutorMode: TutorMode;
  messages: ChatMessage[];
};

const KEY = 'fahim-conversations-v2';

const makeId = () => crypto.randomUUID();

export function createConversation(language: 'ar' | 'en', intro: string): Conversation {
  const now = new Date().toISOString();
  return {
    id: makeId(),
    title: language === 'ar' ? 'محادثة جديدة' : 'New conversation',
    folder: '',
    pinned: false,
    createdAt: now,
    updatedAt: now,
    grade: '',
    subject: '',
    tutorMode: 'explain',
    messages: [{ id: makeId(), role: 'assistant', text: intro, createdAt: now }],
  };
}

export function loadConversations(): Conversation[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]') as Conversation[];
    return Array.isArray(parsed) ? parsed.filter((item) => item?.id && Array.isArray(item.messages)).slice(0, 100) : [];
  } catch {
    return [];
  }
}

export function saveConversations(items: Conversation[]) {
  localStorage.setItem(KEY, JSON.stringify(items.slice(0, 100)));
}

export function conversationTitle(question: string) {
  const clean = question.replace(/\s+/g, ' ').trim();
  return clean.length > 42 ? `${clean.slice(0, 42)}…` : clean;
}

export function exportConversationMarkdown(conversation: Conversation) {
  const body = conversation.messages.map((message) => `## ${message.role === 'user' ? 'Learner' : 'Fahim AI'}\n\n${message.text}`).join('\n\n---\n\n');
  return `# ${conversation.title}\n\n${body}\n`;
}

export function downloadText(filename: string, content: string, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
