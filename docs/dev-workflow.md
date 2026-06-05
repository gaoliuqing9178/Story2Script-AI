# 开发工作流

本文只写本地协作需要的最短路径。产品、数据契约和架构细节分别看 `design.md`、`yaml-schema.md`、`engineering.md`。

## 环境

- Windows + PowerShell 是主路径。
- Node.js 20。
- pnpm workspace。
- 默认 `LLM_PROVIDER=mock`，不要在本地初始化时接真实 key。

如果 `pnpm` 不在 PATH，优先用 Corepack 启用：

```powershell
corepack enable
corepack prepare pnpm@9.15.9 --activate
```

也可以临时用本机 pnpm 绝对路径，但不要把个人路径写死进项目脚本。

## 安装

```powershell
pnpm install
```

首次安装后建议立刻跑：

```powershell
pnpm verify
pnpm test:ui
```

## 启动

```powershell
pnpm dev
```

默认端口：

- Server: `http://127.0.0.1:8787`
- Web: `http://127.0.0.1:5173`

Vite 会把 `/api` 代理到后端，前端不要直接 import server 代码。

## 验证

本项目采用 generator / evaluator 分工：

- generator：每轮只做简单验证，覆盖本次改动直接相关的命令即可，例如 `pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm build` 或 `pnpm verify` 中必要的子集。
- evaluator：每轮收尾前由 generator 调用 evaluator 子代理；evaluator 使用 Chrome DevTools MCP 做真实浏览器交互验证，并截屏检查页面是否空白、错位、遮挡、文字溢出或状态异常。
- `passes:true` 只能在 evaluator 的 QA 报告放行后修改。generator 的简单验证通过，不等于 feature 已验证完成。

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm verify
pnpm test:ui
```

`pnpm verify` 串联 typecheck、lint、test、build。`pnpm test:ui` 是脚本化 smoke 入口；最终真实交互和视觉检查以 evaluator 的 Chrome DevTools MCP QA 报告为准。

## 提交流程

1. 先确认本轮只推进 `feature_list.json` 里的一个小目标。
2. 写或更新 `docs/contracts/<feature-id>.md`，明确本轮做什么、不做什么。
3. generator 实现后跑简单验证，并把命令结果写入 `progress.md` 或对应 contract。
4. 调用 evaluator 子代理做 Chrome DevTools MCP 真实交互验证和截图视觉检查。
5. 只有 evaluator QA 放行后才改 `passes:true`。
6. 更新 `progress.md` 与 `docs/handoff.md`。
7. 提交前看 `git diff`，避免带入密钥、日志、生成产物。

## Windows 提示

- PowerShell 读取中文文档时使用 UTF-8：`Get-Content -Encoding UTF8`。
- 端口占用优先查：`Get-NetTCPConnection -LocalPort 8787,5173`。
- 不要用真实 `.env` 进仓库，只复制 `.env.example` 到本地。
