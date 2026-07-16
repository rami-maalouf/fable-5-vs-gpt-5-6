import { beforeEach, describe, expect, it } from '@jest/globals';

import { useChatStore } from '@/state/chat';

describe('chat store', () => {
  beforeEach(() => {
    useChatStore.getState().resetTranscript();
  });

  it('creates a user turn and assistant placeholder for a request', () => {
    const turn = useChatStore.getState().startAssistantTurn(' hello nova ');
    const state = useChatStore.getState();

    expect(state.messages).toHaveLength(2);
    expect(state.messages[0]).toEqual(
      expect.objectContaining({
        content: 'hello nova',
        role: 'user',
      }),
    );
    expect(state.messages[1]).toEqual(
      expect.objectContaining({
        content: '',
        id: turn.assistantMessageId,
        role: 'assistant',
        status: 'streaming',
      }),
    );
    expect(state.isAwaitingFirstToken).toBe(true);
    expect(turn.requestMessages).toEqual([{ content: 'hello nova', role: 'user' }]);
  });

  it('appends streamed chunks and clears the first-token loading state', () => {
    const turn = useChatStore.getState().startAssistantTurn('hello');

    useChatStore.getState().appendAssistantChunk(turn.assistantMessageId, 'hi ');
    useChatStore.getState().appendAssistantChunk(turn.assistantMessageId, 'there');

    const assistant = useChatStore.getState().messages[1];

    expect(assistant.content).toBe('hi there');
    expect(useChatStore.getState().isAwaitingFirstToken).toBe(false);
  });

  it('marks the active assistant message complete', () => {
    const turn = useChatStore.getState().startAssistantTurn('hello');

    useChatStore.getState().appendAssistantChunk(turn.assistantMessageId, 'hi');
    useChatStore.getState().finishAssistantMessage(turn.assistantMessageId, 'complete');

    expect(useChatStore.getState().activeAssistantMessageId).toBeNull();
    expect(useChatStore.getState().isAwaitingFirstToken).toBe(false);
    expect(useChatStore.getState().messages[1]).toEqual(
      expect.objectContaining({
        content: 'hi',
        status: 'complete',
      }),
    );
  });

  it('loads and resets a persisted conversation transcript', () => {
    useChatStore.getState().loadConversationTranscript({
      conversationId: 'conversation-1',
      messages: [
        {
          content: 'saved prompt',
          createdAt: 100,
          id: 'user-1',
          role: 'user',
          status: 'complete',
        },
        {
          content: 'saved reply',
          createdAt: 110,
          id: 'assistant-1',
          role: 'assistant',
          status: 'complete',
        },
      ],
      model: 'gpt-5.6-sol',
    });

    expect(useChatStore.getState()).toEqual(
      expect.objectContaining({
        activeAssistantMessageId: null,
        currentConversationId: 'conversation-1',
        currentModel: 'gpt-5.6-sol',
        isAwaitingFirstToken: false,
      }),
    );
    expect(useChatStore.getState().messages.map((message) => message.content)).toEqual([
      'saved prompt',
      'saved reply',
    ]);

    useChatStore.getState().resetTranscript();

    expect(useChatStore.getState()).toEqual(
      expect.objectContaining({
        currentConversationId: null,
        currentModel: 'gpt-5.6-luna',
        messages: [],
      }),
    );
  });

  it('sets the current draft model without changing the transcript', () => {
    useChatStore.getState().startAssistantTurn('hello');

    useChatStore.getState().setCurrentModel('gpt-5.6-terra');

    expect(useChatStore.getState()).toEqual(
      expect.objectContaining({
        currentModel: 'gpt-5.6-terra',
      }),
    );
    expect(useChatStore.getState().messages.map((message) => message.content)).toEqual([
      'hello',
      '',
    ]);
  });
});
