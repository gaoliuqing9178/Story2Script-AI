# Handoff

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

`P0-E2E-001`、`P0-INFRA-002`、`P1-VALIDATE-001`、`P1-VALIDATE-002`、`P2-LLM-001`、`P3-PIPELINE-001`、`P3-PIPELINE-002`、`P4-EDITOR-001` 与 `P4-PREVIEW-002` 已正式验收，并在 `feature_list.json` 标记为 `passes:true`。

当前已证明：Web app 可以通过后端 `POST /api/screenplay/generate` 调用默认 `MockProvider`，读取 `examples/screenplay-sample.yaml`，并在页面展示包含 `schema_version`、`project`、`source`、`characters`、`locations`、`scenes` 的 YAML。

当前也已证明：仓库开发 harness 可重复运行，`pnpm install`、`pnpm verify`、`pnpm test:ui`、`node scripts/read-dev-logs.js` 和 `pnpm logs` 均通过；server 结构化日志已有 Vitest 单测和真实 dev 请求日志证据。

当前还已证明：`POST /api/yaml/validate` 会解析 YAML，并用 AJV 按 `docs/yaml-schema.md` v1.0 的结构契约校验必填字段、枚举、数组结构和 `source.chapters` 至少 3 章；结构通过后会继续执行应用层 reference validation，覆盖引用完整性、条件 speaker、ID 唯一和章节覆盖 warning。`POST /api/screenplay/generate` 现在会在 mock 和 openai 两种 provider 模式下返回 YAML 的完整校验结果。

当前前端已证明：页面右侧 YAML editor 支持直接编辑；编辑后会 350ms 防抖调用 `/api/yaml/validate`；校验面板能显示精确错误路径，例如删除 `project.title` 后显示 `project.title` 和 `必填字段缺失`。

当前前端还已证明：`剧本预览` 会复用当前 YAML editor 的事实源，在 validation pass 时渲染场景头部和 action/dialogue/narration/transition/inner_voice 五类 beat；validation fail 时会显示预览暂停态。

工作流已更新：generator 每轮只做简单验证；收尾前调用 evaluator 子代理，由 evaluator 使用 Chrome DevTools MCP 做真实交互验证，并截屏进行视觉检查。涉及用户路径的 feature 只有 evaluator QA 放行后才能置 `passes:true`。

## 已搭好的地基

- 根 `AGENTS.md`：项目地图、开工阅读顺序、完成标准。
- `docs/` 补全：开发流程、质量说明、决策记录、交接、排障、contract/QA 模板。
- `feature_list.json`：Phase 0-5 结构化进度表，当前 `P0-E2E-001`、`P0-INFRA-002`、`P1-VALIDATE-001`、`P1-VALIDATE-002`、`P2-LLM-001`、`P3-PIPELINE-001`、`P3-PIPELINE-002`、`P4-EDITOR-001`、`P4-PREVIEW-002` 为 `passes:true`。
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

## 下一个 coding agent 从哪里开始

建议从 `P4-EXPORT-003` 开始：复用当前 YAML editor 的事实源导出 `.yaml`，并复用本轮预览映射语义生成 `.md`。若优先补硬性输入边界，则从 `P5-POLISH-001` 开始。

## 已知风险

- 当前 OpenAIProvider 已实现，但自动化验收使用本地 OpenAI-compatible fake server，没有调用真实外部 OpenAI API；接真实模型仍需要本地 `.env` 提供 key、base URL 和 model。
- `validation.valid` 现在代表结构校验和应用层 hard errors 都通过；章节覆盖提示属于 `warnings`，不阻断 `valid:true`。
- 本轮验证依赖 pnpm 可用；Windows PATH 如异常，先按 `docs/runbooks/debug.md` 排查。

## 验证记录

- `& 'C:\nvm4w\nodejs\pnpm.cmd' verify`：本轮通过。覆盖 typecheck、lint、Vitest、build。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' test:ui`：本轮通过。Playwright Chromium 4 passed，真实浏览器覆盖 mock route smoke、P2 请求体断言、P4 editor validation 和 P4 preview。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web typecheck`：本轮通过。
- `& 'C:\nvm4w\nodejs\pnpm.cmd' --filter @story2script/web test`：本轮通过，web 1 个 Vitest 文件 / 2 个 tests。
- `powershell.exe -ExecutionPolicy Bypass -File .\init.ps1`：上一轮通过。脚本会 install、verify、安装 Playwright Chromium、跑 UI smoke。本轮未重复运行。
- `node scripts/read-dev-logs.js`：上一轮通过。能读取 `logs/server-dev.jsonl` 中的结构化 JSON 行。
- `pnpm install`：本轮通过，lockfile up to date；web 显式加入 `js-yaml` 与 `@types/js-yaml`。
- `pnpm logs`：上一轮通过，根脚本别名可读取同一结构化日志入口。

## 重要收尾说明

- `feature_list.json` 当前只有 `P0-E2E-001`、`P0-INFRA-002`、`P1-VALIDATE-001`、`P1-VALIDATE-002`、`P2-LLM-001`、`P3-PIPELINE-001`、`P3-PIPELINE-002`、`P4-EDITOR-001` 与 `P4-PREVIEW-002` 为 `passes:true`，其他 feature 仍为 `false`。
- `P0-E2E-001` 已有 contract/QA 证据，可以作为 Phase 0 mock 端到端基线。
- `P0-INFRA-002` 已有 contract/QA 证据，可以作为仓库开发 harness 基线。
- `P1-VALIDATE-001` 已有 contract/QA 证据，可以作为 Phase 1 结构校验基线。
- `P1-VALIDATE-002` 已有 contract/QA 证据，可以作为 Phase 1 应用层校验基线。
- `P2-LLM-001` 已有 contract/QA 证据，可以作为 Phase 2 OpenAI-compatible provider 基线。
- `P3-PIPELINE-001` 与 `P3-PIPELINE-002` 已有 contract/QA 证据，可以作为 Phase 3 pipeline 基线。
- `P4-EDITOR-001` 已有 contract/QA 证据，可以作为 Phase 4 YAML 编辑与校验基线。
- `P4-PREVIEW-002` 已有 contract/QA 证据，可以作为 Phase 4 剧本预览基线。
- Playwright 的 webServer 必须从仓库根启动 `pnpm dev`，配置里已经显式设置 `cwd`。
