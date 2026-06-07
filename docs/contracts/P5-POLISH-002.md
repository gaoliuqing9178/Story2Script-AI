# Sprint Contract

Feature ID: P5-POLISH-002

Owner: generator agent

Date: 2026-06-07

## 本轮目标

实现 Phase 5 的状态打磨：

- generation 路径在章节预检和剧本生成期间有明确 loading 文案。
- generation 按钮在请求中锁定，避免重复提交。
- generation 失败时显示具体失败阶段和 API 路径。
- validation 路径在校验中、业务校验失败和校验请求失败时都有明确状态。
- export 路径在空 YAML、校验中、校验失败、校验请求失败和可导出时都有清晰状态。

## 明确不做

- 不新增后端 API。
- 不修改 provider、pipeline、validator 或 YAML schema 语义。
- 不实现完整章节确认 UI、手动重切章或章节编辑。
- 不新增 PDF、DOCX、Final Draft 等导出格式。
- 不修改 `examples/*` demo fixture。
- 不实现 `P5-DEMO-003` demo 资产、README 或 3 分钟 demo route。

## 用户路径

1. 用户打开 `http://127.0.0.1:5173/`。
2. 初始状态下，右侧 YAML 为空，校验结果为 `未校验`，导出按钮禁用，并显示暂无可导出的 YAML。
3. 用户点击“用样例生成”。
4. 前端先显示章节检查 loading；章节预检通过后显示生成 YAML loading。
5. loading 期间生成按钮禁用，重复点击不会触发重复提交。
6. 生成成功后，YAML 进入编辑器，校验通过，预览更新，导出按钮启用。
7. 如果 `/api/screenplay/generate` 失败，页面显示 `剧本生成阶段失败（/api/screenplay/generate）` 和服务端错误原因。
8. 用户编辑 YAML 时，校验中状态可见，导出暂不可用。
9. 如果 YAML 业务校验失败，校验面板显示精确 path，预览和导出暂停。
10. 如果 `/api/yaml/validate` 请求失败，页面显示 `校验阶段失败（/api/yaml/validate）`，预览和导出暂停。

## 数据状态

- 输入：
  - `novelText`: 小说输入 textarea value。
  - `yaml`: YAML 编辑器 textarea value，是前端 YAML 唯一事实源。
- 状态：
  - `status`: generation 总状态，覆盖 `idle`、`loading`、`error`。
  - `generationPhase`: generation 子阶段，覆盖 `checking` 和 `generating`。
  - `validationStatus`: validation 请求状态，覆盖 `idle`、`validating`、`error`。
  - `validation`: 后端返回的 `ValidationResult`。
- 输出：
  - 成功生成：更新 YAML、validation、预览和导出可用性。
  - 生成失败：保留当前 YAML，不误启用导出。
  - 校验失败：展示 `ValidationResult.errors[].path` 和 `message`。
- 持久化：无。
- 是否影响 `examples/*`：不影响。

## UI 要求

- 页面区域：
  - generation 状态显示在 `小说输入` 面板内。
  - export 状态显示在 `YAML 编辑器` 导出按钮下方。
  - validation 请求失败显示在 `校验结果` 面板内。
- Loading：
  - 章节预检：`正在检查章节数量，确认至少 3 个章节后再进入生成。`
  - 生成 YAML：`正在生成剧本 YAML，请稍等，按钮已暂时锁定。`
  - YAML 校验：`校验中...`，导出提示 `校验中，导出暂不可用。`
- 错误态：
  - generation server error 必须包含 `/api/screenplay/generate`。
  - validation request error 必须包含 `/api/yaml/validate`。
  - validation business error 必须显示精确 path，例如 `project.title`。
- 空态：
  - 空 YAML 时显示 `暂无可导出的 YAML。生成并通过校验后可导出 YAML 或 Markdown。`
  - 空 YAML 时导出按钮禁用、预览未生成、校验未校验。

## API 要求

本轮不新增后端 API。

复用既有接口：

```http
POST /api/chapters/split
POST /api/screenplay/generate
POST /api/yaml/validate
```

错误展示要求：

- `/api/chapters/split` 的 `TOO_FEW_CHAPTERS` 继续显示 P5-POLISH-001 已验收的友好文案。
- `/api/screenplay/generate` 非 2xx 时，前端显示生成阶段和接口路径。
- `/api/yaml/validate` 非 2xx 时，前端显示校验阶段和接口路径。

## 验收方式

Generator 简单验证：

```powershell
& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web typecheck
& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web test
& 'C:\nvm4w\nodejs\pnpm.cmd' lint
& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui -- apps/web/tests/ui/p5-polish.spec.ts
& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui
& 'C:\nvm4w\nodejs\pnpm.cmd' verify
```

自动化覆盖：

1. 少于 3 章输入仍被拦截，且不调用 `/api/screenplay/generate`。
2. 慢 `/api/screenplay/generate` 时 loading 可见，生成按钮 disabled，重复点击只发一次 generate。
3. `/api/screenplay/generate` 500 时显示接口路径，YAML 保持空态。
4. 初始 export 空态明确，导出按钮 disabled。
5. 慢 `/api/yaml/validate` 时导出暂不可用。
6. `/api/yaml/validate` 500 时显示接口路径，预览和导出暂停。
7. YAML 业务校验失败时显示 `project.title` 精确 path，导出禁用。

Evaluator 真实交互验证：

1. 启动真实 dev server。
2. 使用 Chrome DevTools MCP 打开 `http://127.0.0.1:5173/`。
3. 检查初始空态、慢生成 loading、防重复提交、生成 server error、正常生成、业务校验失败、校验 request error、导出状态。
4. 截取 full-page screenshot 并检查页面非空白、无明显错位、遮挡、文字溢出、按钮截断或横向滚动。
5. 停止本轮 dev server 并确认 `5173/8787` 端口释放。

## 失败阈值

- 任一 generator 验证命令失败：不允许 `passes:true`。
- loading 文案不可见或生成按钮可重复提交：不允许 `passes:true`。
- server error 未指出具体阶段或 API 路径：不允许 `passes:true`。
- YAML 业务校验失败后导出仍可用：不允许 `passes:true`。
- 空 YAML 时导出按钮可用或空态不明确：不允许 `passes:true`。
- evaluator 未使用 Chrome DevTools MCP 完成真实交互和截图视觉检查：不允许 `passes:true`。
- 状态文件未同步：不允许收尾。
