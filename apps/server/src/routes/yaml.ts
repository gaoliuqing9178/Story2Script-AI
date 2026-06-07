import { Router } from 'express';
import { createProvider } from '../provider/index.js';
import { repairScreenplayYaml } from '../pipeline/repair.js';
import { validateScreenplayYamlStructure } from '../validate/structural.js';
import { getRepairMaxAttempts } from './request-utils.js';

export const yamlRouter: Router = Router();

yamlRouter.post('/validate', (req, res) => {
  const yamlText = (req.body as { yaml?: unknown }).yaml;

  if (typeof yamlText !== 'string') {
    res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: 'yaml must be a string'
      }
    });
    return;
  }

  res.json(validateScreenplayYamlStructure(yamlText));
});

yamlRouter.post('/repair', async (req, res, next) => {
  try {
    const requestBody = req.body as RepairYamlRequest;
    const yamlText = requestBody.yaml;

    if (typeof yamlText !== 'string') {
      res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'yaml must be a string'
        }
      });
      return;
    }

    const result = await repairScreenplayYaml({
      yaml: yamlText,
      validation: validateScreenplayYamlStructure(yamlText),
      provider: createProvider(),
      maxAttempts: getRepairMaxAttempts(requestBody.repair_max_retries)
    });

    res.json({
      yaml: result.yaml,
      validation: result.validation,
      repair: {
        initial_validation: result.initialValidation,
        attempts: result.attempts,
        max_attempts: result.maxAttempts
      }
    });
  } catch (error) {
    if (process.env.LLM_PROVIDER === 'openai') {
      const message = error instanceof Error ? error.message : 'LLM provider failed.';
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

interface RepairYamlRequest {
  yaml?: unknown;
  repair_max_retries?: unknown;
}
