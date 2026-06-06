# Handoff

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

`P0-E2E-001`、`P0-INFRA-002`、`P1-VALIDATE-001` 与 `P1-VALIDATE-002` 已正式验收，并在 `feature_list.json` 标记为 `passes:true`。

当前已证明：Web app 可以通过后端 `POST /api/screenplay/generate` 调用默认 `MockProvider`，读取 `examples/screenplay-sample.yaml`，并在页面展示包含 `schema_version`、`project`、`source`、`characters`、`locations`、`scenes` 的 YAML。

当前也已证明：仓库开发 harness 可重复运行，`pnpm install`、`pnpm verify`、`pnpm test:ui`、`node scripts/read-dev-logs.js` 和 `pnpm logs` 均通过；server 结构化日志已有 Vitest 单测和真实 dev 请求日志证据。

当前还已证明：`POST /api/yaml/validate` 会解析 YAML，并用 AJV 按 `docs/yaml-schema.md` v1.0 的结构契约校验必填字段、枚举、数组结构和 `source.chapters` 至少 3 章；结构通过后会继续执行应用层 reference validation，覆盖引用完整性、条件 speaker、ID 唯一和章节覆盖 warning。`POST /api/screenplay/generate` 现在也会返回 mock YAML 的完整校验结果。

工作流已更新：generator 每轮只做简单验证；收尾前调用 evaluator 子代理，由 evaluator 使用 Chrome DevTools MCP 做真实交互验证，并截屏进行视觉检查。涉及用户路径的 feature 只有 evaluator QA 放行后才能置 `passes:true`。

## 已搭好的地基

- 根 `AGENTS.md`：项目地图、开工阅读顺序、完成标准。
- `docs/` 补全：开发流程、质量说明、决策记录、交接、排障、contract/QA 模板。
- `feature_list.json`：Phase 0-5 结构化进度表，当前 `P0-E2E-001`、`P0-INFRA-002`、`P1-VALIDATE-001`、`P1-VALIDATE-002` 为 `passes:true`。
- pnpm workspace：`packages/shared`、`apps/server`、`apps/web`。
- MockProvider：默认读取 `examples/screenplay-sample.yaml`。
- Playwright smoke：打开首页、点击 mock 生成按钮，并断言六个必需顶层 YAML 字段显示在页面上。
- 结构化日志：server 输出 JSON 行，并提供 `scripts/read-dev-logs.js`。
- `apps/server/src/validate/structural.ts`：AJV structural validation，使用 shared JSON Schema，并在结构通过后串联应用层校验。
- `apps/server/src/validate/reference.ts`：应用层 reference validation，覆盖引用、条件 speaker、ID 唯一和章节覆盖 warning。
- `apps/server/src/routes/yaml.ts`：`POST /api/yaml/validate` 真实结构 + 应用层校验路由。
- `apps/server/tests/logger.test.ts`：断言 `logEvent` 输出可解析 JSON 行，包含时间戳、级别、事件名和请求字段。
- `apps/server/tests/yaml-validate-route.test.ts`：覆盖有效 fixture、缺字段、枚举错误、最小章节数、引用错误、条件 speaker、重复 ID 和章节覆盖 warning。
- `docs/contracts/P0-E2E-001.md`：mock E2E contract。
- `docs/qa/P0-E2E-001.md`：mock E2E QA PASS 证据。
- `docs/contracts/P0-INFRA-002.md`：开发 harness contract。
- `docs/qa/P0-INFRA-002.md`：开发 harness QA PASS 证据。
- `docs/contracts/P1-VALIDATE-001.md`：AJV structural validation contract。
- `docs/qa/P1-VALIDATE-001.md`：AJV structural validation QA PASS 证据。
- `docs/contracts/P1-VALIDATE-002.md`：Application-layer validation contract。
- `docs/qa/P1-VALIDATE-002.md`：Application-layer validation QA PASS 证据。

## 下一个 coding agent 从哪里开始

建议从 `P2-LLM-001` 或 `P3-PIPELINE-001` 开始。`P2-LLM-001` 的起点是 provider 生成结果接入当前完整校验入口；`P3-PIPELINE-001` 的起点是 chapter split 路由与少于 3 章的 422 拦截。

## 已知风险

- 当前 OpenAIProvider 是占位，真实 LLM 接入必须等 Phase 2。
- `validation.valid` 现在代表结构校验和应用层 hard errors 都通过；章节覆盖提示属于 `warnings`，不阻断 `valid:true`。
- 本轮验证依赖 pnpm 可用；Windows PATH 如异常，先按 `docs/runbooks/debug.md` 排查。

## 验证记录

- `C:\nvm4w\nodejs\pnpm.cmd verify`：通过。覆盖 typecheck、lint、Vitest、build；server Vitest 解析 mock YAML，断言六个必需顶层字段，并覆盖 `/api/yaml/validate` 的结构校验和应用层校验错误路径。
- `C:\nvm4w\nodejs\pnpm.cmd --filter @story2script/server test`：本轮通过，server 3 个 test files、13 个 tests。
- `pnpm test:ui`：上一轮通过。Playwright Chromium smoke 1 passed，真实浏览器打开首页、点击“用样例生成”，并通过后端 mock route 显示六个必需顶层 YAML 字段。本轮无前端 UI 改动，未重复运行。
- `powershell.exe -ExecutionPolicy Bypass -File .\init.ps1`：上一轮通过。脚本会 install、verify、安装 Playwright Chromium、跑 UI smoke。本轮未重复运行。
- `node scripts/read-dev-logs.js`：上一轮通过。能读取 `logs/server-dev.jsonl` 中的结构化 JSON 行。
- `pnpm install`：上一轮通过，lockfile up to date；本轮通过 `pnpm add` 添加 server 依赖并更新 lockfile。
- `pnpm logs`：上一轮通过，根脚本别名可读取同一结构化日志入口。

## 重要收尾说明

- `feature_list.json` 当前只有 `P0-E2E-001`、`P0-INFRA-002`、`P1-VALIDATE-001` 与 `P1-VALIDATE-002` 为 `passes:true`，其他 feature 仍为 `false`。
- `P0-E2E-001` 已有 contract/QA 证据，可以作为 Phase 0 mock 端到端基线。
- `P0-INFRA-002` 已有 contract/QA 证据，可以作为仓库开发 harness 基线。
- `P1-VALIDATE-001` 已有 contract/QA 证据，可以作为 Phase 1 结构校验基线。
- `P1-VALIDATE-002` 已有 contract/QA 证据，可以作为 Phase 1 应用层校验基线。
- Playwright 的 webServer 必须从仓库根启动 `pnpm dev`，配置里已经显式设置 `cwd`。
