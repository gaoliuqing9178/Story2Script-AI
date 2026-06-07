# Story2Script AI 工程文档

> 本文是 `design.md`（产品与方案设计）与 `yaml-schema.md`（数据契约）的**落地实现说明**。
> 三份文档分工：`design.md` 回答“做什么、为什么这么排”，`yaml-schema.md` 回答“数据长什么样”，本文回答“代码怎么组织、模块怎么协作、接口怎么对接”。

---

## 1. 目标与范围

本文覆盖：技术栈、目录结构、数据流、各模块职责与接口、API 契约、Prompt 工程、错误处理、配置、运行构建、测试策略。

不覆盖：产品形态与排期（见 `design.md`）、YAML 字段语义（见 `yaml-schema.md`）。

实现遵循一条主线：**所有 AI 输出都必须经过本地解析与 Schema 校验，校验是系统的“事实标准”，UI 与修复流程都围绕校验结果运转。**

---

## 2. 技术栈

| 层 | 选型 | 说明 |
| --- | --- | --- |
| 前端框架 | React 18 + Vite + TypeScript | 快速冷启动、HMR |
| 样式 | Tailwind CSS | 不写 CSS 文件，速度优先 |
| 编辑器 | CodeMirror 6（首选）/ Monaco | CodeMirror 体积小、集成快；二选一 |
| YAML（前端） | `js-yaml` | 编辑器侧即时解析预览 |
| 后端 | Node.js 20 + Express + TypeScript | 简单稳定，团队熟悉 |
| 校验 | `ajv` + `ajv-formats` | JSON Schema 结构校验 |
| YAML（后端） | `js-yaml` | 解析 / 序列化 |
| LLM | OpenAI-compatible Responses API | 通过 Provider 层封装，可替换 |
| 测试 | `vitest` | 前后端共用一套 |
| 包管理 | pnpm workspace（monorepo） | 前后端共享类型 |

> 选型原则：**能用成熟库就不自造轮子，能共享类型就不重复定义。** `packages/shared` 存放前后端共用的 TS 类型与 JSON Schema，避免契约漂移。

---

## 3. 系统总览

```
┌──────────────────────────────────────────────────────────┐
│                        前端 (Web 工作台)                    │
│  输入区 → 章节确认 → 生成控制 → YAML编辑器 ⇄ 校验面板 ⇄ 预览  │
└───────────────┬──────────────────────────────────────────┘
                │ HTTP (JSON)
┌───────────────▼──────────────────────────────────────────┐
│                          后端 (API)                        │
│  /chapters/split  /chapters/analyze  /screenplay/generate  │
│  /yaml/validate   /yaml/repair       /export               │
│                                                            │
│  ┌────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ Pipeline   │→ │ Provider 层   │  │ Validator          │  │
│  │ 编排        │  │ Mock/OpenAI  │  │ structural+reference│  │
│  └────────────┘  └──────────────┘  └────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

数据始终单向流动：**文本 → 章节 → 分析 → 圣经 → YAML → 校验 → (修复) → 编辑 → 导出**。每一步的输出都是下一步的稳定输入，避免一次性让模型处理全文。

---

## 4. 目录结构

采用 pnpm monorepo，前后端共享类型与 Schema。

```
xengineering/
├── docs/
│   ├── design.md
│   ├── yaml-schema.md
│   └── engineering.md            # 本文
├── examples/
│   ├── novel-sample.md           # 内置样例小说
│   └── screenplay-sample.yaml    # 示例输出 / demo fallback
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── types.ts          # 前后端共用 TS 类型（与 Schema 对齐）
│       │   └── schema.ts         # 导出 JSON Schema 常量
│       └── package.json
├── apps/
│   ├── server/
│   │   ├── src/
│   │   │   ├── index.ts          # Express 入口
│   │   │   ├── routes/           # 各 API 路由
│   │   │   ├── pipeline/         # 多阶段编排
│   │   │   │   ├── split.ts
│   │   │   │   ├── analyze.ts
│   │   │   │   ├── bible.ts
│   │   │   │   ├── generate.ts
│   │   │   │   └── repair.ts
│   │   │   ├── provider/
│   │   │   │   ├── index.ts      # Provider 接口 + 工厂
│   │   │   │   ├── mock.ts       # MockProvider
│   │   │   │   └── openai.ts     # OpenAIProvider
│   │   │   ├── validate/
│   │   │   │   ├── structural.ts # ajv 结构校验
│   │   │   │   └── reference.ts  # 应用层引用/一致性校验
│   │   │   ├── prompts/          # 各阶段 prompt 模板
│   │   │   └── export/           # yaml / markdown 导出
│   │   └── package.json
│   └── web/
│       ├── src/
│       │   ├── App.tsx
│       │   ├── api/              # 后端调用封装
│       │   ├── components/       # 六大区域组件
│       │   ├── store/            # 全局状态
│       │   └── render/           # YAML → 剧本预览渲染
│       └── package.json
├── pnpm-workspace.yaml
└── package.json
```

---

## 5. 核心数据模型

`packages/shared/src/types.ts` 是契约单一来源，前后端都从这里 import。与 `yaml-schema.md` 一一对应。

```ts
export type AdaptationType = 'screenplay' | 'stage_play' | 'audio_drama' | 'short_drama';
export type CharacterRole = 'protagonist' | 'antagonist' | 'supporting' | 'minor';
export type BeatType = 'action' | 'dialogue' | 'narration' | 'transition' | 'inner_voice';

