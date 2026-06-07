import { isRecord, readRawString, readString } from './openai-shared.js';

export async function* readStreamingResponse(body: ReadableStream<Uint8Array>): AsyncIterable<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const parsed = drainSseFrames(buffer);
    buffer = parsed.remainder;

    for (const frame of parsed.frames) {
      const delta = readSseFrameDelta(frame);

      if (delta) {
        yield delta;
      }
    }
  }

  buffer += decoder.decode();

  if (buffer.trim()) {
    const delta = readSseFrameDelta(buffer);

    if (delta) {
      yield delta;
    }
  }
}

function drainSseFrames(buffer: string) {
  const frames: string[] = [];
  let cursor = findSseFrameBoundary(buffer);

  while (cursor !== undefined) {
    const boundaryLength = buffer.startsWith('\r\n\r\n', cursor) ? 4 : 2;
    frames.push(buffer.slice(0, cursor));
    buffer = buffer.slice(cursor + boundaryLength);
    cursor = findSseFrameBoundary(buffer);
  }

  return { frames, remainder: buffer };
}

function findSseFrameBoundary(buffer: string) {
  const lf = buffer.indexOf('\n\n');
  const crlf = buffer.indexOf('\r\n\r\n');

  if (lf === -1) {
    return crlf === -1 ? undefined : crlf;
  }

  if (crlf === -1) {
    return lf;
  }

  return Math.min(lf, crlf);
}

function readSseFrameDelta(frame: string) {
  const data = frame
    .split(/\r?\n/u)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n')
    .trim();

  if (!data || data === '[DONE]') {
    return undefined;
  }

  let payload: unknown;

  try {
    payload = JSON.parse(data);
  } catch {
    return undefined;
  }

  if (!isRecord(payload)) {
    return undefined;
  }

  const type = readString(payload.type);

  if (type === 'response.output_text.delta') {
    return readRawString(payload.delta);
  }

  if (type === 'error' || type === 'response.failed') {
    throw new Error(readStreamErrorMessage(payload) ?? `OpenAI-compatible stream failed with event ${type}`);
  }

  return readChatCompletionDelta(payload);
}

function readChatCompletionDelta(payload: Record<string, unknown>) {
  const choices = payload.choices;

  if (!Array.isArray(choices)) {
    return undefined;
  }

  for (const choice of choices) {
    if (!isRecord(choice)) {
      continue;
    }

    const delta = isRecord(choice.delta) ? choice.delta : undefined;
    const content = readRawString(delta?.content);

    if (content) {
      return content;
    }
  }

  return undefined;
}

function readStreamErrorMessage(payload: Record<string, unknown>) {
  const nestedError = isRecord(payload.error) ? payload.error : undefined;
  const response = isRecord(payload.response) ? payload.response : undefined;
  const responseError = isRecord(response?.error) ? response.error : undefined;

  return readString(nestedError?.message) ?? readString(responseError?.message) ?? readString(payload.message);
}
