import type { LLMProvider, ProviderRequest } from './index.js';

interface OpenAIChatResponse {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
  error?: {
    message?: unknown;
  };
}

export class OpenAIProvider implements LLMProvider {
  async complete(input: ProviderRequest): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required when LLM_PROVIDER=openai.');
    }

    const baseUrl = stripTrailingSlash(process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1');
    const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature: input.temperature ?? 0.2,
        messages: [
          {
            role: 'system',
            content: input.system
          },
          {
            role: 'user',
            content: input.user
          }
        ]
      })
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`OpenAI-compatible request failed with HTTP ${response.status}: ${summarize(responseText)}`);
    }

    const payload = parseOpenAIResponse(responseText);
    const content = payload.choices?.[0]?.message?.content;

    if (typeof content !== 'string' || content.trim().length === 0) {
      const message = payload.error?.message;
      throw new Error(
        typeof message === 'string'
          ? `OpenAI-compatible response did not include message content: ${message}`
          : 'OpenAI-compatible response did not include message content.'
      );
    }

    return unwrapYamlFence(content);
  }
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function parseOpenAIResponse(responseText: string): OpenAIChatResponse {
  try {
    return JSON.parse(responseText) as OpenAIChatResponse;
  } catch {
    throw new Error(`OpenAI-compatible response was not JSON: ${summarize(responseText)}`);
  }
}

function unwrapYamlFence(content: string) {
  const trimmed = content.trim();
  const fenced = /^```(?:yaml|yml)?\s*\r?\n([\s\S]*?)\r?\n```$/i.exec(trimmed);

  return (fenced?.[1] ?? trimmed).trim();
}

function summarize(value: string) {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  return trimmed.length > 300 ? `${trimmed.slice(0, 300)}...` : trimmed;
}