export interface Chapter {
  id: string;
  title: string;
  order: number;
  content: string;      // split 阶段产出，analyze 时使用
  word_count?: number;
}

export interface ChapterAnalysis {
  chapter_id: string;
  summary: string;
  characters: string[];
  locations: string[];
  key_events: string[];
  conflicts: string[];
  adaptation_notes: string[];
}

export interface Beat {
  type: BeatType;
  speaker?: string;     // dialogue / inner_voice 条件必填
  content: string;
}

export interface Scene {
  id: string;
  title: string;
  order: number;
  source_chapters: string[];
  location_id: string;
  time?: string;
  mood?: string;
  characters: string[];
  purpose: string;
  conflict: string;
  beats: Beat[];
  notes?: { adaptation_reason?: string; original_reference?: string };
}

export interface Screenplay {
  schema_version: '1.0';
  project: {
    title: string;
    source_type: 'novel';
    adaptation_type: AdaptationType;
    language: string;
    logline?: string;
    theme?: string;
  };
  source: { chapters: { id: string; title: string; order: number; summary: string }[] };
  characters: {
    id: string; name: string; aliases?: string[]; role: CharacterRole;
    description?: string; goals?: string[];
    relationships?: { target: string; relation: string }[];
  }[];
  locations: { id: string; name: string; type?: string; description?: string }[];
  scenes: Scene[];
}

export interface ValidationError { path: string; message: string; }
export interface ValidationResult { valid: boolean; errors: ValidationError[]; warnings?: ValidationError[]; }
```

> `warnings` 用于承载“章节覆盖”这类非致命提示：不阻断生成，但在 UI 上提醒作者。

---

## 6. 后端模块设计

### 6.1 Provider 层（可替换 LLM 的边界）

接口统一，调用方（pipeline）只依赖接口，不关心具体模型。

```ts
// provider/index.ts
export interface LLMProvider {
  /** 输入 prompt，返回纯文本（通常是 YAML 或 JSON 字符串） */
  complete(input: { system: string; user: string; temperature?: number }): Promise<string>;
}

export function createProvider(): LLMProvider {
  return process.env.LLM_PROVIDER === 'openai'
    ? new OpenAIProvider()
    : new MockProvider();   // 默认 mock，保证零配置可运行
}
```

- `MockProvider`：根据当前阶段返回写死的合法产物（章节分析 JSON / 剧本 YAML）。**断网、限流、欠费时主流程不中断，是 demo 的兜底命脉。**
- `OpenAIProvider`：调用 OpenAI-compatible `/responses`，读取 `OPENAI_API_KEY`、`OPENAI_BASE_URL`、`OPENAI_MODEL`，从 `output_text` 或 `output[].content[].text` 提取文本。
- Provider 同时提供 `stream()`：OpenAI 模式会带 `stream: true` 并解析 Responses SSE `response.output_text.delta`；mock 模式会分块产出文本，用于本地真实 HTTP streaming 和 UI 自动化测试。

> 设计原因：Provider 是唯一与外部不确定性耦合的点。把它隔离成一层，既能换模型，也能在测试与演示中用 mock 完全绕开网络。

### 6.2 章节切分（split）

纯本地正则，不调 AI（确定性优先，省 token、省时间）。

识别优先级：

1. `第N章` / `第一章` / `第 1 章`
2. `Chapter N`
3. Markdown 标题 `#`/`##` + 章节词
4. 自定义分隔符 `---chapter---`

