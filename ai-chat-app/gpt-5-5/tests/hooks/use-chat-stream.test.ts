import { describe, expect, it, jest } from '@jest/globals';
import { fetch } from 'expo/fetch';
import React from 'react';
import { act, create } from 'react-test-renderer';

import { consumeTextStream, useChatStream } from '@/hooks/useChatStream';

jest.mock('expo/fetch', () => ({
  fetch: jest.fn(),
}));

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

  it('flushes partial text before surfacing an interrupted stream', async () => {
    const onText = jest.fn();
    let didSendChunk = false;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (!didSendChunk) {
          didSendChunk = true;
          controller.enqueue(new TextEncoder().encode('partial reply'));
          return;
        }

        controller.error(new Error('Fetch request has been canceled'));
      },
    });

    await expect(consumeTextStream(stream, {
      flushIntervalMs: 40,
      onText,
    })).rejects.toThrow('Fetch request has been canceled');
    expect(onText).toHaveBeenCalledWith('partial reply');
  });
});

describe('useChatStream', () => {
  it('returns a readable error when the chat request fails', async () => {
    const fetchMock = fetch as jest.MockedFunction<typeof fetch>;
    let stream: ReturnType<typeof useChatStream> | undefined;

    function Harness() {
      stream = useChatStream();

      return null;
    }

    fetchMock.mockRejectedValueOnce(new Error('Network request failed'));

    await act(async () => {
      create(React.createElement(Harness));
    });

    let result: Awaited<ReturnType<ReturnType<typeof useChatStream>['send']>> | undefined;

    await act(async () => {
      result = await stream!.send({
        messages: [{ content: 'hello', role: 'user' }],
        model: 'gpt-5.6-luna',
      });
    });

    expect(result).toEqual({
      error: 'Could not connect to Nova. Check your connection, then retry.',
      status: 'error',
    });
    expect(stream?.error).toBe('Could not connect to Nova. Check your connection, then retry.');
    expect(stream?.isStreaming).toBe(false);
  });
});
