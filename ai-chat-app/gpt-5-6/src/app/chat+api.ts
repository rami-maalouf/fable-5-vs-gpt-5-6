import { Agent, run, type AgentInputItem } from '@openai/agents';
import { z } from 'zod';

export const SUPPORTED_MODELS = [
  'gpt-5.6-luna',
  'gpt-5.6-sol',
  'gpt-5.6-terra',
] as const;

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1),
      }),
    )
    .min(1),
  model: z.enum(SUPPORTED_MODELS),
});

const NOVA_INSTRUCTIONS =
  'You are Nova, a warm, sharp, and curious chat companion. Keep replies conversational and concise: one to three short paragraphs. Use plain text only, no markdown, no lists, no code blocks. Ask a light follow-up question when it feels natural.';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return new Response('Invalid request.', { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return new Response('Server is not configured.', { status: 500 });
  }

  const agent = new Agent({
    name: 'Nova',
    instructions: NOVA_INSTRUCTIONS,
    model: parsed.data.model,
  });
  const input: AgentInputItem[] = parsed.data.messages.map((message) => {
    if (message.role === 'user') {
      return { role: 'user', content: message.content };
    }

    return {
      role: 'assistant',
      status: 'completed',
      content: [{ type: 'output_text', text: message.content }],
    };
  });
  const result = await run(agent, input, {
    stream: true,
    signal: request.signal,
  });
  const textStream = result.toTextStream();
  const encoder = new TextEncoder();
  const bodyStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of textStream) {
          controller.enqueue(encoder.encode(chunk));
        }
        await result.completed;
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(bodyStream, {
    headers: {
      'Cache-Control': 'no-cache',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
