import type { LLMProvider, ProviderRequest } from './index.js';
import { extractResponseText, formatRequestFailure, parseOpenAIResponse, unwrapCodeFence } from './openai-response.js';
import { readStreamingResponse } from './openai-stream.js';

export class OpenAIProvider implements LLMProvider {
  async complete(input: ProviderRequest): Promise<string> {
    const response = await requestOpenAI(input, false);
    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(formatRequestFailure(response.status, responseText));
    }

    const payload = parseOpenAIResponse(responseText);
    const content = extractResponseText(payload);

    if (typeof content !== 'string' || content.trim().length === 0) {
      const message = payload.error?.message;
      throw new Error(
        typeof message === 'string'
          ? `OpenAI-compatible response did not include output text: ${message}`
          : 'OpenAI-compatible response did not include output text.'
      );
    }

    return unwrapCodeFence(content);
  }

  async *stream(input: ProviderRequest): AsyncIterable<string> {
    const response = await requestOpenAI(input, true);
    const responseText = response.body ? undefined : await response.text();

    if (!response.ok) {
      throw new Error(formatRequestFailure(response.status, responseText ?? (await response.text())));
    }

    if (!response.body) {
      throw new Error('OpenAI-compatible streaming response did not include a body.');
    }

    yield* readStreamingResponse(response.body);
  }
}

async function requestOpenAI(input: ProviderRequest, stream: boolean) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required when LLM_PROVIDER=openai.');
  }

  const baseUrl = stripTrailingSlash(process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1');
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

  return fetch(`${baseUrl}/responses`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model,
      temperature: input.temperature ?? 0.2,
      instructions: input.system,
      input: input.user,
      ...(stream ? { stream: true } : {})
    })
  });
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}
