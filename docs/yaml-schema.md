# AI 小说转剧本工具 YAML Schema v1.0

## 1. 设计目标

本 Schema 用于描述 AI 小说转剧本工具输出的结构化剧本 YAML。

设计目标包括：

- 让小说作者能直接阅读和编辑剧本初稿。
- 让系统能稳定校验 AI 生成内容。
- 让剧本结构具备人物、地点、场景、动作、对白和来源追溯。
- 为后续扩展短剧、影视剧、舞台剧、广播剧等格式预留空间。

本 Schema 关注“剧本初稿”阶段，不追求完全覆盖专业影视工业格式。它的重点是让小说到剧本的第一步改编可控、可编辑、可继续打磨。

## 2. 顶层结构

完整 YAML 顶层结构如下：

```yaml
schema_version: "1.0"

project:
  title: "雨夜归来"
  source_type: "novel"
  adaptation_type: "screenplay"
  language: "zh-CN"
  logline: "一个离乡多年的青年在雨夜回到故乡，试图查清父亲死亡真相。"
  theme: "记忆、真相与和解"

source:
  chapters:
    - id: "chapter_001"
      title: "第一章 雨夜归来"
      order: 1
      summary: "林舟在雨夜回到故乡，并与旧友沈念重逢。"
    - id: "chapter_002"
      title: "第二章 旧信"
      order: 2
      summary: "林舟发现父亲留下的旧信，信中暗示当年的事故并不简单。"
    - id: "chapter_003"
      title: "第三章 巷口的灯"
      order: 3
      summary: "沈念带林舟回到老街，两人发现有人正在暗中监视他们。"

characters:
  - id: "char_linzhou"
    name: "林舟"
    aliases:
      - "阿舟"
    role: "protagonist"
    description: "沉默克制，带着过去的秘密回到故乡。"
    goals:
      - "查清父亲死亡真相"
    relationships:
      - target: "char_shennian"
        relation: "旧友，也可能是最理解他的人"

locations:
  - id: "loc_old_station"
    name: "旧火车站"
    type: "station"
    description: "废弃多年的老站台，雨夜中显得冷清压抑。"

scenes:
  - id: "scene_001"
    title: "雨夜归来"
    order: 1
    source_chapters:
      - "chapter_001"
    location_id: "loc_old_station"
    time: "夜晚"
    mood: "压抑、悬疑"
    characters:
      - "char_linzhou"
      - "char_shennian"
    purpose: "建立主角回乡和旧人重逢的开端。"
    conflict: "林舟试图隐藏回来的真正原因，沈念察觉异常。"
    beats:
      - type: "action"
        content: "雨水砸在站台铁皮棚上，林舟拖着旧行李箱走出车厢。"
      - type: "dialogue"
        speaker: "char_shennian"
        content: "你还是回来了。"
      - type: "dialogue"
        speaker: "char_linzhou"
        content: "只是回来办点事。"
      - type: "action"
        content: "沈念看向他怀里的旧信封，眼神微微一沉。"
    notes:
      adaptation_reason: "原文中的内心描写被改写为可视化动作和道具。"
      original_reference: "第一章：林舟雨夜抵达旧火车站，与沈念重逢。"
```

## 3. 字段定义

### 3.1 `schema_version`

类型：`string`

是否必填：是

示例：

```yaml
schema_version: "1.0"
```

设计原因：

Schema 会随着项目发展而变化。`schema_version` 用于标识当前 YAML 使用的结构版本，方便后续增加分集、镜头语言、舞台剧调度或广播剧音效字段。

### 3.2 `project`

类型：`object`

是否必填：是

字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | 是 | 剧本标题 |
| `source_type` | `string` | 是 | 来源类型，MVP 固定为 `novel` |
| `adaptation_type` | `string` | 是 | 改编类型 |
| `language` | `string` | 是 | 语言，例如 `zh-CN` |
| `logline` | `string` | 否 | 故事一句话简介 |
| `theme` | `string` | 否 | 故事主题 |

`adaptation_type` 可选值：

- `screenplay`：影视分场剧本。
- `stage_play`：舞台剧。
- `audio_drama`：广播剧。
- `short_drama`：短剧。

设计原因：

