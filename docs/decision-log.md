# Decision Log

## 2026-06-05 - Initial Harness Decisions

Status: accepted

Context:

- `docs/design.md` 要求 54 小时端到端优先，Phase 0 先打通 mock 链路。
- `docs/engineering.md` 明确技术栈为 pnpm monorepo、React 18 + Vite + TypeScript、Tailwind、Node.js 20 + Express、Provider 层、`packages/shared` 共享类型与 JSON Schema。
- `docs/yaml-schema.md` 明确 YAML v1.0 顶层结构和结构校验草案。

Decision:

- 采用 pnpm monorepo。
- 采用 mock-first provider，默认 `LLM_PROVIDER=mock`。
- 创建 `packages/shared` 作为 TS 类型与 JSON Schema 单一契约源。
- 前端通过 `apps/web/src/api` 调用后端，禁止直接依赖 `apps/server`。
- 本轮只搭 walking skeleton 与 harness，不把任何业务 feature 标记为通过。

Consequences:

- 后续 coding agent 可以在零真实 LLM key 的情况下开发与验证主路径。
- 真实 LLM 接入从 Phase 2 开始，不能提前把 key 或 provider 细节写死。
- 如果文档冲突，以 `docs/engineering.md` 的实现决策为准，并在本文件追加记录。
