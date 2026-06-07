# Sprint Contract

Feature ID: P4-EXPORT-003

Owner: generator agent

Date: 2026-06-07

## 本轮目标

实现 Phase 4 的剧本导出能力：

- 复用当前 `YAML 编辑器` 的 textarea value 作为 YAML 导出的唯一事实源。
- 当前 YAML 校验通过且校验状态空闲时，允许用户导出 `.yaml` 文件。
- 当前 YAML 校验通过且能解析为 `Screenplay` 时，允许用户导出 `.md` 文件。
- Markdown 导出复用 `P4-PREVIEW-002` 的场景和 beat 映射语义，输出可读剧本稿。
- 导出文件名优先使用 `project.title`，并清理 Windows 文件名不安全字符。

## 明确不做

- 不新增后端 API；本轮导出在浏览器端完成。
- 不导出 PDF、DOCX、Final Draft、字幕或压缩包。
- 不引入 Monaco Editor、CodeMirror 或文件保存对话框增强。
- 不允许未通过校验的 YAML 进入正常导出路径。
- 不实现 `P5-POLISH-002` 的完整 loading、empty、error 全路径打磨。
- 不修改 `examples/*` demo fixture。

## 用户路径

1. 用户打开 `http://127.0.0.1:5173/`。
2. 无有效 YAML 时，`导出 YAML` 和 `导出 Markdown` 按钮禁用。
3. 用户点击“用样例生成”。
4. 页面右侧 `YAML 编辑器` 显示后端返回的 YAML，并完成 debounce validation。
5. `校验结果` 显示 `校验通过` 后，两个导出按钮启用。
6. 用户点击 `导出 YAML`，浏览器下载当前 YAML 文本。
7. 用户点击 `导出 Markdown`，浏览器下载由当前 YAML 生成的可读剧本稿。

## 数据状态

- 输入：
  - `yaml`: 当前 `YAML 编辑器` textarea value。
  - `validation`: 当前 YAML 的 `ValidationResult`。
- 输出：
  - `.yaml`: 当前 YAML 文本，保持同一顶层结构。
  - `.md`: Markdown 剧本稿，包含项目标题、场景标题、地点、时间、人物和 beat 文本。
- 持久化：无服务端持久化；只触发浏览器下载。
- 是否影响 `examples/*`：不影响。

## UI 要求

- 页面区域：在 `YAML 编辑器` 面板标题区增加 `导出 YAML` 和 `导出 Markdown` 按钮。
- 空态：无 YAML 或未通过校验时，按钮禁用。
- 校验中：按钮保持禁用，避免导出尚未确认的内容。
- 错误态：当前 YAML 无法导出时显示简短错误提示。
- 视觉要求：沿用现有工具型 Tailwind 视觉语言；按钮不截断，不造成横向滚动。

## API 要求

本轮不新增 API。

复用既有接口完成校验：

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

1. Vitest 覆盖 `buildScreenplayMarkdown`，确认 Markdown 包含项目标题、场景 metadata 和五类 beat 文本。
2. Playwright 打开真实页面并确认空态导出按钮禁用。
3. Playwright 点击“用样例生成”后确认导出按钮启用。
4. Playwright 触发 `.yaml` 下载，并用 `js-yaml` 解析下载内容，确认顶层结构与当前 editor YAML 一致。
5. Playwright 触发 `.md` 下载，并确认 Markdown 包含可读场景和 beat 文本。

Evaluator 真实交互验证：

1. 启动真实 dev server。
2. 使用 Chrome DevTools MCP 打开 `http://127.0.0.1:5173/`。
3. 截取 full-page screenshot 并检查页面非空白、无明显错位、遮挡、文字溢出或横向滚动。
4. 点击“用样例生成”，确认校验通过后两个导出按钮启用。
5. 点击两个导出按钮，确认浏览器下载 `.yaml` 与 `.md` 文件。
6. 验证 `.yaml` 可解析回 screenplay 顶层结构。
7. 验证 `.md` 包含可读场景和 beat 文本。

## 失败阈值

- 任一 generator 验证命令失败：不允许 `passes:true`。
- YAML 导出不来自当前 `YAML 编辑器` value：不允许 `passes:true`。
- Markdown 导出未复用当前 YAML 或缺少可读场景/beat 文本：不允许 `passes:true`。
- 无效 YAML 或校验中状态仍允许正常导出：不允许 `passes:true`。
- evaluator 未使用 Chrome DevTools MCP 完成真实浏览器交互和截图：不允许 `passes:true`。
- 状态文件未同步：不允许收尾。
