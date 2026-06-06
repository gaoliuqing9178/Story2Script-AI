import { Router } from 'express';
import { logEvent } from '../logger.js';
import { splitChapters } from '../pipeline/split.js';

export const chaptersRouter: Router = Router();

chaptersRouter.post('/split', (req, res) => {
  const requestBody = req.body as SplitChaptersRequest;
  const text = getRequestText(requestBody);

  if (!text) {
    res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: 'text must be a non-empty string'
      }
    });
    return;
  }

  const chapters = splitChapters(text);

  if (chapters.length < 3) {
    logEvent('chapters.split.rejected', {
      input_chars: text.length,
      chapters: chapters.length
    });
    res.status(422).json({
      error: {
        code: 'TOO_FEW_CHAPTERS',
        message: `至少需要 3 个章节，当前识别到 ${chapters.length} 个`
      }
    });
    return;
  }

  logEvent('chapters.split.completed', {
    input_chars: text.length,
    chapters: chapters.length
  });

  res.json({ chapters });
});

chaptersRouter.post('/analyze', (_req, res) => {
  res.status(501).json({
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Phase 3 will implement chapter analysis. Current harness only verifies API wiring.'
    }
  });
});

interface SplitChaptersRequest {
  text?: unknown;
}

function getRequestText(requestBody: SplitChaptersRequest) {
  if (typeof requestBody.text !== 'string') {
    return undefined;
  }

  const trimmed = requestBody.text.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
