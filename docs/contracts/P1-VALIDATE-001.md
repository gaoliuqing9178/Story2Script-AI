# Sprint Contract

Feature ID: P1-VALIDATE-001

Owner: generator agent

Date: 2026-06-05

## 本轮目标

实现 AJV structural validation，让 `POST /api/yaml/validate` 能按 `docs/yaml-schema.md` v1.0 校验：

- 顶层与嵌套必填字段。
- `schema_version` / `source_type` const。
- `adaptation_type`、`characters[].role`、`beats[].type` 枚举。
- 必需数组结构与 `minItems`。
- `source.chapters` 至少 1 章，不再要求 3 章起步。

## 明确不做

- 不做：应用层引用校验，包括 `speaker`、`location_id`、`source_chapters` 是否指向已定义对象。
- 不做：`dialogue` / `inner_voice` 的 `speaker` 条件必填。
- 不做：ID 唯一、章节覆盖 warning、YAML repair、前端编辑器或校验面板。

## 用户路径

1. 用户或前端调用 `POST /api/yaml/validate`。
2. 请求体传入 `{ "yaml": "schema_version: \"1.0\"..." }`。
3. 系统解析 YAML，用 AJV 执行结构校验，并返回 `{ valid, errors, warnings }`。
4. 对缺字段、枚举错误、数组数量不足返回精确路径，例如 `project.title`、`scenes[0].beats[0].type`、`source.chapters`。

## 数据状态

- 输入：YAML 字符串。
- 输出：`ValidationResult`。
- 持久化：无。
- 是否影响 `examples/*`：不修改示例文件，只用 `examples/screenplay-sample.yaml` 作为有效 fixture。

## UI 要求

- 页面区域：无，本轮只交付后端 API 与测试。
- Loading：无。
- 错误态：HTTP 400 处理缺失或非字符串 `yaml`；YAML 解析失败以 `valid:false` 返回。
- 空态：无。

## API 要求

- Endpoint：`POST /api/yaml/validate`
- Request：`{ "yaml": string }`
- Response：`ValidationResult`
- Error：`{ error: { code: "BAD_REQUEST", message } }`

## 验收方式

```powershell
pnpm verify
```

补充真实路径验证：

1. `apps/server/tests/yaml-validate-route.test.ts` 调用真实 Express app 的 `/api/yaml/validate`。
2. 覆盖 valid fixture、删除 `schema_version`、删除 `project.title`、非法 `beats[0].type`、`source.chapters` 为空，以及 1 章 screenplay 可通过。

## 失败阈值

- 任一验证命令失败：不允许 `passes:true`。
- `/api/yaml/validate` 仍返回 501：不允许 `passes:true`。
- 错误路径不能精确到目标字段或数组下标：不允许 `passes:true`。
- 状态文件未更新：不允许收尾。
