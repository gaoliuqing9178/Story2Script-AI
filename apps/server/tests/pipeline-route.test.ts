import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { dump, load } from 'js-yaml';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Chapter, Screenplay } from '@story2script/shared';
import { createApp } from '../src/app.js';
import { STAGE_MARKERS } from '../src/pipeline/prompts.js';

const servers: ReturnType<typeof createServer>[] = [];
const originalEnv = {
  LLM_PROVIDER: process.env.LLM_PROVIDER,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  REPAIR_MAX_RETRY: process.env.REPAIR_MAX_RETRY
};

interface GeneratePipelineBody {
  yaml: string;
  validation: { valid: boolean; errors: unknown[]; warnings?: unknown[] };
  pipeline: {
    analyses: unknown[];
    bible: { theme?: string };
    initial_validation: { valid: boolean; errors: unknown[] };
    repair_attempts: number;
    max_repair_attempts: number;
  };
}

beforeEach(() => {
  process.env.LLM_PROVIDER = 'mock';
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_BASE_URL;
  delete process.env.OPENAI_MODEL;
  delete process.env.REPAIR_MAX_RETRY;
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

describe('Phase 3 multi-stage pipeline routes', () => {
  it('analyzes chapters through the mock provider', async () => {
    const chapters = makeLongChapters().slice(0, 3);
    const { status, body } = await postJson('/api/chapters/analyze', { chapters });

    expect(status).toBe(200);
    expect(body).toEqual({
      analyses: chapters.map((chapter) => ({
        chapter_id: chapter.id,
        summary: `${chapter.title} 的核心情节被整理为可改编段落。`,
        characters: ['林舟', '沈念'],
        locations: ['旧火车站'],
        key_events: [`${chapter.title} 推进主线线索。`],
        conflicts: ['林舟想继续追查，沈念担心他被过去拖住。'],
        adaptation_notes: ['把心理描写转成动作、对白和可视化线索。']
      }))
    });
  });

  it('runs analysis, bible, generation, validation, and one successful repair', async () => {
    const chapters = makeLongChapters();
    const openai = await startPipelineProvider(chapters);
    process.env.LLM_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.OPENAI_BASE_URL = openai.baseUrl;

    const { status, body } = await postJson('/api/screenplay/generate', {
      chapters,
      adaptation_type: 'screenplay',
      adaptation_intensity: 'balanced',
      repair_max_retries: 2
    });
    const generateBody = body as GeneratePipelineBody;
    const parsed = load(generateBody.yaml) as Screenplay;

    expect(status).toBe(200);
    expect(generateBody.pipeline.analyses).toHaveLength(5);
    expect(generateBody.pipeline.bible.theme).toBe('记忆、真相与和解');
    expect(generateBody.pipeline.initial_validation.valid).toBe(false);
    expect(generateBody.pipeline.repair_attempts).toBe(1);
    expect(generateBody.pipeline.max_repair_attempts).toBe(2);
    expect(generateBody.validation).toEqual({ valid: true, errors: [], warnings: [] });
    expect(parsed.source.chapters).toHaveLength(5);
    expect(parsed.scenes.flatMap((scene) => scene.source_chapters).sort()).toEqual(chapters.map((chapter) => chapter.id));
    expect(openai.stageCalls.filter((stage) => stage === 'analysis')).toHaveLength(5);
    expect(openai.stageCalls).toEqual(expect.arrayContaining(['bible', 'scene-generation', 'repair']));
  });

  it('runs the multi-stage pipeline with two chapters', async () => {
    const chapters = makeLongChapters().slice(0, 2);
    const openai = await startPipelineProvider(chapters);
    process.env.LLM_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.OPENAI_BASE_URL = openai.baseUrl;

    const { status, body } = await postJson('/api/screenplay/generate', {
      chapters,
      adaptation_type: 'screenplay',
      adaptation_intensity: 'balanced'
    });
    const generateBody = body as GeneratePipelineBody;
    const parsed = load(generateBody.yaml) as Screenplay;

    expect(status).toBe(200);
    expect(generateBody.validation).toEqual({ valid: true, errors: [], warnings: [] });
    expect(parsed.source.chapters).toHaveLength(2);
    expect(parsed.scenes.flatMap((scene) => scene.source_chapters).sort()).toEqual(chapters.map((chapter) => chapter.id));
    expect(openai.stageCalls.filter((stage) => stage === 'analysis')).toHaveLength(2);
    expect(openai.stageCalls).toEqual(expect.arrayContaining(['bible', 'scene-generation', 'repair']));
  });

  it('bounds YAML repair retries when the provider keeps returning invalid YAML', async () => {
    const invalidYaml = buildScreenplayYaml(makeLongChapters(), { omitProjectTitle: true });
    const openai = await startRepairProvider(invalidYaml);
    process.env.LLM_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.OPENAI_BASE_URL = openai.baseUrl;

    const { status, body } = await postJson('/api/yaml/repair', {
      yaml: invalidYaml,
      repair_max_retries: 1
    });
    const repairBody = body as {
      validation: { valid: boolean };
      repair: { initial_validation: { valid: boolean }; attempts: number; max_attempts: number };
    };

    expect(status).toBe(200);
    expect(repairBody.repair.initial_validation.valid).toBe(false);
    expect(repairBody.repair.attempts).toBe(1);
    expect(repairBody.repair.max_attempts).toBe(1);
    expect(repairBody.validation.valid).toBe(false);
    expect(openai.calls).toBe(1);
  });
});

async function postJson(path: string, payload: unknown) {
  const baseUrl = await startAppServer();
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return {
    status: response.status,
    body: (await response.json()) as unknown
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

async function startPipelineProvider(chapters: Chapter[]) {
  const stageCalls: string[] = [];
  const server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      const request = JSON.parse(Buffer.concat(chunks).toString('utf8')) as {
        instructions?: unknown;
        input?: unknown;
      };
      const system = typeof request.instructions === 'string' ? request.instructions : '';
      const user = typeof request.input === 'string' ? request.input : '';
      const content = buildProviderResponse(system, user, chapters, stageCalls);
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(buildResponsesPayload(content)));
    });
  });
  servers.push(server);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address() as AddressInfo;
  return { baseUrl: `http://127.0.0.1:${port}`, stageCalls };
}

