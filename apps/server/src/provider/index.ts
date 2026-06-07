import { MockProvider } from './mock.js';
import { OpenAIProvider } from './openai.js';

export interface ProviderRequest {
  system: string;
  user: string;
  temperature?: number;
}

export interface LLMProvider {
  complete(input: ProviderRequest): Promise<string>;
  stream(input: ProviderRequest): AsyncIterable<string>;
}

export async function completeWithOptionalStream(
  provider: LLMProvider,
  input: ProviderRequest,
  onDelta?: (delta: string) => void
) {
  if (!onDelta) {
    return provider.complete(input);
  }

  let text = '';

  for await (const delta of provider.stream(input)) {
    text += delta;
    onDelta(delta);
  }

  return text;
}

export function createProvider(): LLMProvider {
  if (process.env.LLM_PROVIDER === 'openai') {
    return new OpenAIProvider();
  }

  return new MockProvider();
}
