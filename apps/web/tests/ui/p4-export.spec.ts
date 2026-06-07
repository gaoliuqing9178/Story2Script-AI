import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { load } from 'js-yaml';

test('exports the current screenplay as YAML and Markdown', async ({ page }) => {
  await page.goto('/demo');

  await expect(page.getByTestId('validation-state')).toContainText('校验通过');
  await expect(page.getByTestId('export-yaml-button')).toBeEnabled();
  await expect(page.getByTestId('export-markdown-button')).toBeEnabled();

  const yamlDownloadPromise = page.waitForEvent('download');
  await page.getByTestId('export-yaml-button').click();
  const yamlDownload = await yamlDownloadPromise;
  const yamlPath = await yamlDownload.path();

  expect(yamlDownload.suggestedFilename()).toMatch(/\.yaml$/);
  expect(yamlPath).not.toBeNull();

  const editorYaml = await page.getByTestId('yaml-output').inputValue();
  const downloadedYaml = await readFile(yamlPath as string, 'utf8');
  const editorScreenplay = load(editorYaml);
  const downloadedScreenplay = load(downloadedYaml);

  expect(isRecord(editorScreenplay)).toBe(true);
  expect(isRecord(downloadedScreenplay)).toBe(true);
  expect(Object.keys(downloadedScreenplay as Record<string, unknown>)).toEqual(
    Object.keys(editorScreenplay as Record<string, unknown>)
  );

  const markdownDownloadPromise = page.waitForEvent('download');
  await page.getByTestId('export-markdown-button').click();
  const markdownDownload = await markdownDownloadPromise;
  const markdownPath = await markdownDownload.path();

  expect(markdownDownload.suggestedFilename()).toMatch(/\.md$/);
  expect(markdownPath).not.toBeNull();

  const markdown = await readFile(markdownPath as string, 'utf8');

  expect(markdown).toContain('# 雨夜归来');
  expect(markdown).toContain('## 第 1 场 雨夜归来');
  expect(markdown).toContain('- 地点：旧火车站');
  expect(markdown).toContain('雨水砸在站台铁皮棚上');
  expect(markdown).toContain('**沈念**');
  expect(markdown).toContain('> 旁白：信上只有一句话：那场事故不是意外。');
  expect(markdown).toContain('**切至南街尽头。**');
  expect(markdown).toContain('_（内心）林舟：如果这是真的，那我离开的这些年都错了。_');
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
