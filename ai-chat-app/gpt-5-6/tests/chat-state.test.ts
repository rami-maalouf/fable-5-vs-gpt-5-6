/// <reference types="bun" />

import { describe, expect, test } from 'bun:test';

import {
  appendAssistantChunk,
  failAssistantMessage,
  finishAssistantMessage,
  prepareAssistantRetry,
  settleFailedAssistantMessages,
  toRequestMessages,
  type ChatMessage,
} from '@/lib/chat-state';

const pendingAssistant: ChatMessage = {
  id: 'assistant-1',
  role: 'assistant',
  content: '',
  status: 'pending',
};

describe('chat state', () => {
  test('moves a pending assistant through streaming and completion', () => {
    const streaming = appendAssistantChunk([pendingAssistant], 'assistant-1', 'hello');
    const complete = finishAssistantMessage(streaming, 'assistant-1');

    expect(streaming[0]).toMatchObject({ content: 'hello', status: 'streaming' });
    expect(complete[0]).toMatchObject({ content: 'hello', status: 'complete' });
  });

  test('keeps partial text when a stream fails and clears it for retry', () => {
    const partial = appendAssistantChunk([pendingAssistant], 'assistant-1', 'partial answer');
    const failed = failAssistantMessage(partial, 'assistant-1');
    const retried = prepareAssistantRetry(failed, 'assistant-1');

    expect(failed[0]).toMatchObject({ content: 'partial answer', status: 'error' });
    expect(retried[0]).toMatchObject({ content: '', status: 'pending' });
  });

  test('omits an empty assistant placeholder from request history', () => {
    const messages: ChatMessage[] = [
      { id: 'user-1', role: 'user', content: 'hello', status: 'complete' },
      pendingAssistant,
    ];

    expect(toRequestMessages(messages)).toEqual([{ role: 'user', content: 'hello' }]);
  });

  test('settles an old error when the user moves on to another turn', () => {
    const failed = failAssistantMessage([pendingAssistant], 'assistant-1');

    expect(settleFailedAssistantMessages(failed)[0]?.status).toBe('complete');
  });
});
