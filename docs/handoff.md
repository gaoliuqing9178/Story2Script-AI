# Handoff

## 当前状态

`P0-E2E-001` 已正式验收并在 `feature_list.json` 标记为 `passes:true`。

当前已证明：Web app 可以通过后端 `POST /api/screenplay/generate` 调用默认 `MockProvider`，读取 `examples/screenplay-sample.yaml`，并在页面展示包含 `schema_version`、`project`、`source`、`characters`、`locations`、`scenes` 的 YAML。

Phase 1 校验器仍未实现，因此 API 返回的 `validation` 字段只保留响应形状，不代表真实 YAML 校验能力。

## 已搭好的地基

- 根 `AGENTS.md`：项目地图、开工阅读顺序、完成标准。
- `docs/` 补全：开发流程、质量说明、决策记录、交接、排障、contract/QA 模板。
- `feature_list.json`：Phase 0-5 结构化进度表，当前仅 `P0-E2E-001` 为 `passes:true`。
- pnpm workspace：`packages/shared`、`apps/server`、`apps/web`。
- MockProvider：默认读取 `examples/screenplay-sample.yaml`。
- Playwright smoke：打开首页、点击 mock 生成按钮，并断言六个必需顶层 YAML 字段显示在页面上。
- 结构化日志：server 输出 JSON 行，并提供 `scripts/read-dev-logs.js`。
- `docs/contracts/P0-E2E-001.md`：本轮 contract。
- `docs/qa/P0-E2E-001.md`：本轮 QA PASS 证据。

## 下一个 coding agent 从哪里开始

建议从 `P0-INFRA-002` 开始：Repository scripts、TypeScript、ESLint、Vitest、Playwright 和结构化日志的可重复开发 harness。

目标不是扩业务功能，而是把已有工程脚本、日志读取、失败提示与验证命令按 contract/QA 证据正式验收。

## 已知风险

- 当前 OpenAIProvider 是占位，真实 LLM 接入必须等 Phase 2。
- Phase 1 校验器未实现，因此当前返回的 validation 只是 mock 响应形状。
- 本轮验证依赖 pnpm 可用；Windows PATH 如异常，先按 `docs/runbooks/debug.md` 排查。

## 验证记录

- `pnpm verify`：通过。覆盖 typecheck、lint、Vitest、build；server Vitest 解析 mock YAML 并断言六个必需顶层字段。
- `pnpm test:ui`：通过。Playwright Chromium smoke 1 passed，真实浏览器打开首页、点击“用样例生成”，并通过后端 mock route 显示六个必需顶层 YAML 字段。
- `powershell.exe -ExecutionPolicy Bypass -File .\init.ps1`：通过。脚本会 install、verify、安装 Playwright Chromium、跑 UI smoke。
- `node scripts/read-dev-logs.js`：通过。能读取 `logs/server-dev.jsonl` 中的结构化 JSON 行。

## 重要收尾说明

- `feature_list.json` 当前只有 `P0-E2E-001` 为 `passes:true`，其他 feature 仍为 `false`。
- `P0-E2E-001` 已有 contract/QA 证据，可以作为 Phase 0 mock 端到端基线。
- Playwright 的 webServer 必须从仓库根启动 `pnpm dev`，配置里已经显式设置 `cwd`。
