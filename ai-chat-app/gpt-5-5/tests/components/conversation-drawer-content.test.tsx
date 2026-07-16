import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, create } from 'react-test-renderer';
import type { ReactTestRenderer } from 'react-test-renderer';
import { Text, TextInput } from 'react-native';

import {
  createConversationAsync,
  createMessageAsync,
  migrateDatabaseAsync,
} from '@/data';
import type { SqlDatabase, SqlRunResult } from '@/data';
import { ConversationDrawerContent } from '@/components/drawer/ConversationDrawerContent';

interface NodeStatement {
  run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint };
  all(...params: unknown[]): Record<string, unknown>[];
  get(...params: unknown[]): Record<string, unknown> | undefined;
}

interface NodeDatabaseSync {
  exec(source: string): void;
  prepare(source: string): NodeStatement;
  close(): void;
}

const { DatabaseSync } = require('node:sqlite') as {
  DatabaseSync: new (location: string) => NodeDatabaseSync;
};

jest.mock('expo-symbols', () => ({
  SymbolView: 'SymbolView',
}));

class NodeSqlDatabase implements SqlDatabase {
  private readonly db = new DatabaseSync(':memory:');

  async execAsync(source: string) {
    this.db.exec(source);
  }

  async runAsync(source: string, params: unknown[] = []): Promise<SqlRunResult> {
    const result = this.db.prepare(source).run(...params);

    return {
      changes: result.changes,
      lastInsertRowId: Number(result.lastInsertRowid),
    };
  }

  async getFirstAsync<T>(source: string, params: unknown[] = []) {
    return (this.db.prepare(source).get(...params) ?? null) as T | null;
  }

  async getAllAsync<T>(source: string, params: unknown[] = []) {
    return this.db.prepare(source).all(...params) as T[];
  }

  close() {
    this.db.close();
  }
}

async function setupDatabase() {
  const db = new NodeSqlDatabase();
  await migrateDatabaseAsync(db);
  await createConversationAsync(db, {
    createdAt: 100,
    id: 'older',
    model: 'gpt-5.6-luna',
    title: 'Older plan',
  });
  await createConversationAsync(db, {
    createdAt: 200,
    id: 'newer',
    model: 'gpt-5.6-sol',
    title: 'Beach ideas',
  });
  await createMessageAsync(db, {
    content: 'mountain train route',
    conversationId: 'older',
    createdAt: 120,
    id: 'message-older',
    role: 'user',
  });

  return db;
}

async function renderContent(db: SqlDatabase, overrides = {}) {
  let tree: ReactTestRenderer | undefined;
  const props = {
    activeConversationId: null,
    db,
    isOpen: true,
    onNewChat: jest.fn(),
    onSelectConversation: jest.fn(),
    ...overrides,
  };

  await act(async () => {
    tree = create(<ConversationDrawerContent {...props} />);
  });
  await act(async () => undefined);

  return { props, tree: tree! };
}

function visibleText(tree: ReactTestRenderer) {
  return tree.root.findAllByType(Text).map((node) => node.props.children);
}

describe('ConversationDrawerContent', () => {
  let db: NodeSqlDatabase;

  beforeEach(async () => {
    db = await setupDatabase();
  });

  afterEach(() => {
    db.close();
  });

  it('renders conversations newest first and selects a row', async () => {
    const onSelectConversation = jest.fn();
    const { tree } = await renderContent(db, { onSelectConversation });
    const titles = visibleText(tree);

    expect(titles.indexOf('Beach ideas')).toBeLessThan(titles.indexOf('Older plan'));

    await act(async () => {
      tree.root.findByProps({ accessibilityLabel: 'open Beach ideas' }).props.onPress();
    });

    expect(onSelectConversation).toHaveBeenCalledWith('newer');
  });

  it('filters by title and message content through search', async () => {
    const { tree } = await renderContent(db);

    await act(async () => {
      tree.root.findByType(TextInput).props.onChangeText('mountain');
    });
    await act(async () => undefined);

    const titles = visibleText(tree);

    expect(titles).toContain('Older plan');
    expect(titles).not.toContain('Beach ideas');
  });

  it('calls the new chat action', async () => {
    const onNewChat = jest.fn();
    const { tree } = await renderContent(db, { onNewChat });

    await act(async () => {
      tree.root.findByProps({ accessibilityLabel: 'start new chat' }).props.onPress();
    });

    expect(onNewChat).toHaveBeenCalledTimes(1);
  });
});
