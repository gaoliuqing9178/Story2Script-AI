import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

const currentDir = dirname(fileURLToPath(import.meta.url));
const repoRootEnvPath = resolve(currentDir, '../../..', '.env');
const cwdEnvPath = resolve(process.cwd(), '.env');
const loadedPaths = new Set<string>();

for (const envPath of [cwdEnvPath, repoRootEnvPath]) {
  if (loadedPaths.has(envPath) || !existsSync(envPath)) {
    continue;
  }

  config({ path: envPath });
  loadedPaths.add(envPath);
}
