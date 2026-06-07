import { expect, test } from '@playwright/test';

const twoChapterNovel = `第一章 雨夜归来

林舟在雨夜回到旧火车站，沈念在出口等他。

第二章 旧信

林舟在老屋发现父亲留下的旧信。`;

test('blocks generation before the LLM path when fewer than three chapters are detected', async ({ page }) => {
  let generateRequests = 0;

  await page.route('**/api/screenplay/generate', async (route) => {
    generateRequests += 1;
    await route.abort();
  });

  await page.goto('/');
  await page.getByRole('textbox', { name: '小说输入' }).fill(twoChapterNovel);
  await page.getByRole('button', { name: '用样例生成' }).click();

  const generationError = page.getByTestId('generation-error');
  await expect(generationError).toContainText('还差一点');
  await expect(generationError).toContainText('至少需要 3 个章节');
  await expect(generationError).toContainText('当前识别到 2 个');
  await expect(page.getByTestId('yaml-output')).toHaveValue('');
  await expect(page.getByTestId('validation-state')).toContainText('未校验');

  await page.waitForTimeout(500);
  expect(generateRequests).toBe(0);
});
