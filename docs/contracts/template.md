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

```powershell
pnpm verify
pnpm test:ui
```

补充真实路径验证：

1. 
2. 

## 失败阈值

- 任一验证命令失败：不允许 `passes:true`。
- 用户路径无法复现：不允许 `passes:true`。
- 状态文件未更新：不允许收尾。
