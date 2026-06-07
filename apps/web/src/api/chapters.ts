import type { Chapter } from '@story2script/shared';

export interface SplitChaptersResponse {
  chapters: Chapter[];
}

export class ChapterSplitError extends Error {
  readonly code: string | undefined;
  readonly status: number;

  constructor(message: string, status: number, code: string | undefined) {
    super(message);
    this.name = 'ChapterSplitError';
    this.status = status;
    this.code = code;
  }
}

interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
}

export async function splitNovelChapters(text: string): Promise<SplitChaptersResponse> {
  const response = await fetch('/api/chapters/split', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    throw await getChapterSplitError(response);
  }

  return response.json() as Promise<SplitChaptersResponse>;
}

async function getChapterSplitError(response: Response) {
  try {
    const body = (await response.json()) as ApiErrorResponse;
    return new ChapterSplitError(
      body.error?.message ?? `Chapter split failed with HTTP ${response.status}`,
      response.status,
      body.error?.code
    );
  } catch {
    return new ChapterSplitError(`Chapter split failed with HTTP ${response.status}`, response.status, undefined);
  }
}
