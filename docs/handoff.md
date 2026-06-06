# Handoff

## 2026-06-06 Update - P3-PIPELINE-001

`P3-PIPELINE-001` 已正式验收，并在 `feature_list.json` 标记为 `passes:true`。

本轮已实现：

- `apps/server/src/pipeline/split.ts`：本地章节切分纯函数，不调用 LLM。
- `apps/server/src/routes/chapters.ts`：`POST /api/chapters/split` 真实路由。
- `apps/server/src/routes/index.ts`：挂载 `chaptersRouter`。
- `apps/server/tests/chapter-split-route.test.ts`：真实 Express app route tests，覆盖 7 个用例。
- `docs/contracts/P3-PIPELINE-001.md`：本轮 contract。
- `docs/qa/P3-PIPELINE-001.md`：Chrome DevTools MCP evaluator QA 报告。

当前 `/api/chapters/split` 语义：

- 请求体必须提供非空字符串 `text`，否则返回 `400 BAD_REQUEST`。
- 支持中文章节标题：如 `第一章 雨夜归来`、`第 1 章 雨夜归来`。
- 支持英文 `Chapter` 标题：如 `Chapter 1 The Return`。
- 支持 Markdown 标题中的章节标题：如 `# 第一章 雨夜归来`、`## Chapter 2 The Letter`。
- 支持 `---chapter---` 分隔符：
  - 每章前置分隔符可以识别。
  - 章节之间分隔符也可以识别。
- 返回 `Chapter[]`：`id`、`title`、`order`、`content`、`word_count`。
- 有效章节少于 3 个时返回 `422 TOO_FEW_CHAPTERS`，message 形如 `至少需要 3 个章节，当前识别到 2 个`。

验证记录：

- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/server test`：通过，server 4 files / 24 tests。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' typecheck`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' lint`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' verify`：通过，覆盖 typecheck、lint、test、build。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui`：通过，Playwright Chromium 2 passed。
- evaluator 子代理 `019e9bd0-8a5b-7a30-ab2c-e05c21b089b9`：PASS。
  - 使用 Chrome DevTools MCP 打开真实页面并截图。
  - 在浏览器上下文里用 `fetch('/api/chapters/split')` 验证中文、英文、Markdown、`---chapter---`、少于 3 章 422。
  - 补充复核 `---chapter---` 只放在章节之间的边界，结果 PASS。

下一轮建议：

- 若继续 Phase 3，优先做 `P3-PIPELINE-002`：复用 `splitChapters` 作为第 1 阶段，继续实现 analyze -> bible -> generate -> validate -> bounded repair。
- 若优先补用户错误提示，可做 `P5-POLISH-001`：把 `TOO_FEW_CHAPTERS` 的友好提示接到前端 UI；不要把它混进 `P3-PIPELINE-001` 回改。
- 不要回退 `P3-PIPELINE-001.passes`，除非发现上述真实验证路径失败。

## 2026-06-06 Update - P2-LLM-001

`P2-LLM-001` 已正式验收，并在 `feature_list.json` 标记为 `passes:true`。

本轮已实现：

- `apps/server/src/provider/openai.ts`：OpenAI-compatible `/chat/completions` provider，读取 `OPENAI_API_KEY`、`OPENAI_BASE_URL`、`OPENAI_MODEL`。
- `apps/server/src/routes/screenplay.ts`：openai 模式下接收小说文本，构造单阶段 novel-to-YAML prompt，provider 返回后立即执行现有 YAML validator。
- `apps/web/src/api/screenplay.ts` 与 `apps/web/src/App.tsx`：已有小说输入文本会作为 `novel` 传给 generate API；mock 路径仍保持稳定。
- `apps/server/tests/screenplay-route.test.ts`：真实 Express route + 本地 OpenAI-compatible fake server 覆盖成功、坏 YAML validation、缺小说文本、缺 key、mock 回归。
- `apps/web/tests/ui/p2-evaluator.spec.ts`：Playwright evaluator 覆盖浏览器编辑小说输入后，请求体带完整 `novel` 的路径。
- `docs/contracts/P2-LLM-001.md` 与 `docs/qa/P2-LLM-001.md`：本轮 contract 与 QA 证据。
- 子代理 evaluator `019e9bc2-4016-73c3-954d-062cd3a0b435` 已独立复核 `test:ui`、server test、`verify`，结论 PASS，详情见 `docs/qa/P2-LLM-001.md`。

当前 `/api/screenplay/generate` 的语义：

- 默认 `LLM_PROVIDER=mock`：继续读取 `examples/screenplay-sample.yaml`，不需要小说文本，也会返回完整 `validation`。
- `LLM_PROVIDER=openai`：请求体必须提供 `novel`、`novel_text` 或 `text`；缺失时返回 `400 BAD_REQUEST`。
- openai provider 成功返回后，route 会剥离可能出现的 YAML code fence，并立即返回 `{ yaml, validation }`。
- provider 配置缺失、请求失败、非 JSON 响应或缺少 message content 时返回 `502 LLM_UNAVAILABLE`。

