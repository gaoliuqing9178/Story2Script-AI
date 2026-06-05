# Sprint Contract Template

Feature ID:

Owner:

Date:

## 本轮目标

写清一个小目标，只对应 `feature_list.json` 中一个条目。

## 明确不做

- 不做：
- 不做：

## 用户路径

1. 用户打开：
2. 用户输入或点击：
3. 系统返回或展示：

## 数据状态

- 输入：
- 输出：
- 持久化：
- 是否影响 `examples/*`：

## UI 要求

- 页面区域：
- Loading：
- 错误态：
- 空态：

## API 要求

- Endpoint：
- Request：
- Response：
- Error：

## 验收方式

Generator 简单验证：

```powershell
pnpm typecheck
pnpm lint
pnpm test
```

按改动范围补充：

```powershell
pnpm build
pnpm verify
```

Evaluator 真实交互验证：

1. 
2. 

要求：

- generator 收尾前调用 evaluator 子代理。
- evaluator 使用 Chrome DevTools MCP 打开真实页面并完成用户路径。
- evaluator 截屏并检查空白页、错位、遮挡、文字溢出、错误态和关键内容是否可见。
- 截图、观察结果和是否放行写入 `docs/qa/<feature-id>.md`。

## 失败阈值

- generator 简单验证失败：不允许提交。
- evaluator 未使用 Chrome DevTools MCP 完成真实交互和截图视觉检查：不允许 `passes:true`。
- 用户路径无法复现或视觉检查发现阻断问题：不允许 `passes:true`。
- 状态文件未更新：不允许收尾。
