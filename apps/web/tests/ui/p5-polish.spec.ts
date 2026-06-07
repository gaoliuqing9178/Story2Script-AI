import { expect, test } from '@playwright/test';

const twoChapterNovel = `第一章 雨夜归来

林舟在雨夜回到旧火车站，沈念在出口等他。

第二章 旧信

林舟在老屋发现父亲留下的旧信。`;

test('allows generation when fewer than three chapters are detected', async ({ page }) => {
  let splitRequests = 0;
  let generateRequests = 0;

  await page.route('**/api/chapters/split', async (route) => {
    splitRequests += 1;
    await route.continue();
  });
  await page.route('**/api/screenplay/generate', async (route) => {
    generateRequests += 1;
    await route.continue();
  });

  await page.goto('/');
  await page.getByRole('textbox', { name: '小说输入' }).fill(twoChapterNovel);
  await page.getByRole('button', { name: '用样例生成' }).click();

  await expect(page.getByTestId('validation-state')).toContainText('校验通过');
  await expect(page.getByTestId('yaml-output')).toHaveValue(/schema_version: "1.0"/);
  await expect(page.getByTestId('generation-error')).toHaveCount(0);

  expect(splitRequests).toBe(1);
  expect(generateRequests).toBe(1);
});

test('shows generation loading and prevents duplicate generation submits', async ({ page }) => {
  let splitRequests = 0;
  let generateRequests = 0;

  await page.route('**/api/chapters/split', async (route) => {
    splitRequests += 1;
    await route.continue();
  });
  await page.route('**/api/screenplay/generate', async (route) => {
    generateRequests += 1;
    await new Promise((resolve) => {
      setTimeout(resolve, 700);
    });
    await route.continue();
  });

  await page.goto('/');

  const generateButton = page.getByRole('button', { name: '用样例生成' });
  await expect(page.getByTestId('generation-state')).toContainText('等待生成');

  await generateButton.evaluate((button) => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });

  await expect(page.getByTestId('generation-state')).toContainText(/正在识别章节结构|正在生成剧本 YAML/);
  await expect(page.getByRole('button', { name: /识别章节|生成中/ })).toBeDisabled();
  await expect(page.getByTestId('validation-state')).toContainText('校验通过');

  expect(splitRequests).toBe(1);
  expect(generateRequests).toBe(1);
});

test('shows the generation API path when the server returns an error', async ({ page }) => {
  await page.route('**/api/screenplay/generate', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          message: 'mock provider timeout'
        }
      })
    });
  });

  await page.goto('/');
  await page.getByRole('button', { name: '用样例生成' }).click();

  const generationError = page.getByTestId('generation-error');
  await expect(page.getByTestId('generation-state')).toContainText('生成没有完成');
  await expect(generationError).toContainText('剧本生成阶段失败');
  await expect(generationError).toContainText('/api/screenplay/generate');
  await expect(generationError).toContainText('mock provider timeout');
  await expect(page.getByTestId('yaml-output')).toHaveValue('');
});

test('shows validation loading, validation error path, and export blocked states', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByTestId('export-state')).toContainText('暂无可导出的 YAML');
  await expect(page.getByTestId('export-yaml-button')).toBeDisabled();
  await expect(page.getByTestId('export-markdown-button')).toBeDisabled();

  await page.getByRole('button', { name: '用样例生成' }).click();
  await expect(page.getByTestId('validation-state')).toContainText('校验通过');
  await expect(page.getByTestId('export-state')).toContainText('可导出 YAML 或 Markdown');

  await page.route('**/api/yaml/validate', async (route) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          message: 'validator service unavailable'
        }
      })
    });
  });

  const editor = page.getByRole('textbox', { name: 'YAML 编辑器' });
  const originalYaml = await editor.inputValue();
  await editor.fill(`${originalYaml}\n# trigger validation request error\n`);

  await expect(page.getByTestId('validation-state')).toContainText('校验中');
  await expect(page.getByTestId('export-state')).toContainText('校验中，导出暂不可用');
  await expect(page.getByTestId('export-yaml-button')).toBeDisabled();
  await expect(page.getByTestId('export-markdown-button')).toBeDisabled();

  await expect(page.getByTestId('validation-state')).toContainText('请求失败');
  await expect(page.getByTestId('validation-request-error')).toContainText('/api/yaml/validate');
  await expect(page.getByTestId('validation-request-error')).toContainText('validator service unavailable');
  await expect(page.getByTestId('export-state')).toContainText('校验请求失败，导出已暂停');
  await expect(page.getByTestId('preview-state')).toContainText('预览暂停');
});

test('keeps export paused when the current YAML has validation errors', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '用样例生成' }).click();
  await expect(page.getByTestId('validation-state')).toContainText('校验通过');

  const editor = page.getByRole('textbox', { name: 'YAML 编辑器' });
  const originalYaml = await editor.inputValue();
  const brokenYaml = originalYaml.replace(/\r?\n {2}title: "雨夜归来"\r?\n/, '\n');

  await editor.fill(brokenYaml);

  await expect(page.getByTestId('validation-errors')).toContainText('project.title');
  await expect(page.getByTestId('export-state')).toContainText('当前 YAML 未通过校验，导出已暂停');
  await expect(page.getByTestId('export-yaml-button')).toBeDisabled();
  await expect(page.getByTestId('export-markdown-button')).toBeDisabled();
});
