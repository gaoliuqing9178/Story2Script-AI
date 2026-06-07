# Evaluator QA Report

Feature ID: P5-DEMO-003

Date: 2026-06-07

Evaluator:

- Generator Chrome DevTools MCP verification: yes
- Sub-agent evaluator: `019ea0d9-a041-7d50-ba8d-0d9af663168e`

Tooling:

- Chrome DevTools MCP: yes
- Browser: Chrome DevTools MCP attached Chrome
- Viewport: desktop, `1440px` wide during generator layout check

## 复现步骤

1. 从仓库根启动真实 dev server：`C:\nvm4w\nodejs\pnpm.cmd dev`。
2. 使用 Chrome DevTools MCP 打开 `http://127.0.0.1:5173/demo`。
3. 确认页面顶部存在 `3 分钟演示路线`。
4. 确认左侧小说输入预载 `examples/novel-sample.md`。
5. 确认右侧 YAML 编辑器预载稳定合法 fixture，校验状态为 `校验通过`，预览状态为 `预览已更新`，`导出 YAML` 和 `导出 Markdown` 均可用。
6. 点击 `加载坏 YAML`，确认页面通过真实 `/api/yaml/validate` 返回 `project.title` / `必填字段缺失`，预览暂停，导出禁用。
7. 点击 `加载合法 YAML`，确认恢复 `校验通过`、`预览已更新`，导出按钮重新可用。
8. 截取 full-page screenshot 并执行 DOM 几何检查。
9. evaluator 子代理独立重复上述浏览器路径并截图。

## 截图或日志证据

- Generator screenshot: `H:\tmp\P5-DEMO-003-fullpage.png`
- Sub-agent screenshot: `H:\tmp\P5-DEMO-003-evaluator-fullpage.png`
- Chrome DevTools MCP: 已使用。

Generator 恢复合法 YAML 后 DOM 证据：

```json
{
  "url": "http://127.0.0.1:5173/demo",
  "innerWidth": 1440,
  "innerHeight": 934,
  "scrollWidth": 1440,
  "scrollHeight": 1528,
  "horizontalOverflow": false,
  "clippedCount": 0,
  "validationState": "校验通过",
  "previewState": "预览已更新",
  "exportState": "可导出 YAML 或 Markdown。",
  "yamlChars": 3346,
  "exportButtons": [
    { "text": "导出 YAML", "disabled": false },
    { "text": "导出 Markdown", "disabled": false }
  ]
}
```

Generator Network 证据：

```text
POST http://127.0.0.1:5173/api/yaml/validate [200]
POST http://127.0.0.1:5173/api/yaml/validate [200]
POST http://127.0.0.1:5173/api/yaml/validate [200]
```

坏 YAML 状态证据：

```text
校验状态：发现 1 个错误
错误路径：project.title
错误文案：必填字段缺失
导出状态：当前 YAML 未通过校验，导出已暂停（1 个错误）。
预览状态：预览已暂停
```

Sub-agent evaluator 已完成的浏览器验证摘要：

- `/demo` 页面加载成功，顶部存在 `3 分钟演示路线`。
- 初始合法 YAML 预载成功，校验结果为 `校验通过`，预览为 `预览已更新`，导出 YAML/Markdown 按钮可用。
- 点击 `加载坏 YAML` 后，校验面板显示 `project.title` / `必填字段缺失`，预览暂停，导出禁用。
- 点击 `加载合法 YAML` 后，恢复 `校验通过`、`预览已更新` 和导出可用。
- Network 证据：
  - `GET http://127.0.0.1:5173/demo [304]`
  - `examples/screenplay-broken.yaml?import&raw [304]`
  - `examples/screenplay-sample.yaml?import&raw [304]`
  - `examples/novel-sample.md?import&raw [304]`
  - 三次 `POST /api/yaml/validate [200]`，分别覆盖初始合法、坏 YAML、恢复合法。
- Sub-agent screenshot: `H:\tmp\P5-DEMO-003-evaluator-fullpage.png`
- DOM 度量：`hasHorizontalScroll:false`。
- Console 仅有非阻断 `favicon.ico [404]`。

## Generator 验证

- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web typecheck`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/server test`：通过，server 5 个 Vitest 文件 / 28 个 tests。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web test`：通过，web 1 个 Vitest 文件 / 3 个 tests。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' lint`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' build`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui -- apps/web/tests/ui/p5-demo.spec.ts`：通过，Chromium 2 passed。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui`：通过，Playwright Chromium 12 passed。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' verify`：通过，覆盖 typecheck、lint、test、build。

## 自动化覆盖

- `apps/server/tests/yaml-validate-route.test.ts`：
  - `examples/screenplay-sample.yaml` 通过 `/api/yaml/validate`。
  - `examples/screenplay-broken.yaml` YAML 可解析，但校验失败并返回 `project.title` / `必填字段缺失`。
- `apps/web/tests/ui/p5-demo.spec.ts`：
  - `/demo` 预载稳定合法 YAML，校验通过，预览更新，导出可用。
  - `/demo` 点击 `加载坏 YAML` 后显示 `project.title` 错误，预览暂停，导出禁用。
  - `/demo` 点击 `加载合法 YAML` 后恢复校验通过、预览更新和导出可用。

## 视觉检查

| 检查项 | 结果 | 说明 |
| --- | --- | --- |
| 页面非空白 | pass | full-page screenshot 中 demo 路线、小说输入、YAML 编辑器、校验结果和预览区域正常渲染。 |
| 首屏关键内容可见 | pass | `/demo` 面板、合法/坏 YAML 按钮、导出按钮和状态提示均可识别。 |
| 无明显错位或遮挡 | pass | 状态提示在各自面板内，不遮挡输入、预览或按钮。 |
| 无文字溢出或按钮截断 | pass | 长 YAML 内容在 textarea 内滚动，按钮文本未截断。 |
| Loading / 错误态可辨认 | pass | 初始校验、坏 YAML 错误、预览暂停和导出禁用状态均可辨认。 |

## 评分

| 维度 | 分数 | 说明 |
| --- | --- | --- |
| 用户路径完整度 | 5/5 | `/demo` 覆盖合法 YAML、坏 YAML、恢复合法、预览和导出状态。 |
| 数据契约一致性 | 5/5 | 沿用现有 `/api/yaml/validate`，未新增 API 或改弱 schema。 |
| 错误与边界处理 | 5/5 | broken fixture 是真实 YAML 校验失败，错误路径稳定为 `project.title`。 |
| UI 可用性 | 5/5 | 3 分钟路线清晰，按钮和状态可扫描，导出启停语义明确。 |
| 可维护性 | 5/5 | demo assets 独立模块，demo panel 和 validation panel 拆分，App 未超过 lint 行数限制。 |

## 是否放行

Decision: PASS

`pnpm verify` 与 `pnpm test:ui` 均通过；generator 与 evaluator 均使用 Chrome DevTools MCP 完成真实浏览器交互和视觉检查；允许将 `feature_list.json` 中 `P5-DEMO-003.passes` 置为 `true`。

## 非阻断问题

- Chrome DevTools console 中仍可见开发环境 favicon 404，不影响本轮 demo 路径。
- Sub-agent evaluator 试图在主 agent dev server 占用端口时补跑指定 Playwright，用例未执行；主 agent 已在同一工作区成功跑过 `p5-demo.spec.ts` 和完整 `test:ui`，该辅助限制不阻断。
