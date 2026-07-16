/// <reference types="bun" />

import { describe, expect, test } from 'bun:test';

import { createAppFetch, streamChatResponse, type FetchLike } from '@/lib/chat-stream';

const encoder = new TextEncoder();

function streamingResponse(chunks: string[]) {
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    }),
  );
}

describe('streamChatResponse', () => {
  test('resolves relative routes against the native app origin', async () => {
    let requestedUrl = '';
    const appFetch = createAppFetch(async (input) => {
      requestedUrl = input;
      return new Response();
    }, 'http://127.0.0.1:8090');

    await appFetch('/chat');

    expect(requestedUrl).toBe('http://127.0.0.1:8090/chat');
  });

  test('rejects a native relative route when no app origin is available', async () => {
    const appFetch = createAppFetch(async () => new Response());

    await expect(appFetch('/chat')).rejects.toThrow('A native API origin is required');
  });

  test('posts history and emits decoded text incrementally', async () => {
    const received: string[] = [];
    let requestBody: string | undefined;
    const fetchImpl: FetchLike = async (_input, init) => {
      requestBody = init?.body as string;
      return streamingResponse(['hello ', 'from ', 'nova']);
    };

    await streamChatResponse({
      messages: [{ role: 'user', content: 'hello' }],
      model: 'gpt-5.6-luna',
      signal: new AbortController().signal,
      onChunk: (chunk) => received.push(chunk),
      fetchImpl,
    });

    expect(received).toEqual(['hello ', 'from ', 'nova']);
    expect(JSON.parse(requestBody ?? '')).toEqual({
      messages: [{ role: 'user', content: 'hello' }],
      model: 'gpt-5.6-luna',
    });
  });

  test('throws a readable error for a failed response', async () => {
    const fetchImpl: FetchLike = async () => new Response('Invalid request.', { status: 400 });

    expect(
      streamChatResponse({
        messages: [{ role: 'user', content: 'hello' }],
        model: 'gpt-5.6-luna',
        signal: new AbortController().signal,
        onChunk: () => undefined,
        fetchImpl,
      }),
    ).rejects.toThrow('Invalid request.');
  });

  test('passes the abort signal to fetch', async () => {
    const controller = new AbortController();
    const fetchImpl: FetchLike = async (_input, init) => {
      expect(init?.signal).toBe(controller.signal);
      throw new DOMException('aborted', 'AbortError');
    };

    await expect(
      streamChatResponse({
        messages: [{ role: 'user', content: 'hello' }],
        model: 'gpt-5.6-luna',
        signal: controller.signal,
        onChunk: () => undefined,
        fetchImpl,
      }),
    ).rejects.toHaveProperty('name', 'AbortError');
  });

  test('delivers partial text before a stream reader failure', async () => {
    const received: string[] = [];
    let pullCount = 0;
    const fetchImpl: FetchLike = async () =>
      new Response(
        new ReadableStream({
          pull(controller) {
            if (pullCount === 0) {
              pullCount += 1;
              controller.enqueue(encoder.encode('partial response'));
              return;
            }

            controller.error(new Error('connection lost'));
          },
        }),
      );

    await expect(
      streamChatResponse({
        messages: [{ role: 'user', content: 'hello' }],
        model: 'gpt-5.6-luna',
        signal: new AbortController().signal,
        onChunk: (chunk) => received.push(chunk),
        fetchImpl,
      }),
    ).rejects.toThrow('connection lost');
    expect(received).toEqual(['partial response']);
  });
});
