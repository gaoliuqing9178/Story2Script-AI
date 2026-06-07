import { Router } from 'express';
import { chaptersRouter } from './chapters.js';
import { screenplayRouter } from './screenplay.js';
import { yamlRouter } from './yaml.js';

export const apiRouter: Router = Router();

apiRouter.use('/screenplay', screenplayRouter);
apiRouter.use('/yaml', yamlRouter);
apiRouter.use('/chapters', chaptersRouter);

apiRouter.post('/export', (_req, res) => {
  res.status(501).json({
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Phase 4 will implement export. Current harness only verifies API wiring.'
    }
  });
});
