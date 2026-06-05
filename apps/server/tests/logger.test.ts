import { afterEach, describe, expect, it, vi } from 'vitest';
import { logEvent } from '../src/logger.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('logEvent', () => {
  it('prints a structured JSON log line with common fields', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    logEvent('infra.test', {
      method: 'GET',
      path: '/api/health',
      status: 200,
      duration_ms: 12.3
    });

    const line = consoleSpy.mock.calls[0]?.[0];
    expect(typeof line).toBe('string');

    const entry = JSON.parse(line as string) as {
      ts: string;
      level: string;
      event: string;
      method: string;
      path: string;
      status: number;
      duration_ms: number;
    };

    expect(Number.isNaN(Date.parse(entry.ts))).toBe(false);
    expect(entry).toMatchObject({
      level: 'info',
      event: 'infra.test',
      method: 'GET',
      path: '/api/health',
      status: 200,
      duration_ms: 12.3
    });
  });
});
