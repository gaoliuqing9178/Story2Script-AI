# Sprint Contract

Feature ID: P5-POLISH-001

Owner: generator agent

Date: 2026-06-07

Updated: 2026-06-07 - chapter count limit removed

## 本轮目标

实现 Phase 5 的输入预检体验，并按最新题意解除 3 章下限：

- 用户点击生成前，先对小说输入运行章节切分检查。
- 当输入为空时，显示友好提示并阻止继续调用 `/api/screenplay/generate`。
- 当输入能识别出 1 个、2 个或更多章节时，继续调用既有 `/api/screenplay/generate`。
- UI 文案不再暗示“至少需要 3 个章节”；题目要求是至少能处理 3 章以上小说，不是只能处理 3 章以上小说。

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
5. 后端返回 `200` 和 2 个 `Chapter`。
6. 前端继续调用 `POST /api/screenplay/generate`。
7. YAML 进入编辑器，随后走既有 `/api/yaml/validate`、预览和导出可用性逻辑。
8. 用户清空输入后点击生成时，页面显示“请先输入小说正文，再生成剧本。”，并不进入生成路径。

## 数据状态

- 输入：
  - `novelText`: 当前小说输入 textarea value。
- 预检查：
  - `POST /api/chapters/split`: `{ "text": novelText }`
- 输出：
  - 空输入：显示友好提示，不修改当前 YAML。
  - 1 章及以上：继续调用既有 `/api/screenplay/generate`。
- 持久化：无。
- 是否影响 `examples/*`：不影响。

## UI 要求

- 页面区域：generation 状态显示在 `小说输入` 面板内。
- 文案要求：
  - checking 状态描述为“正在识别章节结构，确认可以进入生成。”
  - idle 状态描述为“等待生成：会先识别章节结构，再调用剧本生成接口。”
  - 空输入提示为“请先输入小说正文，再生成剧本。”
  - 不再出现“至少需要 3 个章节”的当前行为文案。
- 正常态：默认 3 章样例仍可生成；2 章输入也可生成。
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

Response when two chapters are detected:

```json
{
  "chapters": [
    { "id": "chapter_001", "title": "第一章 雨夜归来", "order": 1, "content": "雨夜正文。", "word_count": 5 },
    { "id": "chapter_002", "title": "第二章 旧信", "order": 2, "content": "旧信正文。", "word_count": 5 }
  ]
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
4. 断言 `/api/chapters/split` 被调用并放行。
5. 断言 `/api/screenplay/generate` 被调用。
6. 断言 YAML 编辑器出现 `schema_version: "1.0"`，校验结果为 `校验通过`。
7. 断言页面没有章节数不足提示。

Evaluator 真实交互验证：

1. 启动真实 dev server。
2. 使用 Chrome DevTools MCP 打开 `http://127.0.0.1:5173/`。
3. 输入 2 章中文小说并点击生成。
4. 通过页面文本与 Network evidence 确认 split `200`、generate `200`、validate `200`。
5. 截取 full-page screenshot 并检查页面非空白、无明显错位、遮挡、文字溢出或横向滚动。

## 失败阈值

- 任一 generator 验证命令失败：不允许 `passes:true`。
- 1 章或 2 章输入仍被章节数下限拦截：不允许 `passes:true`。
- 2 章输入没有调用 `/api/screenplay/generate`：不允许 `passes:true`。
- UI 仍显示“至少需要 3 个章节”的当前行为文案：不允许 `passes:true`。
- 默认 3 章样例被误拦截：不允许 `passes:true`。
- evaluator 未使用 Chrome DevTools MCP 完成真实浏览器交互和截图：不允许 `passes:true`。
- 状态文件未同步：不允许收尾。
