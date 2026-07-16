import type { MessageRecord } from '@/lib/db';
import type { ChatMessage } from '@/lib/chat-state';

const TITLE_LIMIT = 40;
const TITLE_ELLIPSIS = '...';

export function createConversationTitle(content: string) {
  const normalized = content.trim().replace(/\s+/g, ' ');
  if (normalized.length <= TITLE_LIMIT) {
    return normalized;
  }

  return `${normalized.slice(0, TITLE_LIMIT - TITLE_ELLIPSIS.length).trimEnd()}${TITLE_ELLIPSIS}`;
}

export function restoreChatMessages(records: MessageRecord[]): ChatMessage[] {
  return records.map(({ id, role, content }) => ({
    id,
    role,
    content,
    status: 'complete',
  }));
}
