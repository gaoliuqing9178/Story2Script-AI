# Progress Log

## 2026-06-06 - P2-LLM-001 OpenAI-compatible Single-stage Generation

目标：实现 `feature_list.json` 中的 `P2-LLM-001`，让 OpenAI-compatible provider 可以完成单阶段小说转 YAML 生成，并立即返回现有 validator 的校验结果。

已读取事实来源：

- `docs/design.md`
- `docs/yaml-schema.md`
- `docs/engineering.md`
- `feature_list.json`
- `docs/handoff.md`

本轮创建或修改内容：

- 更新 `apps/server/src/provider/openai.ts`，实现 OpenAI-compatible `/chat/completions` 调用，读取 `OPENAI_API_KEY`、`OPENAI_BASE_URL`、`OPENAI_MODEL`，并从 `choices[0].message.content` 提取 YAML。
- 更新 `apps/server/src/routes/screenplay.ts`，在 `LLM_PROVIDER=openai` 时要求传入小说文本，构造单阶段 novel-to-YAML prompt，provider 返回后立即调用 `validateScreenplayYamlStructure`。
- 更新 `apps/web/src/api/screenplay.ts` 与 `apps/web/src/App.tsx`，让已有小说输入框内容作为 `novel` 传给 generate API；mock 模式继续忽略输入并返回固定 fixture。
- 扩展 `apps/server/tests/screenplay-route.test.ts`，通过真实 Express app 和本地 OpenAI-compatible fake server 覆盖 openai 成功路径、fenced YAML 剥离、即时 validation、坏 YAML 精确错误、缺小说文本、缺 key 和 mock 回归。
- 新增 `apps/web/tests/ui/p2-evaluator.spec.ts`，通过 Playwright 在浏览器中编辑小说输入，拦截 generate API，并断言请求体包含完整 `novel`。
- 新增 `docs/contracts/P2-LLM-001.md` 与 `docs/qa/P2-LLM-001.md`。
- 将 `feature_list.json` 中 `P2-LLM-001.passes` 改为 `true`。

明确未做：

- 未调用真实外部 OpenAI API；本轮不依赖真实 key、余额、限流或网络可用性。
- 未创建或提交 `.env`。
- 未实现 Phase 3 多阶段 pipeline、chapter split、YAML repair。
- 未重做前端 UI 结构或 mock-first 文案。

验证记录：

- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/server test`：通过，server 3 个 test files、17 个 tests 全部通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' typecheck`：通过，shared/server/web 全部通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' lint`：通过，`eslint .` 通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' verify`：通过。
  - `typecheck`：shared/server/web 全部通过。
  - `lint`：`eslint .` 通过。
  - `test`：shared 1 个 Vitest 通过，server 17 个 Vitest 通过，web 无单测且 `--passWithNoTests` 通过。
  - `build`：shared/server `tsc` 通过，web `vite build` 通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui`：通过，Playwright Chromium 2 passed，覆盖 mock backend smoke 与 P2 evaluator 请求体断言。

状态确认：

- `P2-LLM-001` 已具备 contract、QA 报告、真实 Express route 测试、本地 OpenAI-compatible provider 契约验证、mock 回归验证、`pnpm verify` 和 `pnpm test:ui` 证据，可以标记 `passes:true`。
- 当前 `feature_list.json` 中 `P0-E2E-001`、`P0-INFRA-002`、`P1-VALIDATE-001`、`P1-VALIDATE-002`、`P2-LLM-001` 为 `passes:true`，其余 feature 仍保持 `passes:false`。

## 2026-06-06 - P1-VALIDATE-002 Application-layer Validation

目标：实现 `feature_list.json` 中的 `P1-VALIDATE-002`，在 AJV structural validation 通过后补齐应用层引用与一致性校验。

已读取事实来源：

- `docs/design.md`
- `docs/yaml-schema.md`
- `docs/engineering.md`
- `feature_list.json`
- `docs/handoff.md`

本轮创建或修改内容：

- 新增 `apps/server/src/validate/reference.ts`，检查 scene/source/location/character/relationship/speaker 引用、dialogue/inner_voice 条件 speaker、characters/locations/scenes ID 唯一性，以及章节覆盖 warning。
- 更新 `apps/server/src/validate/structural.ts`，保持先结构后语义：结构校验失败时只返回结构错误；结构通过后再运行应用层校验。
- 扩展 `apps/server/tests/yaml-validate-route.test.ts`，通过真实 Express app 覆盖 speaker 引用错误、缺 speaker、重复 ID、章节覆盖 warning，以及 location/source/relationship 等引用错误。
- 新增 `docs/contracts/P1-VALIDATE-002.md` 与 `docs/qa/P1-VALIDATE-002.md`。
- 将 `feature_list.json` 中 `P1-VALIDATE-002.passes` 改为 `true`。

