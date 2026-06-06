# Sprint Contract

Feature ID: P4-EDITOR-001

Owner: generator agent

Date: 2026-06-06

## 本轮目标

实现 Phase 4 的 YAML 编辑闭环：

- 前端展示可直接编辑的 YAML 文本区。
- 用户编辑 YAML 后，前端防抖调用 `POST /api/yaml/validate`。
- 校验面板展示 `ValidationResult.errors[].path` 和 `message`。
- 生成接口返回的初始 `validation` 继续用于首屏状态，后续编辑以 `/api/yaml/validate` 为准。

## 明确不做

- 不引入 Monaco Editor 或 CodeMirror；本轮用原生 textarea 先完成直接编辑与校验闭环。
- 不实现剧本预览渲染，该能力属于 `P4-PREVIEW-002`。
- 不实现 YAML / Markdown 导出，该能力属于 `P4-EXPORT-003`。
- 不修改 `examples/*` demo fixture。
- 不放宽后端 validator 的结构或应用层校验规则。

## 用户路径

1. 用户打开 `http://127.0.0.1:5173`。
2. 用户点击“用样例生成”。
3. 页面右侧 `YAML 编辑器` 显示后端返回的 YAML。
4. 页面 `校验结果` 显示当前 YAML 的 validation 状态。
5. 用户直接删除 `project.title`。
6. 停止输入后，页面自动调用 `/api/yaml/validate`。
7. 校验面板显示 `project.title` 和 `必填字段缺失`。

## 数据状态

- 输入：
  - `/api/screenplay/generate`: `{ "novel": string }`
  - `/api/yaml/validate`: `{ "yaml": string }`
- 输出：
  - `/api/screenplay/generate`: `{ yaml, validation }`
  - `/api/yaml/validate`: `ValidationResult`
- 前端事实源：`yaml` textarea value。
- 持久化：无。
- 是否影响 `examples/*`：不影响。

## UI 要求

- 页面区域：保留小说输入区，右侧新增 YAML 编辑器和校验结果面板。
- Loading：生成按钮保持禁用重复提交；编辑后校验中显示 `校验中...`。
- 错误态：校验 API 请求失败时显示请求错误；业务校验失败时逐条显示 path + message。
- 空态：未生成 YAML 时校验面板显示未校验状态。
- 视觉要求：页面非空白，无明显错位、遮挡、横向滚动或文字溢出。

## API 要求

复用既有后端接口：

```http
POST /api/yaml/validate
```

Request:

```json
{ "yaml": "schema_version: \"1.0\"..." }
```

Response:

```json
{
  "valid": false,
  "errors": [
    {
      "path": "project.title",
      "message": "必填字段缺失"
    }
  ],
  "warnings": []
}
```

## 验收方式

Generator 简单验证：

```powershell
& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web typecheck
& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web test
& 'C:\nvm4w\nodejs\pnpm.cmd' lint
& 'C:\nvm4w\nodejs\pnpm.cmd' verify
& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui
```

自动化覆盖：

1. Playwright 打开真实页面并点击“用样例生成”。
2. 断言 YAML 编辑器 value 包含 mock fixture。
3. 删除 `project.title`。
4. 断言校验面板显示 `project.title` 与 `必填字段缺失`。
5. 保留旧 P0/P2 UI 测试，确认 mock generate 和 novel request body 路径不回退。

Evaluator 真实交互验证：

1. 启动真实 dev server。
2. 使用 Chrome DevTools MCP 打开 `http://127.0.0.1:5173`。
3. 截取 full-page screenshot 并检查页面非空白、无明显错位、遮挡或文本溢出。
4. 点击“用样例生成”，确认 YAML 编辑器显示内容且校验通过。
5. 在 YAML 编辑器中删除 `project.title`。
6. 等待防抖校验完成，确认校验面板显示 `project.title` 与 `必填字段缺失`。

## 失败阈值

- 任一 generator 验证命令失败：不允许 `passes:true`。
- YAML 不能直接编辑：不允许 `passes:true`。
- 编辑后不会触发 `/api/yaml/validate`：不允许 `passes:true`。
- 校验错误不能显示精确 path：不允许 `passes:true`。
- evaluator 未使用 Chrome DevTools MCP 完成真实浏览器交互和截图：不允许 `passes:true`。
- 状态文件未同步：不允许收尾。
