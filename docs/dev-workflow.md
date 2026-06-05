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

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm verify
pnpm test:ui
```

`pnpm verify` 串联 typecheck、lint、test、build。涉及真实用户路径时，还要跑 `pnpm test:ui` 或补充 `docs/qa/` 报告。

## 提交流程

1. 先确认本轮只推进 `feature_list.json` 里的一个小目标。
2. 写或更新 `docs/contracts/<feature-id>.md`，明确本轮做什么、不做什么。
3. 实现后跑对应验证。
4. 只有验证通过才改 `passes:true`。
5. 更新 `progress.md` 与 `docs/handoff.md`。
6. 提交前看 `git diff`，避免带入密钥、日志、生成产物。

## Windows 提示

- PowerShell 读取中文文档时使用 UTF-8：`Get-Content -Encoding UTF8`。
- 端口占用优先查：`Get-NetTCPConnection -LocalPort 8787,5173`。
- 不要用真实 `.env` 进仓库，只复制 `.env.example` 到本地。
