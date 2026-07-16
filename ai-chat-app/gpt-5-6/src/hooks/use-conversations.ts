import { useCallback, useEffect, useRef, useState } from 'react';

import {
  getDatabase,
  listConversations,
  type ConversationRecord,
} from '@/lib/db';

export function useConversations() {
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const requestVersion = useRef(0);

  useEffect(() => {
    return () => {
      requestVersion.current += 1;
    };
  }, []);

  const refresh = useCallback(async () => {
    const currentRequest = requestVersion.current + 1;
    requestVersion.current = currentRequest;
    setIsLoading(true);
    setError(null);

    try {
      const database = await getDatabase();
      const records = await listConversations(database);
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

  return {
    conversations,
    error,
    isLoading,
    refresh,
  };
}
