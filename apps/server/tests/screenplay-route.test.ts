import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const servers: ReturnType<typeof createServer>[] = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        })
    )
  );
});

describe('POST /api/screenplay/generate', () => {
  it('returns the mock YAML fixture through the API', async () => {
    const server = createServer(createApp());
    servers.push(server);

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });

    const { port } = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${port}/api/screenplay/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    });
    const body = (await response.json()) as { yaml: string };

    expect(response.status).toBe(200);
    expect(body.yaml).toContain('schema_version: "1.0"');
    expect(body.yaml).toContain('scenes:');
  });
});
