# Evaluator QA Report

Feature ID: P5-POLISH-001

Date: 2026-06-07

Updated: 2026-06-07 - chapter count limit removed

Evaluator agent: `019ea086-aeda-76c1-ab27-665c30e8ac8f` for original pass; 2026-06-07 update verified by generator tests in this workspace.

Tooling:

- Chrome DevTools MCP: yes for original evaluator pass
- Browser: Chrome DevTools MCP attached browser
- Viewport: desktop, `1440px` wide during evaluator layout check

## 复现步骤

1. 从仓库根启动真实 dev server：`C:\nvm4w\nodejs\pnpm.cmd dev`。
2. 使用 Chrome DevTools MCP 打开 `http://127.0.0.1:5173/`。
3. 初始页面确认：默认 3 章小说、`YAML 编辑器` 为 `0` 字符、导出按钮禁用、校验状态为 `未校验`。
4. 将小说输入框替换为 2 章中文小说。
5. 点击“用样例生成”。
6. 确认页面继续进入生成路径，YAML 更新，校验通过。
7. 通过 Network 确认 `/api/chapters/split` 返回 `200`，随后请求 `/api/screenplay/generate` 和 `/api/yaml/validate`。
8. 刷新后确认默认 3 章样例仍可正常生成。
9. 保存 full-page screenshot 并做视觉检查。
10. 停止本轮启动的 dev server，确认 `5173/8787` 端口释放。

## 截图或日志证据

- Historical screenshot: `H:\tmp\P5-POLISH-001-fullpage.png`
- 2026-06-07 screenshot: `H:\tmp\chapter-limit-removal-fullpage.png`
- Chrome DevTools MCP: 已使用。
- 2026-06-07 generator command:

```text
& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/server test: PASS
server test files: 5 passed
server tests: 30 passed
```

- 2 章路径预期 Network 记录：

```text
POST http://127.0.0.1:5173/api/chapters/split          [200]
POST http://127.0.0.1:5173/api/screenplay/generate     [200]
POST http://127.0.0.1:5173/api/yaml/validate           [200]
```

2026-06-07 Chrome DevTools MCP 实际复核：

```text
POST http://127.0.0.1:5173/api/chapters/split          [200]
POST http://127.0.0.1:5173/api/screenplay/generate     [200]
POST http://127.0.0.1:5173/api/yaml/validate           [200]
```

布局指标：

```json
{
  "innerWidth": 1440,
  "innerHeight": 934,
  "scrollWidth": 1440,
  "scrollHeight": 1373,
  "horizontalOverflow": false,
  "overflowCountSample": 0
}
```

## 当前用户提示文本

generation idle:

```text
等待生成：会先识别章节结构，再调用剧本生成接口。
```

generation checking:

```text
正在识别章节结构，确认可以进入生成。
```

空输入错误：

```text
请先输入小说正文，再生成剧本。
```

当前行为文案不再出现“至少需要 3 个章节”。

## 正常路径回归

2 章中文小说点击“用样例生成”后页面正常完成：

- `/api/chapters/split`：HTTP 200，返回 2 个 `Chapter`。
- `/api/screenplay/generate`：HTTP 200。
- YAML 编辑器包含：`schema_version: "1.0"`。
- 校验状态：`校验通过`。
- 剧本预览状态：`预览已更新`。

默认 3 章样例仍保持正常：

- YAML 编辑器字符数：`3347`。
- 校验状态：`校验通过`。
- 剧本预览状态：`预览已更新`。

## Generator 验证

- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/server test`：通过，server 5 个 Vitest 文件 / 30 个 tests。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui -- apps/web/tests/ui/p5-polish.spec.ts`：通过，Chromium 5 passed。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui`：通过，Playwright Chromium 12 passed。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' verify`：通过，覆盖 typecheck、lint、test、build。
- Chrome DevTools MCP 真实浏览器复核：通过，2 章输入 split/generate/validate 均为 200，校验通过，预览更新，截图保存到 `H:\tmp\chapter-limit-removal-fullpage.png`。

## 自动化覆盖

- `apps/web/tests/ui/p5-polish.spec.ts`：覆盖真实页面 2 章中文小说输入；断言 `/api/chapters/split` 被调用并放行；断言 `/api/screenplay/generate` 被调用；断言 YAML 编辑器出现 `schema_version: "1.0"`，校验状态为 `校验通过`。
- `apps/server/tests/chapter-split-route.test.ts`：覆盖 2 章 fixture 返回 HTTP 200 和 2 个稳定 `Chapter`。
- `apps/server/tests/yaml-validate-route.test.ts`：覆盖 1 章 screenplay 返回 `valid:true`，空 `source.chapters` 仍返回 `valid:false`。

## 视觉检查

| 检查项 | 结果 | 说明 |
| --- | --- | --- |
| 页面非空白 | pass | full-page screenshot 中左右工作区正常渲染。 |
| 首屏关键内容可见 | pass | 小说输入、生成按钮、YAML 编辑器、校验结果和预览区域均可识别。 |
| 无明显错位或遮挡 | pass | generation 状态位于小说输入区域内，不遮挡按钮或右侧工作区。 |
| 无文字溢出或按钮截断 | pass | 状态提示和按钮文本显示正常。 |
| Loading / 错误态可辨认 | pass | 2 章不再进入章节数不足错误态。 |

## 评分

| 维度 | 分数 | 说明 |
| --- | --- | --- |
| 用户路径完整度 | 5/5 | 2 章输入已放行，3 章输入回归生成路径正常。 |
| 数据契约一致性 | 5/5 | 复用已验收的 `/api/chapters/split`，并按最新题意移除 3 章下限。 |
| 错误与边界处理 | 5/5 | 空输入仍有友好提示，1/2 章不会被误拦。 |
| UI 可用性 | 5/5 | 文案与当前行为一致，无布局破损。 |
| 可维护性 | 5/5 | 前端仍保留预检查阶段，但不再以章节数量作为硬门槛。 |

## 是否放行

Decision: PASS

当前代码已解除 3 章下限；`test:ui -- apps/web/tests/ui/p5-polish.spec.ts`、完整 `test:ui` 与 `verify` 均已通过，允许继续保持 `feature_list.json` 中 `P5-POLISH-001.passes:true`。

## 非阻断问题

- Console 中的 React DevTools 提示和 favicon/static 404 不影响本轮验收路径。
