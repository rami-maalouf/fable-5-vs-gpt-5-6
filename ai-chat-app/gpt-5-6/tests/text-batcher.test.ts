import { describe, expect, test } from 'bun:test';

import { createTextBatcher, type TextBatchScheduler } from '@/lib/text-batcher';

function createScheduler() {
  let scheduledCallback: (() => void) | null = null;
  let cancelled = false;
  const scheduler: TextBatchScheduler = {
    cancel: () => {
      cancelled = true;
      scheduledCallback = null;
    },
    schedule: (callback, delay) => {
      expect(delay).toBe(40);
      scheduledCallback = callback;
      return 1 as unknown as ReturnType<typeof setTimeout>;
    },
  };

  return {
    scheduler,
    wasCancelled: () => cancelled,
    runScheduled: () => scheduledCallback?.(),
  };
}

describe('text batcher', () => {
  test('combines chunks into one scheduled commit', () => {
    const batches: string[] = [];
    const testScheduler = createScheduler();
    const batcher = createTextBatcher(
      (text) => batches.push(text),
      40,
      testScheduler.scheduler,
    );

    batcher.push('hello ');
    batcher.push('from nova');

    expect(batches).toEqual([]);
    testScheduler.runScheduled();
    expect(batches).toEqual(['hello from nova']);
  });

  test('flushes pending text immediately and cancels its timer', () => {
    const batches: string[] = [];
    const testScheduler = createScheduler();
    const batcher = createTextBatcher(
      (text) => batches.push(text),
      40,
      testScheduler.scheduler,
    );

    batcher.push('partial reply');
    batcher.flush();

    expect(batches).toEqual(['partial reply']);
    expect(testScheduler.wasCancelled()).toBe(true);
    testScheduler.runScheduled();
    expect(batches).toEqual(['partial reply']);
  });
});
