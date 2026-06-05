# Sprint Contract: P0-INFRA-002

Feature ID: P0-INFRA-002

Owner: generator agent

Date: 2026-06-05

## 本轮目标

正式验收 Phase 0 开发 harness：仓库脚本、TypeScript、ESLint、Vitest、Playwright UI smoke 和 server 结构化日志能组成可重复的本地开发与验证闭环。

## 明确不做

- 不实现 Phase 1 的真实 YAML 校验器。
- 不接入真实 OpenAI Provider 或任何外部 LLM。
- 不改变 `P0-E2E-001` 已验收的 mock 用户路径。
- 不改弱 `feature_list.json` 中的验收步骤。

## 用户路径

1. 开发者运行 `pnpm install` 安装 workspace 依赖。
2. 开发者运行 `pnpm verify`，串联 TypeScript、ESLint、Vitest 和 build。
3. 开发者运行 `pnpm test:ui`，由 Playwright 从仓库根启动 `pnpm dev` 并覆盖浏览器 smoke。
4. 开发者在有 dev 请求后运行 `node scripts/read-dev-logs.js` 或 `pnpm logs`，读取 server JSON 行日志。
5. 任一步失败时，命令输出应包含具体失败阶段或工具错误，而不是静默退出。

## 数据状态

- 输入：仓库源码、测试、配置、示例 fixture 与 dev 请求日志。
- 输出：命令执行结果、Vitest/Playwright 断言、`logs/server-dev.jsonl` 的结构化 JSON 行。
- 持久化：运行时日志只写入已忽略的 `logs/`，不进仓库。
- 是否影响 `examples/*`：不修改示例文件。

## UI 要求

- 页面区域：沿用 `P0-E2E-001` 首页和 YAML 输出区。
- Loading：沿用 mock 生成按钮 loading/禁用状态。
- 错误态：Playwright 路径失败时保留 trace/screenshot 到已忽略输出目录。
- 空态：不新增 UI 空态。

## API 要求

- Endpoint：沿用 `GET /api/health` 与 `POST /api/screenplay/generate`。
- Request：Playwright smoke 触发 mock generate 请求。
- Response：后端返回 mock YAML；server 同时输出 `server.started`、`screenplay.generate.mock`、`http.request` 等结构化事件。
- Error：Express 兜底错误走 `{ error: { code, message } }`，日志输出 `server.error`。

## 验收方式

```powershell
pnpm install
pnpm verify
pnpm test:ui
node scripts/read-dev-logs.js
```

补充真实路径验证：

1. Vitest 覆盖 shared schema contract、server API route 和 `logEvent` JSON 行结构。
2. Playwright Chromium 覆盖真实 dev server、web 页面、后端 mock generate 请求。
3. `read-dev-logs.js` 能读取 `logs/server-dev.jsonl`，并格式化输出最近结构化日志。

## 失败阈值

- 任一验证命令失败：不允许 `passes:true`。
- `pnpm verify` 没有覆盖 typecheck、lint、test、build 任一项：不允许 `passes:true`。
- `pnpm test:ui` 未启动真实浏览器路径：不允许 `passes:true`。
- server 日志不是可解析 JSON 行：不允许 `passes:true`。
- 状态文件未更新：不允许收尾。
