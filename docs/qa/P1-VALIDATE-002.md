# Evaluator QA Report

Feature ID: P1-VALIDATE-002

Date: 2026-06-06

Evaluator: generator agent

## 复现步骤

1. 运行 `C:\nvm4w\nodejs\pnpm.cmd --filter @story2script/server test`。
2. 运行 `C:\nvm4w\nodejs\pnpm.cmd verify`。
3. 观察 server Vitest 中真实 Express app 的 `/api/yaml/validate` 请求。
4. 确认新应用层用例覆盖：
   - `scenes[0].beats[1].speaker` 指向不存在角色。
   - `dialogue` 与 `inner_voice` 缺少 `speaker`。
   - `characters[1].id`、`locations[1].id`、`scenes[1].id` 重复。
   - `source.chapters[2].id` 未被任何 scene 覆盖并返回 warning。
   - location、scene character、source chapter、relationship target 引用不存在。

## 截图或日志证据

- Screenshot: 不适用，本轮无前端 UI 改动。
- Trace: 不适用。
- Server logs: Vitest 真实 Express app 请求日志显示 `/validate` 返回 200，坏 YAML 作为业务校验结果返回 `valid:false`。
- Command output:

```text
C:\nvm4w\nodejs\pnpm.cmd --filter @story2script/server test: PASS
server test files: 3 passed
server tests: 13 passed

C:\nvm4w\nodejs\pnpm.cmd verify: PASS
typecheck: shared/server/web passed
lint: eslint . passed
test: shared 1 passed, server 13 passed, web passWithNoTests passed
build: shared/server/web passed
```

## 评分

| 维度 | 分数 | 说明 |
| --- | --- | --- |
| 用户路径完整度 | 5/5 | `/api/yaml/validate` 真实路径覆盖结构通过后的应用层校验。 |
| 数据契约一致性 | 5/5 | 规则与 `docs/yaml-schema.md`、`docs/engineering.md` 中的应用层职责一致。 |
| 错误与边界处理 | 5/5 | 引用错误、条件 speaker、重复 ID 为 hard errors；章节覆盖为 warning。 |
| UI 可用性 | 5/5 | 本轮无 UI 范围，不引入前端回归。 |
| 可维护性 | 5/5 | 应用层校验独立在 `apps/server/src/validate/reference.ts`，结构校验入口只负责串联。 |

## 是否放行

Decision: PASS

## 修复建议

- 下一轮可继续推进 `P2-LLM-001` 或 `P3-PIPELINE-001`；本轮不需要补 UI evaluator，因为没有用户界面变更。
