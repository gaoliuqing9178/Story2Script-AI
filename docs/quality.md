# 质量说明

本项目是 72 小时比赛项目，质量策略不是“上最重的治理”，而是把最容易翻车的地方机械化约束住。

## 评分维度

来自 `design.md` 与 `engineering.md`：

- 作品完整度与创新性 40%：导入、切章、分析、生成、校验、编辑、预览、导出形成完整链路。
- 开发过程与质量 40%：前后端分层清晰、Provider 独立封装、Schema 与类型共享、验证可复现。
- 演示与表达 20%：内置样例稳定、3 分钟内可演示、能展示错误定位与导出。

## Golden Principles

- 优先共享 utility 和 `packages/shared` 契约，不到处手写 helper。
- 边界必须校验，不猜数据结构；所有 AI 输出落地前必须解析与校验。
- 日志必须结构化，便于 agent 读取运行时反馈。
- 前端只能通过 `apps/web/src/api` 调后端，不直接 import server 层。
- MockProvider 永久保留，真实 LLM 不可用时 demo 主流程仍可走通。
- `feature_list.json` 是真实进度表，`passes` 只能由验证结果驱动。
- 每轮只推进一个小目标，完成后干净收尾。

## 当前已知缺口

- Phase 1 校验器尚未实现，当前只有契约与 skeleton。
- Phase 2 OpenAIProvider 尚未接真实 API，只有占位错误。
- Phase 3 多阶段流水线尚未实现。
- Phase 4 YAML 编辑器、预览与导出尚未实现。
- Phase 5 demo 道具、README 与最终打磨尚未实现。

这些缺口都应由 `feature_list.json` 的后续条目逐项关闭。

## 技术债清单

- 后续实现校验器时，补齐坏 YAML fixture 与错误路径快照测试。
- 后续实现切章时，覆盖中文、英文、Markdown 和 `---chapter---` 四种格式。
- 后续实现导出时，把预览渲染逻辑抽到共享层，避免前后端两套格式。
- 如果依赖规模变大，再引入 dependency-cruiser 或 knip；当前只保留 ESLint 边界约束。

## 扫描命令

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm verify
pnpm test:ui
node scripts/read-dev-logs.js
```

如果怀疑边界违规，先跑 `pnpm lint`。错误信息会指出应通过前端 API 客户端调用，而不是直接依赖 server 层。
