# Evaluator QA Report

Feature ID: P3-PIPELINE-001

Date: 2026-06-06

Evaluator: sub-agent `019e9bd0-8a5b-7a30-ab2c-e05c21b089b9`

Tooling:

- Chrome DevTools MCP: yes
- Browser: Chromium via Chrome DevTools MCP
- Viewport: default desktop viewport

## 复现步骤

1. 打开真实页面 `http://127.0.0.1:5173`。
2. 用 Chrome DevTools MCP snapshot 检查页面内容。
3. 用 Chrome DevTools MCP full-page screenshot 完成视觉检查。
4. 在浏览器页面上下文中执行 `fetch('/api/chapters/split', ...)`。
5. 分别提交中文章节标题、英文 `Chapter` 标题、Markdown 章节标题、`---chapter---` 分隔符 fixture。
6. 提交少于 3 章的 fixture，确认返回 `422 TOO_FEW_CHAPTERS`。
7. 补充提交“`---chapter---` 只放在章节之间”的 fixture，确认返回 3 章。
8. 复核 server route tests。

## 截图或日志证据

- Screenshot: Chrome DevTools MCP 已完成 full-page screenshot；未提交截图产物到仓库。
- Trace: 不适用。
- Server logs:
  - `chapters.split.completed`：四类正向 fixture 均返回 HTTP 200。
  - `chapters.split.rejected`：少于 3 章 fixture 返回 HTTP 422。
- Command output:

```text
& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/server test: PASS
server test files: 4 passed
server tests: 24 passed
chapter-split-route.test.ts: 7 passed

& 'C:\nvm4w\nodejs\pnpm.cmd' typecheck: PASS
shared/server/web typecheck passed

& 'C:\nvm4w\nodejs\pnpm.cmd' lint: PASS
eslint . passed

& 'C:\nvm4w\nodejs\pnpm.cmd' verify: PASS
typecheck: passed
lint: passed
test: shared 1 passed, server 24 passed, web passWithNoTests passed
build: shared/server/web passed

& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui: PASS
Playwright Chromium: 2 passed
```

Note: one initial `test:ui` attempt did not run tests because the real-verification dev server was already listening on `5173`. After stopping that temporary dev process, `test:ui` passed.

## 视觉检查

| 检查项 | 结果 | 说明 |
| --- | --- | --- |
| 页面非空白 | pass | 页面显示 `Story2Script AI` 主标题。 |
| 首屏关键内容可见 | pass | 小说输入、样例文本、生成按钮、YAML 输出区可见。 |
| 无明显错位或遮挡 | pass | 未发现阻塞性布局问题。 |
| 无文字溢出或按钮截断 | pass | 未发现明显溢出或截断。 |
| Loading / 错误态可辨认 | pass | 本轮未改 UI；422 fixture 的控制台错误来自预期错误态请求。 |

## API 覆盖

中文章节标题 fixture：PASS

- HTTP 200。
- `chapters.length === 3`。
- ids 为 `chapter_001`、`chapter_002`、`chapter_003`。
- order 为 `1`、`2`、`3`。
- title、content、word_count 均存在。

英文 `Chapter` 标题 fixture：PASS

- HTTP 200。
- `chapters.length === 3`。
- ids/order/title/content/word_count 正常。

Markdown 标题 fixture：PASS

- HTTP 200。
- 支持 `# 第一章`、`## 第二章`、`### Chapter 3`。
- ids/order/title/content/word_count 正常。

`---chapter---` 每章前置分隔符 fixture：PASS

- HTTP 200。
- `chapters.length === 3`。
- 自动标题为 `Chapter 1`、`Chapter 2`、`Chapter 3`。
- ids/order/content/word_count 正常。

`---chapter---` 章节之间分隔符 fixture：PASS

- HTTP 200。
- `chapters.length === 3`。
- ids 为 `chapter_001`、`chapter_002`、`chapter_003`。
- order 为 `1`、`2`、`3`。
- 自动标题为 `Chapter 1`、`Chapter 2`、`Chapter 3`。
- content 分别包含：
  - `雨夜归来\n林舟回到旧车站。`
  - `旧信\n沈念把信递给他。`
  - `巷口的灯\n脚步声停下。`
- word_count 为 `12`、`10`、`10`。

少于 3 章 fixture：PASS

- HTTP 422。
- `error.code === 'TOO_FEW_CHAPTERS'`。
- message 为 `至少需要 3 个章节，当前识别到 2 个`。

## 评分

| 维度 | 分数 | 说明 |
| --- | --- | --- |
| 用户路径完整度 | 5/5 | `/api/chapters/split` 已从占位变成真实可用 API。 |
| 数据契约一致性 | 5/5 | 返回 shared `Chapter` 字段：id、title、order、content、word_count。 |
| 错误与边界处理 | 5/5 | 覆盖缺 text、少于 3 章、分隔符前置和分隔符居中。 |
| UI 可用性 | 4/5 | 本轮不改 UI；页面 smoke 与视觉检查通过。 |
| 可维护性 | 5/5 | 切章逻辑集中在 `pipeline/split.ts`，route 只负责 HTTP 入参和状态码。 |

## 是否放行

Decision: PASS

Chrome DevTools MCP 真实浏览器验证、server route tests、`pnpm verify` 和 `pnpm test:ui` 均已通过，可将 `P3-PIPELINE-001` 标记为 `passes:true`。

## 修复建议

- 后续 `P3-PIPELINE-002` 可以复用 `splitChapters` 作为 multi-stage pipeline 的第 1 阶段。
- 后续 `P5-POLISH-001` 再把 `TOO_FEW_CHAPTERS` 友好提示接到前端 UI。