产出 `Chapter[]`，附 `word_count` 与内容预览。若无法识别 → 返回空数组并提示前端走“手动分隔”路径。

**输入预检**：切章后返回识别出的 `Chapter[]`。章节数量不再作为拦截条件；题目要求是至少能处理 3 章以上小说，不是只能处理 3 章以上小说。缺少正文时仍返回 `400 BAD_REQUEST`。

### 6.3 流水线编排（pipeline）

对应 `design.md` §6 的六个阶段：

| 阶段 | 模块 | 是否调 AI | 输入 → 输出 |
| --- | --- | --- | --- |
| 1 切章清洗 | `split.ts` | 否 | 原文 → `Chapter[]` |
| 2 逐章分析 | `analyze.ts` | 是（逐章并发） | `Chapter` → `ChapterAnalysis` |
| 3 剧本圣经 | `bible.ts` | 是 | `ChapterAnalysis[]` → 统一人物/地点/主线 |
| 4 分场生成 | `generate.ts` | 是 | 分析 + 圣经 + 参数 → `Screenplay` YAML |
| 5 校验 | `validate/*` | 否 | YAML → `ValidationResult` |
| 6 结构修复 | `repair.ts` | 是 | YAML + errors → 修复后 YAML |

编排策略：

- 阶段 2 逐章**并发**（`Promise.all`），缩短长文本耗时。
- 阶段 4 完成后**立即**走阶段 5；若不通过，自动进入阶段 6，最多重试 N 次（默认 2），仍失败则把最后一次结果与错误一并返回前端，由人工编辑兜底。
- 修复 prompt 严格约束：只返回 YAML、不新增无依据剧情、保留既有人物/地点/场景、只修字段缺失/错误引用/枚举/缩进。
- 前端主生成路径调用 `/api/screenplay/generate/stream`，以 NDJSON 事件返回 `status`、`yaml_delta`、`yaml_snapshot`、`validation` 和 `done`。旧 `/api/screenplay/generate` JSON 契约保留，供兼容和非流式调用使用。
- 模型返回 YAML 可解析时，后端会在校验前做窄范围规范化：缺失 `project.language` 时补为 `zh-CN`，缺失 `project.source_type` 时补为 `novel`，缺失 `project.adaptation_type` 时补为当前请求类型。

### 6.4 校验器（系统事实标准）

两层，职责分离：

```ts
// validate/structural.ts — JSON Schema（ajv）
export function validateStructure(obj: unknown): ValidationError[];

// validate/reference.ts — 应用层跨字段语义
export function validateReferences(s: Screenplay): { errors: ValidationError[]; warnings: ValidationError[] };
```

应用层校验覆盖 JSON Schema 表达不了的规则：

1. **引用完整性**：`scene.source_chapters` / `location_id` / `characters` / `beat.speaker` / `relationships.target` 必须指向已定义 id。
2. **条件必填**：`beat.type ∈ {dialogue, inner_voice}` 时 `speaker` 必填且存在。
3. **ID 唯一**：`characters`/`locations`/`scenes` 内 id 不重复（预览排序依赖）。
4. **章节覆盖**（warning）：每个 `source.chapters[].id` 至少被一个场景引用，否则提示该章未生成场景。

统一入口：

```ts
export function validateScreenplay(yamlText: string): ValidationResult {
  let obj: unknown;
  try { obj = yaml.load(yamlText); }
  catch (e) { return { valid: false, errors: [{ path: '(root)', message: `YAML 解析失败: ${e.message}` }] }; }

  const structural = validateStructure(obj);
  if (structural.length) return { valid: false, errors: structural };

  const { errors, warnings } = validateReferences(obj as Screenplay);
  return { valid: errors.length === 0, errors, warnings };
}
```

> 设计原因：先结构后语义。结构不过就没必要做引用校验（对象形状都不对，引用检查会误报）。

### 6.5 导出

- `.yaml`：`js-yaml.dump(screenplay)`，稳定缩进。
- `.md`：复用前端同一套渲染逻辑（抽到 `packages/shared` 以便前后端共用），把 beats 渲染成可读剧本文本。

