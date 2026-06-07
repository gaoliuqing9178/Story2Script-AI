import { createServer } from 'node:http';
import type { IncomingMessage } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/app.js';

export interface GenerateScreenplayBody {
  yaml: string;
  validation: {
    valid: boolean;
    errors: Array<{ path: string; message: string }>;
    warnings?: Array<{ path: string; message: string }>;
  };
}

export interface CapturedOpenAIRequest {
  method: string | undefined;
  url: string | undefined;
  authorization: string | undefined;
  body: {
    model?: unknown;
    temperature?: unknown;
    instructions?: unknown;
    input?: unknown;
    stream?: unknown;
  };
}

export type ProviderEnv = Record<'LLM_PROVIDER' | 'OPENAI_API_KEY' | 'OPENAI_BASE_URL' | 'OPENAI_MODEL', string | undefined>;

export function createRouteTestHarness() {
  const servers: ReturnType<typeof createServer>[] = [];

  return {
    async close() {
      await Promise.all(
        servers.splice(0).map(
          (server) =>
            new Promise<void>((resolve, reject) => {
              server.close((error) => (error ? reject(error) : resolve()));
            })
        )
      );
    },
    postGenerate(payload: unknown) {
      return postJson<GenerateScreenplayBody>(servers, '/api/screenplay/generate', payload);
    },
    postGenerateStream(payload: unknown) {
      return postStream(servers, payload);
    },
    startOpenAICompatibleErrorServer(statusCode: number, responseBody: Record<string, unknown> | string, contentType = 'application/json') {
      return startErrorServer(servers, statusCode, responseBody, contentType);
    },
    startOpenAICompatibleServer(content: string) {
      return startJsonServer(servers, content);
    },
    startOpenAICompatibleStreamingServer(
      content: string,
      buildNonStreamResponse: (requestBody: CapturedOpenAIRequest['body']) => string
    ) {
      return startStreamingServer(servers, content, buildNonStreamResponse);
    }
  };
}

export function snapshotProviderEnv(): ProviderEnv {
  return {
    LLM_PROVIDER: process.env.LLM_PROVIDER,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
    OPENAI_MODEL: process.env.OPENAI_MODEL
  };
}

export function useMockProviderEnv() {
  process.env.LLM_PROVIDER = 'mock';
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_BASE_URL;
  delete process.env.OPENAI_MODEL;
}

export function restoreProviderEnv(env: ProviderEnv) {
  restoreEnvValue('LLM_PROVIDER', env.LLM_PROVIDER);
  restoreEnvValue('OPENAI_API_KEY', env.OPENAI_API_KEY);
  restoreEnvValue('OPENAI_BASE_URL', env.OPENAI_BASE_URL);
  restoreEnvValue('OPENAI_MODEL', env.OPENAI_MODEL);
}

async function postJson<TBody>(servers: ReturnType<typeof createServer>[], path: string, payload: unknown) {
  const baseUrl = await startAppServer(servers);
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return {
    status: response.status,
    body: (await response.json()) as TBody
  };
}

async function postStream(servers: ReturnType<typeof createServer>[], payload: unknown) {
  const baseUrl = await startAppServer(servers);
  const response = await fetch(`${baseUrl}/api/screenplay/generate/stream`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const responseText = await response.text();

  return {
    status: response.status,
    events: responseText
      .trim()
      .split(/\r?\n/u)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as { type: string; [key: string]: unknown })
  };
}

async function startAppServer(servers: ReturnType<typeof createServer>[]) {
  const server = createServer(createApp());
  servers.push(server);
  await listen(server);
  const { port } = server.address() as AddressInfo;
  return `http://127.0.0.1:${port}`;
}

async function startJsonServer(servers: ReturnType<typeof createServer>[], content: string) {
  let capturedRequest: CapturedOpenAIRequest | undefined;
  const server = createServer((req, res) => {
    const chunks: Buffer[] = [];

    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      capturedRequest = captureRequest(req, chunks);
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(buildResponsesPayload(content)));
    });
  });
  servers.push(server);
  await listen(server);

  return {
    baseUrl: getBaseUrl(server),
    getRequest: () => readCapturedRequest(capturedRequest)
  };
}

async function startErrorServer(
  servers: ReturnType<typeof createServer>[],
  statusCode: number,
  responseBody: Record<string, unknown> | string,
  contentType: string
) {
  const server = createServer((_req, res) => {
    res.statusCode = statusCode;
    res.setHeader('content-type', contentType);
    res.end(typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody));
  });
  servers.push(server);
  await listen(server);

  return {
    baseUrl: getBaseUrl(server)
  };
}

async function startStreamingServer(
  servers: ReturnType<typeof createServer>[],
  content: string,
  buildNonStreamResponse: (requestBody: CapturedOpenAIRequest['body']) => string
) {
  let capturedRequest: CapturedOpenAIRequest | undefined;
  const server = createServer((req, res) => {
    const chunks: Buffer[] = [];

    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      capturedRequest = captureRequest(req, chunks);

      if (!capturedRequest.body.stream) {
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(buildResponsesPayload(buildNonStreamResponse(capturedRequest.body))));
        return;
      }

      res.setHeader('content-type', 'text/event-stream');
      for (const delta of chunkText(content, 160)) {
        res.write(`data: ${JSON.stringify({ type: 'response.output_text.delta', delta })}\n\n`);
      }
      res.end(`data: ${JSON.stringify({ type: 'response.completed' })}\n\n`);
    });
  });
  servers.push(server);
  await listen(server);

  return {
    baseUrl: getBaseUrl(server),
    getRequest: () => readCapturedRequest(capturedRequest)
  };
}

function captureRequest(req: IncomingMessage, chunks: Buffer[]) {
  const rawBody = Buffer.concat(chunks).toString('utf8');
  return {
    method: req.method,
    url: req.url,
    authorization: req.headers.authorization,
    body: JSON.parse(rawBody) as CapturedOpenAIRequest['body']
  };
}

function buildResponsesPayload(content: string) {
  return { output: [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: content }] }] };
}

function readCapturedRequest(capturedRequest: CapturedOpenAIRequest | undefined) {
  if (!capturedRequest) {
    throw new Error('Expected OpenAI-compatible request to be captured.');
  }

  return capturedRequest;
}

function listen(server: ReturnType<typeof createServer>) {
  return new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
}

function getBaseUrl(server: ReturnType<typeof createServer>) {
  const { port } = server.address() as AddressInfo;
  return `http://127.0.0.1:${port}`;
}

function chunkText(text: string, size: number) {
  const chunks: string[] = [];

  for (let index = 0; index < text.length; index += size) {
    chunks.push(text.slice(index, index + size));
  }

  return chunks;
}

function restoreEnvValue(key: keyof ProviderEnv, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}
