import { create } from 'zustand';

import { getSearchIndex, listConversations } from '@/data/conversation-repo';
import { getDb } from '@/data/client-db';
import type { Conversation } from '@/domain/messages';

export type DrawerEntry = Conversation & {
  // concatenated message content, used by the domain search filter
  content: string;
};

type ConversationsStore = {
  entries: DrawerEntry[];
  query: string;
  setQuery: (query: string) => void;
  refresh: () => Promise<void>;
};

export const useConversationsStore = create<ConversationsStore>((set) => ({
  entries: [],
  query: '',
  setQuery: (query) => set({ query }),
  refresh: async () => {
    const db = await getDb();
    const [conversations, index] = await Promise.all([
      listConversations(db),
      getSearchIndex(db),
    ]);
    const contentById = new Map(index.map((e) => [e.id, e.content]));
    set({
      entries: conversations.map((c) => ({ ...c, content: contentById.get(c.id) ?? '' })),
    });
  },
}));
