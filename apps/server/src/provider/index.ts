import { MockProvider } from './mock.js';
import { OpenAIProvider } from './openai.js';

export interface ProviderRequest {
  system: string;
  user: string;
  temperature?: number;
}

export interface LLMProvider {
  complete(input: ProviderRequest): Promise<string>;
}

export function createProvider(): LLMProvider {
  if (process.env.LLM_PROVIDER === 'openai') {
    return new OpenAIProvider();
  }

  return new MockProvider();
}
