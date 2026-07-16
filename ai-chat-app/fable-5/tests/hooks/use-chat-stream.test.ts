// tests the framework-free stream core (streamChat); the react hook is a
// thin one-in-flight wrapper around it

type Controller = {
  push: (chunk: string) => void;
  close: () => void;
  fail: (error: Error) => void;
};

let mockResponseFactory: (signal: AbortSignal | undefined) => Promise<Response>;

jest.mock('expo/fetch', () => ({
  fetch: (_url: string, init?: { signal?: AbortSignal }) => mockResponseFactory(init?.signal),
}));

import { streamChat } from '@/hooks/useChatStream';

const encoder = new TextEncoder();

function streamingResponse(): { response: Response; controller: Controller } {
  let ctrl!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      ctrl = c;
    },
  });
  const response = new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
  return {
    response,
    controller: {
      push: (chunk) => ctrl.enqueue(encoder.encode(chunk)),
      close: () => ctrl.close(),
      fail: (error) => ctrl.error(error),
    },
  };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('streamChat', () => {
  it('assembles chunks and reports complete', async () => {
    const { response, controller } = streamingResponse();
    mockResponseFactory = async () => response;

    const seen: string[] = [];
    const pending = streamChat(
      [{ role: 'user', content: 'hi' }],
      'gpt-5.6-luna',
      { onText: (t) => seen.push(t) },
      new AbortController(),
    );
    controller.push('Hel');
    controller.push('lo');
    controller.push(' world');
    controller.close();
    const r = await pending;

    expect(r.outcome).toBe('complete');
    expect(r.text).toBe('Hello world');
    expect(seen[seen.length - 1]).toBe('Hello world');
  });

  it('keeps partial text and reports stopped on abort', async () => {
    const { response, controller } = streamingResponse();
    const abort = new AbortController();
    mockResponseFactory = async (signal) => {
      // mimic native abort: error the stream when the signal fires
      signal?.addEventListener('abort', () => controller.fail(new Error('aborted')));
      return response;
    };

    const pending = streamChat(
      [{ role: 'user', content: 'long story' }],
      'gpt-5.6-luna',
      { onText: () => {} },
      abort,
    );
    await wait(10);
    controller.push('Once upon');
    await wait(60);
    abort.abort();
    const r = await pending;

    expect(r.outcome).toBe('stopped');
    expect(r.text).toBe('Once upon');
  });

  it('reports error with partial text when the stream dies', async () => {
    const { response, controller } = streamingResponse();
    mockResponseFactory = async () => response;

    const pending = streamChat(
      [{ role: 'user', content: 'hi' }],
      'gpt-5.6-luna',
      { onText: () => {} },
      new AbortController(),
    );
    await wait(10);
    controller.push('partial');
    await wait(60);
    controller.fail(new Error('network died'));
    const r = await pending;

    expect(r.outcome).toBe('error');
    expect(r.text).toBe('partial');
    expect(r.error).toBeDefined();
  });

  it('reports error for a non-ok response', async () => {
    mockResponseFactory = async () => new Response('bad', { status: 400 });
    const r = await streamChat(
      [{ role: 'user', content: 'hi' }],
      'not-a-model',
      { onText: () => {} },
      new AbortController(),
    );
    expect(r.outcome).toBe('error');
    expect(r.error?.message).toContain('400');
  });

  it('batches rapid chunks into few onText emissions but never drops the tail', async () => {
    const { response, controller } = streamingResponse();
    mockResponseFactory = async () => response;

    const seen: string[] = [];
    const pending = streamChat(
      [{ role: 'user', content: 'hi' }],
      'gpt-5.6-luna',
      { onText: (t) => seen.push(t) },
      new AbortController(),
    );
    await wait(10);
    for (let i = 0; i < 20; i++) controller.push(`c${i} `);
    controller.close();
    const r = await pending;

    expect(r.text.trim().split(' ')).toHaveLength(20);
    expect(seen.length).toBeLessThan(20);
    expect(seen[seen.length - 1]).toContain('c19');
  });
});
