import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { readFile } from 'node:fs/promises';
import { dump, load } from 'js-yaml';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { ValidationResult } from '@story2script/shared';
import { createApp } from '../src/app.js';

interface MutableBeat {
  type?: string;
  content?: string;
}

interface MutableScene {
  beats?: MutableBeat[];
}

interface MutableScreenplay {
  schema_version?: string;
  project?: {
    title?: string;
  };
  source?: {
    chapters?: unknown[];
  };
  scenes?: MutableScene[];
}

const servers: ReturnType<typeof createServer>[] = [];
let sampleYaml = '';

beforeAll(async () => {
  sampleYaml = await readFile(new URL('../../../examples/screenplay-sample.yaml', import.meta.url), 'utf8');
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
});

describe('POST /api/yaml/validate', () => {
  it('rejects requests without a YAML string', async () => {
    const { status, body } = await postValidateBody({});

    expect(status).toBe(400);
    expect(body).toEqual({
      error: {
        code: 'BAD_REQUEST',
        message: 'yaml must be a string'
      }
    });
  });

  it('accepts the valid screenplay sample fixture', async () => {
    const { status, body } = await postValidate(sampleYaml);

    expect(status).toBe(200);
    expect(body).toEqual({
      valid: true,
      errors: [],
      warnings: []
    });
  });

  it('reports a precise path for missing schema_version', async () => {
    const screenplay = parseSample();
    delete screenplay.schema_version;

    const { body } = await postValidate(toYaml(screenplay));

    expect(body.valid).toBe(false);
    expect(body.errors).toContainEqual({
      path: 'schema_version',
      message: '必填字段缺失'
    });
  });

  it('reports a precise path for missing project.title', async () => {
    const screenplay = parseSample();
    delete screenplay.project?.title;

    const { body } = await postValidate(toYaml(screenplay));

    expect(body.valid).toBe(false);
    expect(body.errors).toContainEqual({
      path: 'project.title',
      message: '必填字段缺失'
    });
  });

  it('reports a precise path for an invalid beat type enum', async () => {
    const screenplay = parseSample();
    const beat = screenplay.scenes?.[0]?.beats?.[0];

    if (!beat) {
      throw new Error('Sample fixture must include scenes[0].beats[0].');
    }

    beat.type = 'monologue';

    const { body } = await postValidate(toYaml(screenplay));

    expect(body.valid).toBe(false);
    expect(body.errors[0]).toMatchObject({
      path: 'scenes[0].beats[0].type'
    });
    expect(body.errors[0]?.message).toContain('"inner_voice"');
  });

  it('enforces the minimum source chapter count', async () => {
    const screenplay = parseSample();

    if (!screenplay.source?.chapters) {
      throw new Error('Sample fixture must include source.chapters.');
    }

    screenplay.source.chapters = screenplay.source.chapters.slice(0, 2);

    const { body } = await postValidate(toYaml(screenplay));

    expect(body.valid).toBe(false);
    expect(body.errors).toContainEqual({
      path: 'source.chapters',
      message: '至少需要 3 项'
    });
  });
});

function parseSample() {
  return load(sampleYaml) as MutableScreenplay;
}

function toYaml(value: unknown) {
  return dump(value, {
    lineWidth: -1,
    noRefs: true
  });
}

async function postValidate(yamlText: string) {
  const { status, body } = await postValidateBody({ yaml: yamlText });

  return {
    status,
    body: body as ValidationResult
  };
}

async function postValidateBody(payload: unknown) {
  const server = createServer(createApp());
  servers.push(server);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const { port } = server.address() as AddressInfo;
  const response = await fetch(`http://127.0.0.1:${port}/api/yaml/validate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return {
    status: response.status,
    body: (await response.json()) as unknown
  };
}
