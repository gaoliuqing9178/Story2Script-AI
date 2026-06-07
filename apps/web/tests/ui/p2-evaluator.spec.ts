import { expect, test } from '@playwright/test';

const evaluatorNovel = `# Chapter 1

Evaluator chapter marker: the train arrives in heavy rain.

# Chapter 2

The protagonist finds a letter in an old room.

# Chapter 3

The protagonist follows a light near the photo studio.`;

const evaluatorYaml = [
  'schema_version: "1.0"',
  'project:',
  '  title: "Evaluator Fixture"',
  'source:',
  '  chapters: []',
  'characters: []',
  'locations: []',
  'scenes: []'
].join('\n');

test('evaluator: sends edited novel text to screenplay generate API', async ({ page }) => {
  await page.route('**/api/screenplay/generate/stream', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/x-ndjson',
      body: buildGenerateStreamBody(evaluatorYaml)
    });
  });

  await page.goto('/');
  await page.getByRole('textbox', { name: '小说输入' }).fill(evaluatorNovel);

  const requestPromise = page.waitForRequest('**/api/screenplay/generate/stream');
  await page.getByRole('button', { name: '用样例生成' }).click();
  const request = await requestPromise;

  expect(request.postDataJSON()).toMatchObject({
    novel: evaluatorNovel,
    chapters: expect.any(Array)
  });

  await expect(page.getByTestId('yaml-output')).toHaveValue(/title: "Evaluator Fixture"/);
});

function buildGenerateStreamBody(yaml: string) {
  const validation = {
    valid: true,
    errors: [],
    warnings: []
  };

  return [
    { type: 'yaml_reset', source: 'test' },
    { type: 'yaml_delta', delta: yaml, source: 'test' },
    { type: 'yaml_snapshot', yaml, source: 'test' },
    { type: 'validation', validation },
    { type: 'done', yaml, validation }
  ]
    .map((event) => JSON.stringify(event))
    .join('\n')
    .concat('\n');
}
