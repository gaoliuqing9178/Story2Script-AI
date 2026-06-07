import { readFile } from 'node:fs/promises';
import { dump, load } from 'js-yaml';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { STAGE_MARKERS } from '../src/pipeline/prompts.js';
import type { CapturedOpenAIRequest, GenerateScreenplayBody } from './screenplay-route-helpers.js';
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

describe('POST /api/screenplay/generate/stream', () => {
  it('streams OpenAI-compatible YAML deltas and returns final validation', async () => {
    process.env.LLM_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.OPENAI_MODEL = 'test-model';
    const openai = await harness.startOpenAICompatibleStreamingServer(
      buildYamlWithoutProjectLanguage(),
      buildStreamingStageResponse
    );
    process.env.OPENAI_BASE_URL = openai.baseUrl;

    const { status, events } = await harness.postGenerateStream({
      novel: novelSample,
      adaptation_type: 'screenplay',
      adaptation_intensity: 'balanced'
    });
    const request = openai.getRequest();
    const deltas = events.filter((event) => event.type === 'yaml_delta');
    const done = events.find((event) => event.type === 'done') as
      | { type: 'done'; yaml: string; validation: GenerateScreenplayBody['validation'] }
      | undefined;

    expect(status).toBe(200);
    expect(request.body.stream).toBe(true);
    expect(deltas.length).toBeGreaterThan(1);
    expect(done?.yaml).toContain('language: zh-CN');
    expect(done?.validation).toEqual({
      valid: true,
      errors: [],
      warnings: []
    });
  });
});

function buildStreamingStageResponse(requestBody: CapturedOpenAIRequest['body']) {
  const instructions = typeof requestBody.instructions === 'string' ? requestBody.instructions : '';
  const input = typeof requestBody.input === 'string' ? requestBody.input : '';

  if (instructions.includes(STAGE_MARKERS.analysis)) {
    const chapterId = /"id":\s*"([^"]+)"/u.exec(input)?.[1] ?? 'chapter_001';
    return JSON.stringify({
      chapter_id: chapterId,
      summary: `${chapterId} summary`,
      characters: ['Lin Zhou', 'Shen Nian'],
      locations: ['Old Station'],
      key_events: [`${chapterId} event`],
      conflicts: ['Investigation versus protection'],
      adaptation_notes: ['Externalize as action and dialogue']
    });
  }

  if (instructions.includes(STAGE_MARKERS.bible)) {
    return JSON.stringify({
      logline: 'Lin Zhou returns home to investigate an old case.',
      theme: 'memory, truth, and reconciliation',
      characters: [
        { id: 'char_linzhou', name: 'Lin Zhou', role: 'protagonist' },
        { id: 'char_shennian', name: 'Shen Nian', role: 'supporting' }
      ],
      locations: [{ id: 'loc_old_station', name: 'Old Station', type: 'station' }],
      timeline: ['Lin Zhou returns', 'Old letter appears'],
      main_conflict: 'Lin Zhou investigates while Shen Nian worries he will be hurt again.',
      adaptation_principles: ['Keep chapter provenance', 'Give each scene a conflict']
    });
  }

  return '{}';
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
