# Sprint Contract

Feature ID: P5-DEMO-003

Owner: generator agent

Date: 2026-06-07

## 本轮目标

实现 Phase 5 的 demo 收口资产：

- 保留并验证稳定合法 YAML：`examples/screenplay-sample.yaml`。
- 新增故意损坏但语法可解析的 YAML：`examples/screenplay-broken.yaml`。
- 更新 `README.md`，写清运行方式、demo route 和 3 分钟演示节奏。
- 新增 `/demo` 前端演示入口，预载合法 YAML，并支持一键切换到坏 YAML 展示校验错误。

## 明确不做

- 不新增后端 API。
- 不修改 provider、pipeline、validator 或 YAML schema 语义。
- 不新增真实 LLM 调用或 `.env` 配置。
- 不实现视频录制、PDF、DOCX、Final Draft 或后端导出。
- 不回退已验收的 `P5-POLISH-001` / `P5-POLISH-002` 状态语义。

## 用户路径

1. 用户启动 `pnpm dev`。
2. 用户打开 `http://127.0.0.1:5173/demo`。
3. 页面顶部显示 `3 分钟演示路线`。
4. 左侧小说输入预载 `examples/novel-sample.md`。
5. 右侧 YAML 编辑器预载 `examples/screenplay-sample.yaml`，自动调用 `/api/yaml/validate`。
6. 校验通过后，剧本预览更新，`导出 YAML` 和 `导出 Markdown` 可用。
7. 用户点击 `加载坏 YAML`。
8. 页面加载 `examples/screenplay-broken.yaml`，校验面板显示 `project.title` / `必填字段缺失`，预览暂停，导出禁用。
9. 用户点击 `加载合法 YAML`，恢复校验通过、预览更新和导出可用状态。

## 数据状态

- 输入：
  - `examples/novel-sample.md`
  - `examples/screenplay-sample.yaml`
  - `examples/screenplay-broken.yaml`
- 前端状态：
  - `novelText`: `/demo` 与首页均使用稳定 3 章小说样例初始化。
  - `yaml`: `/demo` 初始为稳定合法 YAML；按钮可切换合法/坏 YAML。
  - `validation`: 始终由现有 `/api/yaml/validate` 返回。
- 输出：
  - 合法 YAML：`validation.valid === true`，预览和导出可用。
  - 坏 YAML：`validation.valid === false`，显示精确错误，预览和导出暂停。
- 持久化：无。
- 是否影响 `examples/*`：新增 `examples/screenplay-broken.yaml`；不修改 `examples/screenplay-sample.yaml` 的契约语义。

## UI 要求

- 页面区域：
  - `/demo` 页面顶部新增 demo route 面板。
  - 面板内提供 `加载合法 YAML`、`加载坏 YAML`、`还原样例小说` 三个操作。
  - 其余区域复用现有小说输入、YAML 编辑器、校验结果、剧本预览和导出按钮。
- Loading：
  - `/demo` 初始合法 YAML 仍走既有校验 loading。
  - 切换合法/坏 YAML 后仍走既有校验 loading。
- 错误态：
  - 坏 YAML 必须触发现有校验面板错误，而不是自定义假错误。
  - 错误路径必须是 `project.title`。
- 空态：
  - `/demo` 初始不应为空 YAML；默认应可进入校验通过状态。

## API 要求

本轮不新增 API。

复用既有接口：

```http
POST /api/yaml/validate
POST /api/screenplay/generate
POST /api/chapters/split
```

要求：

- `/demo` 加载合法/坏 YAML 时，校验仍通过 `POST /api/yaml/validate` 完成。
- `examples/screenplay-broken.yaml` 必须是 YAML 语法可解析、但违反 schema 的 fixture。
- 首页 `/` 仍保留原有 mock 生成路径。

## 验收方式

Generator 简单验证：

```powershell
& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web typecheck
& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/server test
& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web test
& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui -- apps/web/tests/ui/p5-demo.spec.ts
& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui
& 'C:\nvm4w\nodejs\pnpm.cmd' verify
```

自动化覆盖：

1. `examples/screenplay-sample.yaml` 通过 `/api/yaml/validate`。
2. `examples/screenplay-broken.yaml` 通过 YAML 解析，但校验失败并返回 `project.title`。
3. `/demo` 预载稳定合法 YAML，校验通过，预览更新，导出可用。
4. `/demo` 点击 `加载坏 YAML` 后显示 `project.title` 错误，预览暂停，导出禁用。
5. `/demo` 点击 `加载合法 YAML` 后恢复校验通过、预览更新和导出可用。

Evaluator 真实交互验证：

1. 启动真实 dev server。
2. 使用 Chrome DevTools MCP 打开 `http://127.0.0.1:5173/demo`。
3. 检查合法 YAML 初始状态、坏 YAML 切换、合法 YAML 恢复、预览和导出状态。
4. 截取 full-page screenshot 并检查页面非空白、无明显错位、遮挡、文字溢出、按钮截断或横向滚动。
5. 停止本轮 dev server 并确认 `5173/8787` 端口释放。

## 失败阈值

- 任一 generator 验证命令失败：不允许 `passes:true`。
- `/demo` 不能直接打开或不能预载合法 YAML：不允许 `passes:true`。
- 坏 YAML 未触发真实 `/api/yaml/validate` 校验错误：不允许 `passes:true`。
- 坏 YAML 错误路径不是 `project.title`：不允许 `passes:true`。
- README 未写清 setup 与 demo route：不允许 `passes:true`。
- evaluator 未使用 Chrome DevTools MCP 完成真实交互和截图视觉检查：不允许 `passes:true`。
- 状态文件未同步：不允许收尾。
