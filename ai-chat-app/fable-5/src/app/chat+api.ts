import { Agent, assistant, run, setTracingDisabled, user } from '@openai/agents';

import { isAllowedModel } from '@/domain/models';

// instructions are fixed verbatim by the spec
const NOVA_INSTRUCTIONS =
  'You are Nova, a warm, sharp, and curious chat companion. Keep replies conversational ' +
  'and concise: one to three short paragraphs. Use plain text only, no markdown, no ' +
  'lists, no code blocks. Ask a light follow-up question when it feels natural.';

// the sdk's tracing exporter is unwanted noise for this app
setTracingDisabled(true);

type IncomingMessage = { role: 'user' | 'assistant'; content: string };

function isIncomingMessage(value: unknown): value is IncomingMessage {
  if (typeof value !== 'object' || value === null) return false;
  const m = value as Record<string, unknown>;
  return (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string';
}

function badRequest(message: string): Response {
  return Response.json({ error: message }, { status: 400 });
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest('body must be json');
  }

  const { messages, model } = (body ?? {}) as { messages?: unknown; model?: unknown };

  if (!isAllowedModel(model)) {
    return badRequest('model must be one of the allowed models');
  }
  if (!Array.isArray(messages) || messages.length === 0 || !messages.every(isIncomingMessage)) {
    return badRequest('messages must be a non-empty array of user/assistant messages');
  }

  const agent = new Agent({ name: 'Nova', instructions: NOVA_INSTRUCTIONS, model });
  const input = messages.map((m) => (m.role === 'user' ? user(m.content) : assistant(m.content)));

  const result = await run(agent, input, { stream: true });

  // the sdk types its stream against its own minimal shim; at runtime it is a
  // standard web ReadableStream
  const textStream = result.toTextStream() as unknown as ReadableStream<string>;

  return new Response(textStream.pipeThrough(new TextEncoderStream()), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
