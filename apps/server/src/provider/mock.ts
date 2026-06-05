import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { LLMProvider, ProviderRequest } from './index.js';

function findRepoFile(relativePath: string) {
  const candidates = [
    resolve(process.cwd(), relativePath),
    resolve(process.cwd(), '..', relativePath),
    resolve(process.cwd(), '..', '..', relativePath)
  ];
  const found = candidates.find((candidate) => existsSync(candidate));

  if (!found) {
    throw new Error(`Cannot find ${relativePath} from ${process.cwd()}`);
  }

  return found;
}

export class MockProvider implements LLMProvider {
  async complete(_input: ProviderRequest): Promise<string> {
    const samplePath = findRepoFile('examples/screenplay-sample.yaml');
    return readFile(samplePath, 'utf8');
  }
}
