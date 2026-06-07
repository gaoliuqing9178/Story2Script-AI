# Story2Script AI

Story2Script AI 是一个面向小说作者的 AI 剧本改编 Web 工作台。它把 3 章以上小说文本转换为可编辑、可校验、可预览、可导出的结构化 YAML 剧本初稿，核心目标不是一次性生成一段不可控文本，而是把改编过程拆成可理解、可验证、可继续打磨的工作流。

当前仓库默认使用 `LLM_PROVIDER=mock`，不需要真实模型 key 就可以跑通主流程。真实 LLM 接入通过 OpenAI-compatible provider 支持，但需要你在本地 `.env` 中配置，不要把密钥提交进仓库。

## 当前能力

当前已经正式验收并写入 `feature_list.json` 的能力：

- Mock 端到端链路：Web app 调后端 `POST /api/screenplay/generate`，展示合法剧本 YAML。
- 开发 harness：pnpm workspace、TypeScript、ESLint、Vitest、Playwright、结构化日志与 `verify` 脚本。
- YAML 结构校验：AJV 校验 `docs/yaml-schema.md` v1.0 的必填字段、枚举、数组结构和最小 3 章约束。
- YAML 应用层校验：引用完整性、`dialogue`/`inner_voice` 条件 speaker、ID 唯一、章节覆盖 warning。
- OpenAI-compatible 单阶段生成：`LLM_PROVIDER=openai` 时可调用兼容 `/chat/completions` 的模型服务，并返回即时校验结果。
- 章节切分：支持中文章节、英文 `Chapter`、Markdown 标题和 `---chapter---` 分隔符；少于 3 章返回 `TOO_FEW_CHAPTERS`。
- 多阶段 pipeline：章节分析、剧本圣经、分场生成、本地校验和 bounded repair。
- YAML 编辑器：前端可直接编辑 YAML，350ms 防抖调用 `/api/yaml/validate` 并展示精确错误路径。
- 剧本预览：校验通过后渲染 action、dialogue、narration、transition、inner_voice 五类 beat。
- 前端导出：校验通过后可导出当前 YAML 和 Markdown 剧本稿。
- 输入拦截：生成前会先检查章节数，少于 3 章时给出具体中文提示，并阻止进入生成路径。
- 状态打磨：generation、validation、export 路径都有明确 loading、empty 和 error 状态。
- Demo 路线：`/demo` 预载稳定 YAML，并可一键切换到坏 YAML 演示校验错误。

当前 `feature_list.json` 中列出的 MVP feature 均已有对应实现、自动化覆盖和 QA 记录。真实进度仍以 `feature_list.json` 为准；`progress.md` 和 `docs/handoff.md` 记录最近验证证据与下一步。

## 技术栈

| 层 | 技术 |
| --- | --- |
| Monorepo | pnpm workspace |
| 前端 | React 18、Vite、TypeScript、Tailwind CSS |
| 后端 | Node.js、Express、TypeScript |
| YAML | `js-yaml` |
| 校验 | `ajv`、应用层 reference validation |
| LLM | MockProvider、OpenAI-compatible Chat Completions |
| 测试 | Vitest、Playwright |

## 目录结构

```text
.
├── apps/
│   ├── server/                 # Express API、provider、pipeline、validator
│   └── web/                    # React/Vite Web 工作台
├── packages/
│   └── shared/                 # 前后端共享类型与 JSON Schema
├── examples/
│   ├── novel-sample.md         # 内置小说样例
│   ├── screenplay-sample.yaml  # mock 生成与 demo fallback 剧本 YAML
│   └── screenplay-broken.yaml  # demo 校验用坏 YAML
├── docs/
│   ├── design.md               # 产品目标、Phase 0-5 计划、验收重点
│   ├── yaml-schema.md          # 剧本 YAML 数据契约与设计原因
│   ├── engineering.md          # 技术架构、模块接口、API 设计
│   ├── quality.md              # 质量策略与验证原则
│   ├── dev-workflow.md         # 本地协作与 generator/evaluator 分工
│   ├── handoff.md              # 最近交接、当前状态、下一步建议
│   ├── contracts/              # 每个 feature 的验收契约
│   └── qa/                     # evaluator QA 报告与证据
├── feature_list.json           # 项目进度事实源
├── progress.md                 # 逐轮进展与验证记录
├── init.ps1                    # Windows 初始化与基线验证
├── init.sh                     # POSIX 初始化与基线验证
└── package.json
```

