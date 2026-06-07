import { expect, test } from '@playwright/test';

test('home page displays mock YAML through the backend', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Story2Script AI' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: '小说输入' })).toBeVisible();

  await page.getByRole('button', { name: '用样例生成' }).click();

  const yamlOutput = page.getByTestId('yaml-output');
  for (const expectedText of ['schema_version: "1.0"', 'project:', 'source:', 'characters:', 'locations:', 'scenes:']) {
    await expect(yamlOutput).toHaveValue(new RegExp(expectedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