明确未做：

- 未实现 YAML repair。
- 未实现前端编辑器、校验面板、预览或导出。
- 未修改 `examples/*` demo fixture。
- 未接入真实 LLM Provider。

验证记录：

- `pnpm --filter @story2script/server test`：当前 shell 找不到 `pnpm`，改用本机路径 `C:\nvm4w\nodejs\pnpm.cmd --filter @story2script/server test` 后通过，server 3 个 test files、13 个 tests 全部通过。
- `C:\nvm4w\nodejs\pnpm.cmd verify`：通过。
  - `typecheck`：shared/server/web 全部通过。
  - `lint`：`eslint .` 通过。
  - `test`：shared 1 个 Vitest 通过，server 13 个 Vitest 通过，web 无单测且 `--passWithNoTests` 通过。
  - `build`：shared/server `tsc` 通过，web `vite build` 通过。

状态确认：

- `P1-VALIDATE-002` 已具备 contract、QA 报告、API route 测试、`pnpm verify` 证据和 truth-file 同步，可以标记 `passes:true`。
- 当前 `feature_list.json` 中 `P0-E2E-001`、`P0-INFRA-002`、`P1-VALIDATE-001`、`P1-VALIDATE-002` 为 `passes:true`，其余 feature 仍保持 `passes:false`。

## 2026-06-05 - P1-VALIDATE-001 AJV Structural Validation

目标：实现 `docs/yaml-schema.md` v1.0 的 AJV 结构校验，让 `POST /api/yaml/validate` 能真实校验必填字段、枚举、数组结构和最小章节数。

已读取事实来源：

- `docs/design.md`
- `docs/yaml-schema.md`
- `docs/engineering.md`
- `feature_list.json`
- `docs/handoff.md`

本轮创建或修改内容：

- 新增 `apps/server/src/validate/structural.ts`，使用 AJV 2020 校验 `packages/shared/src/schema.ts` 的 screenplay JSON Schema。
- 新增 `apps/server/src/routes/yaml.ts`，实现 `POST /api/yaml/validate`，并保留 `/api/yaml/repair` 的 Phase 3 占位。
- 更新 `apps/server/src/routes/index.ts`，挂载 `yamlRouter`。
- 更新 `apps/server/src/routes/screenplay.ts`，让 mock generate 返回真实结构校验结果，不再返回 Phase 1 未实现占位 warning。
- 新增 `apps/server/tests/yaml-validate-route.test.ts`，通过真实 Express app 覆盖 valid fixture、缺 `schema_version`、缺 `project.title`、非法 beat enum、少于 3 章和缺失 YAML 字符串入参。
- 更新 `apps/server/tests/screenplay-route.test.ts`，断言 mock fixture 的结构校验结果为 `valid:true`。
- 为 server 添加 `ajv` 与 `@story2script/shared` workspace 依赖，并调整 TS 配置，使 server 能按工程文档使用 shared 契约。
- 新增 `docs/contracts/P1-VALIDATE-001.md` 与 `docs/qa/P1-VALIDATE-001.md`。
- 将 `feature_list.json` 中 `P1-VALIDATE-001.passes` 改为 `true`。

明确未做：

- 未实现应用层引用校验、条件 speaker、ID 唯一或章节覆盖 warning，这些属于 `P1-VALIDATE-002`。
- 未实现 YAML repair、前端编辑器、校验面板、预览或导出。
- 未接入真实 OpenAI Provider。

验证记录：

- `pnpm --filter @story2script/server test`：通过，server 3 个 test files、8 个 tests 全部通过。
- `pnpm build`：通过，shared/server/web 全部 build 通过。
- `pnpm verify`：通过。
  - `typecheck`：`packages/shared`、`apps/server`、`apps/web` 全部通过。
  - `lint`：`eslint .` 通过。
  - `test`：shared 1 个 Vitest 通过；server 8 个 Vitest 通过；web 无单测且 `--passWithNoTests` 通过。
  - `build`：shared/server `tsc` 通过；web `vite build` 通过。

状态确认：

- `P1-VALIDATE-001` 已具备 contract、QA 报告、API route 测试、结构错误路径断言和 `pnpm verify` 证据，可以标记 `passes:true`。
- 当前 `feature_list.json` 中 `P0-E2E-001`、`P0-INFRA-002`、`P1-VALIDATE-001` 为 `passes:true`，其余 feature 仍保持 `passes:false`。

下一步：

- 继续推进 `P1-VALIDATE-002`，在结构校验通过后补应用层引用与一致性校验。

## 2026-06-05 - P0-INFRA-002 Development Harness Verification

