import { Router } from 'express';
import { createProvider } from '../provider/index.js';
import { logEvent } from '../logger.js';
import { runMultiStagePipeline } from '../pipeline/multistage.js';
import { normalizeGeneratedScreenplayYaml } from '../pipeline/normalize-yaml.js';
import { splitChapters } from '../pipeline/split.js';
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
import { registerScreenplayStreamRoute } from './screenplay-stream.js';
import type { GenerateScreenplayRequest } from './screenplay-types.js';

export const screenplayRouter: Router = Router();

screenplayRouter.post('/generate', async (req, res, next) => {
  try {
    const providerName = process.env.LLM_PROVIDER === 'openai' ? 'openai' : 'mock';
    const requestBody = req.body as GenerateScreenplayRequest;
    const novelText = getNovelText(requestBody);
    const adaptationType = getAdaptationType(requestBody);
    const adaptationIntensity = getOptionalString(requestBody.adaptation_intensity) ?? 'balanced';
    const chapters = parseChaptersInput(requestBody.chapters);
    const analyses = parseAnalysesInput(requestBody.analyses);

    if (requestBody.chapters !== undefined && !chapters) {
      res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'chapters must be a Chapter[]'
        }
      });
      return;
    }

    if (requestBody.analyses !== undefined && !analyses) {
      res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'analyses must be a ChapterAnalysis[]'
        }
      });
      return;
    }

    if (providerName === 'openai' && !novelText && !chapters) {
      res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'novel, novel_text, or text must be a non-empty string when LLM_PROVIDER=openai'
        }
      });
      return;
    }

    const provider = createProvider();

    if (chapters || analyses) {
      const pipelineChapters = chapters ?? (novelText ? splitChapters(novelText) : []);

      if (pipelineChapters.length === 0) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'chapters must include at least one Chapter'
          }
        });
        return;
      }

      const result = await runMultiStagePipeline({
        chapters: pipelineChapters,
        provider,
        adaptationType,
        adaptationIntensity,
        repairMaxAttempts: getRepairMaxAttempts(requestBody.repair_max_retries),
        ...(analyses ? { analyses } : {})
      });

      logEvent('screenplay.pipeline.completed', {
        provider: providerName,
        chapters: pipelineChapters.length,
        analyses: result.analyses.length,
        repair_attempts: result.repair.attempts,
        valid: result.validation.valid
      });

      res.json({
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
      return;
    }

    const yaml = normalizeGeneratedScreenplayYaml(await provider.complete({
      system: buildSingleStageSystemPrompt(),
      user: buildSingleStageUserPrompt({
        novelText: novelText ?? 'Initializer harness request',
        adaptationType,
        adaptationIntensity
      }),
      temperature: providerName === 'openai' ? 0.2 : 0
    }), { adaptationType });

    logEvent('screenplay.generate.completed', {
      provider: providerName,
      input_chars: novelText?.length ?? 0,
      bytes: Buffer.byteLength(yaml, 'utf8')
    });

    const validation = validateScreenplayYamlStructure(yaml);

    res.json({
      yaml,
      validation
    });
  } catch (error) {
    if (process.env.LLM_PROVIDER === 'openai') {
      const message = error instanceof Error ? error.message : 'LLM provider failed.';
      logEvent('screenplay.generate.provider_failed', {
        level: 'error',
        provider: 'openai',
        message
      });
      res.status(502).json({
        error: {
          code: 'LLM_UNAVAILABLE',
          message
        }
      });
      return;
    }

    next(error);
  }
});

registerScreenplayStreamRoute(screenplayRouter);
