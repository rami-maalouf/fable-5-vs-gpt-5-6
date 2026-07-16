import { describe, expect, it, jest } from '@jest/globals';

import { consumeTextStream } from '@/hooks/useChatStream';

function encodeChunks(chunks: string[]) {
  const encoder = new TextEncoder();

  return chunks.map((chunk) => encoder.encode(chunk));
}

function createImmediateStream(chunks: string[]) {
  const encodedChunks = encodeChunks(chunks);

  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of encodedChunks) {
        controller.enqueue(chunk);
      }

      controller.close();
    },
  });
}

describe('consumeTextStream', () => {
  it('assembles chunks and batches immediate updates', async () => {
    const onText = jest.fn();

    const text = await consumeTextStream(createImmediateStream(['hel', 'lo ', 'nova']), {
      flushIntervalMs: 40,
      onText,
    });

    expect(text).toBe('hello nova');
    expect(onText).toHaveBeenCalledTimes(1);
    expect(onText).toHaveBeenCalledWith('hello nova');
  });
});
