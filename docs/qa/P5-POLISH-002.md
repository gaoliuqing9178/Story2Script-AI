# Evaluator QA Report

Feature ID: P5-POLISH-002

Date: 2026-06-07

Evaluator:

- Generator Chrome DevTools MCP verification: yes
- Sub-agent evaluator: `019ea0b9-cb51-7ac0-b6f4-878ba2fe580b`

Tooling:

- Chrome DevTools MCP: yes
- Browser: Chrome DevTools MCP attached Chrome
- Viewport: desktop, `1440px` wide during generator layout check

## 复现步骤

1. 从仓库根启动真实 dev server：`C:\nvm4w\nodejs\pnpm.cmd dev`。
2. 使用 Chrome DevTools MCP 打开 `http://127.0.0.1:5173/`。
3. 初始页面确认：默认 3 章小说、`YAML 编辑器` 为 `0` 字符、导出按钮禁用、校验状态为 `未校验`、导出区显示暂无可导出的 YAML。
4. 在浏览器上下文延迟 `/api/screenplay/generate`，点击生成并读取 DOM 状态。
5. 确认 generation loading 显示 `正在识别章节结构，确认可以进入生成。` 或 `正在生成剧本 YAML，请稍等，按钮已暂时锁定。`，生成按钮 disabled，导出按钮 disabled。
6. 默认 3 章样例正常生成后，确认 YAML 字符数为 `3347`，校验通过，预览更新，导出按钮启用。
7. 删除 YAML 中的 `project.title`，确认校验错误显示 `project.title` / `必填字段缺失`，预览暂停，导出暂停。
8. 模拟 `/api/yaml/validate` 返回 500，确认校验面板显示 `/api/yaml/validate`，导出和预览暂停。
9. 模拟 `/api/screenplay/generate` 返回 500，确认小说输入面板显示 `/api/screenplay/generate`，YAML 保持空态，导出禁用。
10. 截取 full-page screenshot 并执行 DOM 几何检查。
11. 停止本轮启动的 dev server，确认 `5173/8787` 端口释放。

## 截图或日志证据

- Generator screenshot: `H:\tmp\P5-POLISH-002-fullpage.png`
- Sub-agent screenshot: `H:\tmp\P5-POLISH-002-evaluator-fullpage.png`
- Chrome DevTools MCP: 已使用。

Generator 慢生成 DOM 证据：

```json
{
  "generationState": "正在生成剧本 YAML，请稍等，按钮已暂时锁定。",
  "buttonState": [
    { "text": "生成中...", "disabled": true },
    { "text": "导出 YAML", "disabled": true },
    { "text": "导出 Markdown", "disabled": true }
  ],
  "exportState": "暂无可导出的 YAML。生成并通过校验后可导出 YAML 或 Markdown。",
  "requests": [
    { "url": "/api/chapters/split", "status": 200 },
    { "url": "/api/screenplay/generate", "status": null }
  ]
}
```

Generator 正常路径证据：

```text
YAML 字符数：3347
校验状态：校验通过
预览状态：预览已更新
导出状态：可导出 YAML 或 Markdown。
```

Generator validation business error 证据：

```text
校验状态：发现 1 个错误
错误路径：project.title
错误文案：必填字段缺失
导出状态：当前 YAML 未通过校验，导出已暂停（1 个错误）。
预览状态：预览已暂停
```

Generator validation request error 证据：

```text
校验阶段失败（/api/yaml/validate）：validator service unavailable
导出状态：校验请求失败，导出已暂停。
预览状态：预览暂停
```

Generator generation request error 证据：

```text
生成没有完成，请看下方具体阶段提示。
剧本生成阶段失败（/api/screenplay/generate）：mock provider timeout
YAML 字符数：0
导出状态：暂无可导出的 YAML。生成并通过校验后可导出 YAML 或 Markdown。
```

Generator 布局指标：

```json
{
  "innerWidth": 1440,
  "innerHeight": 934,
  "scrollWidth": 1440,
  "scrollHeight": 934,
  "horizontalOverflow": false,
  "overflowingCount": 0
}
```

Sub-agent evaluator 已完成的浏览器验证摘要：

