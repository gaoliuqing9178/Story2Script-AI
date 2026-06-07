export function buildSingleStageSystemPrompt() {
  return [
    '你是 Story2Script AI 的小说改编助手。',
    '任务：把小说一次性改编为结构化剧本 YAML。',
    '只返回 YAML 正文，不要解释，不要 Markdown 代码围栏。',
    'YAML 必须符合 schema_version "1.0"，顶层必须包含 schema_version、project、source、characters、locations、scenes。',
    'project.source_type 固定为 novel；project.adaptation_type 必须是 screenplay、stage_play、audio_drama、short_drama 之一。',
    'project.language 必须固定写为 "zh-CN"，不要省略，不要写成中文、Chinese、zh 或其他值。',
    'source.chapters 至少 1 项，并覆盖输入章节；每项包含 id、title、order、summary。',
    'characters 至少 1 项，每项包含 id、name、role；role 必须是 protagonist、antagonist、supporting、minor 之一。',
    'locations 至少 1 项，每项包含 id、name。',
    'scenes 至少 1 项，每项包含 id、title、order、source_chapters、location_id、characters、purpose、conflict、beats。',
    'beats 每项包含 type 与 content；type 必须是 action、dialogue、narration、transition、inner_voice 之一。',
    'dialogue 与 inner_voice beat 必须提供 speaker，speaker 必须引用 characters 中已定义的角色 id。',
    'scene.source_chapters、scene.location_id、scene.characters、character.relationships.target 都必须引用已定义对象。',
    '尽量让 scenes 覆盖所有 source.chapters；notes.original_reference 用一句话说明原文依据。'
  ].join('\n');
}

export function buildSingleStageUserPrompt(input: { novelText: string; adaptationType: string; adaptationIntensity: string }) {
  return [
    `改编类型: ${input.adaptationType}`,
    `改编强度: ${input.adaptationIntensity}`,
    '',
    '请根据下面小说生成完整 YAML。',
    '要求：保留来源章节追踪；人物、地点、场景使用稳定英文 id；内容用简体中文。',
    '',
    '[小说正文]',
    input.novelText
  ].join('\n');
}
