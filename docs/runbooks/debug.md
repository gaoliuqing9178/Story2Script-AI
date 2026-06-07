# Debug Runbook

## OpenAI-compatible 上游 502/524

现象：前端生成失败，页面或日志里出现 `LLM_UNAVAILABLE`、`status_code=502`、`Upstream request failed`、`HTTP 524` 或 Cloudflare HTML。

处理：
1. 先看 `logs/server-dev.jsonl`，确认 `server.started` 里的 `provider`。如果是 `provider:"openai"`，说明已经不是 mock 回退。
2. 搜索 `screenplay.generate.provider_failed`，看 message 里的上游 HTTP 状态。Story2Script 本地会按契约把 provider 失败包装为 `/generate` HTTP `502`。
3. 如果 message 是 `OpenAI-compatible request failed with HTTP 502 (upstream status_code=502): Upstream request failed`，优先检查 `OPENAI_BASE_URL` 指向的外部网关、模型名、key 权限和上游服务健康。
4. 如果 message 是 `HTTP 524` 或 `HTML error page: 524: A timeout occurred`，优先检查外部网关超时、Cloudflare/反代超时和上游模型响应耗时。
5. 不要在 `LLM_PROVIDER=openai` 下自动切回 mock；需要演示稳定性时再手动切 `LLM_PROVIDER=mock`，避免掩盖真实接入问题。

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
