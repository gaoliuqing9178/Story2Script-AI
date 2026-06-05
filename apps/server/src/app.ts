import express from 'express';
import type { Express } from 'express';
import { apiRouter } from './routes/index.js';
import { logEvent, requestLogger } from './logger.js';

export function createApp(): Express {
  const app = express();

  app.use(express.json({ limit: '2mb' }));
  app.use(requestLogger);

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'story2script-server',
      provider: process.env.LLM_PROVIDER ?? 'mock'
    });
  });

  app.use('/api', apiRouter);

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    logEvent('server.error', { level: 'error', message });
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message
      }
    });
  });

  return app;
}
