import { Router } from 'express';
import { logEvent } from '../logger.js';
import { createProvider } from '../provider/index.js';
import { analyzeChapters } from '../pipeline/analyze.js';
import { splitChapters } from '../pipeline/split.js';
import { parseChaptersInput } from './request-utils.js';

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

chaptersRouter.post('/analyze', async (req, res, next) => {
  try {
    const chapters = parseChaptersInput((req.body as AnalyzeChaptersRequest).chapters);

    if (!chapters || chapters.length === 0) {
      res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'chapters must be a non-empty Chapter[]'
        }
      });
      return;
    }

    const analyses = await analyzeChapters(chapters, createProvider());

    logEvent('chapters.analyze.completed', {
      provider: process.env.LLM_PROVIDER === 'openai' ? 'openai' : 'mock',
      chapters: chapters.length
    });

    res.json({ analyses });
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

interface SplitChaptersRequest {
  text?: unknown;
}

interface AnalyzeChaptersRequest {
  chapters?: unknown;
}

function getRequestText(requestBody: SplitChaptersRequest) {
  if (typeof requestBody.text !== 'string') {
    return undefined;
  }

  const trimmed = requestBody.text.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
