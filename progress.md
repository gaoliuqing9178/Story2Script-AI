# Progress Log

## 2026-06-07 - P5-POLISH-002 Loading Empty Error States

目标：实现 `feature_list.json` 中的 `P5-POLISH-002`，统一 generation、validation、export 路径的 loading、empty、error 状态，让用户能看清当前阶段、错误来源和导出可用性。

已读取事实来源：

- `docs/design.md`
- `docs/yaml-schema.md`
- `docs/engineering.md`
- `feature_list.json`
- `docs/handoff.md`

本轮创建或修改内容：

- 更新 `apps/web/src/App.tsx`：新增 generation 子阶段状态、生成请求防重入、generation 状态提示、export 状态提示、validation request error 稳定测试标识；为两个 textarea 补 `id/name`。
- 新增 `apps/web/src/ui-states.tsx`：集中 generation / validation / export 状态文案和错误阶段格式化。
- 新增 `apps/web/src/download.ts`：拆出导出文件名、Blob 下载和结尾换行 helper，避免 `App.tsx` 继续膨胀。
- 扩展 `apps/web/tests/ui/p5-polish.spec.ts`：覆盖慢生成 loading、防重复提交、生成 500、导出空态、校验中导出暂停、校验 500、业务校验失败导出暂停。
- 新增 `docs/contracts/P5-POLISH-002.md`。
- 新增 `docs/qa/P5-POLISH-002.md`。
- 将 `feature_list.json` 中 `P5-POLISH-002.passes` 改为 `true`。

关键实现说明：

- `handleGenerate` 使用 `generateInFlightRef` 防止同一轮生成重复提交；loading 期间按钮 disabled。
- generation 状态区显示：
  - 初始：`等待生成：会先检查章节数量，再调用剧本生成接口。`
  - 章节预检：`正在检查章节数量，确认至少 3 个章节后再进入生成。`
  - 生成 YAML：`正在生成剧本 YAML，请稍等，按钮已暂时锁定。`
  - 完成：`最近一次生成已完成，YAML 已进入右侧工作区。`
  - 失败：`生成没有完成，请看下方具体阶段提示。`
- generation server error 会显示具体 API 路径，例如 `剧本生成阶段失败（/api/screenplay/generate）：mock provider timeout`。
- validation request error 会显示具体 API 路径，例如 `校验阶段失败（/api/yaml/validate）：validator service unavailable`。
- export 状态区区分空态、校验中、校验请求失败、业务校验失败和可导出。
- 空 YAML、校验中、校验请求失败、业务校验失败时，YAML / Markdown 导出按钮均 disabled。
- 本轮没有新增后端 API，没有修改 provider、pipeline、validator、schema 或 `examples/*`。

明确未做：

- 未实现 `P5-DEMO-003` 的 demo 资产、README 或 3 分钟 demo route。
- 未新增 PDF、DOCX、Final Draft 等导出格式。
- 未实现章节确认 UI、手动重切章或章节编辑。
- 未改变 `P5-POLISH-001` 的少于 3 章拦截语义。

验证记录：

- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web typecheck`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web test`：通过，web 1 个 Vitest 文件 / 3 个 tests。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' lint`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui -- apps/web/tests/ui/p5-polish.spec.ts`：通过，Chromium 5 passed。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui`：通过，Playwright Chromium 10 passed。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' verify`：通过，覆盖 typecheck、lint、test、build。
- generator Chrome DevTools MCP 复核：
  - 初始空态：YAML `0` 字符，校验 `未校验`，导出按钮 disabled，导出区显示暂无可导出的 YAML。
  - 慢生成：浏览器上下文延迟 `/api/screenplay/generate` 后，页面显示 `正在生成剧本 YAML，请稍等，按钮已暂时锁定。`，生成按钮 `生成中...` 且 disabled。
  - 正常生成：YAML 字符数 `3347`，校验通过，预览更新，导出启用。
  - 业务校验失败：删除 `project.title` 后显示 `project.title` / `必填字段缺失`，预览暂停，导出暂停。
  - 校验请求失败：模拟 `/api/yaml/validate` 500，页面显示接口路径，预览和导出暂停。
  - 生成请求失败：模拟 `/api/screenplay/generate` 500，页面显示接口路径，YAML 保持空态，导出 disabled。
  - full-page screenshot：`H:\tmp\P5-POLISH-002-fullpage.png`。
  - 布局指标：`scrollWidth === innerWidth`，无横向溢出。
- evaluator 子代理 `019ea0b9-cb51-7ac0-b6f4-878ba2fe580b`：PASS。
  - 使用 Chrome DevTools MCP 完成真实页面交互、延迟/错误模拟、full-page screenshot 和视觉检查。
  - Screenshot：`H:\tmp\P5-POLISH-002-evaluator-fullpage.png`。
  - 慢生成双击后只有 1 次 `/api/screenplay/generate`。
  - `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui -- apps/web/tests/ui/p5-polish.spec.ts`：通过，5 passed。
  - evaluator 停止本轮 dev server 后确认 `5173/8787` 均无 `Listen`。

状态确认：

- `P5-POLISH-002` 已具备 contract、QA 报告、Playwright UI 覆盖、Chrome DevTools MCP generator/evaluator 证据、`pnpm verify` 和 `pnpm test:ui` 证据，可标记 `passes:true`。
- 当前 `feature_list.json` 中 `P0-E2E-001`、`P0-INFRA-002`、`P1-VALIDATE-001`、`P1-VALIDATE-002`、`P2-LLM-001`、`P3-PIPELINE-001`、`P3-PIPELINE-002`、`P4-EDITOR-001`、`P4-PREVIEW-002`、`P4-EXPORT-003`、`P5-POLISH-001`、`P5-POLISH-002` 为 `passes:true`。
- `P5-DEMO-003` 仍保持 `passes:false`。

## 2026-06-07 - P5-POLISH-001 Input Chapter Count Guard

目标：实现 `feature_list.json` 中的 `P5-POLISH-001`，让少于 3 章的小说输入在前端生成前被友好拦截，并明确告诉用户至少需要 3 个章节、当前识别到几个章节。

已读取事实来源：

- `docs/design.md`
- `docs/yaml-schema.md`
- `docs/engineering.md`
- `feature_list.json`
- `docs/handoff.md`

本轮创建或修改内容：

- 新增 `apps/web/src/api/chapters.ts`：封装 `POST /api/chapters/split`，并用 `ChapterSplitError` 保留后端 `status` 与 `error.code`。
- 更新 `apps/web/src/App.tsx`：点击“用样例生成”时先运行章节切分预检查；`TOO_FEW_CHAPTERS` 时显示中文友好提示，并阻止继续调用 `/api/screenplay/generate`。
- 新增 `apps/web/tests/ui/p5-polish.spec.ts`：覆盖 2 章中文小说负向路径，断言 UI 文案、YAML 空态、校验未校验，以及 generate API 未被调用。
- 新增 `docs/contracts/P5-POLISH-001.md`。
- 新增 `docs/qa/P5-POLISH-001.md`。
- 将 `feature_list.json` 中 `P5-POLISH-001.passes` 改为 `true`。

关键实现说明：

- 前端复用已验收的 `/api/chapters/split` 作为生成前预检查，不新增后端 API，也不改变 `/api/screenplay/generate` 契约。
- 少于 3 章时，提示显示在左侧 `小说输入` 面板内，文案为 `还差一点：至少需要 3 个章节，当前识别到 2 个。请再补充章节后生成剧本。`
- 少于 3 章时不会修改当前 YAML；当前测试覆盖空 YAML 场景下仍保持 YAML 编辑器为空、校验结果为 `未校验`。
- 默认 3 章样例仍按既有路径生成：先 split 成功，再调用 `/api/screenplay/generate`，随后运行 `/api/yaml/validate`。
- 本轮没有修改后端切章规则、provider、pipeline、validator 或 `examples/*`。

明确未做：

- 未实现完整章节确认 UI、章节排序、章节编辑或手动重切章。
- 未实现 `P5-POLISH-002` 的 loading、empty、error 全路径打磨。
- 未新增真实 LLM 调用，也未改变 mock/openai-compatible provider 语义。
- 未修改 demo 资产或 README。

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
  - 页面显示友好提示：`还差一点：至少需要 3 个章节，当前识别到 2 个。请再补充章节后生成剧本。`
  - YAML 编辑器 `valueLength: 0`，校验状态为 `未校验`，导出按钮保持 disabled。
  - 3 章默认样例回归通过：`/api/chapters/split [200]`、`/api/screenplay/generate [200]`、`/api/yaml/validate [200]`，YAML 字符数 `3347`，校验通过，预览已更新。
  - full-page screenshot：`H:\tmp\P5-POLISH-001-fullpage.png`。
  - 布局指标：`scrollWidth === innerWidth`，无横向溢出。
  - evaluator 停止本轮 dev server 后确认 `5173/8787` 端口释放。

状态确认：

- `P5-POLISH-001` 已具备 contract、QA 报告、Playwright UI 覆盖、Chrome DevTools MCP evaluator 证据、`pnpm verify` 和 `pnpm test:ui` 证据，可标记 `passes:true`。
- 当前 `feature_list.json` 中 `P0-E2E-001`、`P0-INFRA-002`、`P1-VALIDATE-001`、`P1-VALIDATE-002`、`P2-LLM-001`、`P3-PIPELINE-001`、`P3-PIPELINE-002`、`P4-EDITOR-001`、`P4-PREVIEW-002`、`P4-EXPORT-003`、`P5-POLISH-001` 为 `passes:true`。
- `P5-POLISH-002` 与 `P5-DEMO-003` 仍保持 `passes:false`。

## 2026-06-07 - P4-EXPORT-003 YAML and Markdown Export

目标：实现 `feature_list.json` 中的 `P4-EXPORT-003`，让用户可以把当前剧本导出为 YAML 和 Markdown。

已读取事实来源：

- `docs/design.md`
- `docs/yaml-schema.md`
- `docs/engineering.md`
- `feature_list.json`
- `docs/handoff.md`

本轮创建或修改内容：

- 更新 `apps/web/src/render/screenplay.ts`：新增 `buildScreenplayMarkdown(screenplay)`，复用 `buildScreenplayPreview` 的场景和 beat 映射语义生成 Markdown。
- 更新 `apps/web/src/render/screenplay.test.ts`：覆盖 Markdown 输出中的项目标题、场景标题、地点、动作、对白、旁白、转场和内心独白。
- 更新 `apps/web/src/App.tsx`：在 `YAML 编辑器` 标题区新增 `导出 YAML` 和 `导出 Markdown` 按钮；仅在当前 YAML 非空、校验状态空闲且 `validation.valid === true` 时启用导出。
- 新增 `apps/web/tests/ui/p4-export.spec.ts`：真实浏览器覆盖空态按钮禁用、生成后按钮启用、`.yaml` 下载可解析、`.md` 下载包含可读场景和 beat 文本。
- 新增 `docs/contracts/P4-EXPORT-003.md`。
- 新增 `docs/qa/P4-EXPORT-003.md`。
- 将 `feature_list.json` 中 `P4-EXPORT-003.passes` 改为 `true`。

关键实现说明：

- YAML 导出直接使用当前 `YAML 编辑器` textarea value，保持前端 YAML 的唯一事实源。
- Markdown 导出先用 `parseScreenplayYaml(yaml)` 解析当前 YAML，再用 `buildScreenplayMarkdown` 生成可读剧本稿。
- 导出文件名优先使用 `project.title`，并清理 Windows 文件名不安全字符；无法得到标题时回退到 `story2script-screenplay`。
- 本轮没有新增后端 API，也没有修改后端 validator。
- 未通过校验、校验中或校验请求失败时，两个导出按钮保持禁用，避免导出未确认内容。

明确未做：

- 未实现 PDF、DOCX、Final Draft、字幕或压缩包导出。
- 未实现 `P5-POLISH-002` 的完整 loading、empty、error 全路径打磨。
- 未引入 Monaco Editor 或 CodeMirror。
- 未修改 `examples/*` demo fixture。
- 未调整真实 LLM provider 或 pipeline 语义。

验证记录：

- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web typecheck`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web test`：通过，web 1 个 Vitest 文件 / 3 个 tests。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' lint`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui -- apps/web/tests/ui/p4-export.spec.ts`：通过，Chromium 1 passed。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui`：通过，Playwright Chromium 5 passed。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' verify`：通过，覆盖 typecheck、lint、test、build。
- generator 使用 Chrome DevTools MCP 做真实交互复核：
  - 打开 `http://127.0.0.1:5173/`。
  - 初始状态两个导出按钮 disabled。
  - 点击“用样例生成”后，校验通过，两个导出按钮 enabled。
  - 真实点击两个导出按钮后，浏览器下载 `雨夜归来.yaml` 和 `雨夜归来.md`。
  - 读取下载文件，YAML 顶层键为 `schema_version`、`project`、`source`、`characters`、`locations`、`scenes`；Markdown 包含项目标题、第一场标题、动作、对白、旁白、转场、内心独白。
  - full-page screenshot：`H:\tmp\P4-EXPORT-003-fullpage.png`。
  - 布局指标：`scrollWidth === clientWidth`，无横向溢出。
- evaluator 子代理 `019ea056-e0a2-79b3-8bff-872c7f35a6bc`：PASS。
  - 使用 Chrome DevTools MCP 完成真实页面交互、下载文件核对和 full-page screenshot。
  - 下载证据：`C:\Users\lx8nb\Downloads\雨夜归来 (1).yaml`，`C:\Users\lx8nb\Downloads\雨夜归来 (1).md`。
  - YAML 成功解析，六个顶层键全部存在，`sceneCount === 3`。
  - Markdown 内容核对全部通过。
  - 视觉检查 PASS：页面非空白，无明显错位、遮挡、文字溢出、按钮截断或横向滚动。
  - evaluator 停止本轮 dev server 后确认 `5173/8787` 端口释放。

状态确认：

- `P4-EXPORT-003` 已具备 contract、QA 报告、Vitest、Playwright UI、Chrome DevTools MCP evaluator 证据、`pnpm verify` 和 `pnpm test:ui` 证据，可标记 `passes:true`。
- 当前 `feature_list.json` 中 `P0-E2E-001`、`P0-INFRA-002`、`P1-VALIDATE-001`、`P1-VALIDATE-002`、`P2-LLM-001`、`P3-PIPELINE-001`、`P3-PIPELINE-002`、`P4-EDITOR-001`、`P4-PREVIEW-002`、`P4-EXPORT-003` 为 `passes:true`，其余 feature 仍保持 `passes:false`。

## 2026-06-06 - P4-PREVIEW-002 Screenplay Preview

目标：实现 `feature_list.json` 中的 `P4-PREVIEW-002`，让前端复用当前 YAML editor 的事实源，在 validation pass 时渲染 action、dialogue、narration、transition、inner_voice 五类 beat，并在 validation fail 时明确暂停预览。

已读取事实来源：

- `docs/design.md`
- `docs/yaml-schema.md`
- `docs/engineering.md`
- `feature_list.json`
- `docs/handoff.md`

本轮创建或修改内容：

- 新增 `apps/web/src/render/screenplay.ts`：前端 YAML 解析、角色/地点反查、场景排序和五类 beat 预览数据映射。
- 新增 `apps/web/src/render/screenplay.test.ts`：覆盖场景 metadata 与 action/dialogue/narration/transition/inner_voice 五类 beat 映射。
- 新增 `apps/web/src/components/ScreenplayPreview.tsx`：独立预览面板；只在 `ValidationResult.valid === true` 且校验空闲时渲染当前 YAML；校验中、请求失败或业务校验失败时显示暂停态。
- 更新 `apps/web/src/App.tsx`：在右侧工作区接入 `ScreenplayPreview`，继续以 YAML textarea value 为事实源。
- 更新 `apps/web/package.json` 与 `pnpm-lock.yaml`：为 web 显式加入 `js-yaml` 和 `@types/js-yaml`，用于前端解析已校验通过的 YAML。
- 新增 `apps/web/tests/ui/p4-preview.spec.ts`：真实浏览器覆盖预览场景头部、五类 beat 和校验失败暂停态。
- 新增 `docs/contracts/P4-PREVIEW-002.md`。
- 新增 `docs/qa/P4-PREVIEW-002.md`。
- 将 `feature_list.json` 中 `P4-PREVIEW-002.passes` 改为 `true`。

关键实现说明：

- 本轮没有修改后端 validator，也没有复制校验规则到前端；前端预览只信任已有 `ValidationResult.valid`。
- `yaml` textarea value 仍是前端唯一事实源；预览不维护第二份用户可编辑数据。
- 预览场景头部显示 `第 N 场`、标题、地点、时间和人物。
- beat 渲染语义：
  - `action`：普通动作段落。
  - `dialogue`：角色名 + 对白内容。
  - `narration`：`旁白：` 前缀。
  - `transition`：居中转场文本。
  - `inner_voice`：`（内心）角色名` + 内容。
- validation fail / request fail / validating 时，预览显示暂停态，避免展示过期通过内容。

明确未做：

- 未实现 `P4-EXPORT-003` 的 YAML / Markdown 导出。
- 未引入 Monaco 或 CodeMirror。
- 未修改 `examples/*` demo fixture。
- 未改弱后端 validator 规则。
- 未实现 `P5-POLISH-001` 的少于 3 章前端友好拦截。

验证记录：

- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web typecheck`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web test`：通过，web 1 个 Vitest 文件 / 2 个 tests。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' lint`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui`：通过，Playwright Chromium 4 passed。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' verify`：通过，覆盖 typecheck、lint、test、build。
- evaluator 子代理 `019e9d9c-de7d-7db2-87a6-9e29323b116f`：PASS。
  - 使用 Chrome DevTools MCP 打开 `http://127.0.0.1:5173/`。
  - 完成真实页面交互和 full-page screenshot。
  - 截图路径：`H:\tmp\P4-PREVIEW-002-fullpage.png`。
  - 点击“用样例生成”后，`剧本预览` 显示 `预览已更新`。
  - 场景头部显示 `第 1 场 雨夜归来`、`地点：旧火车站`、`时间：夜晚`、`人物：林舟、沈念`。
  - 五类 beat 均可见：action、dialogue、narration、transition、inner_voice。
  - 破坏 YAML 后，校验区域显示 `project.title` 与 `必填字段缺失`，预览区域显示 `预览已暂停` 和 `当前 YAML 未通过校验，预览已暂停。`
  - 视觉检查 PASS：页面非空白，无明显错位、遮挡、按钮截断、文字溢出或横向滚动。

状态确认：

- `P4-PREVIEW-002` 已具备 contract、QA 报告、Vitest 预览映射覆盖、Playwright UI 覆盖、Chrome DevTools MCP evaluator 证据、`pnpm verify` 和 `pnpm test:ui` 证据，可以标记 `passes:true`。
- 当前 `feature_list.json` 中 `P0-E2E-001`、`P0-INFRA-002`、`P1-VALIDATE-001`、`P1-VALIDATE-002`、`P2-LLM-001`、`P3-PIPELINE-001`、`P3-PIPELINE-002`、`P4-EDITOR-001`、`P4-PREVIEW-002` 为 `passes:true`，其余 feature 仍保持 `passes:false`。

## 2026-06-06 - P4-EDITOR-001 YAML Editor and Debounced Validation

目标：实现 `feature_list.json` 中的 `P4-EDITOR-001`，让前端 YAML editor 支持直接编辑、编辑后防抖校验，并在校验面板展示精确 validation error path。

已读取事实来源：

- `docs/design.md`
- `docs/yaml-schema.md`
- `docs/engineering.md`
- `feature_list.json`
- `docs/handoff.md`

本轮创建或修改内容：

- 更新 `apps/web/src/api/screenplay.ts`：新增 `validateYaml(yaml)`，调用 `POST /api/yaml/validate`；生成 API 失败时优先读取后端 error message。
- 更新 `apps/web/src/App.tsx`：将右侧 YAML 输出改为可编辑 textarea；新增 validation 状态、防抖校验、错误/警告面板；生成后接收初始 validation，编辑后以 `/api/yaml/validate` 为准。
- 更新 `apps/web/tests/ui/smoke.spec.ts`：适配 YAML 输出从 `<pre>` 改为 textarea value。
- 更新 `apps/web/tests/ui/p2-evaluator.spec.ts`：使用明确 aria label 定位小说输入和生成按钮，避免被新增 YAML textarea 干扰。
- 新增 `apps/web/tests/ui/p4-editor.spec.ts`：覆盖生成 YAML、直接编辑、删除 `project.title`、等待防抖校验并显示 `project.title` / `必填字段缺失`。
- 新增 `docs/contracts/P4-EDITOR-001.md`。
- 新增 `docs/qa/P4-EDITOR-001.md`。
- 将 `feature_list.json` 中 `P4-EDITOR-001.passes` 改为 `true`。

关键实现说明：

- 本轮没有引入 Monaco 或 CodeMirror，先用原生 textarea 完成可直接编辑和校验闭环，避免扩大依赖面。
- 防抖间隔为 350ms；编辑期间显示 `校验中...`，防抖完成后展示后端返回的 `ValidationResult`。
- 校验错误逐条展示 `path` 和 `message`，例如 `project.title` / `必填字段缺失`。
- `yaml` textarea value 是前端 YAML 的事实源；预览和导出仍未实现。

明确未做：

- 未实现 `P4-PREVIEW-002` 的剧本预览。
- 未实现 `P4-EXPORT-003` 的 YAML / Markdown 导出。
- 未修改 `examples/*` demo fixture。
- 未放宽后端 validator 规则。

验证记录：

- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web typecheck`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web test`：通过，web 无 Vitest 单测且 `--passWithNoTests` 通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' lint`：通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' verify`：通过，覆盖 typecheck、lint、test、build。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui`：通过，Playwright Chromium 3 passed。
- evaluator 子代理 `019e9d01-64e9-7390-b4ea-1365e1734420`：PASS。
  - 使用 Chrome DevTools MCP 打开 `http://127.0.0.1:5173`。
  - 完成真实页面交互和 full-page screenshot。
  - 截图路径：`H:\tmp\P4-EDITOR-001-fullpage.png`。
  - 点击“用样例生成”后，YAML 编辑器出现 mock YAML，校验结果最终通过。
  - 删除 `  title: "雨夜归来"` 后，防抖期间只显示 `校验中...`，防抖完成后显示 `project.title` 和 `必填字段缺失`。
  - 视觉检查 PASS：页面非空白，无明显错位、遮挡、按钮截断、文字溢出或横向滚动。

状态确认：

- `P4-EDITOR-001` 已具备 contract、QA 报告、Playwright 覆盖、Chrome DevTools MCP evaluator 证据、`pnpm verify` 和 `pnpm test:ui` 证据，可以标记 `passes:true`。
- 当前 `feature_list.json` 中 `P0-E2E-001`、`P0-INFRA-002`、`P1-VALIDATE-001`、`P1-VALIDATE-002`、`P2-LLM-001`、`P3-PIPELINE-001`、`P3-PIPELINE-002`、`P4-EDITOR-001` 为 `passes:true`，其余 feature 仍保持 `passes:false`。

## 2026-06-06 - P3-PIPELINE-002 Multi-stage Pipeline and Bounded Repair

目标：实现 `feature_list.json` 中的 `P3-PIPELINE-002`，让系统可以执行 chapter analysis、screenplay bible generation、scene generation、validation 和 bounded structure repair。

已读取事实来源：

- `docs/design.md`
- `docs/yaml-schema.md`
- `docs/engineering.md`
- `feature_list.json`
- `docs/handoff.md`

本轮创建或修改内容：

- 新增 `apps/server/src/pipeline/prompts.ts`：集中维护 analysis、bible、scene generation、repair 的 prompt 与 stage marker。
- 新增 `apps/server/src/pipeline/types.ts`：定义 `ScreenplayBible`、`RepairResult`、`MultiStagePipelineInput`、`MultiStagePipelineResult`。
- 新增 `apps/server/src/pipeline/json.ts`：解析 provider 返回的 JSON，兼容 JSON code fence。
- 新增 `apps/server/src/pipeline/analyze.ts`：实现逐章分析。
- 新增 `apps/server/src/pipeline/bible.ts`：实现剧本圣经生成。
- 新增 `apps/server/src/pipeline/multistage.ts`：编排 analyze -> bible -> scene generation -> validation -> repair。
- 新增 `apps/server/src/pipeline/repair.ts`：实现 YAML repair，修复次数由 `repair_max_retries` 或 `REPAIR_MAX_RETRY` 限制，默认 2，最大钳制到 5。
- 新增 `apps/server/src/routes/request-utils.ts`：复用 request parsing、adaptation type、chapters/analyses 解析和 repair retry 读取。
- 更新 `apps/server/src/routes/chapters.ts`：`POST /api/chapters/analyze` 从 501 改为真实分析接口。
- 更新 `apps/server/src/routes/screenplay.ts`：保留旧单阶段 generate；当请求带 `chapters` 或 `analyses` 时运行 multi-stage pipeline，并返回 `pipeline` metadata。
- 更新 `apps/server/src/routes/yaml.ts`：`POST /api/yaml/repair` 从 501 改为真实 bounded repair 接口。
- 更新 `apps/server/src/provider/mock.ts`：默认 mock provider 可按 stage marker 返回章节分析 JSON、剧本圣经 JSON、动态 YAML 和 repair YAML。
- 更新 `apps/server/src/provider/openai.ts`：通用剥离 provider 返回的 code fence，兼容 JSON/YAML 阶段输出。
- 新增 `apps/server/tests/pipeline-route.test.ts`：真实 Express app 覆盖 analyze、multi-stage generate、validation red->green repair 和 repair retry 上限。
- 新增 `docs/contracts/P3-PIPELINE-002.md`。
- 新增 `docs/qa/P3-PIPELINE-002.md`。
- 将 `feature_list.json` 中 `P3-PIPELINE-002.passes` 改为 `true`。

关键实现说明：

- `POST /api/screenplay/generate` 向后兼容 P2 单阶段路径：不传 `chapters` 或 `analyses` 时仍走原单阶段 generate。
- 传入 `chapters` 或 `analyses` 时，`/api/screenplay/generate` 运行 multi-stage pipeline，并返回 `pipeline.analyses`、`pipeline.bible`、`pipeline.initial_validation`、`pipeline.repair_attempts`、`pipeline.max_repair_attempts`。
- `POST /api/chapters/analyze` 使用 provider 逐章生成 `ChapterAnalysis[]`；默认 mock 不联网。
- `POST /api/yaml/repair` 会先运行本地 validator，再在 `valid:false` 且 attempts 未超上限时调用 provider 修复。
- OpenAI-compatible 自动化验证使用本地 fake server，没有调用真实外部 OpenAI API。

明确未做：

- 未实现前端章节确认 UI。
- 未实现 YAML editor、preview 或 export。
- 未调用真实外部 OpenAI API。
- 未修改 `examples/*` demo fixture。
- 未将 `P4-*` 或 `P5-*` 标记为通过。

验证记录：

- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/server test`：通过，server 5 个 test files、27 个 tests 全部通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' lint`：通过，`eslint .` 通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' verify`：通过，覆盖 typecheck、lint、test、build。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui`：通过，Playwright Chromium 2 passed。
- evaluator 子代理 `019e9c16-525e-78a2-9d49-108f9da2b6f7`：PASS。
  - 使用 Chrome DevTools MCP 打开 `http://127.0.0.1:5173/`。
  - 完成页面 snapshot 和 full-page screenshot 视觉检查。
  - 截图路径：`H:\tmp\P3-PIPELINE-002-fullpage.png`。
  - 在浏览器上下文中通过 `fetch` 验证 5 章 split、analyze、multi-stage generate 和 bounded repair。
  - `generate` 返回 `validation.valid === true`、`pipeline.analyses.length === 5`、`pipeline.bible`、`pipeline.initial_validation`、数字类型 `repair_attempts`。
  - 删除 `project.title` 后调用 `/api/yaml/repair`，`repair.attempts === 1` 且 `validation.valid === true`。

状态确认：

- `P3-PIPELINE-002` 已具备 contract、QA 报告、真实 Express route 测试、Chrome DevTools MCP evaluator 证据、`pnpm verify` 和 `pnpm test:ui` 证据，可以标记 `passes:true`。
- 当前 `feature_list.json` 中 `P0-E2E-001`、`P0-INFRA-002`、`P1-VALIDATE-001`、`P1-VALIDATE-002`、`P2-LLM-001`、`P3-PIPELINE-001`、`P3-PIPELINE-002` 为 `passes:true`，其余 feature 仍保持 `passes:false`。

## 2026-06-06 - P3-PIPELINE-001 Chapter Splitting

目标：实现 `feature_list.json` 中的 `P3-PIPELINE-001`，让 `POST /api/chapters/split` 支持中文章节标题、英文 `Chapter` 标题、Markdown 章节标题和 `---chapter---` 分隔符，并在少于 3 章时返回 422。

已读取事实来源：

- `docs/design.md`
- `docs/yaml-schema.md`
- `docs/engineering.md`
- `feature_list.json`
- `docs/handoff.md`

本轮创建或修改内容：

- 新增 `apps/server/src/pipeline/split.ts`，实现本地 deterministic chapter splitting，不调用 LLM。
- 新增 `apps/server/src/routes/chapters.ts`，实现 `POST /api/chapters/split`，并保留 `/api/chapters/analyze` Phase 3 后续占位。
- 更新 `apps/server/src/routes/index.ts`，挂载 `chaptersRouter`。
- 新增 `apps/server/tests/chapter-split-route.test.ts`，通过真实 Express app 覆盖中文标题、英文 `Chapter`、Markdown heading、`---chapter---` 前置/居中分隔符、少于 3 章 422、缺少 `text` 400。
- 新增 `docs/contracts/P3-PIPELINE-001.md`。
- 新增 `docs/qa/P3-PIPELINE-001.md`。
- 将 `feature_list.json` 中 `P3-PIPELINE-001.passes` 改为 `true`。

关键实现说明：

- 标题模式下，按行识别中文章节标题、英文 `Chapter` 标题或 Markdown heading 中的章节标题。
- separator 模式下，只要文本包含 `---chapter---`，就按分隔符切段；兼容“每章前放分隔符”和“章节之间放分隔符”两种输入习惯。
- 无标题 separator 段会生成稳定标题 `Chapter 1`、`Chapter 2`、`Chapter 3`。
- 返回章节 ID 固定为 `chapter_001`、`chapter_002`、`chapter_003` 这种顺序格式。
- `word_count` 当前按去掉空白后的 Unicode code point 数统计，适合中英文混合文本的稳定粗略字数。

明确未做：

- 未实现 `/api/chapters/analyze`。
- 未实现 screenplay bible、multi-stage generate 或 bounded repair。
- 未新增前端章节确认 UI。
- 未修改 `examples/*` demo fixture。
- 未将 `P3-PIPELINE-002`、`P4-*` 或 `P5-*` 标记为通过。

验证记录：

- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/server test`：通过，server 4 个 test files、24 个 tests 全部通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' typecheck`：通过，shared/server/web 全部通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' lint`：通过，`eslint .` 通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' verify`：通过，覆盖 typecheck、lint、test、build。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui`：通过，Playwright Chromium 2 passed。
- evaluator 子代理 `019e9bd0-8a5b-7a30-ab2c-e05c21b089b9`：PASS。
  - 使用 Chrome DevTools MCP 打开 `http://127.0.0.1:5173`。
  - 完成页面 snapshot 和 full-page screenshot 视觉检查。
  - 在浏览器上下文中通过 `fetch('/api/chapters/split')` 验证四类 fixture 和 422 错误态。
  - 发现并促成本轮补齐 `---chapter---` 只放在章节之间的兼容边界；补充复核后仍 PASS。
  - 复跑 server test：4 files / 24 tests passed。

状态确认：

- `P3-PIPELINE-001` 已具备 contract、QA 报告、真实 Express route 测试、Chrome DevTools MCP evaluator 证据、`pnpm verify` 和 `pnpm test:ui` 证据，可以标记 `passes:true`。
- 当前 `feature_list.json` 中 `P0-E2E-001`、`P0-INFRA-002`、`P1-VALIDATE-001`、`P1-VALIDATE-002`、`P2-LLM-001`、`P3-PIPELINE-001` 为 `passes:true`，其余 feature 仍保持 `passes:false`。

## 2026-06-06 - P2-LLM-001 OpenAI-compatible Single-stage Generation

目标：实现 `feature_list.json` 中的 `P2-LLM-001`，让 OpenAI-compatible provider 可以完成单阶段小说转 YAML 生成，并立即返回现有 validator 的校验结果。

已读取事实来源：

- `docs/design.md`
- `docs/yaml-schema.md`
- `docs/engineering.md`
- `feature_list.json`
- `docs/handoff.md`

本轮创建或修改内容：

- 更新 `apps/server/src/provider/openai.ts`，实现 OpenAI-compatible `/chat/completions` 调用，读取 `OPENAI_API_KEY`、`OPENAI_BASE_URL`、`OPENAI_MODEL`，并从 `choices[0].message.content` 提取 YAML。
- 更新 `apps/server/src/routes/screenplay.ts`，在 `LLM_PROVIDER=openai` 时要求传入小说文本，构造单阶段 novel-to-YAML prompt，provider 返回后立即调用 `validateScreenplayYamlStructure`。
- 更新 `apps/web/src/api/screenplay.ts` 与 `apps/web/src/App.tsx`，让已有小说输入框内容作为 `novel` 传给 generate API；mock 模式继续忽略输入并返回固定 fixture。
- 扩展 `apps/server/tests/screenplay-route.test.ts`，通过真实 Express app 和本地 OpenAI-compatible fake server 覆盖 openai 成功路径、fenced YAML 剥离、即时 validation、坏 YAML 精确错误、缺小说文本、缺 key 和 mock 回归。
- 新增 `apps/web/tests/ui/p2-evaluator.spec.ts`，通过 Playwright 在浏览器中编辑小说输入，拦截 generate API，并断言请求体包含完整 `novel`。
- 新增 `docs/contracts/P2-LLM-001.md` 与 `docs/qa/P2-LLM-001.md`。
- 将 `feature_list.json` 中 `P2-LLM-001.passes` 改为 `true`。

明确未做：

- 未调用真实外部 OpenAI API；本轮不依赖真实 key、余额、限流或网络可用性。
- 未创建或提交 `.env`。
- 未实现 Phase 3 多阶段 pipeline、chapter split、YAML repair。
- 未重做前端 UI 结构或 mock-first 文案。

验证记录：

- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/server test`：通过，server 3 个 test files、17 个 tests 全部通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' typecheck`：通过，shared/server/web 全部通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' lint`：通过，`eslint .` 通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' verify`：通过。
  - `typecheck`：shared/server/web 全部通过。
  - `lint`：`eslint .` 通过。
  - `test`：shared 1 个 Vitest 通过，server 17 个 Vitest 通过，web 无单测且 `--passWithNoTests` 通过。
  - `build`：shared/server `tsc` 通过，web `vite build` 通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui`：通过，Playwright Chromium 2 passed，覆盖 mock backend smoke 与 P2 evaluator 请求体断言。

状态确认：

- `P2-LLM-001` 已具备 contract、QA 报告、真实 Express route 测试、本地 OpenAI-compatible provider 契约验证、mock 回归验证、`pnpm verify` 和 `pnpm test:ui` 证据，可以标记 `passes:true`。
- 当前 `feature_list.json` 中 `P0-E2E-001`、`P0-INFRA-002`、`P1-VALIDATE-001`、`P1-VALIDATE-002`、`P2-LLM-001` 为 `passes:true`，其余 feature 仍保持 `passes:false`。

## 2026-06-06 - P1-VALIDATE-002 Application-layer Validation

目标：实现 `feature_list.json` 中的 `P1-VALIDATE-002`，在 AJV structural validation 通过后补齐应用层引用与一致性校验。

已读取事实来源：

- `docs/design.md`
- `docs/yaml-schema.md`
- `docs/engineering.md`
- `feature_list.json`
- `docs/handoff.md`

本轮创建或修改内容：

- 新增 `apps/server/src/validate/reference.ts`，检查 scene/source/location/character/relationship/speaker 引用、dialogue/inner_voice 条件 speaker、characters/locations/scenes ID 唯一性，以及章节覆盖 warning。
- 更新 `apps/server/src/validate/structural.ts`，保持先结构后语义：结构校验失败时只返回结构错误；结构通过后再运行应用层校验。
- 扩展 `apps/server/tests/yaml-validate-route.test.ts`，通过真实 Express app 覆盖 speaker 引用错误、缺 speaker、重复 ID、章节覆盖 warning，以及 location/source/relationship 等引用错误。
- 新增 `docs/contracts/P1-VALIDATE-002.md` 与 `docs/qa/P1-VALIDATE-002.md`。
- 将 `feature_list.json` 中 `P1-VALIDATE-002.passes` 改为 `true`。

明确未做：

- 未实现 YAML repair。
- 未实现前端编辑器、校验面板、预览或导出。
- 未修改 `examples/*` demo fixture。
- 未接入真实 LLM Provider。

验证记录：

- `pnpm --filter @story2script/server test`：当前 shell 找不到 `pnpm`，改用本机路径 `C:\nvm4w\nodejs\pnpm.cmd --filter @story2script/server test` 后通过，server 3 个 test files、13 个 tests 全部通过。
- `C:\nvm4w\nodejs\pnpm.cmd verify`：通过。
  - `typecheck`：shared/server/web 全部通过。
  - `lint`：`eslint .` 通过。
  - `test`：shared 1 个 Vitest 通过，server 13 个 Vitest 通过，web 无单测且 `--passWithNoTests` 通过。
  - `build`：shared/server `tsc` 通过，web `vite build` 通过。

状态确认：

- `P1-VALIDATE-002` 已具备 contract、QA 报告、API route 测试、`pnpm verify` 证据和 truth-file 同步，可以标记 `passes:true`。
- 当前 `feature_list.json` 中 `P0-E2E-001`、`P0-INFRA-002`、`P1-VALIDATE-001`、`P1-VALIDATE-002` 为 `passes:true`，其余 feature 仍保持 `passes:false`。

## 2026-06-05 - P1-VALIDATE-001 AJV Structural Validation

目标：实现 `docs/yaml-schema.md` v1.0 的 AJV 结构校验，让 `POST /api/yaml/validate` 能真实校验必填字段、枚举、数组结构和最小章节数。

已读取事实来源：

- `docs/design.md`
- `docs/yaml-schema.md`
- `docs/engineering.md`
- `feature_list.json`
- `docs/handoff.md`

本轮创建或修改内容：

- 新增 `apps/server/src/validate/structural.ts`，使用 AJV 2020 校验 `packages/shared/src/schema.ts` 的 screenplay JSON Schema。
- 新增 `apps/server/src/routes/yaml.ts`，实现 `POST /api/yaml/validate`，并保留 `/api/yaml/repair` 的 Phase 3 占位。
- 更新 `apps/server/src/routes/index.ts`，挂载 `yamlRouter`。
- 更新 `apps/server/src/routes/screenplay.ts`，让 mock generate 返回真实结构校验结果，不再返回 Phase 1 未实现占位 warning。
- 新增 `apps/server/tests/yaml-validate-route.test.ts`，通过真实 Express app 覆盖 valid fixture、缺 `schema_version`、缺 `project.title`、非法 beat enum、少于 3 章和缺失 YAML 字符串入参。
- 更新 `apps/server/tests/screenplay-route.test.ts`，断言 mock fixture 的结构校验结果为 `valid:true`。
- 为 server 添加 `ajv` 与 `@story2script/shared` workspace 依赖，并调整 TS 配置，使 server 能按工程文档使用 shared 契约。
- 新增 `docs/contracts/P1-VALIDATE-001.md` 与 `docs/qa/P1-VALIDATE-001.md`。
- 将 `feature_list.json` 中 `P1-VALIDATE-001.passes` 改为 `true`。

明确未做：

- 未实现应用层引用校验、条件 speaker、ID 唯一或章节覆盖 warning，这些属于 `P1-VALIDATE-002`。
- 未实现 YAML repair、前端编辑器、校验面板、预览或导出。
- 未接入真实 OpenAI Provider。

验证记录：

- `pnpm --filter @story2script/server test`：通过，server 3 个 test files、8 个 tests 全部通过。
- `pnpm build`：通过，shared/server/web 全部 build 通过。
- `pnpm verify`：通过。
  - `typecheck`：`packages/shared`、`apps/server`、`apps/web` 全部通过。
  - `lint`：`eslint .` 通过。
  - `test`：shared 1 个 Vitest 通过；server 8 个 Vitest 通过；web 无单测且 `--passWithNoTests` 通过。
  - `build`：shared/server `tsc` 通过；web `vite build` 通过。

状态确认：

- `P1-VALIDATE-001` 已具备 contract、QA 报告、API route 测试、结构错误路径断言和 `pnpm verify` 证据，可以标记 `passes:true`。
- 当前 `feature_list.json` 中 `P0-E2E-001`、`P0-INFRA-002`、`P1-VALIDATE-001` 为 `passes:true`，其余 feature 仍保持 `passes:false`。

下一步：

- 继续推进 `P1-VALIDATE-002`，在结构校验通过后补应用层引用与一致性校验。

## 2026-06-05 - P0-INFRA-002 Development Harness Verification

目标：正式验收仓库开发 harness，让 repository scripts、TypeScript、ESLint、Vitest、Playwright 和结构化日志形成可重复的本地验证闭环。

已读取事实来源：

- `docs/design.md`
- `docs/yaml-schema.md`
- `docs/engineering.md`
- `feature_list.json`
- `docs/handoff.md`

本轮创建或修改内容：

- 新增 `docs/contracts/P0-INFRA-002.md`，明确本轮只验收 infra harness，不扩展业务功能。
- 新增 `docs/qa/P0-INFRA-002.md`，记录 install、verify、UI smoke 与日志读取证据。
- 新增 `apps/server/tests/logger.test.ts`，断言 `logEvent` 输出可解析 JSON 行，并包含 `ts`、`level`、`event`、HTTP 字段和耗时字段。
- 将 `feature_list.json` 中 `P0-INFRA-002.passes` 改为 `true`。

明确未做：

- 未实现 Phase 1 的真实 YAML 校验器。
- 未接入真实 OpenAI Provider。
- 未实现切章、多阶段流水线、编辑器、预览、导出或修复链路。

验证记录：

- `pnpm install`：通过，lockfile up to date，依赖无需变更。
- `pnpm verify`：通过。
  - `typecheck`：`apps/server`、`apps/web`、`packages/shared` 全部通过。
  - `lint`：`eslint .` 通过。
  - `test`：shared 1 个 Vitest 通过；server 2 个 Vitest 通过，覆盖 mock API route 与结构化日志 JSON 行；web 无单测且 `--passWithNoTests` 通过。
  - `build`：shared/server `tsc` 通过；web `vite build` 通过。
- `pnpm test:ui`：通过，Playwright Chromium 1 个 smoke 测试通过，真实浏览器打开首页、点击“用样例生成”，并断言 YAML 输出区包含六个必需顶层字段。
- `node scripts/read-dev-logs.js`：通过，可读取 `logs/server-dev.jsonl` 中的结构化 JSON 行，包括 `screenplay.generate.mock`、`http.request`。
- `pnpm logs`：通过，根脚本别名正确调用日志读取入口。

状态确认：

- `P0-INFRA-002` 已具备 contract、QA 报告、自动化测试、浏览器路径验证、结构化日志证据和 truth-file 同步，可以标记 `passes:true`。
- 当前 `feature_list.json` 中 `P0-E2E-001` 与 `P0-INFRA-002` 为 `passes:true`，其余 feature 仍保持 `passes:false`。
- Phase 1 校验器仍未实现，当前 API 的 `validation` 字段只代表响应形状，不代表真实校验能力。

下一步：

- 按 `feature_list.json` 继续推进 `P1-VALIDATE-001`，实现 AJV structural validation，并用坏 YAML 验证精确错误路径。

## 2026-06-05 - P0-E2E-001 Mock E2E Verification

目标：正式验收 Phase 0 mock 端到端链路，让 `MockProvider` 返回写死的合法剧本 YAML，并由 Web app 通过后端 API 展示。

已读取事实来源：

- `docs/design.md`
- `docs/yaml-schema.md`
- `docs/engineering.md`
- `feature_list.json`
- `docs/handoff.md`

本轮创建或修改内容：

- 新增 `docs/contracts/P0-E2E-001.md`，明确本轮只验收 mock fixture 经 `/api/screenplay/generate` 到前端展示。
- 新增 `docs/qa/P0-E2E-001.md`，记录复现路径、评分和 PASS 结论。
- 加强 `apps/server/tests/screenplay-route.test.ts`：真实 Express app 调用 API，解析 YAML，并断言 `schema_version`、`project`、`source`、`characters`、`locations`、`scenes` 六个顶层字段及关键数组。
- 加强 `apps/web/tests/ui/smoke.spec.ts`：Playwright 点击“用样例生成”后断言页面显示六个顶层字段。
- 更新 `apps/server/src/routes/screenplay.ts` 中 Phase 1 前 mock validation warning 的文案，避免与本轮已验收状态冲突。
- 将 `feature_list.json` 中 `P0-E2E-001.passes` 改为 `true`。

明确未做：

- 未实现 Phase 1 的真实 YAML 校验器。
- 未接入真实 OpenAI Provider。
- 未实现切章、编辑器、预览、导出或修复链路。

验证记录：

- `pnpm verify`：通过。
  - `typecheck`：`apps/server`、`apps/web`、`packages/shared` 全部通过。
  - `lint`：`eslint .` 通过。
  - `test`：shared 1 个 Vitest 通过；server 1 个 Vitest 通过，覆盖 mock YAML API 返回和 YAML 顶层契约；web 无单测且 `--passWithNoTests` 通过。
  - `build`：shared/server `tsc` 通过；web `vite build` 通过。
- `pnpm test:ui`：通过，Playwright Chromium 1 个 smoke 测试通过，真实浏览器打开首页、点击“用样例生成”，并断言 YAML 输出区包含六个必需顶层字段。

状态确认：

- `P0-E2E-001` 已具备 contract、QA 报告、API 测试、浏览器路径验证和 truth-file 同步，可以标记 `passes:true`。
- 其他 feature 仍保持 `passes:false`。
- Phase 1 校验器仍未实现，当前 API 的 `validation` 字段只代表响应形状，不代表真实校验能力。

下一步：

- 按 `feature_list.json` 继续推进 `P0-INFRA-002`，把 repository scripts、TypeScript、ESLint、Vitest、Playwright 和结构化日志作为独立工程 harness 项验收。

## 2026-06-05 - Initializer Harness

目标：只搭建 harness 基础设施，不实现业务功能。

已读取事实来源：

- `docs/design.md`
- `docs/yaml-schema.md`
- `docs/engineering.md`

本轮创建内容：

- 根 `AGENTS.md` 项目地图。
- `docs/dev-workflow.md`、`docs/quality.md`、`docs/decision-log.md`、`docs/handoff.md`。
- `docs/runbooks/debug.md`、`docs/contracts/template.md`、`docs/qa/template.md`。
- `feature_list.json` 作为真实进度表，Phase 0-5 全部 `passes:false`。
- pnpm workspace、shared/server/web walking skeleton。
- init 脚本、ESLint/TypeScript/Playwright/日志读取入口。

为什么这样做：

- 与 `engineering.md` 的 pnpm monorepo、Provider 层、shared 契约保持一致。
- 与 `design.md` Phase 0-5 的端到端优先计划保持一致。
- 与 `yaml-schema.md` 的 v1.0 数据结构保持一致。

验证记录：

- `pnpm install`：通过，lockfile up to date / dependencies installed with pnpm v9.15.9。
- `pnpm verify`：通过。
  - `typecheck`：`apps/server`、`apps/web`、`packages/shared` 全部通过。
  - `lint`：`eslint .` 通过。
  - `test`：shared 1 个 Vitest 通过；server 1 个 Vitest 通过；web 无单测且 `--passWithNoTests` 通过。
  - `build`：shared/server `tsc` 通过；web `vite build` 通过，输出 `dist/index.html` 和 assets。
- `pnpm test:ui`：通过，Playwright Chromium 1 个 smoke 测试通过，真实路径为打开首页、点击“用样例生成”、断言 YAML 包含 `schema_version: "1.0"` 与 `scenes:`。
- `powershell.exe -ExecutionPolicy Bypass -File .\init.ps1`：通过，依次完成 install、verify、Playwright Chromium install、UI smoke。
- `pnpm exec node scripts/read-dev-logs.js`：通过，可读取后端 JSON 行日志，包括 `server.started`、`screenplay.generate.mock`、`http.request`。

状态确认：

- `AGENTS.md` 当前 48 行，满足 ≤120 行。
- `feature_list.json` 当前没有任何 `passes:true`，符合本轮“不实现业务功能”的要求。
- `OpenAIProvider` 仍为占位，真实 LLM 接入留给 Phase 2。

下一步：

- 第一个 coding agent 从 `P0-E2E-001` 开始，为 mock 端到端骨架补 contract 和 QA 证据，再决定是否置 `passes:true`。

## 2026-06-05 - Workflow Update

目标：更新每轮 generator / evaluator 验证分工。

变更：

- `AGENTS.md`：完成标准改为 generator 简单验证 + evaluator 子代理 Chrome DevTools MCP 真实交互和截图视觉检查。
- `docs/dev-workflow.md`：补充 generator / evaluator 分工和提交流程。
- `docs/contracts/template.md`：区分 generator 简单验证与 evaluator 真实交互验证。
- `docs/qa/template.md`：加入 Chrome DevTools MCP、viewport、截图和视觉检查表。
- `docs/decision-log.md`：记录该工作流决策。
- `docs/quality.md`、`docs/handoff.md`：同步最终放行依据。

验证记录：

- `AGENTS.md` 行数检查：48 行，仍满足 ≤120 行。
- `pnpm lint`：通过。
- evaluator 子代理：PASS。
  - 使用 Chrome DevTools MCP 打开 `http://127.0.0.1:5173`。
  - 点击“用样例生成”后，YAML 输出包含 `schema_version` 与 `scenes:`。
  - 已执行 full-page screenshot 视觉检查。
  - 页面非空白，主要内容可见，无明显错位、遮挡、按钮截断或文字溢出。
  - 发现非阻断项：`GET /favicon.ico [404]`，可后续小修。
- `git status --short`：仅包含本轮 workflow 文档变更。
