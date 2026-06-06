import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { readFile } from 'node:fs/promises';
import { dump, load } from 'js-yaml';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { ValidationResult } from '@story2script/shared';
import { createApp } from '../src/app.js';

interface MutableBeat {
  type?: string;
  speaker?: string;
  content?: string;
}

interface MutableScene {
  id?: string;
  source_chapters?: string[];
  location_id?: string;
  characters?: string[];
  beats?: MutableBeat[];
}

interface MutableScreenplay {
  schema_version?: string;
  project?: {
    title?: string;
  };
  source?: {
    chapters?: Array<{
      id?: string;
    }>;
  };
  characters?: Array<{
    id?: string;
    relationships?: Array<{
      target?: string;
    }>;
  }>;
  locations?: Array<{
    id?: string;
  }>;
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

  it('reports a precise path for an unknown dialogue speaker reference', async () => {
    const screenplay = parseSample();
    const beat = screenplay.scenes?.[0]?.beats?.[1];

    if (!beat) {
      throw new Error('Sample fixture must include scenes[0].beats[1].');
    }

    beat.speaker = 'char_missing';

    const { body } = await postValidate(toYaml(screenplay));

    expect(body.valid).toBe(false);
    expect(body.errors).toContainEqual({
      path: 'scenes[0].beats[1].speaker',
      message: '未在 characters 中定义: char_missing'
    });
  });

  it('requires speakers for dialogue and inner_voice beats', async () => {
    const screenplay = parseSample();
    const dialogueBeat = screenplay.scenes?.[0]?.beats?.[1];
    const innerVoiceBeat = screenplay.scenes?.[1]?.beats?.[2];

    if (!dialogueBeat || !innerVoiceBeat) {
      throw new Error('Sample fixture must include dialogue and inner_voice beats.');
    }

    delete dialogueBeat.speaker;
    delete innerVoiceBeat.speaker;

    const { body } = await postValidate(toYaml(screenplay));

    expect(body.valid).toBe(false);
    expect(body.errors).toEqual(
      expect.arrayContaining([
        {
          path: 'scenes[0].beats[1].speaker',
          message: 'dialogue beat 必须提供 speaker'
        },
        {
          path: 'scenes[1].beats[2].speaker',
          message: 'inner_voice beat 必须提供 speaker'
        }
      ])
    );
  });

  it('reports duplicate character, location, and scene ids', async () => {
    const screenplay = parseSample();

    if (
      !screenplay.characters?.[0]?.id ||
      !screenplay.characters[1] ||
      !screenplay.locations?.[0]?.id ||
      !screenplay.locations[1] ||
      !screenplay.scenes?.[0]?.id ||
      !screenplay.scenes[1]
    ) {
      throw new Error('Sample fixture must include duplicate id targets.');
    }

    screenplay.characters[1].id = screenplay.characters[0].id;
    screenplay.locations[1].id = screenplay.locations[0].id;
    screenplay.scenes[1].id = screenplay.scenes[0].id;

    const { body } = await postValidate(toYaml(screenplay));

    expect(body.valid).toBe(false);
    expect(body.errors).toEqual(
      expect.arrayContaining([
        {
          path: 'characters[1].id',
          message: 'ID 重复: char_linzhou，首次出现于 characters[0].id'
        },
        {
          path: 'locations[1].id',
          message: 'ID 重复: loc_old_station，首次出现于 locations[0].id'
        },
        {
          path: 'scenes[1].id',
          message: 'ID 重复: scene_001，首次出现于 scenes[0].id'
        }
      ])
    );
  });

  it('warns when a source chapter is not covered by any scene', async () => {
    const screenplay = parseSample();

    if (!screenplay.scenes?.[2]) {
      throw new Error('Sample fixture must include scenes[2].');
    }

    screenplay.scenes[2].source_chapters = ['chapter_002'];

    const { body } = await postValidate(toYaml(screenplay));

    expect(body.valid).toBe(true);
    expect(body.errors).toEqual([]);
    expect(body.warnings).toContainEqual({
      path: 'source.chapters[2].id',
      message: '该章节未生成任何场景: chapter_003'
    });
  });

  it('reports invalid scene location, scene character, source chapter, and relationship references', async () => {
    const screenplay = parseSample();

    if (!screenplay.characters?.[0]?.relationships?.[0] || !screenplay.scenes?.[0]) {
      throw new Error('Sample fixture must include relationship and scene references.');
    }

    screenplay.characters[0].relationships[0].target = 'char_missing';
    screenplay.scenes[0].location_id = 'loc_missing';
    screenplay.scenes[0].characters = ['char_missing'];
    screenplay.scenes[0].source_chapters = ['chapter_missing'];

    const { body } = await postValidate(toYaml(screenplay));

    expect(body.valid).toBe(false);
    expect(body.errors).toEqual(
      expect.arrayContaining([
        {
          path: 'characters[0].relationships[0].target',
          message: '未在 characters 中定义: char_missing'
        },
        {
          path: 'scenes[0].location_id',
          message: '未在 locations 中定义: loc_missing'
        },
        {
          path: 'scenes[0].source_chapters[0]',
          message: '未在 source.chapters 中定义: chapter_missing'
        },
        {
          path: 'scenes[0].characters[0]',
          message: '未在 characters 中定义: char_missing'
        }
      ])
    );
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