- 初始空态：YAML 长度 `0`，校验 `未校验`，两个导出按钮 disabled，导出区空态明确。
- 慢生成：`正在生成剧本 YAML，请稍等，按钮已暂时锁定。` 可见，生成按钮 `生成中...` 且 disabled，双击后只有一次 `/api/screenplay/generate`。
- 生成接口 500：显示 `剧本生成阶段失败（/api/screenplay/generate）：mock provider timeout`，YAML 长度 `0`，导出 disabled。
- 正常路径：YAML 长度 `3347`，校验通过，预览更新，导出按钮启用。
- 破坏 YAML：显示 `project.title` / `必填字段缺失`，预览暂停，导出暂停。
- 校验接口 500：显示 `校验阶段失败（/api/yaml/validate）：validator service unavailable`，预览暂停，导出暂停。
- Screenshot: `H:\tmp\P5-POLISH-002-evaluator-fullpage.png`
- DOM 几何检查：`horizontalOverflow:false`，`clipped:[]`。
- 指定 Playwright 复核：`& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui -- apps/web/tests/ui/p5-polish.spec.ts` 通过，Chromium 5 passed。
- 端口收尾：停止 evaluator 本轮启动的 dev server 后，`5173/8787` 均无 `Listen`。

## Generator 验证

- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web typecheck`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web test`：通过，web 1 个 Vitest 文件 / 3 个 tests。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' lint`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui -- apps/web/tests/ui/p5-polish.spec.ts`：通过，Chromium 5 passed。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui`：通过，Playwright Chromium 10 passed。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' verify`：通过，覆盖 typecheck、lint、test、build。

## 自动化覆盖

- `apps/web/tests/ui/p5-polish.spec.ts`：
  - 2 章输入通过预检，且 `/api/screenplay/generate` 被调用。
  - 慢 `/api/screenplay/generate` 时 loading 可见，生成按钮 disabled，重复点击只发一次 split 和一次 generate。
  - `/api/screenplay/generate` 500 时显示 `剧本生成阶段失败` 和 `/api/screenplay/generate`。
  - 初始导出空态明确，导出按钮 disabled。
  - `/api/yaml/validate` 校验中时导出暂不可用。
  - `/api/yaml/validate` 500 时显示 `/api/yaml/validate`，导出和预览暂停。
  - YAML 业务校验失败时显示 `project.title`，导出按钮 disabled。

## 视觉检查

| 检查项 | 结果 | 说明 |
| --- | --- | --- |
| 页面非空白 | pass | full-page screenshot 中左右工作区正常渲染。 |
| 首屏关键内容可见 | pass | 小说输入、状态提示、YAML 编辑器、导出状态、校验结果和预览区域均可识别。 |
| 无明显错位或遮挡 | pass | 状态提示在各自面板内，不遮挡输入或按钮。 |
| 无文字溢出或按钮截断 | pass | 长接口路径错误文案正常换行，按钮文本未截断。 |
| Loading / 错误态可辨认 | pass | generation loading、generation error、validation loading、validation request error、validation business error 均可辨认。 |

## 评分

| 维度 | 分数 | 说明 |
| --- | --- | --- |
| 用户路径完整度 | 5/5 | 覆盖初始空态、慢生成、正常生成、生成错误、校验错误、校验请求错误和导出状态。 |
| 数据契约一致性 | 5/5 | 未新增 API，保留既有 `/api/chapters/split`、`/api/screenplay/generate`、`/api/yaml/validate` 契约。 |
| 错误与边界处理 | 5/5 | server error 明确显示具体阶段和 API 路径，业务校验错误显示精确 path。 |
| UI 可用性 | 5/5 | loading、empty、error 和 export enable/disable 状态可扫描，按钮禁用语义明确。 |
| 可维护性 | 5/5 | 状态文案和下载 helper 拆出小模块，App 保持现有数据流。 |

## 是否放行

Decision: PASS

`pnpm verify` 与 `pnpm test:ui` 均通过；generator 与 evaluator 均使用 Chrome DevTools MCP 完成真实浏览器交互和视觉检查；允许将 `feature_list.json` 中 `P5-POLISH-002.passes` 置为 `true`。

## 非阻断问题

- Chrome DevTools console 中仍可见开发环境 React DevTools 提示和 favicon 404，不影响本轮状态路径。
