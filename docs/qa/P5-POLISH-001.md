# Evaluator QA Report

Feature ID: P5-POLISH-001

Date: 2026-06-07

Evaluator agent: 019ea086-aeda-76c1-ab27-665c30e8ac8f

Tooling:

- Chrome DevTools MCP: yes
- Browser: Chrome DevTools MCP attached browser
- Viewport: desktop, `1440px` wide during evaluator layout check

## 复现步骤

1. 从仓库根启动真实 dev server：`C:\nvm4w\nodejs\pnpm.cmd dev`。
2. 使用 Chrome DevTools MCP 打开 `http://127.0.0.1:5173/`。
3. 初始页面确认：默认 3 章小说、`YAML 编辑器` 为 `0` 字符、导出按钮禁用、校验状态为 `未校验`。
4. 将小说输入框替换为 2 章中文小说。
5. 点击“用样例生成”。
6. 确认页面在小说输入区域显示具体提示，YAML 仍为空，校验仍为 `未校验`。
7. 通过 Network 确认仅请求 `/api/chapters/split`，返回 `422 TOO_FEW_CHAPTERS`，没有请求 `/api/screenplay/generate`。
8. 回填 3 章默认样例，再次点击“用样例生成”。
9. 确认页面正常生成 YAML，显示 `校验通过`，剧本预览更新。
10. 刷新后再次复现 2 章负向场景，保存 full-page screenshot 并做视觉检查。
11. 停止本轮启动的 dev server，确认 `5173/8787` 端口释放。

## 截图或日志证据

- Screenshot: `H:\tmp\P5-POLISH-001-fullpage.png`
- Chrome DevTools MCP: 已使用。
- 负向路径 Network 记录：

```text
GET  http://127.0.0.1:5173/                         [304]
POST http://127.0.0.1:5173/api/chapters/split       [422]
```

- 刷新后重新复现 2 章负向场景的干净 Network 记录：

```text
GET  http://127.0.0.1:5173/                         [200]
POST http://127.0.0.1:5173/api/chapters/split       [422]
```

- `/api/chapters/split` 响应体：

```json
{
  "error": {
    "code": "TOO_FEW_CHAPTERS",
    "message": "至少需要 3 个章节，当前识别到 2 个"
  }
}
```

- 端口收尾：evaluator 停止 dev server 后复查 `5173/8787` 均为 `not-listening`。

## 友好提示文本

```text
还差一点：至少需要 3 个章节，当前识别到 2 个。请再补充章节后生成剧本。
```

页面状态证据：

```json
{
  "textareas": [
    { "label": "小说输入", "valueLength": 68 },
    { "label": "YAML 编辑器", "valueLength": 0 }
  ],
  "friendlyMessage": "还差一点：至少需要 3 个章节，当前识别到 2 个。请再补充章节后生成剧本。",
  "validationLines": [
    "还差一点：至少需要 3 个章节，当前识别到 2 个。请再补充章节后生成剧本。",
    "未校验",
    "暂无 YAML。",
    "暂无 YAML。"
  ]
}
```

导出按钮状态：

```json
[
  { "text": "用样例生成", "disabled": false },
  { "text": "导出 YAML", "disabled": true },
  { "text": "导出 Markdown", "disabled": true }
]
```

## 正常路径回归

回填默认 3 章样例后点击“用样例生成”，页面正常完成：

- YAML 编辑器字符数：`3347`
- 校验状态：`校验通过`
- 剧本预览状态：`预览已更新`
- 可见预览包含：`第 1 场 雨夜归来`、`旁白：`、`（内心）`、`切至南街尽头。`

对应 Network 记录：

```text
POST http://127.0.0.1:5173/api/chapters/split          [200]
POST http://127.0.0.1:5173/api/screenplay/generate     [200]
POST http://127.0.0.1:5173/api/yaml/validate           [200]
```

## Generator 验证

- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web typecheck`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web test`：通过，web 1 个 Vitest 文件 / 3 个 tests。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' lint`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui -- apps/web/tests/ui/p5-polish.spec.ts`：通过，Chromium 1 passed。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui`：通过，Playwright Chromium 6 passed。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' verify`：通过，覆盖 typecheck、lint、test、build。

## 自动化覆盖

- `apps/web/tests/ui/p5-polish.spec.ts`：覆盖真实页面 2 章中文小说输入；断言 UI 提示包含 `至少需要 3 个章节` 和 `当前识别到 2 个`；断言 `/api/screenplay/generate` 没有被请求；断言 YAML 编辑器仍为空，校验状态仍为未校验。
- 既有 Playwright 用例继续覆盖 mock generate、P2 request body、P4 editor validation、P4 preview 和 P4 export。

## 视觉检查

| 检查项 | 结果 | 说明 |
| --- | --- | --- |
| 页面非空白 | pass | full-page screenshot 中左右工作区正常渲染。 |
| 首屏关键内容可见 | pass | 小说输入、生成按钮、友好提示、YAML 编辑器、校验结果和预览区域均可识别。 |
| 无明显错位或遮挡 | pass | 2 章提示位于小说输入区域底部，不遮挡按钮或右侧工作区。 |
| 无文字溢出或按钮截断 | pass | 友好提示和按钮文本显示正常。 |
| Loading / 错误态可辨认 | pass | 章节不足提示明确，不被误显示为 YAML 校验通过。 |

DOM 布局指标：

- `innerWidth`: `1440`
- `innerHeight`: `934`
- `scrollWidth`: `1440`
- `scrollHeight`: `934`
- `horizontalOverflow`: `false`
- `overflowingCount`: `0`

Console 观察：

- React DevTools 开发提示：正常开发环境提示。
- `422 Unprocessable Entity`：本轮负向路径的预期错误。
- 一个 `404 Not Found` 静态资源错误，未影响验收路径；页面功能和布局均正常。

## 评分

| 维度 | 分数 | 说明 |
| --- | --- | --- |
| 用户路径完整度 | 5/5 | 2 章输入被拦截，3 章输入回归生成路径正常。 |
| 数据契约一致性 | 5/5 | 复用已验收的 `/api/chapters/split`，未新增或改弱后端契约。 |
| 错误与边界处理 | 5/5 | 提示同时包含硬性要求和当前识别数，且没有进入生成路径。 |
| UI 可用性 | 5/5 | 提示位置清楚、语气友好、无布局破损。 |
| 可维护性 | 5/5 | 前端只新增章节预检查客户端与小范围状态处理，保留既有生成 API。 |

## 是否放行

Decision: PASS

`pnpm verify` 与 `pnpm test:ui` 均通过；evaluator 使用 Chrome DevTools MCP 完成真实浏览器交互、Network 复核、full-page screenshot 和视觉检查；允许将 `feature_list.json` 中 `P5-POLISH-001.passes` 置为 `true`。

## 非阻断问题

- Console 中的 React DevTools 提示和 favicon/static 404 不影响本轮验收路径。
