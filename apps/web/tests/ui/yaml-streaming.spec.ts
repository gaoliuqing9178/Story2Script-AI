import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const sampleYaml = readFileSync(new URL('../../../../examples/screenplay-sample.yaml', import.meta.url), 'utf8');
const normalizedSampleYaml = normalizeLineEndings(sampleYaml);

test('streams generated YAML into the editor before final validation', async ({ page }) => {
  let validateRequests = 0;

  await page.route('**/api/screenplay/generate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        yaml: sampleYaml,
        validation: {
          valid: true,
          errors: [],
          warnings: []
        }
      })
    });
  });

  await page.route('**/api/yaml/validate', async (route) => {
    validateRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        valid: true,
        errors: [],
        warnings: []
      })
    });
  });

  await page.goto('/');

  const editor = page.getByTestId('yaml-output');
  const renderState = page.getByTestId('yaml-render-state');
  await page.locator('button[type="button"]').first().click();

  await expect(renderState).toHaveAttribute('data-state', 'streaming');
  await expect
    .poll(async () => (await editor.inputValue()).length)
    .toBeGreaterThan(0);

  const partialYaml = await editor.inputValue();
  expect(partialYaml.length).toBeLessThan(sampleYaml.length);
  expect(validateRequests).toBe(0);

  await expect(renderState).toHaveAttribute('data-state', 'idle');
  await expect.poll(async () => normalizeLineEndings(await editor.inputValue())).toBe(normalizedSampleYaml);
  await expect.poll(() => validateRequests).toBeGreaterThan(0);
});

function normalizeLineEndings(value: string) {
  return value.replace(/\r\n/g, '\n');
}
