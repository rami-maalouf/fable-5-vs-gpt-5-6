import { demoReply, isDemoMode } from '@/demo/demo-mode';

export type ChatRequestMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type ChatModel = 'gpt-5.6-luna' | 'gpt-5.6-sol' | 'gpt-5.6-terra';

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export function createAppFetch(fetchImpl: FetchLike, origin?: string): FetchLike {
  return (input, init) => {
    if (!input.startsWith('/')) {
      return fetchImpl(input, init);
    }

    if (!origin) {
      return Promise.reject(new Error('A native API origin is required for relative routes.'));
    }

    return fetchImpl(new URL(input, origin).toString(), init);
  };
}

type StreamChatResponseOptions = {
  messages: ChatRequestMessage[];
  model: ChatModel;
  signal: AbortSignal;
  onChunk: (chunk: string) => void;
  fetchImpl: FetchLike;
};

export async function streamChatResponse({
  messages,
  model,
  signal,
  onChunk,
  fetchImpl,
}: StreamChatResponseOptions) {
  if (isDemoMode) {
    for (const word of demoReply.split(' ')) {
      if (signal.aborted) throw new DOMException('The request was stopped.', 'AbortError');
      onChunk(`${word} `);
      await new Promise((resolve) => setTimeout(resolve, 35));
    }
    return;
  }

  const response = await fetchImpl('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model }),
    signal,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status}).`);
  }

  if (!response.body) {
    throw new Error('The response did not include a stream.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    const chunk = decoder.decode(value, { stream: true });
    if (chunk) {
      onChunk(chunk);
    }
  }

  const finalChunk = decoder.decode();
  if (finalChunk) {
    onChunk(finalChunk);
  }
}
