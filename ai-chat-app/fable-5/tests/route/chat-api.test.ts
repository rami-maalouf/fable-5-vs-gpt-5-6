// route tests with a mocked agents sdk - validates the backend contract:
// allowlist -> 400, streamed plain-text response for valid requests

const mockRun = jest.fn();

jest.mock('@openai/agents', () => ({
  Agent: jest.fn().mockImplementation((config: unknown) => config),
  run: (...args: unknown[]) => mockRun(...args),
  user: (content: string) => ({ role: 'user', content }),
  assistant: (content: string) => ({ role: 'assistant', content }),
  setTracingDisabled: jest.fn(),
}));

import { POST } from '@/app/chat+api';

function fakeStreamedResult(chunks: string[]) {
  return {
    toTextStream: () =>
      new ReadableStream<string>({
        start(controller) {
          for (const chunk of chunks) controller.enqueue(chunk);
          controller.close();
        },
      }),
  };
}

function postRequest(body: unknown): Request {
  return new Request('http://localhost/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validBody = {
  model: 'gpt-5.6-luna',
  messages: [{ role: 'user', content: 'hey nova' }],
};

beforeEach(() => {
  mockRun.mockReset();
});

describe('POST /chat', () => {
  it('returns 400 for a model off the allowlist', async () => {
    const res = await POST(postRequest({ ...validBody, model: 'gpt-4o' }));
    expect(res.status).toBe(400);
    expect(mockRun).not.toHaveBeenCalled();
  });

  it('returns 400 for a missing model', async () => {
    const res = await POST(postRequest({ messages: validBody.messages }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for malformed json', async () => {
    const res = await POST(
      new Request('http://localhost/chat', { method: 'POST', body: 'not json' }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when messages are missing or malformed', async () => {
    expect((await POST(postRequest({ model: 'gpt-5.6-luna' }))).status).toBe(400);
    expect(
      (await POST(postRequest({ model: 'gpt-5.6-luna', messages: [{ role: 'tool', content: 'x' }] })))
        .status,
    ).toBe(400);
  });

  it('streams the agent reply as plain text for a valid request', async () => {
    mockRun.mockResolvedValue(fakeStreamedResult(['Hello', ' there', '!']));
    const res = await POST(postRequest(validBody));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/plain');
    expect(await res.text()).toBe('Hello there!');
  });

  it('passes the validated model and full history to the agent run', async () => {
    mockRun.mockResolvedValue(fakeStreamedResult(['ok']));
    await POST(
      postRequest({
        model: 'gpt-5.6-terra',
        messages: [
          { role: 'user', content: 'first' },
          { role: 'assistant', content: 'reply' },
          { role: 'user', content: 'second' },
        ],
      }),
    );
    const [agentConfig, input, options] = mockRun.mock.calls[0] as [
      { name: string; instructions: string; model: string },
      Array<{ role: string; content: string }>,
      { stream: boolean },
    ];
    expect(agentConfig.name).toBe('Nova');
    expect(agentConfig.model).toBe('gpt-5.6-terra');
    expect(agentConfig.instructions).toContain('You are Nova');
    expect(input).toEqual([
      { role: 'user', content: 'first' },
      { role: 'assistant', content: 'reply' },
      { role: 'user', content: 'second' },
    ]);
    expect(options).toEqual({ stream: true });
  });
});