`project` 保存作品整体信息，帮助作者和系统理解这份 YAML 是什么类型的剧本。`adaptation_type` 能影响后续渲染方式，例如影视剧更强调地点和动作，广播剧更强调旁白、音效和对白。

### 3.3 `source`

类型：`object`

是否必填：是

字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `chapters` | `array` | 是 | 原小说章节摘要列表 |

`source.chapters[]` 字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 是 | 章节稳定 ID |
| `title` | `string` | 是 | 章节标题 |
| `order` | `number` | 是 | 章节顺序 |
| `summary` | `string` | 是 | 章节摘要 |

设计原因：

小说改编必须保留来源追溯。`source` 不保存完整原文，而保存章节 ID、标题和摘要，用于连接原小说与剧本场景。这样既能降低 YAML 体积，也能让作者知道某个场景来自哪些章节。

### 3.4 `characters`

类型：`array`

是否必填：是

每个角色字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 是 | 角色稳定 ID |
| `name` | `string` | 是 | 角色显示名 |
| `aliases` | `array<string>` | 否 | 别名、昵称或称谓 |
| `role` | `string` | 是 | 剧情角色类型 |
| `description` | `string` | 否 | 人物描述 |
| `goals` | `array<string>` | 否 | 人物目标 |
| `relationships` | `array<object>` | 否 | 人物关系 |

`role` 可选值：

- `protagonist`
- `antagonist`
- `supporting`
- `minor`

`relationships[]` 字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `target` | `string` | 是 | 目标角色 ID |
| `relation` | `string` | 是 | 关系描述 |

设计原因：

小说中同一人物可能有本名、昵称、代称或身份称谓。如果只使用名字，很容易出现 `林舟`、`阿舟`、`他` 被误认为不同角色的问题。使用稳定 `id` 可以让场景、对白和人物关系保持一致。

### 3.5 `locations`

类型：`array`

是否必填：是

每个地点字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 是 | 地点稳定 ID |
| `name` | `string` | 是 | 地点名称 |
| `type` | `string` | 否 | 地点类型 |
| `description` | `string` | 否 | 地点描述 |

设计原因：

剧本是强场景媒介。将地点独立出来，可以避免不同场景重复描述同一个地点，也方便后续扩展场景预算、拍摄地点、舞台调度或音效环境。

### 3.6 `scenes`

类型：`array`

是否必填：是

每个场景字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 是 | 场景稳定 ID |
| `title` | `string` | 是 | 场景标题 |
| `order` | `number` | 是 | 场景顺序 |
| `source_chapters` | `array<string>` | 是 | 来源章节 ID |
| `location_id` | `string` | 是 | 地点 ID |
| `time` | `string` | 否 | 场景时间 |
| `mood` | `string` | 否 | 场景氛围 |
| `characters` | `array<string>` | 是 | 出场角色 ID |
| `purpose` | `string` | 是 | 场景功能 |
| `conflict` | `string` | 是 | 场景冲突 |
| `beats` | `array<object>` | 是 | 场景内容节拍 |
| `notes` | `object` | 否 | 改编说明 |

设计原因：

小说章节不等于剧本场景。一个章节可能拆成多个场景，多个章节也可能合并成一个场景。`scenes` 用于表达最终剧本结构，而 `source_chapters` 用于说明这个场景来自哪些小说章节。

`purpose` 和 `conflict` 是本 Schema 的关键字段。它们迫使每个场景回答两个问题：

- 这一场在故事里有什么作用？
- 这一场的戏剧冲突是什么？

这能帮助作者判断场景是否值得保留，也能减少 AI 生成“只有说明，没有戏”的内容。

### 3.7 `beats`

类型：`array`

是否必填：是

每个 beat 字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `type` | `string` | 是 | 内容类型 |
| `speaker` | `string` | 条件必填 | 说话角色 ID |
| `content` | `string` | 是 | 内容正文 |

`type` 可选值：

- `action`：动作描写。
- `dialogue`：对白。
- `narration`：旁白。
- `transition`：转场。
- `inner_voice`：内心独白。

规则：

- 当 `type` 为 `dialogue` 或 `inner_voice` 时，`speaker` 必填。
- 当 `speaker` 存在时，必须引用 `characters` 中已定义的角色 ID。
- `content` 不允许为空。

