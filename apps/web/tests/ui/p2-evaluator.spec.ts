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
  await page.route('**/api/screenplay/generate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        yaml: evaluatorYaml,
        validation: {
          valid: true,
          errors: [],
          warnings: []
        }
      })
    });
  });

  await page.goto('/');
  await page.locator('textarea').fill(evaluatorNovel);

  const requestPromise = page.waitForRequest('**/api/screenplay/generate');
  await page.getByRole('button').click();
  const request = await requestPromise;

  expect(request.postDataJSON()).toMatchObject({
    novel: evaluatorNovel
  });

  await expect(page.getByTestId('yaml-output')).toContainText('title: "Evaluator Fixture"');
});
