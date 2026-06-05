# Story2Script AI Agent Map

Story2Script AI 是面向小说作者的 AI 剧本改编 Web 工作台。目标是把 3 章以上小说转成可编辑、可校验、可预览、可导出的结构化 YAML 剧本初稿。

## 开工前先读

1. `docs/design.md`：产品目标、Phase 0-5 端到端计划、验收重点。
2. `docs/yaml-schema.md`：剧本 YAML 数据契约与设计原因。
3. `docs/engineering.md`：monorepo 结构、模块接口、API、技术栈。
4. `feature_list.json`：真实进度表；只能在真实验证后改 `passes`。
5. `docs/handoff.md`：最近一轮交接、下一步起点、风险。

如果文档冲突，记录到 `docs/decision-log.md`，实现以 `docs/engineering.md` 的技术决策为准。

## 常用命令

```powershell
pnpm install
pnpm dev
pnpm typecheck
pnpm lint
pnpm test
pnpm test:ui
pnpm build
pnpm verify
node scripts/read-dev-logs.js
```

Windows 首选 `init.ps1`；其他环境可用 `init.sh`。

## 不要碰

- 不提交 `.env`、真实密钥、token、私有模型配置。
- 不删除或重写 `docs/design.md`、`docs/yaml-schema.md`、`docs/engineering.md`。
- 不随手改弱 `feature_list.json` 的验收标准。
- 不覆盖 `examples/*` demo 道具，除非对应 feature 明确要求。
- 不提交 `node_modules`、`dist`、coverage、Playwright trace/screenshot、运行日志等生成产物。

## 什么叫完成

一轮只推进一个小目标。完成必须同时满足：

- 代码、文档、`feature_list.json`、`progress.md`、`docs/handoff.md` 状态一致。
- generator 做简单验证：至少跑与改动直接相关的 lint/typecheck/test/build 命令，并记录结果。
- 收尾前调用 evaluator 子代理；evaluator 必须用 Chrome DevTools MCP 跑真实交互验证，并截屏做视觉检查。
- 涉及用户路径时，只有 evaluator 的 QA 报告放行后，才能把对应 feature 的 `passes` 改为 `true`。

本仓库默认 `LLM_PROVIDER=mock`，真实 LLM 接入从 Phase 2 开始。