验证记录：

- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/server test`：通过，server 3 个 test files、17 个 tests。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' verify`：通过，覆盖 typecheck、lint、test、build。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui`：通过，Playwright Chromium 2 passed；子代理 evaluator 独立复跑同样通过。

下一轮建议：

- 继续 Phase 3 时，可从 `P3-PIPELINE-001` 开始做 chapter split 与少于 3 章的 422 拦截。
- 继续 LLM 深化时，可从 `P3-PIPELINE-002` 开始拆多阶段 pipeline 和 bounded repair；不要把 `P2-LLM-001` 的 passes 回退，除非发现真实验证失败。

## 2026-06-06 Update - P1-VALIDATE-002

`P1-VALIDATE-002` 已正式验收，并在 `feature_list.json` 标记为 `passes:true`。

本轮已实现：

- `apps/server/src/validate/reference.ts`：应用层 reference validation。
- `apps/server/src/validate/structural.ts`：结构校验通过后串联应用层校验。
- `apps/server/tests/yaml-validate-route.test.ts`：真实 Express route 覆盖引用错误、条件 speaker、重复 ID、章节覆盖 warning。
- `docs/contracts/P1-VALIDATE-002.md` 与 `docs/qa/P1-VALIDATE-002.md`：本轮 contract 与 QA 证据。

当前 `/api/yaml/validate` 的语义：

- YAML parse 或 AJV structural validation 失败时，不继续跑应用层引用校验。
- 结构通过后，引用错误、缺 speaker、重复 ID 进入 `errors`，并让 `valid:false`。
- 未覆盖章节进入 `warnings`，不阻断 `valid:true`。

验证记录：

- `C:\nvm4w\nodejs\pnpm.cmd --filter @story2script/server test`：通过，server 3 个 test files、13 个 tests。
- `C:\nvm4w\nodejs\pnpm.cmd verify`：通过，覆盖 typecheck、lint、test、build。

下一轮建议：

- 若继续 Phase 1/2，可从 `P2-LLM-001` 开始，把 provider 生成结果接入当前完整校验入口。
- 若优先补 pipeline，可从 `P3-PIPELINE-001` 开始做 chapter split；不要把 `P1-VALIDATE-002` 的 passes 回退，除非发现真实验证失败。

## 当前状态

`P0-E2E-001`、`P0-INFRA-002`、`P1-VALIDATE-001`、`P1-VALIDATE-002` 与 `P2-LLM-001` 已正式验收，并在 `feature_list.json` 标记为 `passes:true`。

当前已证明：Web app 可以通过后端 `POST /api/screenplay/generate` 调用默认 `MockProvider`，读取 `examples/screenplay-sample.yaml`，并在页面展示包含 `schema_version`、`project`、`source`、`characters`、`locations`、`scenes` 的 YAML。

当前也已证明：仓库开发 harness 可重复运行，`pnpm install`、`pnpm verify`、`pnpm test:ui`、`node scripts/read-dev-logs.js` 和 `pnpm logs` 均通过；server 结构化日志已有 Vitest 单测和真实 dev 请求日志证据。

当前还已证明：`POST /api/yaml/validate` 会解析 YAML，并用 AJV 按 `docs/yaml-schema.md` v1.0 的结构契约校验必填字段、枚举、数组结构和 `source.chapters` 至少 3 章；结构通过后会继续执行应用层 reference validation，覆盖引用完整性、条件 speaker、ID 唯一和章节覆盖 warning。`POST /api/screenplay/generate` 现在会在 mock 和 openai 两种 provider 模式下返回 YAML 的完整校验结果。

工作流已更新：generator 每轮只做简单验证；收尾前调用 evaluator 子代理，由 evaluator 使用 Chrome DevTools MCP 做真实交互验证，并截屏进行视觉检查。涉及用户路径的 feature 只有 evaluator QA 放行后才能置 `passes:true`。

## 已搭好的地基

- 根 `AGENTS.md`：项目地图、开工阅读顺序、完成标准。
- `docs/` 补全：开发流程、质量说明、决策记录、交接、排障、contract/QA 模板。
- `feature_list.json`：Phase 0-5 结构化进度表，当前 `P0-E2E-001`、`P0-INFRA-002`、`P1-VALIDATE-001`、`P1-VALIDATE-002`、`P2-LLM-001` 为 `passes:true`。
- pnpm workspace：`packages/shared`、`apps/server`、`apps/web`。
- MockProvider：默认读取 `examples/screenplay-sample.yaml`。
- OpenAIProvider：读取 `OPENAI_API_KEY`、`OPENAI_BASE_URL`、`OPENAI_MODEL`，调用 OpenAI-compatible `/chat/completions`，从 `choices[0].message.content` 提取 YAML。
- Playwright smoke：打开首页、点击 mock 生成按钮，并断言六个必需顶层 YAML 字段显示在页面上。
- 结构化日志：server 输出 JSON 行，并提供 `scripts/read-dev-logs.js`。
- `apps/server/src/validate/structural.ts`：AJV structural validation，使用 shared JSON Schema，并在结构通过后串联应用层校验。
- `apps/server/src/validate/reference.ts`：应用层 reference validation，覆盖引用、条件 speaker、ID 唯一和章节覆盖 warning。
- `apps/server/src/routes/yaml.ts`：`POST /api/yaml/validate` 真实结构 + 应用层校验路由。
- `apps/server/tests/logger.test.ts`：断言 `logEvent` 输出可解析 JSON 行，包含时间戳、级别、事件名和请求字段。
- `apps/server/tests/yaml-validate-route.test.ts`：覆盖有效 fixture、缺字段、枚举错误、最小章节数、引用错误、条件 speaker、重复 ID 和章节覆盖 warning。
- `apps/server/tests/screenplay-route.test.ts`：覆盖 mock generate、openai-compatible generate、fenced YAML 剥离、即时 validation、坏 YAML 精确错误、缺小说文本和缺 key。
- `apps/web/tests/ui/p2-evaluator.spec.ts`：覆盖前端把编辑后的小说全文作为 `novel` 传给 generate API。
- `docs/contracts/P0-E2E-001.md`：mock E2E contract。
- `docs/qa/P0-E2E-001.md`：mock E2E QA PASS 证据。
- `docs/contracts/P0-INFRA-002.md`：开发 harness contract。
- `docs/qa/P0-INFRA-002.md`：开发 harness QA PASS 证据。
- `docs/contracts/P1-VALIDATE-001.md`：AJV structural validation contract。
- `docs/qa/P1-VALIDATE-001.md`：AJV structural validation QA PASS 证据。
- `docs/contracts/P1-VALIDATE-002.md`：Application-layer validation contract。
- `docs/qa/P1-VALIDATE-002.md`：Application-layer validation QA PASS 证据。
- `docs/contracts/P2-LLM-001.md`：OpenAI-compatible single-stage generation contract。
- `docs/qa/P2-LLM-001.md`：OpenAI-compatible single-stage generation QA PASS 证据。

## 下一个 coding agent 从哪里开始

建议从 `P3-PIPELINE-001` 或 `P3-PIPELINE-002` 开始。`P3-PIPELINE-001` 的起点是 chapter split 路由与少于 3 章的 422 拦截；`P3-PIPELINE-002` 的起点是多阶段 pipeline 与 bounded repair。

## 已知风险

- 当前 OpenAIProvider 已实现，但自动化验收使用本地 OpenAI-compatible fake server，没有调用真实外部 OpenAI API；接真实模型仍需要本地 `.env` 提供 key、base URL 和 model。
- `validation.valid` 现在代表结构校验和应用层 hard errors 都通过；章节覆盖提示属于 `warnings`，不阻断 `valid:true`。
- 本轮验证依赖 pnpm 可用；Windows PATH 如异常，先按 `docs/runbooks/debug.md` 排查。

## 验证记录

- `& 'C:\nvm4w\nodejs\pnpm.cmd' verify`：通过。覆盖 typecheck、lint、Vitest、build；server Vitest 覆盖 mock YAML、`/api/yaml/validate`、openai-compatible provider 成功与错误路径。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/server test`：本轮通过，server 3 个 test files、17 个 tests。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui`：本轮通过。Playwright Chromium 2 passed，真实浏览器覆盖 mock route smoke 与 P2 evaluator 请求体断言。
- `powershell.exe -ExecutionPolicy Bypass -File .\init.ps1`：上一轮通过。脚本会 install、verify、安装 Playwright Chromium、跑 UI smoke。本轮未重复运行。
- `node scripts/read-dev-logs.js`：上一轮通过。能读取 `logs/server-dev.jsonl` 中的结构化 JSON 行。
- `pnpm install`：上一轮通过，lockfile up to date；本轮通过 `pnpm add` 添加 server 依赖并更新 lockfile。
- `pnpm logs`：上一轮通过，根脚本别名可读取同一结构化日志入口。

## 重要收尾说明

- `feature_list.json` 当前只有 `P0-E2E-001`、`P0-INFRA-002`、`P1-VALIDATE-001`、`P1-VALIDATE-002` 与 `P2-LLM-001` 为 `passes:true`，其他 feature 仍为 `false`。
- `P0-E2E-001` 已有 contract/QA 证据，可以作为 Phase 0 mock 端到端基线。
- `P0-INFRA-002` 已有 contract/QA 证据，可以作为仓库开发 harness 基线。
- `P1-VALIDATE-001` 已有 contract/QA 证据，可以作为 Phase 1 结构校验基线。
- `P1-VALIDATE-002` 已有 contract/QA 证据，可以作为 Phase 1 应用层校验基线。
- `P2-LLM-001` 已有 contract/QA 证据，可以作为 Phase 2 OpenAI-compatible provider 基线。
- Playwright 的 webServer 必须从仓库根启动 `pnpm dev`，配置里已经显式设置 `cwd`。
