import type { AdaptationType, Chapter, ChapterAnalysis, ValidationError } from '@story2script/shared';
import type { ScreenplayBible } from './types.js';

export const STAGE_MARKERS = {
  analysis: '[story2script-stage:chapter-analysis]',
  bible: '[story2script-stage:screenplay-bible]',
  sceneGeneration: '[story2script-stage:scene-generation]',
  repair: '[story2script-stage:structure-repair]'
} as const;

export function buildChapterAnalysisPrompt(chapter: Chapter) {
  return {
    system: [
      STAGE_MARKERS.analysis,
      '你是 Story2Script AI 的章节分析助手。',
      '只返回 JSON，不要解释，不要 Markdown 代码围栏。',
      'JSON 必须包含 chapter_id、summary、characters、locations、key_events、conflicts、adaptation_notes。',
      'characters、locations、key_events、conflicts、adaptation_notes 必须全部是 string[]，不要返回对象数组。'
    ].join('\n'),
    user: [
      '请分析下面章节，为后续剧本改编提供稳定中间结果。',
      '',
      '[chapter-json]',
      JSON.stringify(chapter, null, 2),
      '[/chapter-json]'
    ].join('\n')
  };
}

export function buildBiblePrompt(analyses: ChapterAnalysis[]) {
  return {
    system: [
      STAGE_MARKERS.bible,
      '你是 Story2Script AI 的剧本圣经整理助手。',
      '只返回 JSON，不要解释，不要 Markdown 代码围栏。',
      'JSON 必须包含 logline、theme、characters、locations、timeline、main_conflict、adaptation_principles。',
      'logline、theme、main_conflict 必须是非空 string；timeline、adaptation_principles 必须是 string[]。',
      'characters 必须是对象数组，每项至少包含 id、name、role；locations 必须是对象数组，每项至少包含 id、name。'
    ].join('\n'),
    user: [
      '请根据逐章分析结果，统一人物、地点、主题、时间线和主线矛盾。',
      '',
      '[analyses-json]',
      JSON.stringify(analyses, null, 2),
      '[/analyses-json]'
    ].join('\n')
  };
}

export function buildSceneGenerationPrompt(input: {
  chapters: Chapter[];
  analyses: ChapterAnalysis[];
  bible: ScreenplayBible;
  adaptationType: AdaptationType;
  adaptationIntensity: string;
}) {
  return {
    system: [
      STAGE_MARKERS.sceneGeneration,
      '你是 Story2Script AI 的分场剧本生成助手。',
      '只返回 YAML 正文，不要解释，不要 Markdown 代码围栏。',
      'YAML 必须符合 schema_version "1.0"，顶层必须包含 schema_version、project、source、characters、locations、scenes。',
      'project.source_type 固定为 novel；project.adaptation_type 必须使用请求中的改编类型。',
      'project.language 必须固定写为 "zh-CN"，不要省略，不要写成中文、Chinese、zh 或其他值。',
      'source.chapters 必须覆盖输入章节；scenes 必须至少引用每个 source chapter 一次。',
      'characters、locations、scenes 使用稳定英文 id；所有引用必须指向已定义对象。',
      'dialogue 与 inner_voice beat 必须提供 speaker，speaker 必须引用 characters 中已定义的角色 id。',
      '每个场景必须有 purpose、conflict、beats 和 notes.original_reference。'
    ].join('\n'),
    user: [
      `adaptation_type: ${input.adaptationType}`,
      `adaptation_intensity: ${input.adaptationIntensity}`,
      '',
      '[chapters-json]',
      JSON.stringify(input.chapters, null, 2),
      '[/chapters-json]',
      '',
      '[analyses-json]',
      JSON.stringify(input.analyses, null, 2),
      '[/analyses-json]',
      '',
      '[bible-json]',
      JSON.stringify(input.bible, null, 2),
      '[/bible-json]'
    ].join('\n')
  };
}

export function buildRepairPrompt(input: { yaml: string; errors: ValidationError[]; warnings?: ValidationError[] }) {
  return {
    system: [
      STAGE_MARKERS.repair,
      '你是 Story2Script AI 的 YAML 结构修复助手。',
      '只返回 YAML 正文，不要解释，不要 Markdown 代码围栏。',
      '只修复结构问题、缺失字段、错误引用、枚举值和缩进。',
      '如果 project.language 缺失或为空，必须补为 "zh-CN"。',
      '不要重写剧情，不要删除或替换既有人物、地点、场景和来源章节。',
      '修复后必须符合 schema_version "1.0" 的剧本 YAML 契约。'
    ].join('\n'),
    user: [
      '请根据校验错误修复下面 YAML。',
      '',
      '[validation-errors-json]',
      JSON.stringify(input.errors, null, 2),
      '[/validation-errors-json]',
      '',
      '[validation-warnings-json]',
      JSON.stringify(input.warnings ?? [], null, 2),
      '[/validation-warnings-json]',
      '',
      '[yaml]',
      input.yaml,
      '[/yaml]'
    ].join('\n')
  };
}
