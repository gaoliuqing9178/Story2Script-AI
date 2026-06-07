import type { Response } from 'express';

export type StreamEvent =
  | { type: 'status'; stage: string }
  | { type: 'yaml_reset'; source: string; attempt?: number }
  | { type: 'yaml_delta'; delta: string; source: string; attempt?: number }
  | { type: 'yaml_snapshot'; yaml: string; source: string; attempt?: number }
  | { type: 'validation'; validation: unknown }
  | { type: 'done'; yaml: string; validation: unknown; pipeline?: unknown }
  | { type: 'error'; error: { code: string; message: string } };

export function prepareNdjsonStream(res: Response) {
  res.status(200);
  res.setHeader('content-type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('cache-control', 'no-cache');
  res.setHeader('x-accel-buffering', 'no');
  res.flushHeaders();
}

export function writeStreamEvent(res: Response, event: StreamEvent) {
  res.write(`${JSON.stringify(event)}\n`);
}
