import { expect, test } from '@playwright/test';

test('editor validates direct YAML edits and displays precise errors', async ({ page }) => {
  await page.goto('/demo');

  const editor = page.getByRole('textbox', { name: 'YAML 编辑器' });
  await expect(editor).toHaveValue(/project:/);
  await expect(page.getByTestId('validation-state')).toContainText('校验通过');

  const originalYaml = await editor.inputValue();
  const brokenYaml = originalYaml.replace(/\r?\n {2}title: .+\r?\n/, '\n');

  await editor.fill(brokenYaml);

  const errors = page.getByTestId('validation-errors');
  await expect(errors).toContainText('project.title');
  await expect(errors).toContainText('必填字段缺失');
});