---

## 7. API 契约

所有接口 `Content-Type: application/json`。错误统一返回 `{ error: { code, message } }`。

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| POST | `/api/chapters/split` | 文本 → 章节数组（本地） |
| POST | `/api/chapters/analyze` | 章节 → 逐章分析（AI） |
| POST | `/api/screenplay/generate` | 章节+分析+参数 → 剧本 YAML + 校验 |
| POST | `/api/yaml/validate` | YAML → 校验结果 |
| POST | `/api/yaml/repair` | YAML+errors → 修复后 YAML + 校验 |
| POST | `/api/export` | YAML + format → 导出内容 |

### 7.1 `/api/chapters/split`

请求 `{ "text": "第一章..." }`

响应 `200`：

```json
{ "chapters": [{ "id": "chapter_001", "title": "第一章 雨夜归来", "order": 1, "content": "...", "word_count": 2600 }] }
```

章节数量不作为错误条件；1 章、2 章和更多章节都返回 `200`。

### 7.2 `/api/screenplay/generate`

请求：

```json
{ "chapters": [], "analyses": [], "adaptation_type": "screenplay", "adaptation_intensity": "balanced" }
```

响应：

```json
{ "yaml": "schema_version: \"1.0\"...", "validation": { "valid": true, "errors": [], "warnings": [] } }
```

> `adaptation_intensity` 为可选；时间紧时可不传，默认 `balanced`（见 design.md 可裁剪项）。

### 7.3 `/api/yaml/validate` / `/api/yaml/repair`

`validate` 请求 `{ "yaml": "..." }`，响应 `ValidationResult`。

`repair` 请求 `{ "yaml": "...", "errors": [...] }`，响应 `{ "yaml": "...", "validation": {...} }`。

错误码表：

| code | HTTP | 含义 |
| --- | --- | --- |
| `YAML_PARSE_ERROR` | 200* | YAML 无法解析（作为校验结果返回，非 HTTP 错误） |
| `LLM_UNAVAILABLE` | 502 | Provider 调用失败（前端可提示切 mock） |
| `BAD_REQUEST` | 400 | 入参缺失/格式错 |

\* 解析失败属于业务校验结果，仍走 `200` 返回 `valid:false`，让前端在校验面板统一展示。

---

## 8. 前端模块设计

### 8.1 组件结构（对应六大区域）

```
App
├─ NovelInput        小说输入（粘贴 / 上传 / 选样例）
├─ ChapterConfirm    章节确认（标题/顺序/字数/预览，可手动重切）
├─ GenerateControl   改编类型 + 强度 + 生成按钮
├─ YamlEditor        CodeMirror，editable，改完触发校验
├─ ValidationPanel   错误/警告列表，点击可跳转编辑器对应行
└─ ScreenplayPreview YAML → 可读剧本渲染
```

### 8.2 状态管理

用轻量状态（Zustand 或 Context + useReducer 均可），单一 store：

```ts
interface AppState {
  rawText: string;
  chapters: Chapter[];
  analyses: ChapterAnalysis[];
  yamlText: string;          // 编辑器内容（事实来源）
  validation: ValidationResult | null;
  status: 'idle' | 'splitting' | 'analyzing' | 'generating' | 'repairing';
}
```

关键约定：**`yamlText` 是前端唯一事实来源**。编辑器改动 → 防抖 300ms → 调 `/yaml/validate` → 更新 `validation` → 校验通过则刷新预览。预览永远从 `yamlText` 渲染，不维护第二份结构化副本，避免双源不一致。

### 8.3 预览渲染（render/）

按 beat 类型映射样式（抽到 `packages/shared` 与导出 `.md` 共用）：

| beat.type | 渲染 |
| --- | --- |
| `action` | 普通动作段落 |
| `dialogue` | `角色名：` 换行 + 对白 |
| `narration` | 旁白（斜体/前缀“旁白：”） |
| `transition` | 居中转场（如“切至”） |
| `inner_voice` | 内心独白（前缀“（内心）”） |

场景头部渲染场号、标题、地点（由 `location_id` 反查 `locations[].name`）、时间、人物。

---

## 9. Prompt 工程

每个 AI 阶段一个独立模板，放在 `prompts/`，强约束输出格式。

通用原则：

