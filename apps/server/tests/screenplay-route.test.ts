import { load } from 'js-yaml';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createRouteTestHarness, restoreProviderEnv, snapshotProviderEnv, useMockProviderEnv } from './screenplay-route-helpers.js';

const harness = createRouteTestHarness();
const originalEnv = snapshotProviderEnv();
const requiredTopLevelKeys = ['schema_version', 'project', 'source', 'characters', 'locations', 'scenes'];

beforeEach(() => {
  useMockProviderEnv();
});

afterEach(async () => {
  await harness.close();
  restoreProviderEnv(originalEnv);
});

describe('POST /api/screenplay/generate', () => {
  it('returns the mock YAML fixture through the API', async () => {
    const { status, body } = await harness.postGenerate({});
    const parsed = load(body.yaml) as {
      schema_version?: string;
      source?: { chapters?: unknown[] };
      characters?: unknown[];
      locations?: unknown[];
      scenes?: unknown[];
    };

    expect(status).toBe(200);
    expect(body.yaml).toContain('schema_version: "1.0"');
    for (const key of requiredTopLevelKeys) {
      expect(body.yaml).toContain(`${key}:`);
    }
    expect(parsed.schema_version).toBe('1.0');
    expect(parsed.source?.chapters).toHaveLength(3);
    expect(parsed.characters?.length).toBeGreaterThan(0);
    expect(parsed.locations?.length).toBeGreaterThan(0);
    expect(parsed.scenes?.length).toBeGreaterThan(0);
    expect(body.validation).toEqual({
      valid: true,
      errors: [],
      warnings: []
    });
  });
});
