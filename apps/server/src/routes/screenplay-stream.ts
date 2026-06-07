import type { Response, Router } from 'express';
import { logEvent } from '../logger.js';
import { runMultiStagePipelineStream } from '../pipeline/multistage.js';
import { normalizeGeneratedScreenplayYaml } from '../pipeline/normalize-yaml.js';
import { splitChapters } from '../pipeline/split.js';
import { createProvider } from '../provider/index.js';
import { validateScreenplayYamlStructure } from '../validate/structural.js';
import {
  getAdaptationType,
  getNovelText,
  getOptionalString,
  getRepairMaxAttempts,
  parseAnalysesInput,
  parseChaptersInput
} from './request-utils.js';
import { buildSingleStageSystemPrompt, buildSingleStageUserPrompt } from './screenplay-prompts.js';
import type { GenerateScreenplayRequest } from './screenplay-types.js';
import { prepareNdjsonStream, writeStreamEvent } from './streaming.js';

export function registerScreenplayStreamRoute(router: Router) {
  router.post('/generate/stream', async (req, res, next) => {
    const providerName = process.env.LLM_PROVIDER === 'openai' ? 'openai' : 'mock';
    let streamStarted = false;

    try {
      const requestBody = req.body as GenerateScreenplayRequest;
      const novelText = getNovelText(requestBody);
      const adaptationType = getAdaptationType(requestBody);
      const adaptationIntensity = getOptionalString(requestBody.adaptation_intensity) ?? 'balanced';
      const chapters = parseChaptersInput(requestBody.chapters);
      const analyses = parseAnalysesInput(requestBody.analyses);

      if (requestBody.chapters !== undefined && !chapters) {
        sendBadRequest(res, 'chapters must be a Chapter[]');
        return;
      }

      if (requestBody.analyses !== undefined && !analyses) {
        sendBadRequest(res, 'analyses must be a ChapterAnalysis[]');
        return;
      }

      if (providerName === 'openai' && !novelText && !chapters) {
        sendBadRequest(res, 'novel, novel_text, or text must be a non-empty string when LLM_PROVIDER=openai');
        return;
      }

      const provider = createProvider();
      const pipelineChapters = chapters ?? (novelText ? splitChapters(novelText) : undefined);
      const usePipeline = Boolean(pipelineChapters || analyses);

      if (usePipeline && (!pipelineChapters || pipelineChapters.length === 0)) {
        sendBadRequest(res, 'chapters must include at least one Chapter');
        return;
      }

      prepareNdjsonStream(res);
      streamStarted = true;
      logEvent('screenplay.stream.started', {
        provider: providerName,
        mode: usePipeline ? 'pipeline' : 'single-stage',
        chapters: pipelineChapters?.length ?? 0
      });

      if (usePipeline) {
        await streamPipelineGeneration({
          res,
          providerName,
          requestBody,
          pipelineChapters: pipelineChapters ?? [],
          analyses,
          provider,
          adaptationType,
          adaptationIntensity
        });
        return;
      }

      await streamSingleStageGeneration({
        res,
        providerName,
        provider,
        novelText: novelText ?? 'Initializer harness request',
        adaptationType,
        adaptationIntensity
      });
    } catch (error) {
      handleStreamError({ error, next, providerName, res, streamStarted });
    }
  });
}

function sendBadRequest(res: Response, message: string) {
  res.status(400).json({
    error: {
      code: 'BAD_REQUEST',
      message
    }
  });
}

async function streamPipelineGeneration(input: {
  res: Response;
  providerName: string;
  requestBody: GenerateScreenplayRequest;
  pipelineChapters: ReturnType<typeof splitChapters>;
  analyses: ReturnType<typeof parseAnalysesInput>;
  provider: ReturnType<typeof createProvider>;
  adaptationType: ReturnType<typeof getAdaptationType>;
  adaptationIntensity: string;
}) {
  const result = await runMultiStagePipelineStream(
    {
      chapters: input.pipelineChapters,
      provider: input.provider,
      adaptationType: input.adaptationType,
      adaptationIntensity: input.adaptationIntensity,
      repairMaxAttempts: getRepairMaxAttempts(input.requestBody.repair_max_retries),
      ...(input.analyses ? { analyses: input.analyses } : {})
    },
    createPipelineStreamObserver(input.res, input.providerName)
  );

  writeStreamEvent(input.res, { type: 'validation', validation: result.validation });
  writeStreamEvent(input.res, {
    type: 'done',
    yaml: result.yaml,
    validation: result.validation,
    pipeline: {
      analyses: result.analyses,
      bible: result.bible,
      initial_validation: result.repair.initialValidation,
      repair_attempts: result.repair.attempts,
      max_repair_attempts: result.repair.maxAttempts
    }
  });
  logEvent('screenplay.stream.completed', {
    provider: input.providerName,
    mode: 'pipeline',
    chapters: input.pipelineChapters.length,
    repair_attempts: result.repair.attempts,
    valid: result.validation.valid,
    bytes: Buffer.byteLength(result.yaml, 'utf8')
  });
  input.res.end();
}

