# Sprint Contract

Feature ID: P3-PIPELINE-001

Owner: generator agent

Date: 2026-06-06

## 本轮目标

实现本地章节切分能力，并接入 `POST /api/chapters/split`：

- 支持中文章节标题，例如 `第一章 雨夜归来`、`第 1 章 雨夜归来`。
- 支持英文 `Chapter` 标题，例如 `Chapter 1 Arrival`。
- 支持 Markdown 标题中的章节标题，例如 `# 第一章 雨夜归来`、`## Chapter 2 The Letter`。
- 支持手动分隔符 `---chapter---`，兼容每章前置分隔符和章节之间分隔符，并为无标题分隔结果生成稳定标题。
- 返回稳定有序的 `chapter_001` 风格 ID、标题、顺序、正文和 `word_count`。
- 少于 3 个有效章节时返回 HTTP 422 和 `TOO_FEW_CHAPTERS`。

## 明确不做

- 不实现 `/api/chapters/analyze`。
- 不实现 screenplay bible、multi-stage generate 或 bounded repair。
- 不改前端章节确认 UI；本轮只交付 API 与 server 测试证据。
- 不修改 `examples/*` demo fixture。
- 不放宽 `feature_list.json` 中后续 pipeline、editor、preview、export 的验收标准。

## 用户路径

1. 调用方提交小说全文到 `POST /api/chapters/split`。
2. 系统按章节标题或 `---chapter---` 分隔符切分文本。
3. 系统返回有序章节数组，供后续章节确认与 Phase 3 pipeline 使用。
4. 如果有效章节少于 3 个，系统返回明确的 422 错误，阻止后续 LLM 工作。

## 数据状态

- 输入：`{ "text": "..." }`。
- 输出：`{ "chapters": Chapter[] }`。
- 持久化：无。
- 是否影响 `examples/*`：不影响。

## UI 要求

- 页面区域：本轮不新增 UI。
- Loading：不涉及。
- 错误态：API 返回 `TOO_FEW_CHAPTERS`，前端错误展示留给 `P5-POLISH-001`。
- 空态：缺少 `text` 时返回 `400 BAD_REQUEST`。

## API 要求

- Endpoint：`POST /api/chapters/split`
- Request：

```json
{
  "text": "第一章 雨夜归来\n正文..."
}
```

- Success Response：

```json
{
  "chapters": [
    {
      "id": "chapter_001",
      "title": "第一章 雨夜归来",
      "order": 1,
      "content": "正文...",
      "word_count": 3
    }
  ]
}
```

- Error：
  - `400 BAD_REQUEST`：`text` 缺失或为空字符串。
  - `422 TOO_FEW_CHAPTERS`：有效章节少于 3 个。

## 验收方式

Generator 简单验证：

```powershell
& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/server test
& 'C:\nvm4w\nodejs\pnpm.cmd' typecheck
& 'C:\nvm4w\nodejs\pnpm.cmd' lint
& 'C:\nvm4w\nodejs\pnpm.cmd' verify
```

自动化覆盖：

1. 中文章节标题 fixture。
2. 英文 `Chapter` 标题 fixture。
3. Markdown 章节标题 fixture。
4. `---chapter---` 每章前置分隔符 fixture。
5. `---chapter---` 章节之间分隔符 fixture。
6. 少于 3 章时返回 `422 TOO_FEW_CHAPTERS`。
7. 缺少 `text` 时返回 `400 BAD_REQUEST`。

Evaluator 真实交互验证：

1. 启动真实 dev server。
2. 用 Chrome DevTools MCP 打开 `http://127.0.0.1:5173`。
3. 在浏览器上下文中通过 `fetch('/api/chapters/split')` 提交四类 fixture，并检查响应。
4. 提交 2 章 fixture，检查 `422 TOO_FEW_CHAPTERS`。
5. 截图并检查页面非空白、无明显错位、遮挡或文本溢出。

## 失败阈值

- 任一 generator 验证命令失败：不允许 `passes:true`。
- 任一章节格式 fixture 无法切分出有序章节：不允许 `passes:true`。
- 少于 3 章没有返回 422：不允许 `passes:true`。
- evaluator 未使用 Chrome DevTools MCP 完成真实浏览器请求和截图：不允许 `passes:true`。
- 状态文件未同步：不允许收尾。
