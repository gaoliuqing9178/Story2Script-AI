import type { LLMProvider, ProviderRequest } from './index.js';

interface OpenAIResponsesResponse {
  output_text?: unknown;
  output?: unknown;
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
  error?: {
    message?: unknown;
  };
}

interface UpstreamErrorDetails {
  statusCode?: string;
  code?: string;
  message?: string;
}

export class OpenAIProvider implements LLMProvider {
  async complete(input: ProviderRequest): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required when LLM_PROVIDER=openai.');
    }

    const baseUrl = stripTrailingSlash(process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1');
    const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
    const response = await fetch(`${baseUrl}/responses`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature: input.temperature ?? 0.2,
        instructions: input.system,
        input: input.user
      })
    });

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
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function parseOpenAIResponse(responseText: string): OpenAIResponsesResponse {
  try {
    return JSON.parse(responseText) as OpenAIResponsesResponse;
  } catch {
    throw new Error(`OpenAI-compatible response was not JSON: ${summarize(responseText)}`);
  }
}

function extractResponseText(payload: OpenAIResponsesResponse) {
  const outputText = readString(payload.output_text);

  if (outputText) {
    return outputText;
  }

  const outputContent = readOutputText(payload.output);

  if (outputContent) {
    return outputContent;
  }

  return payload.choices?.find((choice) => typeof choice.message?.content === 'string')?.message?.content;
}

function readOutputText(output: unknown) {
  if (!Array.isArray(output)) {
    return undefined;
  }

  for (const item of output) {
    if (!isRecord(item)) {
      continue;
    }

    const itemText = readString(item.text) ?? readString(item.output_text);

    if (itemText) {
      return itemText;
    }

    const contentText = readContentText(item.content);

    if (contentText) {
      return contentText;
    }
  }

  return undefined;
}

function readContentText(content: unknown) {
  if (typeof content === 'string' && content.trim()) {
    return content;
  }

  if (!Array.isArray(content)) {
    return undefined;
  }

  for (const item of content) {
    if (typeof item === 'string' && item.trim()) {
      return item;
    }

    if (!isRecord(item)) {
      continue;
    }

    const text = readString(item.text) ?? readString(item.output_text);

    if (text) {
      return text;
    }
  }

  return undefined;
}

function formatRequestFailure(httpStatus: number, responseText: string) {
  const upstreamError = parseUpstreamError(responseText);
  const upstreamStatus = upstreamError?.statusCode ? ` (upstream status_code=${upstreamError.statusCode})` : '';
  const upstreamCode = upstreamError?.code ? ` (code=${upstreamError.code})` : '';

  if (upstreamError?.message) {
    return `OpenAI-compatible request failed with HTTP ${httpStatus}${upstreamStatus}${upstreamCode}: ${upstreamError.message}`;
  }

  const htmlTitle = extractHtmlTitle(responseText);

  if (htmlTitle) {
    return `OpenAI-compatible request failed with HTTP ${httpStatus}: HTML error page: ${htmlTitle}`;
  }

  const summary = summarize(responseText);
  return `OpenAI-compatible request failed with HTTP ${httpStatus}: ${summary || 'empty response body'}`;
}

function parseUpstreamError(responseText: string): UpstreamErrorDetails | undefined {
  let payload: unknown;

  try {
    payload = JSON.parse(responseText);
  } catch {
    return undefined;
  }

  if (!isRecord(payload)) {
    return typeof payload === 'string' && payload.trim()
      ? {
          message: payload.trim()
        }
      : undefined;
  }

  const nestedError = isRecord(payload.error) ? payload.error : undefined;
  const details: UpstreamErrorDetails = {};
  const statusCode =
    readScalar(payload.status_code) ??
    readScalar(payload.statusCode) ??
    readScalar(payload.status) ??
    readScalar(nestedError?.status_code) ??
    readScalar(nestedError?.status);
  const code = readScalar(nestedError?.code) ?? readScalar(payload.code);
  const message = readString(nestedError?.message) ?? readString(payload.message);

  if (statusCode) {
    details.statusCode = statusCode;
  }

  if (code) {
    details.code = code;
  }

  if (message) {
    details.message = message;
  }

  return Object.keys(details).length > 0 ? details : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readScalar(value: unknown) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return undefined;
}

function readString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function extractHtmlTitle(value: string) {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/iu.exec(value);
  const title = match?.[1];
  return title ? summarize(decodeBasicHtmlEntities(title)) : undefined;
}

function decodeBasicHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/giu, ' ')
    .replace(/&amp;/giu, '&')
    .replace(/&lt;/giu, '<')
    .replace(/&gt;/giu, '>')
    .replace(/&quot;/giu, '"')
    .replace(/&#39;/giu, "'");
}

function unwrapCodeFence(content: string) {
  const trimmed = content.trim();
  const fenced = /^```[a-zA-Z0-9_-]*\s*\r?\n([\s\S]*?)\r?\n```$/u.exec(trimmed);

  return (fenced?.[1] ?? trimmed).trim();
}

function summarize(value: string) {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  return trimmed.length > 300 ? `${trimmed.slice(0, 300)}...` : trimmed;
}
