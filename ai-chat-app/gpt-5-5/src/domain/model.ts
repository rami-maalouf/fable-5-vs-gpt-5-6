export const CHAT_MODELS = ['gpt-5.6-luna', 'gpt-5.6-sol', 'gpt-5.6-terra'] as const;

export type ChatModel = (typeof CHAT_MODELS)[number];

export const DEFAULT_CHAT_MODEL: ChatModel = 'gpt-5.6-luna';

export function isChatModel(value: string): value is ChatModel {
  return CHAT_MODELS.includes(value as ChatModel);
}

export function parseChatModel(value: string): ChatModel | null {
  return isChatModel(value) ? value : null;
}

export function assertChatModel(value: string): ChatModel {
  const model = parseChatModel(value);

  if (model == null) {
    throw new Error(`unsupported chat model: ${value}`);
  }

  return model;
}