目标：正式验收仓库开发 harness，让 repository scripts、TypeScript、ESLint、Vitest、Playwright 和结构化日志形成可重复的本地验证闭环。

已读取事实来源：

- `docs/design.md`
- `docs/yaml-schema.md`
- `docs/engineering.md`
- `feature_list.json`
- `docs/handoff.md`

本轮创建或修改内容：

- 新增 `docs/contracts/P0-INFRA-002.md`，明确本轮只验收 infra harness，不扩展业务功能。
- 新增 `docs/qa/P0-INFRA-002.md`，记录 install、verify、UI smoke 与日志读取证据。
- 新增 `apps/server/tests/logger.test.ts`，断言 `logEvent` 输出可解析 JSON 行，并包含 `ts`、`level`、`event`、HTTP 字段和耗时字段。
- 将 `feature_list.json` 中 `P0-INFRA-002.passes` 改为 `true`。

明确未做：

- 未实现 Phase 1 的真实 YAML 校验器。
- 未接入真实 OpenAI Provider。
- 未实现切章、多阶段流水线、编辑器、预览、导出或修复链路。

验证记录：

- `pnpm install`：通过，lockfile up to date，依赖无需变更。
- `pnpm verify`：通过。
  - `typecheck`：`apps/server`、`apps/web`、`packages/shared` 全部通过。
  - `lint`：`eslint .` 通过。
  - `test`：shared 1 个 Vitest 通过；server 2 个 Vitest 通过，覆盖 mock API route 与结构化日志 JSON 行；web 无单测且 `--passWithNoTests` 通过。
  - `build`：shared/server `tsc` 通过；web `vite build` 通过。
- `pnpm test:ui`：通过，Playwright Chromium 1 个 smoke 测试通过，真实浏览器打开首页、点击“用样例生成”，并断言 YAML 输出区包含六个必需顶层字段。
- `node scripts/read-dev-logs.js`：通过，可读取 `logs/server-dev.jsonl` 中的结构化 JSON 行，包括 `screenplay.generate.mock`、`http.request`。
- `pnpm logs`：通过，根脚本别名正确调用日志读取入口。

状态确认：

- `P0-INFRA-002` 已具备 contract、QA 报告、自动化测试、浏览器路径验证、结构化日志证据和 truth-file 同步，可以标记 `passes:true`。
- 当前 `feature_list.json` 中 `P0-E2E-001` 与 `P0-INFRA-002` 为 `passes:true`，其余 feature 仍保持 `passes:false`。
- Phase 1 校验器仍未实现，当前 API 的 `validation` 字段只代表响应形状，不代表真实校验能力。

下一步：

- 按 `feature_list.json` 继续推进 `P1-VALIDATE-001`，实现 AJV structural validation，并用坏 YAML 验证精确错误路径。

## 2026-06-05 - P0-E2E-001 Mock E2E Verification

目标：正式验收 Phase 0 mock 端到端链路，让 `MockProvider` 返回写死的合法剧本 YAML，并由 Web app 通过后端 API 展示。

已读取事实来源：

- `docs/design.md`
- `docs/yaml-schema.md`
- `docs/engineering.md`
- `feature_list.json`
- `docs/handoff.md`

本轮创建或修改内容：

- 新增 `docs/contracts/P0-E2E-001.md`，明确本轮只验收 mock fixture 经 `/api/screenplay/generate` 到前端展示。
- 新增 `docs/qa/P0-E2E-001.md`，记录复现路径、评分和 PASS 结论。
- 加强 `apps/server/tests/screenplay-route.test.ts`：真实 Express app 调用 API，解析 YAML，并断言 `schema_version`、`project`、`source`、`characters`、`locations`、`scenes` 六个顶层字段及关键数组。
- 加强 `apps/web/tests/ui/smoke.spec.ts`：Playwright 点击“用样例生成”后断言页面显示六个顶层字段。
- 更新 `apps/server/src/routes/screenplay.ts` 中 Phase 1 前 mock validation warning 的文案，避免与本轮已验收状态冲突。
- 将 `feature_list.json` 中 `P0-E2E-001.passes` 改为 `true`。

明确未做：

- 未实现 Phase 1 的真实 YAML 校验器。
- 未接入真实 OpenAI Provider。
- 未实现切章、编辑器、预览、导出或修复链路。

验证记录：

- `pnpm verify`：通过。
  - `typecheck`：`apps/server`、`apps/web`、`packages/shared` 全部通过。
  - `lint`：`eslint .` 通过。
  - `test`：shared 1 个 Vitest 通过；server 1 个 Vitest 通过，覆盖 mock YAML API 返回和 YAML 顶层契约；web 无单测且 `--passWithNoTests` 通过。
  - `build`：shared/server `tsc` 通过；web `vite build` 通过。
