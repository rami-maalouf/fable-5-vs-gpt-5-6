import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { NOVA_AGENT_INSTRUCTIONS, POST } from '@/app/chat+api';

let mockAgentCalls: unknown[] = [];
let mockRunCalls: unknown[][] = [];
let mockRunImplementation: (...args: unknown[]) => Promise<unknown>;

jest.mock('@openai/agents', () => ({
  Agent: function MockAgent(config: unknown) {
    mockAgentCalls.push(config);

    return { config };
  },
  run: (...args: unknown[]) => {
    mockRunCalls.push(args);

    return mockRunImplementation(...args);
  },
}));

function createRequest(body: unknown) {
  return new Request('http://localhost/chat', {
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
    },
    method: 'POST',
  });
}

function createTextStream(chunks: string[]) {
  return new ReadableStream<string>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }

      controller.close();
    },
  });
}

describe('chat api route', () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key';
    mockAgentCalls = [];
    mockRunCalls = [];
    mockRunImplementation = async () => {
      throw new Error('run mock was not configured');
    };
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  it('rejects models outside the allowlist', async () => {
    const response = await POST(
      createRequest({
        messages: [{ role: 'user', content: 'hello' }],
        model: 'gpt-4.1',
      }),
    );

    await expect(response.json()).resolves.toEqual({
      error: 'unsupported model',
    });
    expect(response.status).toBe(400);
    expect(mockRunCalls).toEqual([]);
  });

  it('streams text through the Nova agent with the selected model', async () => {
    mockRunImplementation = async () => ({
      completed: Promise.resolve(),
      toTextStream: () => createTextStream(['hello ', 'from nova']),
    });

    const response = await POST(
      createRequest({
        messages: [
          { role: 'user', content: 'hello' },
          { role: 'assistant', content: 'hi there' },
          { role: 'user', content: 'what can you do?' },
        ],
        model: 'gpt-5.6-luna',
      }),
    );

    await expect(response.text()).resolves.toBe('hello from nova');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(mockAgentCalls).toEqual([
      {
        instructions: NOVA_AGENT_INSTRUCTIONS,
        model: 'gpt-5.6-luna',
        name: 'Nova',
      },
    ]);
    expect(mockRunCalls).toEqual([
      [
        expect.objectContaining({
          config: expect.objectContaining({
            model: 'gpt-5.6-luna',
          }),
        }),
        [
          {
            content: 'hello',
            role: 'user',
          },
          {
            content: [{ text: 'hi there', type: 'output_text' }],
            role: 'assistant',
            status: 'completed',
          },
          {
            content: 'what can you do?',
            role: 'user',
          },
        ],
        expect.objectContaining({
          stream: true,
        }),
      ],
    ]);
    expect(mockAgentCalls[0]).toEqual({
      instructions: NOVA_AGENT_INSTRUCTIONS,
      model: 'gpt-5.6-luna',
      name: 'Nova',
    });
  });

  it('returns a server error when the server key is missing', async () => {
    delete process.env.OPENAI_API_KEY;

    const response = await POST(
      createRequest({
        messages: [{ role: 'user', content: 'hello' }],
        model: 'gpt-5.6-luna',
      }),
    );

    await expect(response.json()).resolves.toEqual({
      error: 'missing server configuration',
    });
    expect(response.status).toBe(500);
    expect(mockRunCalls).toEqual([]);
  });
});
