import type { ValidationResult } from '@story2script/shared';

export interface GenerateScreenplayResponse {
  yaml: string;
  validation: ValidationResult;
}

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
