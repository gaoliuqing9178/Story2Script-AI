# Sprint Contract

Feature ID: P4-PREVIEW-002

Owner: generator agent

Date: 2026-06-06

## 本轮目标

实现 Phase 4 的剧本预览能力：

- 复用当前 `YAML 编辑器` 的 textarea value 作为唯一事实源。
- 当前 YAML 校验通过时，将 YAML 解析为 `Screenplay` 并渲染可读剧本预览。
- 场景头部显示场号、标题、地点、时间和人物。
- 五类 beat 都有可读呈现：`action`、`dialogue`、`narration`、`transition`、`inner_voice`。
- 当前 YAML 校验失败、校验请求失败或校验进行中时，预览明确暂停，不展示过期通过态。

## 明确不做

- 不实现 YAML 或 Markdown 导出，该能力属于 `P4-EXPORT-003`。
- 不引入 Monaco Editor 或 CodeMirror；继续沿用 `P4-EDITOR-001` 的 textarea。
- 不修改 `examples/*` demo fixture。
- 不改弱后端 validator 的结构或应用层校验规则。
- 不实现章节确认 UI、输入预检体验或 loading/error 全路径打磨，这些属于后续 feature。

## 用户路径

1. 用户打开 `http://127.0.0.1:5173`。
2. 用户点击“用样例生成”。
3. 页面右侧 `YAML 编辑器` 显示后端返回的 YAML。
4. `剧本预览` 根据当前 YAML 渲染可读剧本。
5. 预览场景头部显示 `第 N 场`、标题、地点、时间、人物。
6. 预览内容显示 action、dialogue、narration、transition、inner_voice 五类 beat。
7. 用户删除 `project.title`。
8. `/api/yaml/validate` 返回 `valid:false` 后，`剧本预览` 显示暂停态。

## 数据状态

- 输入：
  - `/api/screenplay/generate`: `{ "novel": string }`
  - `/api/yaml/validate`: `{ "yaml": string }`
- 输出：
  - `/api/screenplay/generate`: `{ yaml, validation }`
  - `/api/yaml/validate`: `ValidationResult`
- 前端事实源：`yaml` textarea value。
- 前端解析：校验通过时用 `js-yaml` 解析当前 YAML，再映射为预览数据。
- 持久化：无。
- 是否影响 `examples/*`：不影响。

## UI 要求

- 页面区域：在右侧工作区新增 `剧本预览` 面板，沿用当前工具型布局和 Tailwind 视觉语言。
- 空态：无 YAML 时显示未生成状态。
- Loading / 校验中：显示等待校验，预览暂不更新。
- 错误态：校验请求失败或业务校验失败时显示预览暂停。
- 可读性：
  - action 渲染为普通动作段落。
  - dialogue 渲染角色名和对白。
  - narration 显示 `旁白：` 前缀。
  - transition 居中显示转场内容。
  - inner_voice 显示 `（内心）角色名` 和内容。
- 视觉要求：页面非空白，无明显错位、遮挡、横向滚动或文字溢出。

## API 要求

本轮不新增后端 API。

复用既有接口：

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
  "valid": true,
  "errors": [],
  "warnings": []
}
```

## 验收方式

Generator 简单验证：

```powershell
& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web typecheck
& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web test
& 'C:\nvm4w\nodejs\pnpm.cmd' lint
& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui
& 'C:\nvm4w\nodejs\pnpm.cmd' verify
```

自动化覆盖：

1. Vitest 覆盖 `buildScreenplayPreview`，确认场景 metadata 与五类 beat 映射。
2. Playwright 打开真实页面并点击“用样例生成”。
3. 断言 `剧本预览` 显示第 1 场、地点、时间、人物。
4. 断言 action、dialogue、narration、transition、inner_voice 五类 beat 都出现。
5. 删除 `project.title`。
6. 断言校验面板显示 `project.title`，并且预览区域显示暂停态。

Evaluator 真实交互验证：

1. 启动真实 dev server。
2. 使用 Chrome DevTools MCP 打开 `http://127.0.0.1:5173`。
3. 截取 full-page screenshot 并检查页面非空白、无明显错位、遮挡或文本溢出。
4. 点击“用样例生成”，确认预览面板渲染场景头部和五类 beat。
5. 在 YAML 编辑器中删除 `project.title`。
6. 等待防抖校验完成，确认预览面板显示暂停态。

## 失败阈值

- 任一 generator 验证命令失败：不允许 `passes:true`。
- 预览不从当前 YAML editor value 渲染：不允许 `passes:true`。
- 五类 beat 任一未渲染或无法辨认：不允许 `passes:true`。
- 校验失败后预览仍显示为正常通过态：不允许 `passes:true`。
- evaluator 未使用 Chrome DevTools MCP 完成真实浏览器交互和截图：不允许 `passes:true`。
- 状态文件未同步：不允许收尾。
