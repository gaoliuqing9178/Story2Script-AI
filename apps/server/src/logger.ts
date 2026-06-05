import type { NextFunction, Request, Response } from 'express';
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';

type LogFields = Record<string, boolean | number | string | undefined>;

const defaultLogFile = resolve(process.cwd(), '../../logs/server-dev.jsonl');
const logFile = process.env.DEV_LOG_FILE ?? defaultLogFile;

export function logEvent(event: string, fields: LogFields = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level: fields.level ?? 'info',
    event,
    ...fields
  };
  const line = JSON.stringify(entry);

  console.log(line);

  if (process.env.NODE_ENV !== 'test') {
    mkdirSync(dirname(logFile), { recursive: true });
    appendFileSync(logFile, `${line}\n`, 'utf8');
  }
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const started = performance.now();

  res.on('finish', () => {
    logEvent('http.request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: Number((performance.now() - started).toFixed(1))
    });
  });

  next();
}
