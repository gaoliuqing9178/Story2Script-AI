import './env.js';
import { createApp } from './app.js';
import { logEvent } from './logger.js';

const port = Number.parseInt(process.env.PORT ?? '8787', 10);
const host = process.env.HOST ?? '127.0.0.1';

const app = createApp();

app.listen(port, host, () => {
  logEvent('server.started', {
    host,
    port,
    provider: process.env.LLM_PROVIDER ?? 'mock'
  });
});