function createPipelineStreamObserver(res: Response, providerName: string) {
  let chunkIndex = 0;
  let totalBytes = 0;

  return {
    onStage(stage: 'analysis' | 'bible' | 'scene-generation' | 'repair') {
      writeStreamEvent(res, { type: 'status', stage });
      logEvent('screenplay.stream.stage', {
        provider: providerName,
        stage
      });
    },
    onYamlReset(source: 'scene-generation' | 'repair', attempt?: number) {
      chunkIndex = 0;
      totalBytes = 0;
      writeStreamEvent(res, attempt === undefined ? { type: 'yaml_reset', source } : { type: 'yaml_reset', source, attempt });
      logEvent('screenplay.stream.yaml_reset', {
        provider: providerName,
        source,
        attempt
      });
    },
    onYamlDelta(delta: string, source: 'scene-generation' | 'repair', attempt?: number) {
      chunkIndex += 1;
      totalBytes += Buffer.byteLength(delta, 'utf8');
      writeStreamEvent(
        res,
        attempt === undefined ? { type: 'yaml_delta', delta, source } : { type: 'yaml_delta', delta, source, attempt }
      );
      logEvent('screenplay.stream.yaml_delta', {
        provider: providerName,
        source,
        attempt,
        chunk_index: chunkIndex,
        bytes: Buffer.byteLength(delta, 'utf8'),
        total_bytes: totalBytes
      });
    },
    onYamlSnapshot(yaml: string, source: 'scene-generation' | 'repair', attempt?: number) {
      writeStreamEvent(
        res,
        attempt === undefined ? { type: 'yaml_snapshot', yaml, source } : { type: 'yaml_snapshot', yaml, source, attempt }
      );
      logEvent('screenplay.stream.yaml_snapshot', {
        provider: providerName,
        source,
        attempt,
        bytes: Buffer.byteLength(yaml, 'utf8')
      });
    }
  };
}

async function streamSingleStageGeneration(input: {
  res: Response;
  providerName: string;
  provider: ReturnType<typeof createProvider>;
  novelText: string;
  adaptationType: ReturnType<typeof getAdaptationType>;
  adaptationIntensity: string;
}) {
  let yaml = '';
  let chunkIndex = 0;
  let totalBytes = 0;

  writeStreamEvent(input.res, { type: 'status', stage: 'single-stage' });
  writeStreamEvent(input.res, { type: 'yaml_reset', source: 'single-stage' });

  for await (const delta of input.provider.stream({
    system: buildSingleStageSystemPrompt(),
    user: buildSingleStageUserPrompt({
      novelText: input.novelText,
      adaptationType: input.adaptationType,
      adaptationIntensity: input.adaptationIntensity
    }),
    temperature: input.providerName === 'openai' ? 0.2 : 0
  })) {
    yaml += delta;
    chunkIndex += 1;
    totalBytes += Buffer.byteLength(delta, 'utf8');
    writeStreamEvent(input.res, { type: 'yaml_delta', delta, source: 'single-stage' });
    logEvent('screenplay.stream.yaml_delta', {
      provider: input.providerName,
      source: 'single-stage',
      chunk_index: chunkIndex,
      bytes: Buffer.byteLength(delta, 'utf8'),
      total_bytes: totalBytes
    });
  }

  yaml = normalizeGeneratedScreenplayYaml(yaml, { adaptationType: input.adaptationType });
  const validation = validateScreenplayYamlStructure(yaml);
  writeStreamEvent(input.res, { type: 'yaml_snapshot', yaml, source: 'single-stage' });
  writeStreamEvent(input.res, { type: 'validation', validation });
  writeStreamEvent(input.res, { type: 'done', yaml, validation });
  logEvent('screenplay.stream.completed', {
    provider: input.providerName,
    mode: 'single-stage',
    valid: validation.valid,
    bytes: Buffer.byteLength(yaml, 'utf8')
  });
  input.res.end();
}

function handleStreamError(input: {
  error: unknown;
  next: (error: unknown) => void;
  providerName: string;
  res: Response;
  streamStarted: boolean;
}) {
  const message = input.error instanceof Error ? input.error.message : 'LLM provider failed.';
  logEvent('screenplay.stream.failed', {
    level: 'error',
    provider: input.providerName,
    message
  });

  if (input.streamStarted) {
    writeStreamEvent(input.res, {
      type: 'error',
      error: {
        code: input.providerName === 'openai' ? 'LLM_UNAVAILABLE' : 'INTERNAL_ERROR',
        message
      }
    });
    input.res.end();
    return;
  }

  if (input.providerName === 'openai') {
    input.res.status(502).json({
      error: {
        code: 'LLM_UNAVAILABLE',
        message
      }
    });
    return;
  }

  input.next(input.error);
}
