import type { ValidationResult } from '@story2script/shared';

export interface GenerateScreenplayResponse {
  yaml: string;
  validation: ValidationResult;
}

export async function generateMockScreenplay(): Promise<GenerateScreenplayResponse> {
  const response = await fetch('/api/screenplay/generate', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({})
  });

  if (!response.ok) {
    throw new Error(`Generate request failed with HTTP ${response.status}`);
  }

  return response.json() as Promise<GenerateScreenplayResponse>;
}
