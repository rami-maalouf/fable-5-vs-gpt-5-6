import type { Message } from '@/domain/messages';

export const isDemoMode = process.env.EXPO_PUBLIC_DEMO_MODE === '1';
export const demoConversationId = 'demo-conversation-morning-plan';
export const demoReply =
  'Start with the one decision that makes the rest of the morning easier. Then protect ninety focused minutes before checking messages.';

export function createDemoMessages(now = Date.now()): Message[] {
  return [
    {
      id: 'demo-user-1',
      conversationId: demoConversationId,
      role: 'user',
      content: 'Help me design a calm, focused morning.',
      status: 'complete',
      createdAt: now - 90_000,
    },
    {
      id: 'demo-assistant-1',
      conversationId: demoConversationId,
      role: 'assistant',
      content:
        'Begin gently: water, ten quiet minutes, and one clear intention. Then protect a ninety-minute focus block before the day gets noisy.',
      status: 'complete',
      createdAt: now - 60_000,
    },
  ];
}
