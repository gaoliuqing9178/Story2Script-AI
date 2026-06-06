import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { readFile } from 'node:fs/promises';
import { dump, load } from 'js-yaml';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const servers: ReturnType<typeof createServer>[] = [];
const requiredTopLevelKeys = ['schema_version', 'project', 'source', 'characters', 'locations', 'scenes'];
const originalEnv = {
  LLM_PROVIDER: process.env.LLM_PROVIDER,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
  OPENAI_MODEL: process.env.OPENAI_MODEL
};

let sampleYaml = '';
let novelSample = '';

interface GenerateScreenplayBody {
  yaml: string;
  validation: {
    valid: boolean;
    errors: Array<{ path: string; message: string }>;
    warnings?: Array<{ path: string; message: string }>;
  };
}

interface CapturedOpenAIRequest {
  method: string | undefined;
  url: string | undefined;
  authorization: string | undefined;
  body: {
    model?: unknown;
    temperature?: unknown;
    messages?: Array<{ role?: unknown; content?: unknown }>;
  };
}

beforeAll(async () => {
  sampleYaml = await readFile(new URL('../../../examples/screenplay-sample.yaml', import.meta.url), 'utf8');
  novelSample = await readFile(new URL('../../../examples/novel-sample.md', import.meta.url), 'utf8');
});

beforeEach(() => {
  process.env.LLM_PROVIDER = 'mock';
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_BASE_URL;
  delete process.env.OPENAI_MODEL;
});

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        })
    )
  );
  restoreEnv();
});

describe('POST /api/screenplay/generate', () => {
  it('returns the mock YAML fixture through the API', async () => {
    const { status, body } = await postGenerate({});
    const generateBody = body as GenerateScreenplayBody;
    const parsed = load(generateBody.yaml) as {
      schema_version?: string;
      source?: { chapters?: unknown[] };
      characters?: unknown[];
      locations?: unknown[];
      scenes?: unknown[];
    };

    expect(status).toBe(200);
    expect(generateBody.yaml).toContain('schema_version: "1.0"');
    for (const key of requiredTopLevelKeys) {
      expect(generateBody.yaml).toContain(`${key}:`);
    }
    expect(parsed.schema_version).toBe('1.0');
    expect(parsed.source?.chapters).toHaveLength(3);
    expect(parsed.characters?.length).toBeGreaterThan(0);
    expect(parsed.locations?.length).toBeGreaterThan(0);
    expect(parsed.scenes?.length).toBeGreaterThan(0);
    expect(generateBody.validation).toEqual({
      valid: true,
      errors: [],
      warnings: []
    });
  });

  it('calls an OpenAI-compatible provider and immediately validates returned YAML', async () => {
    process.env.LLM_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.OPENAI_MODEL = 'test-model';
    const openai = await startOpenAICompatibleServer(`\`\`\`yaml\n${sampleYaml}\n\`\`\``);
    process.env.OPENAI_BASE_URL = openai.baseUrl;

    const { status, body } = await postGenerate({
      novel: novelSample,
      adaptation_type: 'screenplay',
      adaptation_intensity: 'balanced'
    });
    const generateBody = body as GenerateScreenplayBody;
    const request = openai.getRequest();

    expect(status).toBe(200);
    expect(generateBody.yaml).toContain('schema_version: "1.0"');
    expect(generateBody.yaml.startsWith('```')).toBe(false);
    expect(generateBody.validation).toEqual({
      valid: true,
      errors: [],
      warnings: []
    });
    expect(request.method).toBe('POST');
    expect(request.url).toBe('/chat/completions');
    expect(request.authorization).toBe('Bearer test-key');
    expect(request.body.model).toBe('test-model');
    expect(request.body.messages?.[0]).toMatchObject({
      role: 'system'
    });
    expect(request.body.messages?.[0]?.content).toContain('只返回 YAML 正文');
    expect(request.body.messages?.[1]).toMatchObject({
      role: 'user'
    });
    expect(request.body.messages?.[1]?.content).toContain('第一章 雨夜归来');
  });

  it('returns precise validation errors for OpenAI-compatible YAML output', async () => {
    process.env.LLM_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'test-key';
    const invalidYaml = buildYamlWithoutProjectTitle();
    const openai = await startOpenAICompatibleServer(invalidYaml);
    process.env.OPENAI_BASE_URL = openai.baseUrl;

    const { status, body } = await postGenerate({
      text: novelSample
    });
    const generateBody = body as GenerateScreenplayBody;

    expect(status).toBe(200);
    expect(generateBody.yaml).toBe(invalidYaml.trim());
    expect(generateBody.validation.valid).toBe(false);
    expect(generateBody.validation.errors).toContainEqual({
      path: 'project.title',
      message: '必填字段缺失'
    });
  });

  it('requires novel text before calling OpenAI-compatible generation', async () => {
    process.env.LLM_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'test-key';

    const { status, body } = await postGenerate({});

    expect(status).toBe(400);
    expect(body).toEqual({
      error: {
        code: 'BAD_REQUEST',
        message: 'novel, novel_text, or text must be a non-empty string when LLM_PROVIDER=openai'
      }
    });
  });

  it('reports OpenAI-compatible provider failures without exposing secrets', async () => {
    process.env.LLM_PROVIDER = 'openai';

    const { status, body } = await postGenerate({
      novel_text: novelSample
    });

    expect(status).toBe(502);
    expect(body).toEqual({
      error: {
        code: 'LLM_UNAVAILABLE',
        message: 'OPENAI_API_KEY is required when LLM_PROVIDER=openai.'
      }
    });
  });
});

async function postGenerate(payload: unknown) {
  const baseUrl = await startAppServer();
  const response = await fetch(`${baseUrl}/api/screenplay/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return {
    status: response.status,
    body: (await response.json()) as GenerateScreenplayBody | { error: { code: string; message: string } }
  };
}

async function startAppServer() {
  const server = createServer(createApp());
  servers.push(server);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const { port } = server.address() as AddressInfo;
  return `http://127.0.0.1:${port}`;
}

async function startOpenAICompatibleServer(content: string) {
  let capturedRequest: CapturedOpenAIRequest | undefined;
  const server = createServer((req, res) => {
    const chunks: Buffer[] = [];

    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      const rawBody = Buffer.concat(chunks).toString('utf8');
      capturedRequest = {
        method: req.method,
        url: req.url,
        authorization: req.headers.authorization,
        body: JSON.parse(rawBody) as CapturedOpenAIRequest['body']
      };

      res.setHeader('content-type', 'application/json');
      res.end(
        JSON.stringify({
          choices: [
            {
              message: {
                content
              }
            }
          ]
        })
      );
    });
  });
  servers.push(server);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const { port } = server.address() as AddressInfo;

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    getRequest() {
      if (!capturedRequest) {
        throw new Error('Expected OpenAI-compatible request to be captured.');
      }

      return capturedRequest;
    }
  };
}

function buildYamlWithoutProjectTitle() {
  const screenplay = load(sampleYaml) as {
    project?: {
      title?: string;
    };
  };

  delete screenplay.project?.title;

  return dump(screenplay, {
    lineWidth: -1,
    noRefs: true
  });
}

function restoreEnv() {
  restoreEnvValue('LLM_PROVIDER', originalEnv.LLM_PROVIDER);
  restoreEnvValue('OPENAI_API_KEY', originalEnv.OPENAI_API_KEY);
  restoreEnvValue('OPENAI_BASE_URL', originalEnv.OPENAI_BASE_URL);
  restoreEnvValue('OPENAI_MODEL', originalEnv.OPENAI_MODEL);
}

function restoreEnvValue(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}
