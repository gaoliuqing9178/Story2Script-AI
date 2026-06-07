# Evaluator QA Report

Feature ID: P4-PREVIEW-002

Date: 2026-06-06

Evaluator agent: 019e9d9c-de7d-7db2-87a6-9e29323b116f

## 复现步骤

1. 从仓库根启动真实 dev server：`C:\nvm4w\nodejs\pnpm.cmd dev`。
2. 使用 Chrome DevTools MCP 打开 `http://127.0.0.1:5173/`。
3. 使用桌面视口约 `1442x903` 完成页面检查。
4. 点击“用样例生成”。
5. 确认 `YAML 编辑器` 从空内容更新为 mock YAML。
6. 确认 `剧本预览` 显示 `预览已更新`。
7. 检查第 1 场头部：场号、标题、地点、时间、人物。
8. 检查 action、dialogue、narration、transition、inner_voice 五类 beat。
9. 破坏 YAML，使 `project.title` 缺失。
10. 等待防抖校验完成。
11. 确认校验面板显示 `project.title` 与 `必填字段缺失`。
12. 确认预览面板显示 `预览已暂停` 和 `当前 YAML 未通过校验，预览已暂停。`

## 截图或日志证据

- Screenshot: `H:\tmp\P4-PREVIEW-002-fullpage.png`
- Screenshot file size: `199,763 bytes`
- Screenshot saved at: `2026-06-06 23:51:47`
- Chrome DevTools MCP: 已使用。
- Browser:
  - 打开页面标题为 `Story2Script AI`。
  - 点击“用样例生成”后，YAML 编辑器从 `0` 字符更新到 `3347` 字符。
  - 校验状态显示 `校验通过`。
  - 预览状态显示 `预览已更新`。
- 预览头部证据：
  - `第 1 场 雨夜归来`
  - `地点：旧火车站`
  - `时间：夜晚`
  - `人物：林舟、沈念`
- 五类 beat 证据：
  - action: `雨水砸在站台铁皮棚上，林舟拖着旧行李箱走出车厢。`
  - dialogue: `沈念` / `你还是回来了。`
  - narration: `旁白：信上只有一句话：那场事故不是意外。`
  - transition: `切至南街尽头。`
  - inner_voice: `（内心）林舟` / `如果这是真的，那我离开的这些年都错了。`
- 失败态证据：
  - 破坏 YAML 后，校验区域显示 `发现 7 个错误`。
  - 错误列表包含 `project.title` 与 `必填字段缺失`。
  - 预览区域显示 `预览已暂停` 与 `当前 YAML 未通过校验，预览已暂停。`
- Layout metrics:
  - viewport: `1442 x 903`
  - document `clientWidth = 1442`
  - document `scrollWidth = 1442`
  - `hasHorizontalOverflow = false`

## Generator 验证

- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web typecheck`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web test`：通过，web 1 个 Vitest 文件 / 2 个 tests。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' lint`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui`：通过，Playwright Chromium 4 passed。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' verify`：通过，覆盖 typecheck、lint、test、build。

## 自动化覆盖

- `apps/web/src/render/screenplay.test.ts`：覆盖 `buildScreenplayPreview` 对场景 metadata、角色/地点反查和 action/dialogue/narration/transition/inner_voice 五类 beat 的映射。
- `apps/web/tests/ui/p4-preview.spec.ts`：覆盖真实页面点击“用样例生成”后渲染场景头部和五类 beat；删除 `project.title` 后校验失败并显示预览暂停态。
- `apps/web/tests/ui/smoke.spec.ts`：继续覆盖 mock generate 后 YAML 编辑器 value 包含必需顶层字段。
- `apps/web/tests/ui/p2-evaluator.spec.ts`：继续覆盖编辑后的小说输入会进入 generate API request body。
- `apps/web/tests/ui/p4-editor.spec.ts`：继续覆盖直接编辑 YAML、删除 `project.title`、等待防抖校验并显示精确错误。

## 视觉检查

| 检查项 | 结果 | 说明 |
| --- | --- | --- |
| 页面非空白 | pass | full-page screenshot 中页面主体、YAML 编辑器、校验结果和预览面板均可见。 |
| 首屏关键内容可见 | pass | 小说输入、生成按钮、YAML 编辑器、校验面板、预览区域均可识别。 |
| 无明显错位或遮挡 | pass | 未发现主要区域遮挡、控件错位或按钮被截断。 |
| 无文字溢出或按钮截断 | pass | 关键中文文本、预览内容和错误列表显示正常。 |
| Loading / 错误态可辨认 | pass | 校验失败后预览暂停态和校验错误路径清楚可辨认。 |

## 评分

| 维度 | 分数 | 说明 |
| --- | --- | --- |
| 用户路径完整度 | 5/5 | 生成 YAML、校验通过、预览渲染、破坏 YAML、预览暂停完整可复现。 |
| 数据契约一致性 | 5/5 | 预览只在 `ValidationResult.valid === true` 时消费当前 YAML editor value；不复制后端校验规则。 |
| 错误与边界处理 | 5/5 | 校验失败时预览明确暂停，避免展示过期正常态。 |
| UI 可用性 | 5/5 | 五类 beat 有区分度，场景头部信息清楚；无横向滚动。 |
| 可维护性 | 5/5 | 预览解析与映射集中在 `apps/web/src/render/screenplay.ts`，UI 面板独立为 `ScreenplayPreview`。 |

## 是否放行

Decision: PASS

`pnpm verify` 与 `pnpm test:ui` 均通过；evaluator 使用 Chrome DevTools MCP 完成真实浏览器交互、截图和视觉检查；允许将 `feature_list.json` 中 `P4-PREVIEW-002.passes` 置为 `true`。

## 非阻断问题

- 未发现阻断验收的问题。