设计原因：

剧本不是普通文章，而是动作、对白、旁白和转场的连续序列。使用 `beats` 数组可以保留剧本的时间顺序，同时允许不同类型内容混排。它比固定字段如 `actions`、`dialogues` 更灵活，也更适合 AI 分段生成和用户编辑。

### 3.8 `notes`

类型：`object`

是否必填：否

字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `adaptation_reason` | `string` | 否 | 改编原因 |
| `original_reference` | `string` | 否 | 原文依据 |

设计原因：

AI 改编需要建立信任。`notes` 让系统说明为什么这样改，以及这个场景大致对应原小说中的哪些内容。作者不必盲目信任模型输出，可以回到原文进行核对和修改。

## 4. 校验规则

### 4.1 结构校验

必须满足：

- 顶层必须包含 `schema_version`、`project`、`source`、`characters`、`locations`、`scenes`。
- `project.title`、`project.source_type`、`project.adaptation_type`、`project.language` 必填。
- `source.chapters` 至少包含 3 个章节。
- `characters` 至少包含 1 个角色。
- `locations` 至少包含 1 个地点。
- `scenes` 至少包含 1 个场景。
- 每个 scene 必须包含 `id`、`title`、`order`、`source_chapters`、`location_id`、`characters`、`purpose`、`conflict`、`beats`。
- 每个 beat 必须包含 `type` 和 `content`。

### 4.2 枚举校验

`project.adaptation_type` 只能是：

- `screenplay`
- `stage_play`
- `audio_drama`
- `short_drama`

`characters[].role` 只能是：

- `protagonist`
- `antagonist`
- `supporting`
- `minor`

`beats[].type` 只能是：

- `action`
- `dialogue`
- `narration`
- `transition`
- `inner_voice`

### 4.3 引用校验

必须满足：

- `scenes[].source_chapters[]` 必须引用 `source.chapters[].id`。
- `scenes[].location_id` 必须引用 `locations[].id`。
- `scenes[].characters[]` 必须引用 `characters[].id`。
- `beats[].speaker` 如果存在，必须引用 `characters[].id`。
- `characters[].relationships[].target` 如果存在，必须引用 `characters[].id`。

### 4.4 内容校验

建议满足：

- `content` 不为空。
- `purpose` 不为空。
- `conflict` 不为空。
- `order` 从 1 开始递增。
- `id` 在同类对象中唯一。

## 5. JSON Schema 草案

