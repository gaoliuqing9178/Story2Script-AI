# Sprint Contract

Feature ID: P5-STREAM-004

Owner: generator

Date: 2026-06-07

## 本轮目标

把生成主路径从前端伪流式改为后端真实流式输出，并提高真实 LLM 返回 YAML 通过校验的概率，重点保护 `project.language`。

## 明确不做

- 不做：删除或改变旧 `POST /api/screenplay/generate` JSON 契约。
- 不做：接入真实密钥、真实外部模型调用或提交 `.env`。
- 不做：把 YAML 编辑器重构为 Monaco/CodeMirror。

## 用户路径

1. 用户打开首页。
2. 用户输入或使用默认小说文本，点击 `用样例生成`。
3. 前端先调用 `/api/chapters/split` 得到 `Chapter[]`，再调用 `/api/screenplay/generate/stream`。
4. YAML 编辑器收到后端 NDJSON `yaml_delta` 事件后增量显示内容。
5. 后端完成本地规范化、校验和必要 repair 后发送最终 `yaml_snapshot`、`validation` 和 `done`。

## 数据状态

- 输入：小说正文、split 后的 `Chapter[]`、改编参数。
- 输出：符合 v1.0 schema 的 YAML、`ValidationResult`、pipeline metadata。
- 持久化：无新增持久化；后端结构化日志新增 stream 阶段与 chunk metadata。
- 是否影响 `examples/*`：否。

## UI 要求

- 页面区域：右侧 YAML 编辑器继续作为唯一 YAML 事实源。
- Loading：生成期间按钮锁定，YAML 标题区显示 `正在流式写入 YAML`。
- 错误态：生成失败显示 `/api/screenplay/generate/stream` 的阶段路径和错误原因。
- 空态：无 YAML 时保持既有空态、预览暂停和导出禁用。

## API 要求

- Endpoint：`POST /api/screenplay/generate/stream`
- Request：JSON，至少包含 `novel`；主前端路径会附带 `chapters: Chapter[]`。
- Response：`application/x-ndjson`，逐行 JSON event。
- Events：`status`、`yaml_reset`、`yaml_delta`、`yaml_snapshot`、`validation`、`done`、`error`。
- Error：请求体错误仍可在开始流前返回 JSON `400 BAD_REQUEST`；流开始后的 provider 失败返回 NDJSON `error` event。

## 验收方式

Generator 简单验证：

```powershell
& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/server typecheck
& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web typecheck
& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/server test -- screenplay-route.test.ts
& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui -- apps/web/tests/ui/yaml-streaming.spec.ts apps/web/tests/ui/p2-evaluator.spec.ts apps/web/tests/ui/p5-polish.spec.ts
& 'C:\nvm4w\nodejs\pnpm.cmd' verify
& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui
```

Evaluator 真实交互验证：

1. 使用 Chrome DevTools MCP 打开真实页面。
2. 点击 `用样例生成`，确认 Network 有 `/api/screenplay/generate/stream`，YAML 长度增量增长，最终校验通过。
3. 截图并检查首屏、YAML 编辑器、校验面板、预览和导出按钮无明显错位或遮挡。

## 失败阈值

- 生成主路径仍调用旧 `/api/screenplay/generate`：不放行。
- 没有后端 `yaml_delta` 事件或后端日志缺少 stream chunk metadata：不放行。
- `project.language` 缺失时无法被规范化为 `zh-CN`：不放行。
- full `verify`、full `test:ui` 或 Chrome DevTools MCP 真实路径验证失败：不允许 `passes:true`。
