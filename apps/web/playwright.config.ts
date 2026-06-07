import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig({
  testDir: './tests/ui',
  outputDir: '../../test-results/playwright',
  fullyParallel: false,
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: 'pnpm dev',
    cwd: repoRoot,
    env: {
      LLM_PROVIDER: 'mock'
    },
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: false,
    timeout: 120_000
  }
});