- `pnpm test:ui`：通过，Playwright Chromium 1 个 smoke 测试通过，真实浏览器打开首页、点击“用样例生成”，并断言 YAML 输出区包含六个必需顶层字段。

状态确认：

- `P0-E2E-001` 已具备 contract、QA 报告、API 测试、浏览器路径验证和 truth-file 同步，可以标记 `passes:true`。
- 其他 feature 仍保持 `passes:false`。
- Phase 1 校验器仍未实现，当前 API 的 `validation` 字段只代表响应形状，不代表真实校验能力。

下一步：

- 按 `feature_list.json` 继续推进 `P0-INFRA-002`，把 repository scripts、TypeScript、ESLint、Vitest、Playwright 和结构化日志作为独立工程 harness 项验收。

## 2026-06-05 - Initializer Harness

目标：只搭建 harness 基础设施，不实现业务功能。

已读取事实来源：

- `docs/design.md`
- `docs/yaml-schema.md`
- `docs/engineering.md`

本轮创建内容：

- 根 `AGENTS.md` 项目地图。
- `docs/dev-workflow.md`、`docs/quality.md`、`docs/decision-log.md`、`docs/handoff.md`。
- `docs/runbooks/debug.md`、`docs/contracts/template.md`、`docs/qa/template.md`。
- `feature_list.json` 作为真实进度表，Phase 0-5 全部 `passes:false`。
- pnpm workspace、shared/server/web walking skeleton。
- init 脚本、ESLint/TypeScript/Playwright/日志读取入口。

为什么这样做：

- 与 `engineering.md` 的 pnpm monorepo、Provider 层、shared 契约保持一致。
- 与 `design.md` Phase 0-5 的端到端优先计划保持一致。
- 与 `yaml-schema.md` 的 v1.0 数据结构保持一致。

验证记录：

- `pnpm install`：通过，lockfile up to date / dependencies installed with pnpm v9.15.9。
- `pnpm verify`：通过。
  - `typecheck`：`apps/server`、`apps/web`、`packages/shared` 全部通过。
  - `lint`：`eslint .` 通过。
  - `test`：shared 1 个 Vitest 通过；server 1 个 Vitest 通过；web 无单测且 `--passWithNoTests` 通过。
  - `build`：shared/server `tsc` 通过；web `vite build` 通过，输出 `dist/index.html` 和 assets。
- `pnpm test:ui`：通过，Playwright Chromium 1 个 smoke 测试通过，真实路径为打开首页、点击“用样例生成”、断言 YAML 包含 `schema_version: "1.0"` 与 `scenes:`。
- `powershell.exe -ExecutionPolicy Bypass -File .\init.ps1`：通过，依次完成 install、verify、Playwright Chromium install、UI smoke。
- `pnpm exec node scripts/read-dev-logs.js`：通过，可读取后端 JSON 行日志，包括 `server.started`、`screenplay.generate.mock`、`http.request`。

状态确认：

- `AGENTS.md` 当前 48 行，满足 ≤120 行。
- `feature_list.json` 当前没有任何 `passes:true`，符合本轮“不实现业务功能”的要求。
- `OpenAIProvider` 仍为占位，真实 LLM 接入留给 Phase 2。

下一步：

- 第一个 coding agent 从 `P0-E2E-001` 开始，为 mock 端到端骨架补 contract 和 QA 证据，再决定是否置 `passes:true`。

## 2026-06-05 - Workflow Update

目标：更新每轮 generator / evaluator 验证分工。

变更：

- `AGENTS.md`：完成标准改为 generator 简单验证 + evaluator 子代理 Chrome DevTools MCP 真实交互和截图视觉检查。
- `docs/dev-workflow.md`：补充 generator / evaluator 分工和提交流程。
- `docs/contracts/template.md`：区分 generator 简单验证与 evaluator 真实交互验证。
- `docs/qa/template.md`：加入 Chrome DevTools MCP、viewport、截图和视觉检查表。
- `docs/decision-log.md`：记录该工作流决策。
- `docs/quality.md`、`docs/handoff.md`：同步最终放行依据。

验证记录：

- `AGENTS.md` 行数检查：48 行，仍满足 ≤120 行。
- `pnpm lint`：通过。
- evaluator 子代理：PASS。
  - 使用 Chrome DevTools MCP 打开 `http://127.0.0.1:5173`。
  - 点击“用样例生成”后，YAML 输出包含 `schema_version` 与 `scenes:`。
  - 已执行 full-page screenshot 视觉检查。
  - 页面非空白，主要内容可见，无明显错位、遮挡、按钮截断或文字溢出。
  - 发现非阻断项：`GET /favicon.ico [404]`，可后续小修。
- `git status --short`：仅包含本轮 workflow 文档变更。
