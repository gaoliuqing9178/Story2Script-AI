# Debug Runbook

## LLM 调用失败

现象：生成接口返回 `LLM_UNAVAILABLE` 或 OpenAIProvider 报错。

处理：

1. 确认本地默认走 mock：`.env` 或环境变量里 `LLM_PROVIDER=mock`。
2. 不要在 Phase 0/1 接真实 key。
3. 如果必须验证真实 provider，先确认该功能属于 Phase 2，并记录 contract。
4. 真实 provider 失败时，切回 mock，保证 demo 主流程不中断。

## YAML 解析失败

现象：校验面板或 API 返回 YAML parse error。

处理：

1. 保留原始 YAML，不要直接覆盖。
2. 记录错误路径和错误消息。
3. Phase 1 以后通过 `/api/yaml/validate` 复现。
4. Phase 3 以后可走 `/api/yaml/repair`，但只能修结构，不改剧情。

## 端口占用

默认端口：

- server: `8787`
- web: `5173`

PowerShell：

```powershell
Get-NetTCPConnection -LocalPort 8787
Get-NetTCPConnection -LocalPort 5173
```

若端口被占用，优先停掉旧 dev 进程，或者临时设置 `PORT` / Vite port 并在 QA 记录中写清。

## pnpm workspace 问题

常见现象：

- `pnpm` 不在 PATH。
- workspace package 互相解析失败。
- node_modules 残留导致版本错乱。

处理：

```powershell
corepack enable
corepack prepare pnpm@9.15.9 --activate
pnpm install
pnpm verify
```

不要提交 `node_modules` 或 lockfile 之外的安装缓存。

## 前端看不到后端响应

1. 确认 `pnpm dev` 同时启动 server 与 web。
2. 打开 `http://127.0.0.1:8787/api/health`。
3. 打开 `http://127.0.0.1:5173`。
4. 检查 Vite proxy 是否仍指向 `http://127.0.0.1:8787`。
5. 用 `node scripts/read-dev-logs.js` 查看最近 server JSON 日志。
