import { expect, test } from '@playwright/test';

test('demo route preloads stable valid YAML for the three-minute path', async ({ page }) => {
  await page.goto('/demo');

  await expect(page.getByTestId('demo-route')).toBeVisible();
  await expect(page.getByRole('heading', { name: '3 分钟演示路线' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: '小说输入' })).toHaveValue(/第一章 雨夜归来/);
  await expect(page.getByTestId('yaml-output')).toHaveValue(/schema_version: "1.0"/);
  await expect(page.getByTestId('yaml-output')).toHaveValue(/title: "雨夜归来"/);
  await expect(page.getByTestId('validation-state')).toContainText('校验通过');
  await expect(page.getByTestId('preview-state')).toContainText('预览已更新');
  await expect(page.getByTestId('export-yaml-button')).toBeEnabled();
  await expect(page.getByTestId('export-markdown-button')).toBeEnabled();
});

test('demo route switches between broken and valid YAML fixtures', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByTestId('validation-state')).toContainText('校验通过');

  await page.getByRole('button', { name: '加载坏 YAML' }).click();

  await expect(page.getByTestId('validation-state')).toContainText('发现 1 个错误');
  await expect(page.getByTestId('validation-errors')).toContainText('project.title');
  await expect(page.getByTestId('validation-errors')).toContainText('必填字段缺失');
  await expect(page.getByTestId('preview-state')).toContainText('预览已暂停');
  await expect(page.getByTestId('export-state')).toContainText('当前 YAML 未通过校验，导出已暂停');
  await expect(page.getByTestId('export-yaml-button')).toBeDisabled();
  await expect(page.getByTestId('export-markdown-button')).toBeDisabled();

  await page.getByRole('button', { name: '加载合法 YAML' }).click();

  await expect(page.getByTestId('validation-state')).toContainText('校验通过');
  await expect(page.getByTestId('preview-state')).toContainText('预览已更新');
  await expect(page.getByTestId('export-yaml-button')).toBeEnabled();
  await expect(page.getByTestId('export-markdown-button')).toBeEnabled();
});
