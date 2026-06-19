import { describe, it, expect } from 'vitest';
import { BACKLOG_STATUSES, isBacklogStatus } from '@/lib/backlog/statuses';

describe('isBacklogStatus', () => {
  it('accepts every defined backlog status', () => {
    for (const status of BACKLOG_STATUSES) {
      expect(isBacklogStatus(status)).toBe(true);
    }
  });

  it('rejects an unknown status string', () => {
    expect(isBacklogStatus('Paused')).toBe(false);
    expect(isBacklogStatus('')).toBe(false);
  });

  it('rejects non-string input', () => {
    expect(isBacklogStatus(null)).toBe(false);
    expect(isBacklogStatus(2)).toBe(false);
    expect(isBacklogStatus(undefined)).toBe(false);
  });
});
