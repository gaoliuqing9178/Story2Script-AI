# Evaluator QA Report

Feature ID: P4-EXPORT-003

Date: 2026-06-07

Evaluator agent: 019ea056-e0a2-79b3-8bff-872c7f35a6bc

Tooling:

- Chrome DevTools MCP: yes
- Browser: Chrome DevTools MCP attached browser
- Viewport: desktop, `1440px` wide during evaluator layout check

## 复现步骤

1. 从仓库根启动真实 dev server：`C:\nvm4w\nodejs\pnpm.cmd dev`。
2. 使用 Chrome DevTools MCP 打开 `http://127.0.0.1:5173/`。
3. 初始状态确认 `YAML 编辑器` 为 `0` 字符，`导出 YAML` 和 `导出 Markdown` 均为 disabled。
4. 点击“用样例生成”。
5. 等待 `校验结果` 显示 `校验通过`。
6. 确认 `YAML 编辑器` 更新为 `3347` 字符，`导出 YAML` 和 `导出 Markdown` 均启用。
7. 点击 `导出 YAML`，确认浏览器实际下载 `.yaml` 文件。
8. 点击 `导出 Markdown`，确认浏览器实际下载 `.md` 文件。
9. 读取下载文件，验证 YAML 顶层结构和 Markdown 可读文本。
10. 截取 full-page screenshot 并检查页面布局。
11. 停止本轮启动的 dev server，确认 `5173/8787` 端口释放。

## 截图或日志证据

- Screenshot: `H:\tmp\P4-EXPORT-003-fullpage.png`
- Chrome DevTools MCP: 已使用。
- 下载文件：
  - `C:\Users\lx8nb\Downloads\雨夜归来 (1).yaml`
  - `C:\Users\lx8nb\Downloads\雨夜归来 (1).md`
- 下载文件大小：
  - YAML: `4783` bytes
  - Markdown: `1113` bytes
- 下载时间：
  - YAML: `2026-06-07 12:32:26` 本地时间
  - Markdown: `2026-06-07 12:32:37` 本地时间
- 端口收尾：evaluator 停止 dev server 后复查 `5173/8787` 均为 `not-listening`。

## 内容核对

YAML 使用仓库依赖 `js-yaml` 成功解析为 object。

顶层键核对：

| 键 | 结果 |
| --- | --- |
| `schema_version` | pass |
| `project` | pass |
| `source` | pass |
| `characters` | pass |
| `locations` | pass |
| `scenes` | pass |

补充核对：

- `sceneCount`: `3`
- 第一场标题：`雨夜归来`

Markdown 内容核对：

| 内容 | 结果 |
| --- | --- |
| `# 雨夜归来` | pass |
| `## 第 1 场 雨夜归来` | pass |
| `雨水砸在站台铁皮棚上，林舟拖着旧行李箱走出车厢。` | pass |
| `沈念` | pass |
| `旁白` 与 `信上只有一句话：那场事故不是意外。` | pass |
| `切至南街尽头。` | pass |
| `内心` 与 `如果这是真的，那我离开的这些年都错了。` | pass |

## Generator 验证

- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web typecheck`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web test`：通过，web 1 个 Vitest 文件 / 3 个 tests。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' lint`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui -- apps/web/tests/ui/p4-export.spec.ts`：通过，导出专项 1 个 Chromium 用例。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui`：通过，Playwright Chromium 5 passed。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' verify`：通过，覆盖 typecheck、lint、test、build。

## 自动化覆盖

- `apps/web/src/render/screenplay.test.ts`：覆盖 `buildScreenplayMarkdown`，确认 Markdown 包含项目标题、场景标题、地点、动作、对白、旁白、转场和内心独白。
- `apps/web/tests/ui/p4-export.spec.ts`：覆盖真实页面导出路径；确认空态按钮 disabled、校验通过后 enabled、`.yaml` 下载可解析、`.md` 下载包含可读场景和 beat 文本。
- 既有 Playwright 用例继续覆盖 mock generate、P2 request body、P4 editor validation 和 P4 preview。

## 视觉检查

| 检查项 | 结果 | 说明 |
| --- | --- | --- |
| 页面非空白 | pass | full-page screenshot 中左右工作区、YAML 编辑器、导出按钮、校验结果和剧本预览均可见。 |
| 首屏关键内容可见 | pass | 小说输入、生成按钮、YAML 编辑器、导出按钮和校验区域均可识别。 |
| 无明显错位或遮挡 | pass | 未发现主要区域遮挡、控件错位或按钮被截断。 |
| 无文字溢出或按钮截断 | pass | 关键中文文本和导出按钮显示正常。 |
| Loading / 错误态可辨认 | pass | 校验中导出按钮保持禁用；校验通过后按钮启用。 |

DOM 布局指标：

- `innerWidth`: `1440`
- `scrollWidth`: `1440`
- `horizontalOverflow`: `false`
- `overflowingCount`: `0`

## 评分

| 维度 | 分数 | 说明 |
| --- | --- | --- |
| 用户路径完整度 | 5/5 | 初始禁用、生成、校验通过、导出 YAML、导出 Markdown 全链路可复现。 |
| 数据契约一致性 | 5/5 | YAML 来自当前 editor value；Markdown 来自当前 YAML 解析后的 `Screenplay`。 |
| 错误与边界处理 | 5/5 | 未通过校验或校验中不允许正常导出。 |
| UI 可用性 | 5/5 | 导出入口位于 YAML 工作区，按钮状态清楚，没有布局破损。 |
| 可维护性 | 5/5 | Markdown 生成复用 preview 映射函数，没有新增后端 API 或重复数据源。 |

## 是否放行

Decision: PASS

`pnpm verify` 与 `pnpm test:ui` 均通过；evaluator 使用 Chrome DevTools MCP 完成真实浏览器交互、下载文件核对、full-page screenshot 和视觉检查；允许将 `feature_list.json` 中 `P4-EXPORT-003.passes` 置为 `true`。

## 非阻断问题

- evaluator 停止 dev server 后查看 console 时出现 Vite WebSocket 断连错误，这是关服后的预期现象，不计入页面验收问题。