## 快速开始

### 1. 安装依赖

```powershell
pnpm install
```

Windows 上如果 `pnpm` 不在 PATH，优先启用 Corepack：

```powershell
corepack enable
corepack prepare pnpm@9.15.9 --activate
```

这台机器上如果仍有 PATH 问题，可以临时使用本机 pnpm 绝对路径运行命令，但不要把个人路径写进项目脚本。

### 2. 配置环境变量

复制 `.env.example` 到本地 `.env`，默认 mock 模式不需要填 key。

```env
LLM_PROVIDER=mock
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
REPAIR_MAX_RETRY=2
PORT=8787
```

接真实模型时：

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=你的本地密钥
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=你的模型名
```

`.env` 不要提交。自动化验收里的 OpenAI provider 测试使用本地 fake server，不会调用真实外部 API。

### 3. 启动开发服务

```powershell
pnpm dev
```

默认地址：

- Web: `http://127.0.0.1:5173`
- Server: `http://127.0.0.1:8787`
- Demo: `http://127.0.0.1:5173/demo`

Vite 会把前端 `/api` 请求代理到后端 `8787`，前端代码应通过 `apps/web/src/api` 调后端，不要直接 import server 层。

### 4. 跑基线验证

```powershell
pnpm verify
pnpm test:ui
```

也可以直接运行初始化脚本：

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\init.ps1
```

`init.ps1` 会安装依赖、跑 `verify`、安装 Playwright Chromium、跑 UI smoke。需要启动开发服务时可加 `-StartDev`。

## 使用路径

1. 打开 `http://127.0.0.1:5173`。
2. 左侧 `小说输入` 默认带有 3 章样例，也可以粘贴自己的小说文本。
3. 点击 `用样例生成`。
4. 前端先调用 `/api/chapters/split` 检查章节数，少于 3 章会显示友好提示并停止生成。
5. 章节数通过后，调用 `/api/screenplay/generate` 生成 YAML。
6. 右侧 `YAML 编辑器` 显示当前 YAML，可直接修改。
7. 编辑后自动调用 `/api/yaml/validate`，校验面板展示错误、warning 或通过状态。
8. 校验通过时，`剧本预览` 会刷新为可读剧本格式。
9. 校验通过后，可点击 `导出 YAML` 或 `导出 Markdown` 下载当前内容。

## 3 分钟 Demo 路线

演示入口：`http://127.0.0.1:5173/demo`。

`/demo` 会直接加载 `examples/novel-sample.md` 和稳定合法的 `examples/screenplay-sample.yaml`，方便现场先展示可校验、可预览、可导出的完整状态。页面顶部提供三个演示按钮：

- `加载合法 YAML`：恢复到稳定合法 fixture，校验通过后预览和导出可用。
- `加载坏 YAML`：加载 `examples/screenplay-broken.yaml`，展示 `project.title` 的精确校验错误，并暂停预览和导出。
- `还原样例小说`：把左侧小说输入恢复为内置 3 章样例。

建议演示节奏：

1. `00:00-00:40` 打开 `/demo`，展示 3 章小说样例和已预载的合法 YAML。
2. `00:40-01:30` 展示校验通过、剧本预览和 YAML / Markdown 导出按钮。
3. `01:30-02:20` 点击 `加载坏 YAML`，展示校验面板中的 `project.title` 错误、预览暂停和导出禁用。
4. `02:20-03:00` 点击 `加载合法 YAML`，恢复绿灯状态；必要时点击 `用样例生成` 展示 mock 生成链路。

## 常用命令

```powershell
pnpm dev
pnpm typecheck
pnpm lint
pnpm test
pnpm test:ui
pnpm build
pnpm verify
pnpm logs
node scripts/read-dev-logs.js
```

`pnpm verify` 串联 `typecheck`、`lint`、`test`、`build`。`pnpm test:ui` 使用 Playwright 跑真实浏览器脚本化用例。涉及用户路径的正式放行还需要 evaluator 使用 Chrome DevTools MCP 做真实交互、Network 复核和截图视觉检查。

## API 概览

所有 API 都挂在 `/api` 下，使用 JSON 请求和响应。

