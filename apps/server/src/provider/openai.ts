import type { LLMProvider, ProviderRequest } from './index.js';

export class OpenAIProvider implements LLMProvider {
  async complete(_input: ProviderRequest): Promise<string> {
    throw new Error(
      'OpenAIProvider is intentionally not implemented in the initializer harness. Use LLM_PROVIDER=mock until Phase 2.'
    );
  }
}
