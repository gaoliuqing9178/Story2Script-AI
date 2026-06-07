# Sprint Contract

Feature ID: P5-POLISH-001

Owner: generator agent

Date: 2026-06-07

## 本轮目标

实现 Phase 5 的输入章节数拦截：

- 用户点击生成前，先对小说输入运行章节切分检查。
- 当输入少于 3 个章节时，阻止继续调用 `/api/screenplay/generate`。
- UI 用温和、具体的中文提示告诉用户：至少需要 3 个章节，以及当前识别到几个章节。
- 输入达到 3 个章节时，保留既有 mock/openai-compatible generate 请求路径，不改变生成 API 契约。

## 明确不做

- 不实现完整章节确认 UI。
- 不实现手动重切章、拖拽排序或章节内容编辑。
- 不改变 `/api/chapters/split` 的识别规则；复用 `P3-PIPELINE-001` 已验收的后端切章能力。
- 不实现 `P5-POLISH-002` 的所有 loading、empty、error 状态打磨。
- 不新增真实 LLM 调用，不修改 provider 或 pipeline 语义。
- 不修改 `examples/*` demo fixture。

## 用户路径

1. 用户打开 `http://127.0.0.1:5173/`。
2. 用户在 `小说输入` 中填入 2 章中文小说。
3. 用户点击“用样例生成”。
4. 前端先调用 `POST /api/chapters/split`。
5. 后端返回 `422 TOO_FEW_CHAPTERS`，message 包含当前识别到的章节数。
6. 前端在小说输入区显示友好提示。
7. 本次点击不再调用 `POST /api/screenplay/generate`。
8. 用户补足 3 章后，再次点击“用样例生成”，既有生成路径继续可用。

## 数据状态

- 输入：
  - `novelText`: 当前小说输入 textarea value。
- 预检查：
  - `POST /api/chapters/split`: `{ "text": novelText }`
- 输出：
  - 少于 3 章：显示友好提示，不修改当前 YAML。
  - 3 章及以上：继续调用既有 `/api/screenplay/generate`。
- 持久化：无。
- 是否影响 `examples/*`：不影响。

## UI 要求

- 页面区域：提示显示在 `小说输入` 面板内，靠近输入与生成按钮。
- 文案要求：
  - 明确说“至少需要 3 个章节”。
  - 明确说“当前识别到 N 个”。
  - 语气友好，不只抛后端错误码。
- 空态：没有输入正文时提示用户先输入至少 3 个章节。
- 正常态：默认 3 章样例仍可生成。
- 视觉要求：提示不遮挡输入，不造成按钮截断、文字溢出或横向滚动。

## API 要求

本轮不新增后端 API。

复用既有接口：

```http
POST /api/chapters/split
```

Request:

```json
{ "text": "第一章..." }
```

Response when too few chapters:

```json
{
  "error": {
    "code": "TOO_FEW_CHAPTERS",
    "message": "至少需要 3 个章节，当前识别到 2 个"
  }
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

1. Playwright 打开真实页面。
2. 填入 2 章中文小说。
3. 点击“用样例生成”。
4. 断言 UI 提示包含 `至少需要 3 个章节` 和 `当前识别到 2 个`。
5. 断言本次没有请求 `/api/screenplay/generate`。
6. 断言 YAML 编辑器仍为空，校验结果仍为未校验。

Evaluator 真实交互验证：

1. 启动真实 dev server。
2. 使用 Chrome DevTools MCP 打开 `http://127.0.0.1:5173/`。
3. 输入 2 章中文小说并点击生成。
4. 通过页面文本与 Network evidence 确认 `/api/chapters/split` 拦截，且 `/api/screenplay/generate` 未被调用。
5. 截取 full-page screenshot 并检查页面非空白、无明显错位、遮挡、文字溢出或横向滚动。
6. 补回 3 章输入，确认生成路径仍可用。

## 失败阈值

- 任一 generator 验证命令失败：不允许 `passes:true`。
- 2 章输入仍调用 `/api/screenplay/generate`：不允许 `passes:true`。
- UI 未说明当前识别到的章节数：不允许 `passes:true`。
- UI 只显示后端错误码或英文错误，不够友好：不允许 `passes:true`。
- 3 章输入被误拦截：不允许 `passes:true`。
- evaluator 未使用 Chrome DevTools MCP 完成真实浏览器交互和截图：不允许 `passes:true`。
- 状态文件未同步：不允许收尾。
