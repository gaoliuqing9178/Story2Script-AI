import type { Chapter, ValidationResult } from '@story2script/shared';

export interface GenerateScreenplayResponse {
  yaml: string;
  validation: ValidationResult;
}

export type GenerateScreenplayStreamEvent =
  | { type: 'status'; stage: string }
  | { type: 'yaml_reset'; source: string; attempt?: number }
  | { type: 'yaml_delta'; delta: string; source: string; attempt?: number }
  | { type: 'yaml_snapshot'; yaml: string; source: string; attempt?: number }
  | { type: 'validation'; validation: ValidationResult }
  | { type: 'done'; yaml: string; validation: ValidationResult }
  | { type: 'error'; error: { code: string; message: string } };

interface ApiErrorResponse {
  error?: {
    message?: string;
  };
}

export async function generateMockScreenplay(novelText: string): Promise<GenerateScreenplayResponse> {
  const response = await fetch('/api/screenplay/generate', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      novel: novelText
    })
  });

  if (!response.ok) {
    throw new Error(await getResponseError(response, 'Generate request failed'));
  }

  return response.json() as Promise<GenerateScreenplayResponse>;
}

export async function generateScreenplayStream(input: {
  novelText: string;
  chapters: Chapter[];
  onEvent: (event: GenerateScreenplayStreamEvent) => void;
  signal?: AbortSignal;
}) {
  const requestInit: RequestInit = {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      novel: input.novelText,
      chapters: input.chapters
    })
  };

  if (input.signal) {
    requestInit.signal = input.signal;
  }

  const response = await fetch('/api/screenplay/generate/stream', {
    ...requestInit
  });

  if (!response.ok) {
    throw new Error(await getResponseError(response, 'Generate stream request failed'));
  }

  if (!response.body) {
    throw new Error('Generate stream response did not include a body');
  }

  await readNdjsonStream(response.body, input.onEvent);
}

export async function validateYaml(yaml: string): Promise<ValidationResult> {
  const response = await fetch('/api/yaml/validate', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ yaml })
  });

  if (!response.ok) {
    throw new Error(await getResponseError(response, 'YAML validation failed'));
  }

  return response.json() as Promise<ValidationResult>;
}

async function getResponseError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as ApiErrorResponse;
    return body.error?.message ?? `${fallback} with HTTP ${response.status}`;
  } catch {
    return `${fallback} with HTTP ${response.status}`;
  }
}

async function readNdjsonStream(body: ReadableStream<Uint8Array>, onEvent: (event: GenerateScreenplayStreamEvent) => void) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    buffer = drainNdjsonLines(buffer, onEvent);
  }

  buffer += decoder.decode();
  drainNdjsonLines(`${buffer}\n`, onEvent);
}

function drainNdjsonLines(buffer: string, onEvent: (event: GenerateScreenplayStreamEvent) => void) {
  let newlineIndex = buffer.indexOf('\n');

  while (newlineIndex !== -1) {
    const line = buffer.slice(0, newlineIndex).trim();
    buffer = buffer.slice(newlineIndex + 1);

    if (line) {
      const event = JSON.parse(line) as GenerateScreenplayStreamEvent;

      if (event.type === 'error') {
        throw new Error(event.error.message);
      }

      onEvent(event);
    }

    newlineIndex = buffer.indexOf('\n');
  }

  return buffer;
}
