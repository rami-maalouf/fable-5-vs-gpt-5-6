export type SearchEntry = {
  id: string;
  title: string;
  content: string;
};

// case-insensitive substring match over title or message content;
// empty query matches everything
export function conversationMatches(query: string, title: string, content: string): boolean {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return true;
  return title.toLowerCase().includes(q) || content.toLowerCase().includes(q);
}

export function filterConversations<T extends SearchEntry>(entries: T[], query: string): T[] {
  return entries.filter((e) => conversationMatches(query, e.title, e.content));
}
