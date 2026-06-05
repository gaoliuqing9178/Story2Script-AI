# Progress Log

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