async function startRepairProvider(content: string) {
  let calls = 0;
  const server = createServer((_req, res) => {
    calls += 1;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(buildResponsesPayload(content)));
  });
  servers.push(server);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address() as AddressInfo;
  return { baseUrl: `http://127.0.0.1:${port}`, get calls() { return calls; } };
}

function buildProviderResponse(system: string, user: string, chapters: Chapter[], stageCalls: string[]) {
  if (system.includes(STAGE_MARKERS.analysis)) {
    stageCalls.push('analysis');
    const chapter = readJsonBlock<Chapter>(user, 'chapter-json');
    return JSON.stringify({
      chapter_id: chapter.id,
      summary: `${chapter.title} 摘要`,
      characters: ['林舟', '沈念'],
      locations: ['旧火车站'],
      key_events: [`${chapter.title} 事件`],
      conflicts: ['追查与阻止之间的冲突'],
      adaptation_notes: ['外化为动作和对白']
    });
  }

  if (system.includes(STAGE_MARKERS.bible)) {
    stageCalls.push('bible');
    return JSON.stringify(buildBible());
  }

  if (system.includes(STAGE_MARKERS.sceneGeneration)) {
    stageCalls.push('scene-generation');
    return buildScreenplayYaml(chapters, { omitProjectTitle: true });
  }

  stageCalls.push('repair');
  return buildScreenplayYaml(chapters);
}

function buildResponsesPayload(content: string) {
  return { output: [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: content }] }] };
}

function buildBible() {
  return {
    logline: '林舟回乡追查旧案。',
    theme: '记忆、真相与和解',
    characters: [
      { id: 'char_linzhou', name: '林舟', role: 'protagonist' },
      { id: 'char_shennian', name: '沈念', role: 'supporting' }
    ],
    locations: [{ id: 'loc_old_station', name: '旧火车站', type: 'station' }],
    timeline: ['林舟回乡', '旧信出现'],
    main_conflict: '林舟追查真相，沈念担心他再次受伤。',
    adaptation_principles: ['保留章节来源', '每场有明确冲突']
  };
}

function buildScreenplayYaml(chapters: Chapter[], options: { omitProjectTitle?: boolean } = {}) {
  const screenplay: Screenplay = {
    schema_version: '1.0',
    project: {
      title: '雨夜归来',
      source_type: 'novel',
      adaptation_type: 'screenplay',
      language: 'zh-CN'
    },
    source: {
      chapters: chapters.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        order: chapter.order,
        summary: `${chapter.title} 摘要`
      }))
    },
    characters: buildBible().characters as Screenplay['characters'],
    locations: buildBible().locations,
    scenes: chapters.map((chapter) => ({
      id: `scene_${chapter.order.toString().padStart(3, '0')}`,
      title: chapter.title,
      order: chapter.order,
      source_chapters: [chapter.id],
      location_id: 'loc_old_station',
      characters: ['char_linzhou', 'char_shennian'],
      purpose: `${chapter.title} 的戏剧功能`,
      conflict: '追查与阻止之间的冲突',
      beats: [{ type: 'action', content: `${chapter.title} 的动作段落。` }],
      notes: { original_reference: chapter.title }
    }))
  };

  if (options.omitProjectTitle) {
    const mutable = screenplay as { project: { title?: string } };
    delete mutable.project.title;
  }

  return dump(screenplay, { lineWidth: -1, noRefs: true });
}

function makeLongChapters(): Chapter[] {
  return ['雨夜归来', '旧信', '巷口的灯', '照相馆暗格', '黎明之前'].map((title, index) => ({
    id: `chapter_${(index + 1).toString().padStart(3, '0')}`,
    title: `第${index + 1}章 ${title}`,
    order: index + 1,
    content: `${title} 的正文。林舟和沈念继续靠近旧案真相。`,
    word_count: 24
  }));
}

function readJsonBlock<T>(text: string, blockName: string): T {
  const start = `[${blockName}]`;
  const end = `[/${blockName}]`;
  return JSON.parse(text.slice(text.indexOf(start) + start.length, text.indexOf(end)).trim()) as T;
}

function restoreEnv() {
  restoreEnvValue('LLM_PROVIDER', originalEnv.LLM_PROVIDER);
  restoreEnvValue('OPENAI_API_KEY', originalEnv.OPENAI_API_KEY);
  restoreEnvValue('OPENAI_BASE_URL', originalEnv.OPENAI_BASE_URL);
  restoreEnvValue('OPENAI_MODEL', originalEnv.OPENAI_MODEL);
  restoreEnvValue('REPAIR_MAX_RETRY', originalEnv.REPAIR_MAX_RETRY);
}

function restoreEnvValue(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }
  process.env[key] = value;
}
