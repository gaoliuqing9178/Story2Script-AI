import { Router } from 'express';
import { createProvider } from '../provider/index.js';
import { logEvent } from '../logger.js';
import { validateScreenplayYamlStructure } from '../validate/structural.js';

export const screenplayRouter: Router = Router();

screenplayRouter.post('/generate', async (_req, res, next) => {
  try {
    const provider = createProvider();
    const yaml = await provider.complete({
      system: 'Return the mock screenplay YAML fixture.',
      user: 'Initializer harness request',
      temperature: 0
    });

    logEvent('screenplay.generate.mock', {
      provider: process.env.LLM_PROVIDER ?? 'mock',
      bytes: Buffer.byteLength(yaml, 'utf8')
    });

    const validation = validateScreenplayYamlStructure(yaml);

    res.json({
      yaml,
      validation
    });
  } catch (error) {
    next(error);
  }
});
