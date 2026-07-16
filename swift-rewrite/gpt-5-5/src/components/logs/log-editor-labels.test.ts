// ports: twilight/views/logs/sleepsessioneditorview.swift

import { formatEditorClockTime } from './log-editor-labels';

describe('log editor labels', () => {
  it('formats picker minutes without timezone shifts', () => {
    expect(formatEditorClockTime(0)).toBe('12:00 AM');
    expect(formatEditorClockTime(7 * 60 + 5)).toBe('7:05 AM');
    expect(formatEditorClockTime(22 * 60)).toBe('10:00 PM');
  });
});
