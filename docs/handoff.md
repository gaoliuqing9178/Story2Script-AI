# Handoff

## 当前状态

Initializer harness 已建立基础文件结构与规则，目标是让后续 coding agent 能按 `feature_list.json` 一轮一项推进。

本轮不实现业务功能，不把任何 feature 标记为 `passes:true`。Phase 0 的 mock 端到端链路只是 walking skeleton，用于证明工具链和前后端通信路径可运行。

## 已搭好的地基

- 根 `AGENTS.md`：项目地图、开工阅读顺序、完成标准。
- `docs/` 补全：开发流程、质量说明、决策记录、交接、排障、contract/QA 模板。
- `feature_list.json`：Phase 0-5 结构化进度表，全部 `passes:false`。
- pnpm workspace：`packages/shared`、`apps/server`、`apps/web`。
- MockProvider：默认读取 `examples/screenplay-sample.yaml`。
- Playwright smoke：打开首页并点击 mock 生成按钮。
- 结构化日志：server 输出 JSON 行，并提供 `scripts/read-dev-logs.js`。

## 第一个 coding agent 从哪里开始

从 `P0-E2E-001` 开始：Phase 0 端到端骨架项。

目标不是扩展功能，而是把“样例小说 -> 后端 MockProvider -> YAML -> 前端显示”按 contract 和 QA 证据正式验收，然后才能把该项 `passes` 改为 `true`。

建议先创建：

```text
docs/contracts/P0-E2E-001.md
docs/qa/P0-E2E-001.md
```

## 已知风险

- 当前 OpenAIProvider 是占位，真实 LLM 接入必须等 Phase 2。
- Phase 1 校验器未实现，因此当前返回的 validation 只是 mock 响应形状。
- 本轮验证依赖 pnpm 可用；Windows PATH 如异常，先按 `docs/runbooks/debug.md` 排查。

## 验证记录

- `pnpm verify`：通过。覆盖 typecheck、lint、Vitest、build。
- `pnpm test:ui`：通过。Playwright Chromium smoke 1 passed，真实浏览器打开首页并通过后端 mock route 显示 YAML。
- `powershell.exe -ExecutionPolicy Bypass -File .\init.ps1`：通过。脚本会 install、verify、安装 Playwright Chromium、跑 UI smoke。
- `node scripts/read-dev-logs.js`：通过。能读取 `logs/server-dev.jsonl` 中的结构化 JSON 行。

## 重要收尾说明

- `feature_list.json` 仍然全部 `passes:false`，这是本轮刻意保持的状态。
- 当前 mock 端到端链路已经能跑，但还没有 contract/QA 证据，因此不能把 `P0-E2E-001` 置为 true。
- Playwright 的 webServer 必须从仓库根启动 `pnpm dev`，配置里已经显式设置 `cwd`。
