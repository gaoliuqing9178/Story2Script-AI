import { expect, test } from '@playwright/test';

test('home page displays mock YAML through the backend', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Story2Script AI' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: '小说输入' })).toBeVisible();

  await page.getByRole('button', { name: '用样例生成' }).click();

  await expect(page.getByTestId('yaml-output')).toContainText('schema_version: "1.0"');
  await expect(page.getByTestId('yaml-output')).toContainText('scenes:');
});
