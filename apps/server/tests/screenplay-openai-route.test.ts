import { readFile } from 'node:fs/promises';
import { dump, load } from 'js-yaml';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createRouteTestHarness, restoreProviderEnv, snapshotProviderEnv, useMockProviderEnv } from './screenplay-route-helpers.js';

const harness = createRouteTestHarness();
const originalEnv = snapshotProviderEnv();
let sampleYaml = '';
let novelSample = '';

beforeAll(async () => {
  sampleYaml = await readFile(new URL('../../../examples/screenplay-sample.yaml', import.meta.url), 'utf8');
  novelSample = await readFile(new URL('../../../examples/novel-sample.md', import.meta.url), 'utf8');
});

beforeEach(() => {
  useMockProviderEnv();
});

afterEach(async () => {
  await harness.close();
  restoreProviderEnv(originalEnv);
});

describe('POST /api/screenplay/generate with OpenAI-compatible provider', () => {
  it('calls the provider and immediately validates returned YAML', async () => {
    process.env.LLM_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.OPENAI_MODEL = 'test-model';
    const openai = await harness.startOpenAICompatibleServer(`\`\`\`yaml\n${sampleYaml}\n\`\`\``);
    process.env.OPENAI_BASE_URL = openai.baseUrl;

    const { status, body } = await harness.postGenerate({
      novel: novelSample,
      adaptation_type: 'screenplay',
      adaptation_intensity: 'balanced'
    });
    const request = openai.getRequest();

    expect(status).toBe(200);
    expect(body.yaml).toContain('schema_version: "1.0"');
    expect(body.yaml.startsWith('```')).toBe(false);
    expect(body.validation).toEqual({
      valid: true,
      errors: [],
      warnings: []
    });
    expect(request.method).toBe('POST');
    expect(request.url).toBe('/responses');
    expect(request.authorization).toBe('Bearer test-key');
    expect(request.body.model).toBe('test-model');
    expect(request.body.instructions).toContain('只返回 YAML 正文');
    expect(request.body.input).toContain('第一章 雨夜归来');
  });

  it('returns precise validation errors for provider YAML output', async () => {
    process.env.LLM_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'test-key';
    const invalidYaml = buildYamlWithoutProjectTitle();
    const openai = await harness.startOpenAICompatibleServer(invalidYaml);
    process.env.OPENAI_BASE_URL = openai.baseUrl;

    const { status, body } = await harness.postGenerate({
      text: novelSample
    });

    expect(status).toBe(200);
    expect(body.yaml).toBe(invalidYaml.trim());
    expect(body.validation.valid).toBe(false);
    expect(body.validation.errors).toContainEqual({
      path: 'project.title',
      message: '必填字段缺失'
    });
  });

  it('normalizes missing project.language before validation', async () => {
    process.env.LLM_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'test-key';
    const openai = await harness.startOpenAICompatibleServer(buildYamlWithoutProjectLanguage());
    process.env.OPENAI_BASE_URL = openai.baseUrl;

    const { status, body } = await harness.postGenerate({
      text: novelSample
    });

    expect(status).toBe(200);
    expect(body.yaml).toContain('language: zh-CN');
    expect(body.validation).toEqual({
      valid: true,
      errors: [],
      warnings: []
    });
  });

  it('requires novel text before calling OpenAI-compatible generation', async () => {
    process.env.LLM_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'test-key';

    const { status, body } = await harness.postGenerate({});

    expect(status).toBe(400);
    expect(body).toEqual({
      error: {
        code: 'BAD_REQUEST',
        message: 'novel, novel_text, or text must be a non-empty string when LLM_PROVIDER=openai'
      }
    });
  });

  it('reports provider failures without exposing secrets', async () => {
    process.env.LLM_PROVIDER = 'openai';

    const { status, body } = await harness.postGenerate({
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

  it.each([
    [
      502,
      { status_code: 502, message: 'Upstream request failed' },
      'application/json',
      'OpenAI-compatible request failed with HTTP 502 (upstream status_code=502): Upstream request failed'
    ],
    [
      524,
      '<!DOCTYPE html><html><head><title>524: A timeout occurred</title></head><body>Cloudflare</body></html>',
      'text/html',
      'OpenAI-compatible request failed with HTTP 524: HTML error page: 524: A timeout occurred'
    ]
  ])('reports upstream HTTP %i errors clearly', async (upstreamStatus, responseBody, contentType, expectedMessage) => {
    process.env.LLM_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'test-key';
    const openai = await harness.startOpenAICompatibleErrorServer(upstreamStatus, responseBody, contentType);
    process.env.OPENAI_BASE_URL = openai.baseUrl;

    const { status, body } = await harness.postGenerate({
      novel_text: novelSample
    });

    expect(status).toBe(502);
    expect(body).toEqual({
      error: {
        code: 'LLM_UNAVAILABLE',
        message: expectedMessage
      }
    });
  });
});

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

function buildYamlWithoutProjectLanguage() {
  const screenplay = load(sampleYaml) as {
    project?: {
      language?: string;
    };
  };

  delete screenplay.project?.language;

  return dump(screenplay, {
    lineWidth: -1,
    noRefs: true
  });
}
