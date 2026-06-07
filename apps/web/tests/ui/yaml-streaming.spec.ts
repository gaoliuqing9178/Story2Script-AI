import { expect, test } from '@playwright/test';

test('streams generated YAML into the editor before final validation', async ({ page }) => {
  let validateRequests = 0;
  let streamRequests = 0;

  await page.route('**/api/screenplay/generate/stream', async (route) => {
    streamRequests += 1;
    await route.continue();
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
  await page.getByRole('button', { name: '用样例生成' }).click();

  await expect(renderState).toHaveAttribute('data-state', 'streaming');
  await expect
    .poll(async () => (await editor.inputValue()).length)
    .toBeGreaterThan(0);

  const partialYaml = await editor.inputValue();
  expect(partialYaml).toContain('schema_version');
  expect(validateRequests).toBe(0);

  await expect(renderState).toHaveAttribute('data-state', 'idle');
  await expect.poll(async () => (await editor.inputValue()).length).toBeGreaterThan(partialYaml.length);
  await expect(editor).toHaveValue(/language: zh-CN/);
  await expect.poll(() => validateRequests).toBeGreaterThan(0);
  expect(streamRequests).toBe(1);
});

test('stores completed generations in sidebar history and restores them', async ({ page }) => {
  await page.route('**/api/yaml/validate', async (route) => {
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
  await page.getByRole('button', { name: '用样例生成' }).click();
  await expect(page.getByTestId('yaml-render-state')).toHaveAttribute('data-state', 'idle');
  await expect(page.getByTestId('history-item')).toHaveCount(1);

  const generatedYaml = await editor.inputValue();
  await editor.fill('schema_version: broken');
  await page.getByTestId('history-item').first().click();

  await expect(editor).toHaveValue(generatedYaml);
});
