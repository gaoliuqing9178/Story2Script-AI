# Handoff

## 当前状态

`P0-E2E-001`、`P0-INFRA-002` 与 `P1-VALIDATE-001` 已正式验收，并在 `feature_list.json` 标记为 `passes:true`。

当前已证明：Web app 可以通过后端 `POST /api/screenplay/generate` 调用默认 `MockProvider`，读取 `examples/screenplay-sample.yaml`，并在页面展示包含 `schema_version`、`project`、`source`、`characters`、`locations`、`scenes` 的 YAML。

当前也已证明：仓库开发 harness 可重复运行，`pnpm install`、`pnpm verify`、`pnpm test:ui`、`node scripts/read-dev-logs.js` 和 `pnpm logs` 均通过；server 结构化日志已有 Vitest 单测和真实 dev 请求日志证据。

当前还已证明：`POST /api/yaml/validate` 会解析 YAML，并用 AJV 按 `docs/yaml-schema.md` v1.0 的结构契约校验必填字段、枚举、数组结构和 `source.chapters` 至少 3 章。`POST /api/screenplay/generate` 现在也会返回 mock YAML 的真实结构校验结果。

Phase 1 应用层校验仍未实现，因此引用完整性、条件 speaker、ID 唯一和章节覆盖 warning 仍不代表已验收。

## 已搭好的地基

- 根 `AGENTS.md`：项目地图、开工阅读顺序、完成标准。
- `docs/` 补全：开发流程、质量说明、决策记录、交接、排障、contract/QA 模板。
- `feature_list.json`：Phase 0-5 结构化进度表，当前 `P0-E2E-001`、`P0-INFRA-002`、`P1-VALIDATE-001` 为 `passes:true`。
- pnpm workspace：`packages/shared`、`apps/server`、`apps/web`。
- MockProvider：默认读取 `examples/screenplay-sample.yaml`。
- Playwright smoke：打开首页、点击 mock 生成按钮，并断言六个必需顶层 YAML 字段显示在页面上。
- 结构化日志：server 输出 JSON 行，并提供 `scripts/read-dev-logs.js`。
- `apps/server/src/validate/structural.ts`：AJV structural validation，使用 shared JSON Schema。
- `apps/server/src/routes/yaml.ts`：`POST /api/yaml/validate` 真实结构校验路由。
- `apps/server/tests/logger.test.ts`：断言 `logEvent` 输出可解析 JSON 行，包含时间戳、级别、事件名和请求字段。
- `apps/server/tests/yaml-validate-route.test.ts`：覆盖有效 fixture、缺字段、枚举错误和最小章节数。
- `docs/contracts/P0-E2E-001.md`：mock E2E contract。
- `docs/qa/P0-E2E-001.md`：mock E2E QA PASS 证据。
- `docs/contracts/P0-INFRA-002.md`：开发 harness contract。
- `docs/qa/P0-INFRA-002.md`：开发 harness QA PASS 证据。
- `docs/contracts/P1-VALIDATE-001.md`：AJV structural validation contract。
- `docs/qa/P1-VALIDATE-001.md`：AJV structural validation QA PASS 证据。

## 下一个 coding agent 从哪里开始

建议从 `P1-VALIDATE-002` 开始：Application-layer validation，按 `docs/design.md` 5.7 与 `docs/engineering.md` 6.4 落地引用完整性、条件 speaker、ID 唯一和章节覆盖 warning。

起点是 `apps/server/src/validate/structural.ts` 的结构校验结果。下一轮应在结构校验通过后，再接应用层语义校验；不要把结构错误和引用错误混在同一层里。

## 已知风险

- 当前 OpenAIProvider 是占位，真实 LLM 接入必须等 Phase 2。
- `P1-VALIDATE-002` 未实现，因此当前 `validation.valid` 只代表结构校验通过，不代表引用与一致性校验完整通过。
- 本轮验证依赖 pnpm 可用；Windows PATH 如异常，先按 `docs/runbooks/debug.md` 排查。

## 验证记录

- `pnpm verify`：通过。覆盖 typecheck、lint、Vitest、build；server Vitest 解析 mock YAML，断言六个必需顶层字段，并覆盖 `/api/yaml/validate` 的结构校验错误路径。
- `pnpm test:ui`：上一轮通过。Playwright Chromium smoke 1 passed，真实浏览器打开首页、点击“用样例生成”，并通过后端 mock route 显示六个必需顶层 YAML 字段。本轮无前端 UI 改动，未重复运行。
- `powershell.exe -ExecutionPolicy Bypass -File .\init.ps1`：上一轮通过。脚本会 install、verify、安装 Playwright Chromium、跑 UI smoke。本轮未重复运行。
- `node scripts/read-dev-logs.js`：上一轮通过。能读取 `logs/server-dev.jsonl` 中的结构化 JSON 行。
- `pnpm install`：上一轮通过，lockfile up to date；本轮通过 `pnpm add` 添加 server 依赖并更新 lockfile。
- `pnpm logs`：上一轮通过，根脚本别名可读取同一结构化日志入口。

## 重要收尾说明

- `feature_list.json` 当前只有 `P0-E2E-001`、`P0-INFRA-002` 与 `P1-VALIDATE-001` 为 `passes:true`，其他 feature 仍为 `false`。
- `P0-E2E-001` 已有 contract/QA 证据，可以作为 Phase 0 mock 端到端基线。
- `P0-INFRA-002` 已有 contract/QA 证据，可以作为仓库开发 harness 基线。
- `P1-VALIDATE-001` 已有 contract/QA 证据，可以作为 Phase 1 结构校验基线。
- Playwright 的 webServer 必须从仓库根启动 `pnpm dev`，配置里已经显式设置 `cwd`。
