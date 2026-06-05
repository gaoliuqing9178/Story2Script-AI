import { Router } from 'express';
import { createProvider } from '../provider/index.js';
import { logEvent } from '../logger.js';

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

    res.json({
      yaml,
      validation: {
        valid: false,
        errors: [],
        warnings: [
          {
            path: '(harness)',
            message: 'Validation is not implemented until Phase 1; this mock response is not a feature pass.'
          }
        ]
      }
    });
  } catch (error) {
    next(error);
  }
});
