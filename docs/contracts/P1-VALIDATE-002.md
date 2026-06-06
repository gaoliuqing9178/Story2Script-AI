# Sprint Contract

Feature ID: P1-VALIDATE-002

Owner: generator agent

Date: 2026-06-06

## 本轮目标

实现应用层 YAML 校验，在 AJV 结构校验通过后继续检查 JSON Schema 不适合表达的跨字段规则：

- `scenes[].source_chapters[]` 必须引用 `source.chapters[].id`。
- `scenes[].location_id` 必须引用 `locations[].id`。
- `scenes[].characters[]` 与 `beats[].speaker` 必须引用 `characters[].id`。
- `characters[].relationships[].target` 必须引用 `characters[].id`。
- `dialogue` 与 `inner_voice` beat 必须提供非空 `speaker`，且 speaker 必须存在。
- `characters`、`locations`、`scenes` 内部 `id` 必须各自唯一。
- 每个 `source.chapters[].id` 至少被一个 scene 覆盖；未覆盖时返回 warning，不阻断 `valid:true`。

## 明确不做

- 不实现 YAML repair。
- 不实现前端编辑器、校验面板、预览或导出。
- 不修改 `examples/*` demo fixture 内容。
- 不接入真实 OpenAI Provider；默认 mock 仍保持 Phase 0/1 演示稳定。

## 用户路径

1. 用户或前端调用 `POST /api/yaml/validate`。
2. 请求体传入 `{ "yaml": "schema_version: \"1.0\"..." }`。
3. 系统先执行 AJV structural validation。
4. 结构通过后，系统执行应用层 reference validation。
5. 系统返回 `{ valid, errors, warnings }`，其中硬错误进入 `errors`，章节覆盖提示进入 `warnings`。

## 数据状态

- 输入：YAML 字符串。
- 输出：`ValidationResult`。
- 持久化：无。
- 是否影响 `examples/*`：不修改示例文件，只读取 `examples/screenplay-sample.yaml` 作为有效 fixture。

## UI 要求

- 页面区域：无，本轮只交付后端 API 与测试。
- Loading：无。
- 错误态：`errors[].path` 精确定位到字段或数组下标。
- 空态：无。

## API 要求

- Endpoint：`POST /api/yaml/validate`
- Request：`{ "yaml": string }`
- Response：`ValidationResult`
- Error：缺失或非字符串 `yaml` 仍返回 HTTP 400 `BAD_REQUEST`。

## 验收方式

```powershell
pnpm verify
```

补充真实路径验证：

1. `apps/server/tests/yaml-validate-route.test.ts` 调用真实 Express app 的 `/api/yaml/validate`。
2. 覆盖 broken dialogue speaker、dialogue/inner_voice 缺 speaker、重复 character/location/scene id、未覆盖章节 warning。
3. 补充覆盖 scene location、scene character、source chapter、relationship target 引用错误。
4. `apps/server/tests/screenplay-route.test.ts` 确认 mock generate 返回的 fixture 在新应用层校验下仍为 `valid:true`。

## 失败阈值

- 任一验证命令失败：不允许 `passes:true`。
- 应用层错误路径不能精确到目标字段或数组下标：不允许 `passes:true`。
- 未覆盖章节被放进 hard errors 而不是 warnings：不允许 `passes:true`。
- 状态文件未更新：不允许收尾。
