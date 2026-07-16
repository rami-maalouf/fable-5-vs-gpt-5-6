export interface SearchableMessage {
  content: string;
}

export interface SearchableConversation {
  title: string;
  messages?: SearchableMessage[];
  searchableContent?: string | null;
}

function normalizeQuery(query: string) {
  return query.trim().toLocaleLowerCase();
}

export function conversationMatchesSearch(conversation: SearchableConversation, query: string) {
  const normalizedQuery = normalizeQuery(query);

  if (normalizedQuery.length === 0) {
    return true;
  }

  const haystacks = [
    conversation.title,
    conversation.searchableContent ?? '',
    ...(conversation.messages ?? []).map((message) => message.content),
  ];

  return haystacks.some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
}

export function filterConversationsBySearch<T extends SearchableConversation>(
  conversations: T[],
  query: string
) {
  return conversations.filter((conversation) => conversationMatchesSearch(conversation, query));
}
