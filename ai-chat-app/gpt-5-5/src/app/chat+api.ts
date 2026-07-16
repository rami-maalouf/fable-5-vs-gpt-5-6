import { Agent, run, type AgentInputItem } from '@openai/agents';

import { parseChatModel } from '@/domain/model';

export const NOVA_AGENT_INSTRUCTIONS =
  'You are Nova, a warm, sharp, and curious chat companion. Keep replies conversational and concise: one to three short paragraphs. Use plain text only, no markdown, no lists, no code blocks. Ask a light follow-up question when it feels natural.';

type ChatRouteMessage = {
  content: unknown;
  role: unknown;
};

type ParsedChatRouteMessage = {
  content: string;
  role: 'assistant' | 'user';
};

type ChatRouteBody = {
  messages?: unknown;
  model?: unknown;
};

function jsonError(error: string, status: number) {
  return Response.json({ error }, { status });
}

function isChatRouteMessage(value: unknown): value is ParsedChatRouteMessage {
  if (typeof value !== 'object' || value == null) {
    return false;
  }

  const message = value as ChatRouteMessage;

  return (
    (message.role === 'user' || message.role === 'assistant') &&
    typeof message.content === 'string' &&
    message.content.trim().length > 0
  );
}

function toAgentInput(messages: ParsedChatRouteMessage[]): AgentInputItem[] {
  return messages.map((message) => {
    if (message.role === 'assistant') {
      return {
        content: [{ text: message.content, type: 'output_text' }],
        role: 'assistant',
        status: 'completed',
      };
    }

    return {
      content: message.content,
      role: 'user',
    };
  });
}

function encodeTextStream(source: AsyncIterable<string>, completed: Promise<void>) {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of source) {
          controller.enqueue(encoder.encode(chunk));
        }

        await completed;
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return jsonError('missing server configuration', 500);
  }

  let body: ChatRouteBody;

  try {
    body = (await request.json()) as ChatRouteBody;
  } catch {
    return jsonError('invalid json body', 400);
  }

  if (typeof body.model !== 'string') {
    return jsonError('unsupported model', 400);
  }

  const model = parseChatModel(body.model);

  if (model == null) {
    return jsonError('unsupported model', 400);
  }

  if (!Array.isArray(body.messages) || !body.messages.every(isChatRouteMessage)) {
    return jsonError('invalid messages', 400);
  }

  const agent = new Agent({
    instructions: NOVA_AGENT_INSTRUCTIONS,
    model,
    name: 'Nova',
  });
  const result = await run(agent, toAgentInput(body.messages), {
    signal: request.signal,
    stream: true,
  });

  return new Response(encodeTextStream(result.toTextStream(), result.completed), {
    headers: {
      'cache-control': 'no-cache',
      'content-type': 'text/plain; charset=utf-8',
    },
  });
}
