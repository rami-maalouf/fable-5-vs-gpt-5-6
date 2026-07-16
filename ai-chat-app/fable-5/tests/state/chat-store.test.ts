import { useChatStore } from '@/state/chat-store';

const initial = useChatStore.getState();

beforeEach(() => {
  useChatStore.setState(initial, true);
});

function startExampleTurn() {
  const s = useChatStore.getState();
  s.startTurn(
    { id: 'u1', conversationId: '', role: 'user', content: 'hi', status: 'complete', createdAt: 1 },
    { id: 'a1', conversationId: '', role: 'assistant', content: '', status: 'complete', createdAt: 2 },
  );
}

describe('chat store', () => {
  it('starts fresh: no conversation, default model, empty messages, idle', () => {
    const s = useChatStore.getState();
    expect(s.conversationId).toBeNull();
    expect(s.model).toBe('gpt-5.6-luna');
    expect(s.messages).toHaveLength(0);
    expect(s.sendState).toBe('idle');
  });

  it('startTurn appends user + assistant placeholder and enters awaiting', () => {
    startExampleTurn();
    const s = useChatStore.getState();
    expect(s.messages.map((m) => m.id)).toEqual(['u1', 'a1']);
    expect(s.sendState).toBe('awaiting');
    expect(s.streamingMessageId).toBe('a1');
  });

  it('setStreamingText grows the placeholder and flips to streaming', () => {
    startExampleTurn();
    useChatStore.getState().setStreamingText('a1', 'Hel');
    useChatStore.getState().setStreamingText('a1', 'Hello');
    const s = useChatStore.getState();
    expect(s.sendState).toBe('streaming');
    expect(s.messages[1].content).toBe('Hello');
  });

  it('finishTurn finalizes content + status and returns to idle', () => {
    startExampleTurn();
    useChatStore.getState().setStreamingText('a1', 'partial');
    useChatStore.getState().finishTurn('a1', 'partial answer', 'stopped');
    const s = useChatStore.getState();
    expect(s.sendState).toBe('idle');
    expect(s.streamingMessageId).toBeNull();
    expect(s.messages[1].content).toBe('partial answer');
    expect(s.messages[1].status).toBe('stopped');
  });

  it('reset returns to a fresh unsaved conversation but keeps the chosen model', () => {
    startExampleTurn();
    useChatStore.getState().setModel('gpt-5.6-terra');
    useChatStore.getState().reset();
    const s = useChatStore.getState();
    expect(s.conversationId).toBeNull();
    expect(s.messages).toHaveLength(0);
    expect(s.sendState).toBe('idle');
    expect(s.model).toBe('gpt-5.6-terra');
  });

  it('loadConversation replaces state with the stored conversation', () => {
    useChatStore.getState().loadConversation(
      { id: 'c9', title: 'Trip', model: 'gpt-5.6-sol', createdAt: 1, updatedAt: 2 },
      [
        { id: 'm1', conversationId: 'c9', role: 'user', content: 'q', status: 'complete', createdAt: 1 },
        { id: 'm2', conversationId: 'c9', role: 'assistant', content: 'a', status: 'complete', createdAt: 2 },
      ],
    );
    const s = useChatStore.getState();
    expect(s.conversationId).toBe('c9');
    expect(s.model).toBe('gpt-5.6-sol');
    expect(s.messages).toHaveLength(2);
  });
});
