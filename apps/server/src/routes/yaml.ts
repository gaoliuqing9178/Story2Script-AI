import { Router } from 'express';
import { validateScreenplayYamlStructure } from '../validate/structural.js';

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

yamlRouter.post('/repair', (_req, res) => {
  res.status(501).json({
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Phase 3 will implement YAML repair. Current harness only verifies API wiring.'
    }
  });
});
