import { expect, test } from '@playwright/test';

test('preview renders all screenplay beat types and pauses when validation fails', async ({ page }) => {
  await page.goto('/demo');

  const preview = page.getByTestId('screenplay-preview');
  await expect(preview).toContainText('第 1 场 雨夜归来');
  await expect(preview).toContainText('地点：旧火车站');
  await expect(preview).toContainText('时间：夜晚');
  await expect(preview).toContainText('人物：林舟、沈念');

  await expect(page.getByTestId('preview-beat-action').first()).toContainText('雨水砸在站台铁皮棚上');
  await expect(page.getByTestId('preview-beat-dialogue').first()).toContainText('沈念');
  await expect(page.getByTestId('preview-beat-dialogue').first()).toContainText('你还是回来了。');
  await expect(page.getByTestId('preview-beat-narration')).toContainText('旁白');
  await expect(page.getByTestId('preview-beat-narration')).toContainText('那场事故不是意外。');
  await expect(page.getByTestId('preview-beat-transition')).toContainText('切至南街尽头。');
  await expect(page.getByTestId('preview-beat-inner_voice')).toContainText('（内心）林舟');
  await expect(page.getByTestId('preview-beat-inner_voice')).toContainText('如果这是真的');

  const editor = page.getByRole('textbox', { name: 'YAML 编辑器' });
  const originalYaml = await editor.inputValue();
  const brokenYaml = originalYaml.replace(/\r?\n {2}title: .+\r?\n/, '\n');

  await editor.fill(brokenYaml);

  await expect(page.getByTestId('validation-errors')).toContainText('project.title');
  await expect(preview).toContainText('预览已暂停');
  await expect(preview).toContainText('当前 YAML 未通过校验');
});
