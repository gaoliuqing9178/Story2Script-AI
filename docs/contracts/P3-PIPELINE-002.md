# Sprint Contract

Feature ID: P3-PIPELINE-002

Owner: generator agent

Date: 2026-06-06

## 本轮目标

实现 Phase 3 多阶段生成闭环：

- 逐章分析：`Chapter[]` -> `ChapterAnalysis[]`。
- 剧本圣经：`ChapterAnalysis[]` -> 统一人物、地点、主题、时间线和主线矛盾。
- 分场生成：`chapters + analyses + bible + adaptation params` -> screenplay YAML。
- 本地校验：生成 YAML 立即经过现有 structural + reference validator。
- 结构修复：校验失败时调用 provider 修复 YAML，且修复次数有上限。

## 明确不做

- 不实现前端章节确认 UI。
- 不实现 YAML 编辑器、剧本预览或导出。
- 不调用真实外部 OpenAI API；自动化验证使用本地 OpenAI-compatible fake server 与默认 mock provider。
- 不修改 `examples/*` demo fixture。
- 不放宽 `feature_list.json` 中 P4/P5 后续功能验收标准。

## 用户路径

1. 调用方通过 `POST /api/chapters/split` 获得 5 章以上 `Chapter[]`。
2. 调用方通过 `POST /api/chapters/analyze` 获得逐章分析。
3. 调用方通过 `POST /api/screenplay/generate` 提交 `chapters`，系统运行 multi-stage pipeline。
4. pipeline 返回 YAML、最终 validation、analyses、bible、initial validation 和 repair attempt metadata。
5. 如 YAML 缺字段或引用错误，调用方可通过 `POST /api/yaml/repair` 进行 bounded repair。

## 数据状态

- 输入：
  - `/api/chapters/analyze`: `{ "chapters": Chapter[] }`
  - `/api/screenplay/generate`: `{ "chapters": Chapter[], "analyses"?: ChapterAnalysis[], "repair_max_retries"?: number }`
  - `/api/yaml/repair`: `{ "yaml": string, "repair_max_retries"?: number }`
- 输出：
  - `/api/chapters/analyze`: `{ "analyses": ChapterAnalysis[] }`
  - `/api/screenplay/generate`: `{ yaml, validation, pipeline }`
  - `/api/yaml/repair`: `{ yaml, validation, repair }`
- 持久化：无。
- 是否影响 `examples/*`：不影响。

## UI 要求

- 页面区域：本轮不新增 UI。
- Loading：不涉及。
- 错误态：API 返回具体 `BAD_REQUEST`、`TOO_FEW_CHAPTERS` 或 `LLM_UNAVAILABLE`。
- 视觉要求：现有页面不能因后端改动出现空白、错位、遮挡、文字溢出。

## API 要求

### `POST /api/chapters/analyze`

Request:

```json
{
  "chapters": [
    {
      "id": "chapter_001",
      "title": "第一章 雨夜归来",
      "order": 1,
      "content": "正文...",
      "word_count": 100
    }
  ]
}
```

Success Response:

```json
{
  "analyses": [
    {
      "chapter_id": "chapter_001",
      "summary": "...",
      "characters": ["林舟"],
      "locations": ["旧火车站"],
      "key_events": ["林舟回乡"],
      "conflicts": ["追查与阻止之间的冲突"],
      "adaptation_notes": ["把心理描写外化为动作和对白"]
    }
  ]
}
```

### `POST /api/screenplay/generate`

兼容旧路径：

- 不传 `chapters`/`analyses` 时，保持 P2 单阶段 generate 行为。
- 传入 `chapters` 或 `analyses` 时，运行 P3 multi-stage pipeline。

Pipeline response:

```json
{
  "yaml": "schema_version: \"1.0\"...",
  "validation": { "valid": true, "errors": [], "warnings": [] },
  "pipeline": {
    "analyses": [],
    "bible": {},
    "initial_validation": { "valid": true, "errors": [], "warnings": [] },
    "repair_attempts": 0,
    "max_repair_attempts": 2
  }
}
```

### `POST /api/yaml/repair`

Success Response:

```json
{
  "yaml": "schema_version: \"1.0\"...",
  "validation": { "valid": true, "errors": [], "warnings": [] },
  "repair": {
    "initial_validation": { "valid": false, "errors": [] },
    "attempts": 1,
    "max_attempts": 1
  }
}
```

## 验收方式

Generator 简单验证：

```powershell
& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/server test
& 'C:\nvm4w\nodejs\pnpm.cmd' lint
& 'C:\nvm4w\nodejs\pnpm.cmd' verify
& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui
```

自动化覆盖：

1. `/api/chapters/analyze` 默认 mock provider 返回每章分析。
2. `/api/screenplay/generate` 使用本地 OpenAI-compatible fake server，确认 5 次 analysis、1 次 bible、1 次 scene generation、1 次 repair。
3. 生成阶段故意返回缺 `project.title` 的 YAML，确认 initial validation 为 false，repair 后 validation 为 true。
4. `/api/yaml/repair` 在 provider 持续返回 invalid YAML 时，确认 repair attempts 不超过请求上限。
5. 旧 P2 单阶段 generate route 测试继续通过。

Evaluator 真实交互验证：

1. 启动真实 dev server。
2. 用 Chrome DevTools MCP 打开 `http://127.0.0.1:5173`。
3. 截取 full-page screenshot 并检查页面非空白、无明显错位、遮挡或文本溢出。
4. 在浏览器上下文中用 `fetch` 调用 split/analyze/generate/repair。
5. 使用 5 章小说 fixture，确认 generate 返回 `validation.valid === true`、`pipeline.analyses.length === 5`、`pipeline.bible`、`pipeline.initial_validation` 和数字类型 `repair_attempts`。
6. 删除 generate 结果中的 `project.title` 后调用 `/api/yaml/repair`，确认 `repair.attempts <= repair_max_retries`。

## 失败阈值

- 任一 generator 验证命令失败：不允许 `passes:true`。
- multi-stage pipeline 没有返回 analyses、bible、validation 或 repair metadata：不允许 `passes:true`。
- repair attempts 可超过上限：不允许 `passes:true`。
- evaluator 未使用 Chrome DevTools MCP 完成真实浏览器请求和截图：不允许 `passes:true`。
- 状态文件未同步：不允许收尾。
