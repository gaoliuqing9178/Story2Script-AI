# Evaluator QA Report

Feature ID: P3-PIPELINE-002

Date: 2026-06-06

Evaluator: sub-agent `019e9c16-525e-78a2-9d49-108f9da2b6f7`

Tooling:

- Chrome DevTools MCP: yes
- Browser: Chromium via Chrome DevTools MCP
- Viewport: desktop, measured `clientWidth === 502`

## 复现步骤

1. 打开真实页面 `http://127.0.0.1:5173/`。
2. 用 Chrome DevTools MCP snapshot 检查页面内容。
3. 用 Chrome DevTools MCP full-page screenshot 完成视觉检查。
4. 在浏览器页面上下文中执行 `fetch('/api/chapters/split', ...)`，提交 5 章小说文本。
5. 使用 split 返回的 `chapters` 执行 `fetch('/api/chapters/analyze', ...)`。
6. 使用 `chapters` 执行 `fetch('/api/screenplay/generate', ...)`，走默认 mock provider 的 multi-stage pipeline。
7. 基于 generate 结果删除 `project.title`，执行 `fetch('/api/yaml/repair', ...)`，验证 bounded repair。

## 截图或日志证据

- Screenshot: `H:\tmp\P3-PIPELINE-002-fullpage.png`
- Trace: 不适用。
- Chrome DevTools MCP actions:
  - `list_pages`
  - `navigate_page`
  - `take_snapshot`
  - `take_screenshot`
  - `evaluate_script`
- Command output:

```text
& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/server test: PASS
server test files: 5 passed
server tests: 27 passed

& 'C:\nvm4w\nodejs\pnpm.cmd' lint: PASS
eslint . passed

& 'C:\nvm4w\nodejs\pnpm.cmd' verify: PASS
typecheck: shared/server/web passed
lint: passed
test: shared 1 passed, server 27 passed, web passWithNoTests passed
build: shared/server/web passed

& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui: PASS
Playwright Chromium: 2 passed
```

## 视觉检查

| 检查项 | 结果 | 说明 |
| --- | --- | --- |
| 页面非空白 | pass | 页面显示 `Story2Script AI`、小说输入区和 `YAML 输出` 区。 |
| 首屏关键内容可见 | pass | 主要输入与输出区域可见。 |
| 无明显错位或遮挡 | pass | full-page screenshot 未发现阻断性布局问题。 |
| 无文字溢出或按钮截断 | pass | `scrollWidth === clientWidth === 502`，`textarea/button/pre` 无横向溢出。 |
| Loading / 错误态可辨认 | pass | 本轮不改 UI；API 错误态由 route 返回结构化 JSON。 |

说明：`textarea` 有纵向滚动，属于输入框内容高度的预期行为，不算页面问题。

## API 覆盖

### `/api/chapters/split`

Result: PASS

- HTTP 200。
- 返回 `chapters`。
- `chapters.length === 5`。
- `order` 为 `[1, 2, 3, 4, 5]`。
- 标题：
  - `第一章 雨夜归来`
  - `第二章 旧信`
  - `第三章 巷口的灯`
  - `第四章 暗房回声`
  - `第五章 天台对峙`

### `/api/chapters/analyze`

Result: PASS

- HTTP 200。
- 返回 `analyses`。
- `analyses.length === 5`。
- 单条分析包含字段：
  - `chapter_id`
  - `summary`
  - `characters`
  - `locations`
  - `key_events`
  - `conflicts`
  - `adaptation_notes`

### `/api/screenplay/generate`

Result: PASS

- HTTP 200。
- 返回字段：`yaml`、`validation`、`pipeline`。
- `yaml` 存在，长度为 `4363`。
- `validation.valid === true`。
- `pipeline.analyses.length === 5`。
- `pipeline.bible` 存在。
- `pipeline.initial_validation` 存在。
- `pipeline.repair_attempts` 为数字，值为 `0`。

### `/api/yaml/repair`

Result: PASS

- 坏 YAML 构造方式：基于 generate 结果删除 `project.title`。
- Request: `{ yaml, repair_max_retries: 1 }`
- HTTP 200。
- 返回字段：`yaml`、`validation`、`repair`。
- `repair.attempts === 1`。
- `repair.attempts <= 1`。
- `validation` 存在。
- `repair.initial_validation` 存在。
- `validation.valid === true`。

## 自动化测试补充

`apps/server/tests/pipeline-route.test.ts` 覆盖：

- `/api/chapters/analyze` mock provider。
- `/api/screenplay/generate` fake OpenAI-compatible provider 的 analysis -> bible -> scene generation -> validation -> repair。
- 生成阶段故意返回缺 `project.title` 的 YAML，repair 后转为 valid。
- `/api/yaml/repair` 在 provider 持续返回 invalid YAML 时，attempts 被 `repair_max_retries` 限制。

## 评分

| 维度 | 分数 | 说明 |
| --- | --- | --- |
| 用户路径完整度 | 5/5 | split -> analyze -> generate -> validate -> repair 已可通过 API 跑通。 |
| 数据契约一致性 | 5/5 | 输出沿用 shared `ChapterAnalysis`、`ValidationResult` 和 screenplay YAML v1.0。 |
| 错误与边界处理 | 5/5 | 覆盖坏 YAML repair 和 repair retry 上限。 |
| UI 可用性 | 4/5 | 本轮不改 UI；真实页面视觉检查通过。 |
| 可维护性 | 5/5 | 阶段逻辑集中在 `pipeline/`，route 只负责 HTTP 入参和响应。 |

## 是否放行

Decision: PASS

Chrome DevTools MCP 真实浏览器验证、server route tests、`pnpm verify` 和 `pnpm test:ui` 均已通过，可将 `P3-PIPELINE-002` 标记为 `passes:true`。

## 修复建议

- 后续 `P4-EDITOR-001` 可基于当前 `/api/yaml/validate` 与 `/api/yaml/repair` 接入编辑器。
- 后续 `P4-PREVIEW-002` 可直接消费本轮 generate 返回的 YAML。
