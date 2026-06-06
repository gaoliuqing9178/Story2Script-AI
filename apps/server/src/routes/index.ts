import { Router } from 'express';
import { screenplayRouter } from './screenplay.js';
import { yamlRouter } from './yaml.js';

export const apiRouter: Router = Router();

apiRouter.use('/screenplay', screenplayRouter);
apiRouter.use('/yaml', yamlRouter);

apiRouter.post('/chapters/split', (_req, res) => {
  res.status(501).json({
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Phase 3 will implement chapter splitting. Current harness only verifies API wiring.'
    }
  });
});

apiRouter.post('/chapters/analyze', (_req, res) => {
  res.status(501).json({
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Phase 3 will implement chapter analysis. Current harness only verifies API wiring.'
    }
  });
});

apiRouter.post('/export', (_req, res) => {
  res.status(501).json({
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Phase 4 will implement export. Current harness only verifies API wiring.'
    }
  });
});
