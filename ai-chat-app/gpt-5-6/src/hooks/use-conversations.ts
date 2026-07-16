import { useCallback, useEffect, useRef, useState } from 'react';

import {
  deleteConversation as deleteConversationRecord,
  getDatabase,
  renameConversation as renameConversationRecord,
  searchConversations,
  type ConversationRecord,
} from '@/lib/db';

export function useConversations() {
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const requestVersion = useRef(0);

  useEffect(() => {
    return () => {
      requestVersion.current += 1;
    };
  }, []);

  const load = useCallback(async (searchQuery: string) => {
    const currentRequest = requestVersion.current + 1;
    requestVersion.current = currentRequest;
    setIsLoading(true);
    setError(null);

    try {
      const database = await getDatabase();
      const records = await searchConversations(database, searchQuery);
      if (requestVersion.current === currentRequest) {
        setConversations(records);
      }
    } catch {
      if (requestVersion.current === currentRequest) {
        setError('Could not load conversations.');
      }
    } finally {
      if (requestVersion.current === currentRequest) {
        setIsLoading(false);
      }
    }
  }, []);

  const refresh = useCallback(() => load(query), [load, query]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void load(query);
    }, 180);

    return () => clearTimeout(timeout);
  }, [load, query]);

  const rename = useCallback(
    async (conversationId: string, title: string) => {
      try {
        const database = await getDatabase();
        await renameConversationRecord(database, conversationId, title);
        await load(query);
        return true;
      } catch {
        setError('Could not rename conversation.');
        return false;
      }
    },
    [load, query],
  );

  const remove = useCallback(
    async (conversationId: string) => {
      try {
        const database = await getDatabase();
        await deleteConversationRecord(database, conversationId);
        await load(query);
        return true;
      } catch {
        setError('Could not delete conversation.');
        return false;
      }
    },
    [load, query],
  );

  return {
    conversations,
    error,
    isLoading,
    query,
    refresh,
    remove,
    rename,
    setQuery,
  };
}