| 方法 | 路径 | 状态 |
| --- | --- | --- |
| `POST` | `/api/chapters/split` | 已实现。切分小说章节，少于 3 章返回 `422 TOO_FEW_CHAPTERS`。 |
| `POST` | `/api/chapters/analyze` | 已实现。对 `Chapter[]` 做逐章分析，mock/openai provider 均走 provider 层。 |
| `POST` | `/api/screenplay/generate` | 已实现。无 `chapters`/`analyses` 时走单阶段生成；传入后走多阶段 pipeline。 |
| `POST` | `/api/yaml/validate` | 已实现。返回结构校验与应用层校验结果。 |
| `POST` | `/api/yaml/repair` | 已实现。执行 bounded YAML repair，并返回 repair metadata。 |
| `POST` | `/api/export` | 后端占位，当前返回 `501 NOT_IMPLEMENTED`。已验收的导出功能目前在前端完成。 |

示例：章节切分

```http
POST /api/chapters/split
Content-Type: application/json
```

```json
{
  "text": "# 第一章 雨夜归来\n...\n# 第二章 旧信\n...\n# 第三章 巷口的灯\n..."
}
```

示例：YAML 校验

```http
POST /api/yaml/validate
Content-Type: application/json
```

```json
{
  "yaml": "schema_version: \"1.0\"\nproject:\n  title: \"雨夜归来\"\n..."
}
```

## YAML 契约

生成结果必须符合 `docs/yaml-schema.md` 的 v1.0 契约，顶层至少包含：

```yaml
schema_version: "1.0"
project: {}
source:
  chapters: []
characters: []
locations: []
scenes: []
```

校验分两层：

- 结构校验：由 `packages/shared/src/schema.ts` 的 JSON Schema 和 AJV 执行，覆盖必填字段、枚举、数组结构、最小章节数。
- 应用层校验：由 `apps/server/src/validate/reference.ts` 执行，覆盖跨字段引用、条件 speaker、ID 唯一和章节覆盖 warning。

`validation.valid === true` 表示结构校验和 hard errors 都通过；章节覆盖属于 `warnings`，不会阻断 `valid:true`。

## Provider 与真实 LLM

Provider 是后端唯一接触外部模型的边界：

- `MockProvider`：默认 provider，读取或生成固定合法产物，保证离线、断网、无 key 时主流程可跑。
- `OpenAIProvider`：读取 `OPENAI_API_KEY`、`OPENAI_BASE_URL`、`OPENAI_MODEL`，调用 OpenAI-compatible `/chat/completions`，从 `choices[0].message.content` 提取 YAML 或 JSON。

真实模型输出不会被直接信任，落地前必须经过本地 YAML 解析和校验。provider 失败时，后端返回 `502 LLM_UNAVAILABLE`。

## 开发与验收规则

本仓库的状态文件有明确分工：

- `feature_list.json`：项目进度事实源，`passes` 只能在真实验证后改。
- `progress.md`：每轮实现、未做事项、验证命令和结论。
- `docs/handoff.md`：最近交接、当前状态、风险与下一步。
- `docs/contracts/<feature-id>.md`：单个 feature 的验收契约。
- `docs/qa/<feature-id>.md`：evaluator QA 证据。

每轮只推进一个小目标。涉及用户路径时，generator 侧测试通过不等于正式完成；必须由 evaluator 使用 Chrome DevTools MCP 做真实浏览器交互和截图视觉检查，QA 放行后才能把对应 feature 的 `passes` 改为 `true`。

## 文档入口

建议按这个顺序读：

1. `docs/design.md`：产品目标、Phase 0-5 计划、验收重点。
2. `docs/yaml-schema.md`：剧本 YAML 数据契约与设计原因。
3. `docs/engineering.md`：monorepo 结构、模块接口、API、技术栈。
4. `feature_list.json`：当前真实进度。
5. `docs/handoff.md`：最近一轮交接和下一步。

遇到冲突时，不要靠 README 猜状态。以 `feature_list.json`、`progress.md`、`docs/handoff.md` 和对应 contract/QA 证据为准。

## 已知边界

- 当前没有账号、多项目管理、数据库、协作或复杂版本历史。
- 当前没有 Final Draft、PDF、DOCX 或 FDX 导出。
- 当前没有自动分镜、镜头表或图像生成。
- 当前没有完整章节确认 UI、章节排序、章节编辑或手动重切章。
- 当前后端 `/api/export` 未实现；用户可见导出已在前端完成。
- 当前 OpenAIProvider 已实现，但真实外部模型调用需要本地 `.env` 和可用模型服务。
