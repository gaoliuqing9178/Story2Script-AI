# Handoff

## 2026-06-07 Update - Chapter Count Limit Removal

本轮按最新题意解除章节数限制：原题“至少处理三章以上的小说”表示系统至少要能处理 3 章以上长输入，不表示只能处理 3 章以上输入。

当前行为：

- `/api/chapters/split` 不再因少于 3 章返回 `TOO_FEW_CHAPTERS`；1 章、2 章和更多章节都返回 HTTP 200 与有序 `Chapter[]`。
- `/api/screenplay/generate` 的 multi-stage 路径允许 1 章或更多章节；0 章仍返回 `400 BAD_REQUEST`，避免把无来源章节的数据送进 pipeline。
- `source.chapters` 的 YAML schema 下限从 3 改为 1；空章节数组仍非法。
- 前端 generation checking 文案改为 `正在识别章节结构，确认可以进入生成。`，初始文案改为 `等待生成：会先识别章节结构，再调用剧本生成接口。`
- 2 章中文小说现在会通过预检并继续调用 `/api/screenplay/generate`；空输入仍显示 `请先输入小说正文，再生成剧本。`

本轮已修改：

- `apps/server/src/routes/chapters.ts`
- `apps/server/src/routes/screenplay.ts`
- `packages/shared/src/schema.ts`
- `apps/web/src/ui-states.tsx`
- `apps/server/tests/chapter-split-route.test.ts`
- `apps/server/tests/yaml-validate-route.test.ts`
- `apps/server/tests/pipeline-route.test.ts`
- `apps/web/tests/ui/p5-polish.spec.ts`
- `feature_list.json`
- `README.md`
- `AGENTS.md`
- `docs/design.md`
- `docs/engineering.md`
- `docs/yaml-schema.md`
- `docs/contracts/P1-VALIDATE-001.md`
- `docs/contracts/P3-PIPELINE-001.md`
- `docs/contracts/P3-PIPELINE-002.md`
- `docs/contracts/P4-PREVIEW-002.md`
- `docs/contracts/P5-POLISH-001.md`
- `docs/contracts/P5-POLISH-002.md`
- `docs/qa/P1-VALIDATE-001.md`
- `docs/qa/P3-PIPELINE-001.md`
- `docs/qa/P5-POLISH-001.md`
- `docs/qa/P5-POLISH-002.md`

验证记录：

- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/server test`：通过，server 5 个 Vitest 文件 / 30 个 tests。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui -- apps/web/tests/ui/p5-polish.spec.ts`：通过，Chromium 5 passed。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui`：通过，Playwright Chromium 12 passed。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' verify`：通过，覆盖 typecheck、lint、test、build；shared 1 test、server 30 tests、web 3 tests 均通过，build 成功。
- Chrome DevTools MCP 真实浏览器复核：通过。2 章中文小说路径显示 split `[200]`、generate `[200]`、validate `[200]`，页面 `校验通过`、`预览已更新`，截图 `H:\tmp\chapter-limit-removal-fullpage.png`，布局 `horizontalOverflow:false`。
- 首次运行指定 `test:ui` 时旧 dev server 占用 `5173/8787`；确认进程属于当前仓库后已停止并重新验证通过。

注意：

- 本文件后续历史段落中仍会出现旧的 `TOO_FEW_CHAPTERS` / 少于 3 章拦截记录，那些是旧需求下的历史验收证据。当前行为以本节、`feature_list.json` 和更新后的 contracts/QA 为准。

## 2026-06-07 Update - P5-DEMO-003

`P5-DEMO-003` 已正式验收，并在 `feature_list.json` 标记为 `passes:true`。

本轮已实现：

- `examples/screenplay-broken.yaml`：新增 demo 专用 broken YAML fixture，语法可解析，但故意缺失 `project.title`。
- `apps/web/src/demo-assets.ts`：集中导入 demo 小说、稳定合法 YAML 和坏 YAML。
- `apps/web/src/App.tsx`：识别 `/demo` route；`/demo` 初始预载稳定合法 YAML；保留首页 `/` 的 mock 生成路径。
- `apps/web/src/components/DemoRoutePanel.tsx`：新增 `3 分钟演示路线` 面板，提供 `加载合法 YAML`、`加载坏 YAML`、`还原样例小说`。
- `apps/web/src/components/ValidationPanel.tsx`：拆出校验结果面板，避免 `App.tsx` 超过 lint `max-lines`。
- `apps/web/tests/ui/p5-demo.spec.ts`：覆盖 `/demo` 初始合法状态、坏 YAML 校验错误和恢复合法状态。
- `apps/server/tests/yaml-validate-route.test.ts`：新增 broken fixture 校验断言，确认错误路径为 `project.title`。
- `README.md`：补充 demo 地址、fixture 说明和 3 分钟演示节奏。
- `docs/contracts/P5-DEMO-003.md`：本轮 contract。
- `docs/qa/P5-DEMO-003.md`：Chrome DevTools MCP generator/evaluator QA 报告。

当前 `/demo` 语义：

- 打开 `http://127.0.0.1:5173/demo` 后，页面顶部显示 `3 分钟演示路线`。
- 左侧小说输入预载 `examples/novel-sample.md`。
- 右侧 YAML 编辑器预载 `examples/screenplay-sample.yaml`，并通过现有 `/api/yaml/validate` 校验。
- 初始合法状态：`校验通过`、`预览已更新`、`导出 YAML` / `导出 Markdown` 可用。
- 点击 `加载坏 YAML`：加载 `examples/screenplay-broken.yaml`，校验面板显示 `project.title` / `必填字段缺失`，预览暂停，导出禁用。
- 点击 `加载合法 YAML`：恢复合法 fixture，校验、预览和导出恢复可用。
- 本轮没有新增后端 API，没有改变 provider、pipeline、validator、schema 或导出语义。

验证记录：

- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web typecheck`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/server test`：通过，server 5 个 Vitest 文件 / 28 个 tests。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web test`：通过，web 1 个 Vitest 文件 / 3 个 tests。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' lint`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' build`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui -- apps/web/tests/ui/p5-demo.spec.ts`：通过，Chromium 2 passed。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui`：通过，Playwright Chromium 12 passed。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' verify`：通过，覆盖 typecheck、lint、test、build。
- generator Chrome DevTools MCP 复核：PASS。
  - Network 显示三次 `POST /api/yaml/validate [200]`，分别对应初始合法、坏 YAML、恢复合法。
  - full-page screenshot：`H:\tmp\P5-DEMO-003-fullpage.png`。
  - 布局指标：`horizontalOverflow:false`、`clippedCount:0`。
- evaluator 子代理 `019ea0d9-a041-7d50-ba8d-0d9af663168e`：PASS。
  - Screenshot：`H:\tmp\P5-DEMO-003-evaluator-fullpage.png`。
  - 确认坏 YAML 返回 `project.title` / `必填字段缺失`。
  - 视觉检查通过，非阻断项仅有 favicon 404。

当前状态：

- `P0-E2E-001`、`P0-INFRA-002`、`P1-VALIDATE-001`、`P1-VALIDATE-002`、`P2-LLM-001`、`P3-PIPELINE-001`、`P3-PIPELINE-002`、`P4-EDITOR-001`、`P4-PREVIEW-002`、`P4-EXPORT-003`、`P5-POLISH-001`、`P5-POLISH-002`、`P5-DEMO-003` 均已正式验收，并在 `feature_list.json` 标记为 `passes:true`。
- MVP feature list 当前已全部通过。

后续建议：

- 如果继续打磨，可优先补 demo 视频脚本/录屏材料，但这已不属于 `P5-DEMO-003` 的代码验收阻断项。
- 不要回退 `P5-DEMO-003.passes`，除非发现上述真实验证路径失效。

## 2026-06-07 Update - P5-POLISH-002

`P5-POLISH-002` 已正式验收，并在 `feature_list.json` 标记为 `passes:true`。

本轮已实现：

- `apps/web/src/App.tsx`：新增 generation 子阶段状态、生成请求防重入、generation 状态提示、export 状态提示、validation request error 稳定测试标识；两个 textarea 补 `id/name`。
- `apps/web/src/ui-states.tsx`：集中维护 generation、validation、export 状态文案，以及 generation / validation 请求错误的阶段路径格式化。
- `apps/web/src/download.ts`：拆出下载文件、导出文件名和结尾换行 helper，保持 `App.tsx` 行数和职责收敛。
- `apps/web/tests/ui/p5-polish.spec.ts`：扩展到 5 个 Playwright 用例，覆盖少于 3 章拦截、慢生成 loading、防重复提交、生成 500、导出空态、校验中导出暂停、校验 500、业务校验失败导出暂停。
- `docs/contracts/P5-POLISH-002.md`：本轮 contract。
- `docs/qa/P5-POLISH-002.md`：Chrome DevTools MCP generator/evaluator QA 报告。

当前状态语义：

- generation 初始空态：`等待生成：会先检查章节数量，再调用剧本生成接口。`
- generation 章节预检中：`正在检查章节数量，确认至少 3 个章节后再进入生成。`
- generation 生成中：`正在生成剧本 YAML，请稍等，按钮已暂时锁定。`
- generation 完成：`最近一次生成已完成，YAML 已进入右侧工作区。`
- generation 失败：`生成没有完成，请看下方具体阶段提示。`
- `/api/screenplay/generate` 非 2xx：显示 `剧本生成阶段失败（/api/screenplay/generate）：<message>`。
- `/api/yaml/validate` 非 2xx：显示 `校验阶段失败（/api/yaml/validate）：<message>`。
- export 空态：`暂无可导出的 YAML。生成并通过校验后可导出 YAML 或 Markdown。`
- export 校验中：`校验中，导出暂不可用。`
- export 校验请求失败：`校验请求失败，导出已暂停。`
- export 业务校验失败：`当前 YAML 未通过校验，导出已暂停（N 个错误）。`
- export 可用：`可导出 YAML 或 Markdown。`

本轮明确没有修改：

- 后端 API、provider、pipeline、validator、YAML schema。
- `examples/*` demo fixture。
- P5-POLISH-001 的少于 3 章拦截语义。
- P5-DEMO-003 的 demo 资产、README 或 demo route。

验证记录：

- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web typecheck`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web test`：通过，web 1 个 Vitest 文件 / 3 个 tests。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' lint`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui -- apps/web/tests/ui/p5-polish.spec.ts`：通过，Chromium 5 passed。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui`：通过，Playwright Chromium 10 passed。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' verify`：通过，覆盖 typecheck、lint、test、build。
- generator Chrome DevTools MCP 复核：PASS。
  - 初始空态、慢生成、正常生成、业务校验失败、校验请求失败、生成请求失败均已覆盖。
  - full-page screenshot：`H:\tmp\P5-POLISH-002-fullpage.png`。
  - 布局指标：`scrollWidth === innerWidth`，无横向溢出。
- evaluator 子代理 `019ea0b9-cb51-7ac0-b6f4-878ba2fe580b`：PASS。
  - 使用 Chrome DevTools MCP 完成真实页面交互、延迟/错误模拟、full-page screenshot 和视觉检查。
  - Screenshot：`H:\tmp\P5-POLISH-002-evaluator-fullpage.png`。
  - 慢生成双击后只有 1 次 `/api/screenplay/generate`。
  - evaluator 补跑 `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui -- apps/web/tests/ui/p5-polish.spec.ts`：通过，5 passed。
  - evaluator 停止本轮 dev server 后确认 `5173/8787` 均无 `Listen`。

当前状态：

- `P0-E2E-001`、`P0-INFRA-002`、`P1-VALIDATE-001`、`P1-VALIDATE-002`、`P2-LLM-001`、`P3-PIPELINE-001`、`P3-PIPELINE-002`、`P4-EDITOR-001`、`P4-PREVIEW-002`、`P4-EXPORT-003`、`P5-POLISH-001`、`P5-POLISH-002` 已正式验收，并在 `feature_list.json` 标记为 `passes:true`。
- `P5-DEMO-003` 仍为 `passes:false`。

下一轮建议：

- 优先做 `P5-DEMO-003`：补稳定 demo 资产、broken YAML fixture、README 和 3 分钟 demo route。
- 不要回退 `P5-POLISH-002.passes`，除非发现上述真实验证路径失效。

## 2026-06-07 Update - P5-POLISH-001

`P5-POLISH-001` 已正式验收，并在 `feature_list.json` 标记为 `passes:true`。

本轮已实现：

- `apps/web/src/api/chapters.ts`：新增章节切分客户端，调用 `POST /api/chapters/split`，并通过 `ChapterSplitError` 保留后端 `status` 与 `error.code`。
- `apps/web/src/App.tsx`：点击“用样例生成”时先做章节数预检查；少于 3 章时在 `小说输入` 面板显示友好提示，并阻止调用 `/api/screenplay/generate`。
- `apps/web/tests/ui/p5-polish.spec.ts`：Playwright 覆盖 2 章中文小说负向路径，断言提示包含最低章节数和当前识别数，且 generate API 未被调用。
- `docs/contracts/P5-POLISH-001.md`：本轮 contract。
- `docs/qa/P5-POLISH-001.md`：Chrome DevTools MCP evaluator QA 报告。

当前输入拦截语义：

- 前端复用已验收的 `POST /api/chapters/split`，本轮不新增后端 API，也不改变 `/api/screenplay/generate` 契约。
- 少于 3 章时，页面显示：`还差一点：至少需要 3 个章节，当前识别到 2 个。请再补充章节后生成剧本。`
- 少于 3 章时，本次点击不会进入 LLM/mock 生成路径；YAML 编辑器保持原状态。当前负向用例覆盖空 YAML 时仍为空，校验状态仍为 `未校验`。
- 默认 3 章样例仍正常回归：先 `/api/chapters/split [200]`，再 `/api/screenplay/generate [200]`，随后 `/api/yaml/validate [200]`。
- 本轮没有修改后端切章规则、provider、pipeline、validator 或 `examples/*`。

验证记录：

- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web typecheck`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web test`：通过，web 1 个 Vitest 文件 / 3 个 tests。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' lint`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui -- apps/web/tests/ui/p5-polish.spec.ts`：通过，Chromium 1 passed。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui`：通过，Playwright Chromium 6 passed。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' verify`：通过，覆盖 typecheck、lint、test、build。
- evaluator 子代理 `019ea086-aeda-76c1-ab27-665c30e8ac8f`：PASS。
  - 使用 Chrome DevTools MCP 完成真实页面交互、Network 复核、full-page screenshot 和视觉检查。
  - 2 章负向路径 Network 只有 `POST /api/chapters/split [422]`，没有 `/api/screenplay/generate`。
  - `/api/chapters/split` 响应为 `TOO_FEW_CHAPTERS`，message 为 `至少需要 3 个章节，当前识别到 2 个`。
  - YAML 编辑器 `valueLength: 0`，校验状态为 `未校验`，导出按钮保持 disabled。
  - 3 章默认样例回归通过，YAML 字符数 `3347`，校验通过，预览已更新。
  - Screenshot：`H:\tmp\P5-POLISH-001-fullpage.png`。
  - 布局检查 PASS：页面非空白，无明显错位、遮挡、文字溢出、按钮截断或横向滚动。
  - evaluator 停止本轮 dev server 后确认 `5173/8787` 端口释放。

当前状态：

- `P0-E2E-001`、`P0-INFRA-002`、`P1-VALIDATE-001`、`P1-VALIDATE-002`、`P2-LLM-001`、`P3-PIPELINE-001`、`P3-PIPELINE-002`、`P4-EDITOR-001`、`P4-PREVIEW-002`、`P4-EXPORT-003`、`P5-POLISH-001` 已正式验收，并在 `feature_list.json` 标记为 `passes:true`。
- `P5-POLISH-002` 与 `P5-DEMO-003` 仍为 `passes:false`。
- `H:\tmp\P5-POLISH-001-fullpage.png` 是本轮 QA 证据，不属于仓库内交付产物。

下一轮建议：

- 若继续用户体验收口，优先做 `P5-POLISH-002`：统一 generation、validation、export 路径的 loading、empty、error 状态。
- 若准备演示包，做 `P5-DEMO-003`：补稳定 demo 资产、broken YAML fixture、README 和 3 分钟 demo route。
- 不要回退 `P5-POLISH-001.passes`，除非发现上述真实验证路径失效。

## 2026-06-07 Update - P4-EXPORT-003

`P4-EXPORT-003` 已正式验收，并在 `feature_list.json` 标记为 `passes:true`。

本轮已实现：

- `apps/web/src/render/screenplay.ts`：新增 `buildScreenplayMarkdown(screenplay)`，复用现有 `buildScreenplayPreview` 的场景排序、角色/地点反查和 beat 映射语义。
- `apps/web/src/render/screenplay.test.ts`：Vitest 覆盖 Markdown 输出，确认项目标题、场景标题、地点、动作、对白、旁白、转场和内心独白可读。
- `apps/web/src/App.tsx`：在 `YAML 编辑器` 面板标题区新增 `导出 YAML` 和 `导出 Markdown`；只有当前 YAML 非空、校验空闲且 `validation.valid === true` 时按钮才启用。
- `apps/web/tests/ui/p4-export.spec.ts`：Playwright 覆盖真实页面下载路径，确认 `.yaml` 可解析且 `.md` 包含可读场景和 beat 文本。
- `docs/contracts/P4-EXPORT-003.md`：本轮 contract。
- `docs/qa/P4-EXPORT-003.md`：Chrome DevTools MCP evaluator QA 报告。

当前导出语义：

- `yaml` textarea value 仍是前端 YAML 的唯一事实源。
- YAML 导出直接下载当前 `YAML 编辑器` 内容，并补齐结尾换行。
- Markdown 导出先用 `parseScreenplayYaml(yaml)` 解析当前 YAML，再用 `buildScreenplayMarkdown` 生成 `.md`。
- 文件名优先使用 `project.title`，并清理 Windows 文件名不安全字符；无标题时回退为 `story2script-screenplay`。
- 无 YAML、校验中、校验请求失败或 `validation.valid !== true` 时，导出按钮保持 disabled。
- 本轮没有新增后端 API，没有修改后端 validator，没有改动 `examples/*`。

验证记录：

- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web typecheck`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web test`：通过，web 1 个 Vitest 文件 / 3 个 tests。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' lint`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui -- apps/web/tests/ui/p4-export.spec.ts`：通过，Chromium 1 passed。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui`：通过，Playwright Chromium 5 passed。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' verify`：通过，覆盖 typecheck、lint、test、build。
- generator Chrome DevTools MCP 复核：打开真实页面、生成样例、确认按钮启用、真实点击两个导出按钮、读取下载文件内容并截图。
- evaluator 子代理 `019ea056-e0a2-79b3-8bff-872c7f35a6bc`：PASS。
  - Screenshot：`H:\tmp\P4-EXPORT-003-fullpage.png`。
  - 下载证据：`C:\Users\lx8nb\Downloads\雨夜归来 (1).yaml`，`C:\Users\lx8nb\Downloads\雨夜归来 (1).md`。
  - YAML 可解析，六个顶层键均存在，`sceneCount === 3`。
  - Markdown 包含项目标题、第一场标题、动作、对白角色、旁白、转场和内心独白。
  - 视觉检查 PASS：页面非空白，无明显错位、遮挡、文字溢出、按钮截断或横向滚动。
  - evaluator 停止本轮 dev server 后确认 `5173/8787` 端口释放。

当前状态：

- `P0-E2E-001`、`P0-INFRA-002`、`P1-VALIDATE-001`、`P1-VALIDATE-002`、`P2-LLM-001`、`P3-PIPELINE-001`、`P3-PIPELINE-002`、`P4-EDITOR-001`、`P4-PREVIEW-002`、`P4-EXPORT-003` 已正式验收，并在 `feature_list.json` 标记为 `passes:true`。
- `P5-POLISH-001`、`P5-POLISH-002`、`P5-DEMO-003` 仍为 `passes:false`。
- `H:\tmp\P4-EXPORT-003-fullpage.png` 与 Downloads 中的 `雨夜归来*.yaml/.md` 是本轮 QA 证据，不属于仓库内交付产物。

下一轮建议：

- 若继续做用户体验收口，优先做 `P5-POLISH-001`：少于 3 章输入在前端用户路径中友好拦截。
- 若继续打磨状态边界，做 `P5-POLISH-002`：generation、validation、export 路径的 loading、empty、error 状态统一检查。
- 若准备演示包，做 `P5-DEMO-003`：补稳定 demo 资产、broken YAML fixture、README 和 3 分钟 demo route。
- 不要回退 `P4-EXPORT-003.passes`，除非发现上述真实验证路径失效。

## 2026-06-06 Update - P4-PREVIEW-002

`P4-PREVIEW-002` 已正式验收，并在 `feature_list.json` 标记为 `passes:true`。

本轮已实现：

- `apps/web/src/render/screenplay.ts`：前端 YAML 解析与预览数据映射；反查角色名、地点名；按 scene order 排序。
- `apps/web/src/render/screenplay.test.ts`：Vitest 覆盖场景头部数据和 action/dialogue/narration/transition/inner_voice 五类 beat 映射。
- `apps/web/src/components/ScreenplayPreview.tsx`：新增独立 `剧本预览` 面板；只在当前 YAML 校验通过且校验空闲时渲染；校验中、请求失败或业务校验失败时显示暂停态。
- `apps/web/src/App.tsx`：将 `ScreenplayPreview` 接入右侧工作区，继续复用当前 YAML editor textarea value 作为事实源。
- `apps/web/package.json` 与 `pnpm-lock.yaml`：web 显式依赖 `js-yaml` 和 `@types/js-yaml`，用于前端解析已校验通过的 YAML。
- `apps/web/tests/ui/p4-preview.spec.ts`：Playwright 覆盖预览场景头部、五类 beat 和校验失败暂停态。
- `docs/contracts/P4-PREVIEW-002.md`：本轮 contract。
- `docs/qa/P4-PREVIEW-002.md`：Chrome DevTools MCP evaluator QA 报告。

当前前端预览语义：

- `yaml` textarea value 仍是前端 YAML 的事实源。
- `validation.valid === true` 且 `validationStatus === 'idle'` 时，`ScreenplayPreview` 使用 `js-yaml` 解析当前 YAML 并渲染预览。
- 场景头部显示：
  - `第 N 场 <title>`
  - `地点：<locations[].name>`
  - `时间：<scene.time 或 未标注>`
  - `人物：<characters[].name>`
- 五类 beat 渲染：
  - `action`：动作段落。
  - `dialogue`：角色名 + 对白。
  - `narration`：`旁白：` 前缀。
  - `transition`：居中转场文本。
  - `inner_voice`：`（内心）角色名` + 内容。
- YAML 为空时显示暂无 YAML；校验中显示预览暂不更新；校验请求失败或 `valid:false` 时显示 `预览已暂停`。

验证记录：

- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web typecheck`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web test`：通过，web 1 个 Vitest 文件 / 2 个 tests。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' lint`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui`：通过，Playwright Chromium 4 passed。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' verify`：通过，覆盖 typecheck、lint、test、build。
- evaluator 子代理 `019e9d9c-de7d-7db2-87a6-9e29323b116f`：PASS。
  - 使用 Chrome DevTools MCP 打开真实页面并截图。
  - 截图路径：`H:\tmp\P4-PREVIEW-002-fullpage.png`。
  - 点击“用样例生成”后，YAML 编辑器从 `0` 字符更新到 `3347` 字符，校验通过，预览显示 `预览已更新`。
  - 场景头部包含 `第 1 场 雨夜归来`、`地点：旧火车站`、`时间：夜晚`、`人物：林舟、沈念`。
  - action/dialogue/narration/transition/inner_voice 五类 beat 均可读可见。
  - 破坏 YAML 后，校验面板显示 `project.title` 与 `必填字段缺失`，预览显示 `预览已暂停` 和 `当前 YAML 未通过校验，预览已暂停。`
  - 视觉检查 PASS；无明显错位、遮挡、按钮截断、文字溢出或横向滚动。

下一轮建议：

- 若继续 Phase 4，优先做 `P4-EXPORT-003`：复用当前 YAML editor 的事实源，导出 `.yaml`；Markdown 导出可复用本轮预览映射语义。
- 若优先补硬性题目输入边界，做 `P5-POLISH-001`：把少于 3 章拦截和友好提示接到前端用户路径。
- 不要回退 `P4-PREVIEW-002.passes`，除非发现上述真实验证路径失败。

## 2026-06-06 Update - P4-EDITOR-001

`P4-EDITOR-001` 已正式验收，并在 `feature_list.json` 标记为 `passes:true`。

本轮已实现：

- `apps/web/src/api/screenplay.ts`：新增 `validateYaml(yaml)`，调用 `POST /api/yaml/validate`；生成 API 失败时优先读取后端 error message。
- `apps/web/src/App.tsx`：右侧 YAML 输出改为可编辑 textarea；新增 validation 状态、350ms 防抖校验、错误/警告面板；编辑期间显示 `校验中...`，校验完成后展示精确 path + message。
- `apps/web/tests/ui/smoke.spec.ts`：适配 YAML textarea value。
- `apps/web/tests/ui/p2-evaluator.spec.ts`：用明确 aria label 定位小说输入和生成按钮，避免新增 textarea 后定位歧义。
- `apps/web/tests/ui/p4-editor.spec.ts`：覆盖生成 YAML、直接编辑、删除 `project.title`、防抖校验和精确错误展示。
- `docs/contracts/P4-EDITOR-001.md`：本轮 contract。
- `docs/qa/P4-EDITOR-001.md`：Chrome DevTools MCP evaluator QA 报告。

当前前端语义：

- 点击“用样例生成”后，`POST /api/screenplay/generate` 返回的 YAML 会进入右侧 `YAML 编辑器`。
- `yaml` textarea value 是前端 YAML 的事实源。
- YAML 非空时，编辑后 350ms 防抖调用 `POST /api/yaml/validate`。
- 校验面板展示：
  - 空态：未校验 / 暂无 YAML。
  - 进行中：`校验中...`。
  - 通过：`校验通过` 和 `结构与引用校验通过。`
  - 失败：逐条显示 `errors[].path` 和 `errors[].message`。
  - warnings：逐条显示 `warnings[].path` 和 `warnings[].message`。

验证记录：

- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web typecheck`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web test`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' lint`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' verify`：通过，覆盖 typecheck、lint、test、build。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui`：通过，Playwright Chromium 3 passed。
- evaluator 子代理 `019e9d01-64e9-7390-b4ea-1365e1734420`：PASS。
  - 使用 Chrome DevTools MCP 打开真实页面并截图。
  - 截图路径：`H:\tmp\P4-EDITOR-001-fullpage.png`。
  - 点击“用样例生成”后，YAML 编辑器出现 mock YAML 且校验结果最终通过。
  - 删除 `  title: "雨夜归来"` 后，防抖完成显示 `project.title` 和 `必填字段缺失`。
  - 视觉检查 PASS；无明显错位、遮挡、按钮截断、文字溢出或横向滚动。

下一轮建议：

- 若继续 Phase 4，优先做 `P4-PREVIEW-002`：复用当前 YAML editor 的事实源，在 validation pass 时渲染 action/dialogue/narration/transition/inner_voice 五类 beat。
- 若优先补可交付导出，做 `P4-EXPORT-003`；不要把 preview/export 混进 `P4-EDITOR-001` 回改。
- 不要回退 `P4-EDITOR-001.passes`，除非发现上述真实验证路径失败。

## 2026-06-06 Update - P3-PIPELINE-002

`P3-PIPELINE-002` 已正式验收，并在 `feature_list.json` 标记为 `passes:true`。

本轮已实现：

- `apps/server/src/pipeline/prompts.ts`：analysis、bible、scene generation、repair stage prompts 和 marker。
- `apps/server/src/pipeline/types.ts`：multi-stage pipeline 与 screenplay bible 类型。
- `apps/server/src/pipeline/json.ts`：provider JSON 解析和字段读取 helper。
- `apps/server/src/pipeline/analyze.ts`：逐章分析。
- `apps/server/src/pipeline/bible.ts`：剧本圣经生成。
- `apps/server/src/pipeline/multistage.ts`：analysis -> bible -> scene generation -> validation -> repair 编排。
- `apps/server/src/pipeline/repair.ts`：bounded YAML repair。
- `apps/server/src/routes/request-utils.ts`：route 入参解析复用。
- `apps/server/src/routes/chapters.ts`：`POST /api/chapters/analyze` 真实路由。
- `apps/server/src/routes/screenplay.ts`：`POST /api/screenplay/generate` 支持 multi-stage pipeline，同时保留 P2 单阶段路径。
- `apps/server/src/routes/yaml.ts`：`POST /api/yaml/repair` 真实 bounded repair 路由。
- `apps/server/src/provider/mock.ts`：mock provider 支持 analysis/bible/scene-generation/repair stage 输出。
- `apps/server/src/provider/openai.ts`：通用剥离 code fence，兼容 JSON/YAML 阶段输出。
- `apps/server/tests/pipeline-route.test.ts`：真实 Express app 覆盖 multi-stage pipeline 与 repair 上限。
- `docs/contracts/P3-PIPELINE-002.md`：本轮 contract。
- `docs/qa/P3-PIPELINE-002.md`：Chrome DevTools MCP evaluator QA 报告。

当前 API 语义：

- `POST /api/chapters/analyze`
  - 请求体必须提供 `chapters: Chapter[]`，否则返回 `400 BAD_REQUEST`。
  - 返回 `{ analyses: ChapterAnalysis[] }`。
- `POST /api/screenplay/generate`
  - 不传 `chapters`/`analyses`：保留 P2 单阶段 generate 行为。
  - 传入 `chapters` 或 `analyses`：运行 multi-stage pipeline。
  - 章节数少于 3 个时返回 `422 TOO_FEW_CHAPTERS`。
  - pipeline response 返回 `yaml`、`validation` 和 `pipeline` metadata：
    - `analyses`
    - `bible`
    - `initial_validation`
    - `repair_attempts`
    - `max_repair_attempts`
- `POST /api/yaml/repair`
  - 请求体必须提供 `yaml: string`，否则返回 `400 BAD_REQUEST`。
  - 会先运行本地 validator，再按 `repair_max_retries` 或 `REPAIR_MAX_RETRY` 做 bounded repair。
  - 默认 repair 上限为 2，最大钳制到 5。

验证记录：

- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/server test`：通过，server 5 files / 27 tests。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' lint`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' verify`：通过，覆盖 typecheck、lint、test、build。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui`：通过，Playwright Chromium 2 passed。
- evaluator 子代理 `019e9c16-525e-78a2-9d49-108f9da2b6f7`：PASS。
  - 使用 Chrome DevTools MCP 打开真实页面并截图。
  - 截图路径：`H:\tmp\P3-PIPELINE-002-fullpage.png`。
  - 在浏览器上下文里用 `fetch` 验证 5 章 split、analyze、generate、repair。
  - `generate` 返回 `validation.valid === true`、`pipeline.analyses.length === 5`、`pipeline.bible`、`pipeline.initial_validation`、数字类型 `repair_attempts`。
  - 删除 `project.title` 后调用 `/api/yaml/repair`，`repair.attempts === 1` 且 `validation.valid === true`。

下一轮建议：

- 若继续 Phase 4，优先做 `P4-EDITOR-001`：把当前 `/api/yaml/validate` 和 `/api/yaml/repair` 接入前端 YAML 编辑体验。
- 若继续可读输出，做 `P4-PREVIEW-002`：复用 generate 返回的 YAML，渲染 action/dialogue/narration/transition/inner_voice 五类 beat。
- 不要回退 `P3-PIPELINE-002.passes`，除非发现上述真实验证路径失败。

## 2026-06-06 Update - P3-PIPELINE-001

`P3-PIPELINE-001` 已正式验收，并在 `feature_list.json` 标记为 `passes:true`。

本轮已实现：

- `apps/server/src/pipeline/split.ts`：本地章节切分纯函数，不调用 LLM。
- `apps/server/src/routes/chapters.ts`：`POST /api/chapters/split` 真实路由。
- `apps/server/src/routes/index.ts`：挂载 `chaptersRouter`。
- `apps/server/tests/chapter-split-route.test.ts`：真实 Express app route tests，覆盖 7 个用例。
- `docs/contracts/P3-PIPELINE-001.md`：本轮 contract。
- `docs/qa/P3-PIPELINE-001.md`：Chrome DevTools MCP evaluator QA 报告。

当前 `/api/chapters/split` 语义：

- 请求体必须提供非空字符串 `text`，否则返回 `400 BAD_REQUEST`。
- 支持中文章节标题：如 `第一章 雨夜归来`、`第 1 章 雨夜归来`。
- 支持英文 `Chapter` 标题：如 `Chapter 1 The Return`。
- 支持 Markdown 标题中的章节标题：如 `# 第一章 雨夜归来`、`## Chapter 2 The Letter`。
- 支持 `---chapter---` 分隔符：
  - 每章前置分隔符可以识别。
  - 章节之间分隔符也可以识别。
- 返回 `Chapter[]`：`id`、`title`、`order`、`content`、`word_count`。
- 有效章节少于 3 个时返回 `422 TOO_FEW_CHAPTERS`，message 形如 `至少需要 3 个章节，当前识别到 2 个`。

验证记录：

- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/server test`：通过，server 4 files / 24 tests。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' typecheck`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' lint`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' verify`：通过，覆盖 typecheck、lint、test、build。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui`：通过，Playwright Chromium 2 passed。
- evaluator 子代理 `019e9bd0-8a5b-7a30-ab2c-e05c21b089b9`：PASS。
  - 使用 Chrome DevTools MCP 打开真实页面并截图。
  - 在浏览器上下文里用 `fetch('/api/chapters/split')` 验证中文、英文、Markdown、`---chapter---`、少于 3 章 422。
  - 补充复核 `---chapter---` 只放在章节之间的边界，结果 PASS。

下一轮建议：

- 若继续 Phase 3，优先做 `P3-PIPELINE-002`：复用 `splitChapters` 作为第 1 阶段，继续实现 analyze -> bible -> generate -> validate -> bounded repair。
- 若优先补用户错误提示，可做 `P5-POLISH-001`：把 `TOO_FEW_CHAPTERS` 的友好提示接到前端 UI；不要把它混进 `P3-PIPELINE-001` 回改。
- 不要回退 `P3-PIPELINE-001.passes`，除非发现上述真实验证路径失败。

## 2026-06-06 Update - P2-LLM-001

`P2-LLM-001` 已正式验收，并在 `feature_list.json` 标记为 `passes:true`。

本轮已实现：

- `apps/server/src/provider/openai.ts`：OpenAI-compatible `/chat/completions` provider，读取 `OPENAI_API_KEY`、`OPENAI_BASE_URL`、`OPENAI_MODEL`。
- `apps/server/src/routes/screenplay.ts`：openai 模式下接收小说文本，构造单阶段 novel-to-YAML prompt，provider 返回后立即执行现有 YAML validator。
- `apps/web/src/api/screenplay.ts` 与 `apps/web/src/App.tsx`：已有小说输入文本会作为 `novel` 传给 generate API；mock 路径仍保持稳定。
- `apps/server/tests/screenplay-route.test.ts`：真实 Express route + 本地 OpenAI-compatible fake server 覆盖成功、坏 YAML validation、缺小说文本、缺 key、mock 回归。
- `apps/web/tests/ui/p2-evaluator.spec.ts`：Playwright evaluator 覆盖浏览器编辑小说输入后，请求体带完整 `novel` 的路径。
- `docs/contracts/P2-LLM-001.md` 与 `docs/qa/P2-LLM-001.md`：本轮 contract 与 QA 证据。
- 子代理 evaluator `019e9bc2-4016-73c3-954d-062cd3a0b435` 已独立复核 `test:ui`、server test、`verify`，结论 PASS，详情见 `docs/qa/P2-LLM-001.md`。

当前 `/api/screenplay/generate` 的语义：

- 默认 `LLM_PROVIDER=mock`：继续读取 `examples/screenplay-sample.yaml`，不需要小说文本，也会返回完整 `validation`。
- `LLM_PROVIDER=openai`：请求体必须提供 `novel`、`novel_text` 或 `text`；缺失时返回 `400 BAD_REQUEST`。
- openai provider 成功返回后，route 会剥离可能出现的 YAML code fence，并立即返回 `{ yaml, validation }`。
- provider 配置缺失、请求失败、非 JSON 响应或缺少 message content 时返回 `502 LLM_UNAVAILABLE`。

验证记录：

- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/server test`：通过，server 3 个 test files、17 个 tests。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' verify`：通过，覆盖 typecheck、lint、test、build。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui`：通过，Playwright Chromium 2 passed；子代理 evaluator 独立复跑同样通过。

下一轮建议：

- 继续 Phase 3 时，可从 `P3-PIPELINE-001` 开始做 chapter split 与少于 3 章的 422 拦截。
- 继续 LLM 深化时，可从 `P3-PIPELINE-002` 开始拆多阶段 pipeline 和 bounded repair；不要把 `P2-LLM-001` 的 passes 回退，除非发现真实验证失败。

## 2026-06-06 Update - P1-VALIDATE-002

`P1-VALIDATE-002` 已正式验收，并在 `feature_list.json` 标记为 `passes:true`。

本轮已实现：

- `apps/server/src/validate/reference.ts`：应用层 reference validation。
- `apps/server/src/validate/structural.ts`：结构校验通过后串联应用层校验。
- `apps/server/tests/yaml-validate-route.test.ts`：真实 Express route 覆盖引用错误、条件 speaker、重复 ID、章节覆盖 warning。
- `docs/contracts/P1-VALIDATE-002.md` 与 `docs/qa/P1-VALIDATE-002.md`：本轮 contract 与 QA 证据。

当前 `/api/yaml/validate` 的语义：

- YAML parse 或 AJV structural validation 失败时，不继续跑应用层引用校验。
- 结构通过后，引用错误、缺 speaker、重复 ID 进入 `errors`，并让 `valid:false`。
- 未覆盖章节进入 `warnings`，不阻断 `valid:true`。

验证记录：

- `C:\nvm4w\nodejs\pnpm.cmd --filter @story2script/server test`：通过，server 3 个 test files、13 个 tests。
- `C:\nvm4w\nodejs\pnpm.cmd verify`：通过，覆盖 typecheck、lint、test、build。

下一轮建议：

- 若继续 Phase 1/2，可从 `P2-LLM-001` 开始，把 provider 生成结果接入当前完整校验入口。
- 若优先补 pipeline，可从 `P3-PIPELINE-001` 开始做 chapter split；不要把 `P1-VALIDATE-002` 的 passes 回退，除非发现真实验证失败。

## 当前状态

`P0-E2E-001`、`P0-INFRA-002`、`P1-VALIDATE-001`、`P1-VALIDATE-002`、`P2-LLM-001`、`P3-PIPELINE-001`、`P3-PIPELINE-002`、`P4-EDITOR-001`、`P4-PREVIEW-002`、`P4-EXPORT-003` 与 `P5-POLISH-001` 已正式验收，并在 `feature_list.json` 标记为 `passes:true`。

当前已证明：Web app 可以通过后端 `POST /api/screenplay/generate` 调用默认 `MockProvider`，读取 `examples/screenplay-sample.yaml`，并在页面展示包含 `schema_version`、`project`、`source`、`characters`、`locations`、`scenes` 的 YAML。

当前也已证明：仓库开发 harness 可重复运行，`pnpm install`、`pnpm verify`、`pnpm test:ui`、`node scripts/read-dev-logs.js` 和 `pnpm logs` 均通过；server 结构化日志已有 Vitest 单测和真实 dev 请求日志证据。

当前还已证明：`POST /api/yaml/validate` 会解析 YAML，并用 AJV 按 `docs/yaml-schema.md` v1.0 的结构契约校验必填字段、枚举、数组结构和 `source.chapters` 至少 3 章；结构通过后会继续执行应用层 reference validation，覆盖引用完整性、条件 speaker、ID 唯一和章节覆盖 warning。`POST /api/screenplay/generate` 现在会在 mock 和 openai 两种 provider 模式下返回 YAML 的完整校验结果。

当前前端已证明：页面右侧 YAML editor 支持直接编辑；编辑后会 350ms 防抖调用 `/api/yaml/validate`；校验面板能显示精确错误路径，例如删除 `project.title` 后显示 `project.title` 和 `必填字段缺失`。

当前前端还已证明：`剧本预览` 会复用当前 YAML editor 的事实源，在 validation pass 时渲染场景头部和 action/dialogue/narration/transition/inner_voice 五类 beat；validation fail 时会显示预览暂停态。

当前前端还已证明：`YAML 编辑器` 可在 validation pass 后导出当前 YAML 和 Markdown 剧本稿；YAML 下载可解析回 `schema_version`、`project`、`source`、`characters`、`locations`、`scenes` 顶层结构，Markdown 下载包含可读场景和 beat 文本。

当前前端还已证明：点击生成前会先调用 `/api/chapters/split` 做章节数预检查；少于 3 章时会在 `小说输入` 面板显示友好、具体的中文提示，并阻止 `/api/screenplay/generate`；默认 3 章样例仍可正常生成、校验和预览。

工作流已更新：generator 每轮只做简单验证；收尾前调用 evaluator 子代理，由 evaluator 使用 Chrome DevTools MCP 做真实交互验证，并截屏进行视觉检查。涉及用户路径的 feature 只有 evaluator QA 放行后才能置 `passes:true`。

## 已搭好的地基

- 根 `AGENTS.md`：项目地图、开工阅读顺序、完成标准。
- `docs/` 补全：开发流程、质量说明、决策记录、交接、排障、contract/QA 模板。
- `feature_list.json`：Phase 0-5 结构化进度表，当前 `P0-E2E-001`、`P0-INFRA-002`、`P1-VALIDATE-001`、`P1-VALIDATE-002`、`P2-LLM-001`、`P3-PIPELINE-001`、`P3-PIPELINE-002`、`P4-EDITOR-001`、`P4-PREVIEW-002`、`P4-EXPORT-003`、`P5-POLISH-001` 为 `passes:true`。
- pnpm workspace：`packages/shared`、`apps/server`、`apps/web`。
- MockProvider：默认读取 `examples/screenplay-sample.yaml`。
- OpenAIProvider：读取 `OPENAI_API_KEY`、`OPENAI_BASE_URL`、`OPENAI_MODEL`，调用 OpenAI-compatible `/chat/completions`，从 `choices[0].message.content` 提取 YAML。
- Playwright smoke：打开首页、点击 mock 生成按钮，并断言六个必需顶层 YAML 字段显示在页面上。
- 结构化日志：server 输出 JSON 行，并提供 `scripts/read-dev-logs.js`。
- `apps/server/src/validate/structural.ts`：AJV structural validation，使用 shared JSON Schema，并在结构通过后串联应用层校验。
- `apps/server/src/validate/reference.ts`：应用层 reference validation，覆盖引用、条件 speaker、ID 唯一和章节覆盖 warning。
- `apps/server/src/routes/yaml.ts`：`POST /api/yaml/validate` 真实结构 + 应用层校验路由。
- `apps/server/tests/logger.test.ts`：断言 `logEvent` 输出可解析 JSON 行，包含时间戳、级别、事件名和请求字段。
- `apps/server/tests/yaml-validate-route.test.ts`：覆盖有效 fixture、缺字段、枚举错误、最小章节数、引用错误、条件 speaker、重复 ID 和章节覆盖 warning。
- `apps/server/tests/screenplay-route.test.ts`：覆盖 mock generate、openai-compatible generate、fenced YAML 剥离、即时 validation、坏 YAML 精确错误、缺小说文本和缺 key。
- `apps/web/tests/ui/p2-evaluator.spec.ts`：覆盖前端把编辑后的小说全文作为 `novel` 传给 generate API。
- `apps/web/tests/ui/p4-editor.spec.ts`：覆盖直接编辑 YAML、删除 `project.title`、防抖校验和精确错误展示。
- `apps/web/src/render/screenplay.test.ts`：覆盖剧本预览数据映射和五类 beat。
- `apps/web/tests/ui/p4-preview.spec.ts`：覆盖预览场景头部、五类 beat 和校验失败暂停态。
- `apps/web/tests/ui/p4-export.spec.ts`：覆盖 YAML / Markdown 下载路径和下载内容核对。
- `apps/web/src/api/chapters.ts`：前端章节切分 API 客户端，用于生成前预检查。
- `apps/web/tests/ui/p5-polish.spec.ts`：覆盖少于 3 章输入的友好拦截、generate 未调用、YAML 空态和校验未校验。
- `docs/contracts/P0-E2E-001.md`：mock E2E contract。
- `docs/qa/P0-E2E-001.md`：mock E2E QA PASS 证据。
- `docs/contracts/P0-INFRA-002.md`：开发 harness contract。
- `docs/qa/P0-INFRA-002.md`：开发 harness QA PASS 证据。
- `docs/contracts/P1-VALIDATE-001.md`：AJV structural validation contract。
- `docs/qa/P1-VALIDATE-001.md`：AJV structural validation QA PASS 证据。
- `docs/contracts/P1-VALIDATE-002.md`：Application-layer validation contract。
- `docs/qa/P1-VALIDATE-002.md`：Application-layer validation QA PASS 证据。
- `docs/contracts/P2-LLM-001.md`：OpenAI-compatible single-stage generation contract。
- `docs/qa/P2-LLM-001.md`：OpenAI-compatible single-stage generation QA PASS 证据。
- `docs/contracts/P3-PIPELINE-001.md`：chapter split contract。
- `docs/qa/P3-PIPELINE-001.md`：chapter split QA PASS 证据。
- `docs/contracts/P3-PIPELINE-002.md`：multi-stage pipeline contract。
- `docs/qa/P3-PIPELINE-002.md`：multi-stage pipeline QA PASS 证据。
- `docs/contracts/P4-EDITOR-001.md`：YAML editor validation contract。
- `docs/qa/P4-EDITOR-001.md`：YAML editor validation QA PASS 证据。
- `docs/contracts/P4-PREVIEW-002.md`：screenplay preview contract。
- `docs/qa/P4-PREVIEW-002.md`：screenplay preview QA PASS 证据。
- `docs/contracts/P4-EXPORT-003.md`：YAML / Markdown export contract。
- `docs/qa/P4-EXPORT-003.md`：YAML / Markdown export QA PASS 证据。
- `docs/contracts/P5-POLISH-001.md`：input chapter count guard contract。
- `docs/qa/P5-POLISH-001.md`：input chapter count guard QA PASS 证据。

## 下一个 coding agent 从哪里开始

建议从 `P5-POLISH-002` 开始：统一 generation、validation、export 路径的 loading、empty、error 状态。若准备演示资产，则做 `P5-DEMO-003`。

## 已知风险

- 当前 OpenAIProvider 已实现，但自动化验收使用本地 OpenAI-compatible fake server，没有调用真实外部 OpenAI API；接真实模型仍需要本地 `.env` 提供 key、base URL 和 model。
- `validation.valid` 现在代表结构校验和应用层 hard errors 都通过；章节覆盖提示属于 `warnings`，不阻断 `valid:true`。
- 本轮验证依赖 pnpm 可用；Windows PATH 如异常，先按 `docs/runbooks/debug.md` 排查。

## 验证记录

- `& 'C:\nvm4w\nodejs\pnpm.cmd' verify`：本轮通过。覆盖 typecheck、lint、Vitest、build。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui`：本轮通过。Playwright Chromium 6 passed，真实浏览器覆盖 mock route smoke、P2 请求体断言、P4 editor validation、P4 preview、P4 export 和 P5 polish 章节数拦截。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web typecheck`：本轮通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web test`：本轮通过，web 1 个 Vitest 文件 / 3 个 tests。
- `powershell.exe -ExecutionPolicy Bypass -File .\init.ps1`：上一轮通过。脚本会 install、verify、安装 Playwright Chromium、跑 UI smoke。本轮未重复运行。
- `node scripts/read-dev-logs.js`：上一轮通过。能读取 `logs/server-dev.jsonl` 中的结构化 JSON 行。
- `pnpm install`：本轮通过，lockfile up to date；web 显式加入 `js-yaml` 与 `@types/js-yaml`。
- `pnpm logs`：上一轮通过，根脚本别名可读取同一结构化日志入口。

## 重要收尾说明

- `feature_list.json` 当前只有 `P0-E2E-001`、`P0-INFRA-002`、`P1-VALIDATE-001`、`P1-VALIDATE-002`、`P2-LLM-001`、`P3-PIPELINE-001`、`P3-PIPELINE-002`、`P4-EDITOR-001`、`P4-PREVIEW-002`、`P4-EXPORT-003` 与 `P5-POLISH-001` 为 `passes:true`，`P5-POLISH-002` 与 `P5-DEMO-003` 仍为 `false`。
- `P0-E2E-001` 已有 contract/QA 证据，可以作为 Phase 0 mock 端到端基线。
- `P0-INFRA-002` 已有 contract/QA 证据，可以作为仓库开发 harness 基线。
- `P1-VALIDATE-001` 已有 contract/QA 证据，可以作为 Phase 1 结构校验基线。
- `P1-VALIDATE-002` 已有 contract/QA 证据，可以作为 Phase 1 应用层校验基线。
- `P2-LLM-001` 已有 contract/QA 证据，可以作为 Phase 2 OpenAI-compatible provider 基线。
- `P3-PIPELINE-001` 与 `P3-PIPELINE-002` 已有 contract/QA 证据，可以作为 Phase 3 pipeline 基线。
- `P4-EDITOR-001` 已有 contract/QA 证据，可以作为 Phase 4 YAML 编辑与校验基线。
- `P4-PREVIEW-002` 已有 contract/QA 证据，可以作为 Phase 4 剧本预览基线。
- `P4-EXPORT-003` 已有 contract/QA 证据，可以作为 Phase 4 YAML / Markdown 导出基线。
- `P5-POLISH-001` 已有 contract/QA 证据，可以作为 Phase 5 少于 3 章输入友好拦截基线。
- Playwright 的 webServer 必须从仓库根启动 `pnpm dev`，配置里已经显式设置 `cwd`。
