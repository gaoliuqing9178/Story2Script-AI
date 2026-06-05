import { describe, expect, it } from 'vitest';
import { screenplayJsonSchema } from '../src/schema';

describe('screenplayJsonSchema', () => {
  it('tracks the required yaml-schema.md top-level contract', () => {
    expect(screenplayJsonSchema.required).toEqual([
      'schema_version',
      'project',
      'source',
      'characters',
      'locations',
      'scenes'
    ]);
  });
});