- system 里声明角色与硬规则（“只返回 X，不要任何解释/Markdown 代码围栏”）。
- 在生成与修复阶段，把 `yaml-schema.md` 的**精简版**（字段+枚举+必填+引用规则）嵌入 prompt，让模型对齐契约。
- 分析阶段产出 JSON（便于程序消费），生成/修复阶段产出 YAML（最终格式）。
- 修复阶段额外注入校验器返回的 `errors`，并强约束“只修结构、不改剧情、保留既有对象”。

`generate` 阶段输入装配（不喂全文，控制上下文）：

```
system: 你是剧本改编助手，只输出符合 Schema 的 YAML...
user:
  [剧本圣经]: 统一人物表/地点表/主题/主线
  [章节分析]: 各章 summary/characters/locations/events/conflicts
  [改编参数]: type=screenplay, intensity=balanced
  [Schema 摘要]: 字段、枚举、必填、引用规则
  要求: 仅输出 YAML，scenes 必须覆盖所有 source_chapters。
```

---

## 10. 错误处理与可观测性

- 每个 AI 调用包 try/catch，失败抛 `LLM_UNAVAILABLE`，前端提示“可切换 mock 继续”。
- 生成失败不只回 “生成失败”，而是回**具体阶段 + 原因**（哪一阶段、解析失败还是校验失败、错误路径）。
- 后端按阶段打点日志（阶段名、耗时、token 估算、是否走修复），便于 demo 后复盘与答辩举证。
- 修复重试有上限，超限不死循环，降级为“返回当前最佳结果 + 错误列表，交人工编辑”。

---

## 11. 配置与环境变量

`.env`（后端）：

```
LLM_PROVIDER=mock            # mock | openai
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
REPAIR_MAX_RETRY=2
PORT=8787
```

> 默认 `LLM_PROVIDER=mock`：克隆仓库后**零配置即可跑通整条链路**，评委/队友上手无障碍；接真模型只需改一行。

---

## 12. 本地运行与构建

```bash
pnpm install

# 开发（前后端并行）
pnpm --filter server dev      # http://localhost:8787
pnpm --filter web dev         # http://localhost:5173（代理 /api → 8787）

# 测试
pnpm test

# 生产构建
pnpm --filter web build
pnpm --filter server build
```

> 前端 Vite 配置 `/api` 代理到后端端口，避免 CORS 与跨域配置开销。

---

## 13. 测试策略

按“校验器优先”原则，测试投入集中在确定性最强、收益最高的部分。

| 层 | 用例 | 工具 |
| --- | --- | --- |
| 切章 | 中文章节 / Chapter / Markdown / 自定义分隔；2 章放行 | vitest |
| 结构校验 | 缺 `schema_version`、缺 `title`、`beat.type` 越界、枚举错 | vitest |
| 引用校验 | speaker/location_id/source_chapters 悬空；条件必填缺 speaker；id 重复 | vitest |
| 覆盖警告 | 存在未被引用的章节 → warning | vitest |
| 预览渲染 | 五类 beat 各渲染正确 | vitest |
| Provider | Mock 返回可被校验通过的 YAML | vitest |
| E2E（手动） | 样例 → 生成 → 改坏 → 报错 → 修复 → 导出 | 验收记录 |

校验器与切章是纯函数，**优先写单测**——它们是系统正确性的地基，也是 demo“故意改坏再修复”桥段的保证。

---

## 14. 安全与边界

- 仅接受 `.txt` / `.md` 文本，限制上传体积（如 ≤ 2MB）。
- LLM key 只存后端 `.env`，绝不下发前端。
- 所有 AI 输出落地前必经本地解析与校验，不直接信任模型字符串。
- MVP 不引入数据库/账号，状态存浏览器 + LocalStorage（见 design.md §7.3）。

---

## 15. 文档对应关系

| 关注点 | 看哪份 |
| --- | --- |
| 产品形态、排期、评审对齐 | `design.md` |
| YAML 字段语义与设计原因 | `yaml-schema.md` |
| 代码组织、模块接口、API、运行 | 本文 |

三者通过两处契约硬绑定，改动需同步：

1. **数据契约**：`packages/shared`（TS 类型 + JSON Schema）⇄ `yaml-schema.md`。
2. **流程契约**：`pipeline/` 六阶段 ⇄ `design.md` §6。