实现时可将 YAML 解析为 JavaScript object，再使用 JSON Schema 校验。

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Story2Script Screenplay YAML Schema",
  "type": "object",
  "required": ["schema_version", "project", "source", "characters", "locations", "scenes"],
  "properties": {
    "schema_version": {
      "type": "string",
      "const": "1.0"
    },
    "project": {
      "type": "object",
      "required": ["title", "source_type", "adaptation_type", "language"],
      "properties": {
        "title": { "type": "string", "minLength": 1 },
        "source_type": { "type": "string", "const": "novel" },
        "adaptation_type": {
          "type": "string",
          "enum": ["screenplay", "stage_play", "audio_drama", "short_drama"]
        },
        "language": { "type": "string", "minLength": 1 },
        "logline": { "type": "string" },
        "theme": { "type": "string" }
      }
    },
    "source": {
      "type": "object",
      "required": ["chapters"],
      "properties": {
        "chapters": {
          "type": "array",
          "minItems": 3,
          "items": {
            "type": "object",
            "required": ["id", "title", "order", "summary"],
            "properties": {
              "id": { "type": "string", "minLength": 1 },
              "title": { "type": "string", "minLength": 1 },
              "order": { "type": "number" },
              "summary": { "type": "string", "minLength": 1 }
            }
          }
        }
      }
    },
    "characters": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["id", "name", "role"],
        "properties": {
          "id": { "type": "string", "minLength": 1 },
          "name": { "type": "string", "minLength": 1 },
          "aliases": {
            "type": "array",
            "items": { "type": "string" }
          },
          "role": {
            "type": "string",
            "enum": ["protagonist", "antagonist", "supporting", "minor"]
          },
          "description": { "type": "string" },
          "goals": {
            "type": "array",
            "items": { "type": "string" }
          },
          "relationships": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["target", "relation"],
              "properties": {
                "target": { "type": "string", "minLength": 1 },
                "relation": { "type": "string", "minLength": 1 }
              }
            }
          }
        }
      }
    },
    "locations": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["id", "name"],
        "properties": {
          "id": { "type": "string", "minLength": 1 },
          "name": { "type": "string", "minLength": 1 },
          "type": { "type": "string" },
          "description": { "type": "string" }
        }
      }
    },
    "scenes": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": [
          "id",
          "title",
          "order",
          "source_chapters",
          "location_id",
          "characters",
          "purpose",
          "conflict",
          "beats"
        ],
        "properties": {
          "id": { "type": "string", "minLength": 1 },
          "title": { "type": "string", "minLength": 1 },
          "order": { "type": "number" },
          "source_chapters": {
            "type": "array",
            "minItems": 1,
            "items": { "type": "string" }
          },
          "location_id": { "type": "string", "minLength": 1 },
          "time": { "type": "string" },
          "mood": { "type": "string" },
          "characters": {
            "type": "array",
            "minItems": 1,
            "items": { "type": "string" }
          },
          "purpose": { "type": "string", "minLength": 1 },
          "conflict": { "type": "string", "minLength": 1 },
          "beats": {
            "type": "array",
            "minItems": 1,
            "items": {
              "type": "object",
              "required": ["type", "content"],
              "properties": {
                "type": {
                  "type": "string",
                  "enum": ["action", "dialogue", "narration", "transition", "inner_voice"]
                },
                "speaker": { "type": "string" },
                "content": { "type": "string", "minLength": 1 }
              }
            }
          },
          "notes": {
            "type": "object",
            "properties": {
              "adaptation_reason": { "type": "string" },
              "original_reference": { "type": "string" }
            }
          }
        }
      }
    }
  }
}
```

说明：

JSON Schema 负责基础结构校验。跨字段引用校验，例如 `speaker` 是否存在于 `characters`，需要在应用层额外实现。

## 6. 设计原因总结

### 6.1 为什么选择 YAML

YAML 比 JSON 更适合创作者阅读和修改。小说作者不一定熟悉代码，但可以比较自然地理解缩进、字段和值。YAML 也便于 AI 输出，并能被程序解析成结构化对象。

### 6.2 为什么保留全局人物表

剧本改编需要人物一致性。全局人物表可以减少角色重复、称谓混乱和对白归属错误，也方便后续做人设编辑和人物关系图。

### 6.3 为什么保留全局地点表

剧本以场景为单位组织，地点是剧本生产的重要资产。独立地点表可以支持后续扩展拍摄地点、舞台布景、音效环境和场景预算。

### 6.4 为什么使用 `scenes`

小说章节和剧本场景不是一一对应关系。剧本需要按可表演、可拍摄、可听见的单位组织内容，所以使用 `scenes` 作为核心结构。

### 6.5 为什么使用 `beats`

剧本中的动作、对白、旁白、转场会交替出现。`beats` 能保持内容顺序，也方便用户逐条编辑、删除或重排。

### 6.6 为什么需要 `purpose` 和 `conflict`

很多小说段落适合阅读，但不一定适合表演。`purpose` 和 `conflict` 帮助 AI 与作者判断场景是否有戏剧价值，避免生成只有背景介绍、没有推进作用的场景。

### 6.7 为什么需要来源追溯

作者需要知道 AI 为什么这样改。`source_chapters` 和 `original_reference` 可以让每个场景回到原文依据，减少 AI 改编的不透明感。

### 6.8 为什么使用 ID 引用

中文小说中人物和地点经常有多个称呼。使用稳定 ID 可以让结构校验更可靠，也方便未来接入人物关系图、场景卡片、时间线等功能。

## 7. 后续扩展方向

未来可以在兼容 v1.0 的基础上扩展：

- 分集结构：`episodes`。
- 镜头语言：`shots`、`camera`、`angle`。
- 舞台剧调度：`blocking`、`props`、`lighting`。
- 广播剧音效：`sound_effects`、`music_cue`。
- 版本管理：`revision`、`change_notes`。
- 协作批注：`comments`、`review_status`。
- 导出格式：Final Draft、Fountain、PDF。
