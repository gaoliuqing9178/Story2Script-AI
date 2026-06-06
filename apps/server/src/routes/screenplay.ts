import { Router } from 'express';
import { createProvider } from '../provider/index.js';
import { logEvent } from '../logger.js';
import { validateScreenplayYamlStructure } from '../validate/structural.js';

export const screenplayRouter: Router = Router();

const adaptationTypes = new Set(['screenplay', 'stage_play', 'audio_drama', 'short_drama']);

screenplayRouter.post('/generate', async (req, res, next) => {
  try {
    const providerName = process.env.LLM_PROVIDER === 'openai' ? 'openai' : 'mock';
    const requestBody = req.body as GenerateScreenplayRequest;
    const novelText = getNovelText(requestBody);
    const adaptationType = getAdaptationType(requestBody);
    const adaptationIntensity = getOptionalString(requestBody.adaptation_intensity) ?? 'balanced';

    if (providerName === 'openai' && !novelText) {
      res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'novel, novel_text, or text must be a non-empty string when LLM_PROVIDER=openai'
        }
      });
      return;
    }

    const provider = createProvider();
    const yaml = await provider.complete({
      system: buildSingleStageSystemPrompt(),
      user: buildSingleStageUserPrompt({
        novelText: novelText ?? 'Initializer harness request',
        adaptationType,
        adaptationIntensity
      }),
      temperature: providerName === 'openai' ? 0.2 : 0
    });

    logEvent('screenplay.generate.completed', {
      provider: providerName,
      input_chars: novelText?.length ?? 0,
      bytes: Buffer.byteLength(yaml, 'utf8')
    });

    const validation = validateScreenplayYamlStructure(yaml);

    res.json({
      yaml,
      validation
    });
  } catch (error) {
    if (process.env.LLM_PROVIDER === 'openai') {
      const message = error instanceof Error ? error.message : 'LLM provider failed.';
      logEvent('screenplay.generate.provider_failed', {
        level: 'error',
        provider: 'openai',
        message
      });
      res.status(502).json({
        error: {
          code: 'LLM_UNAVAILABLE',
          message
        }
      });
      return;
    }

    next(error);
  }
});

interface GenerateScreenplayRequest {
  novel?: unknown;
  novel_text?: unknown;
  text?: unknown;
  adaptation_type?: unknown;
  adaptation_intensity?: unknown;
}

function getNovelText(requestBody: GenerateScreenplayRequest) {
  return getOptionalString(requestBody.novel) ?? getOptionalString(requestBody.novel_text) ?? getOptionalString(requestBody.text);
}

function getOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function getAdaptationType(requestBody: GenerateScreenplayRequest) {
  const requested = getOptionalString(requestBody.adaptation_type);

  if (requested && adaptationTypes.has(requested)) {
    return requested;
  }

  return 'screenplay';
}

function buildSingleStageSystemPrompt() {
  return [
    '你是 Story2Script AI 的小说改编助手。',
    '任务：把三章以上小说一次性改编为结构化剧本 YAML。',
    '只返回 YAML 正文，不要解释，不要 Markdown 代码围栏。',
    'YAML 必须符合 schema_version "1.0"，顶层必须包含 schema_version、project、source、characters、locations、scenes。',
    'project.source_type 固定为 novel；project.adaptation_type 必须是 screenplay、stage_play、audio_drama、short_drama 之一。',
    'source.chapters 至少 3 项，每项包含 id、title、order、summary。',
    'characters 至少 1 项，每项包含 id、name、role；role 必须是 protagonist、antagonist、supporting、minor 之一。',
    'locations 至少 1 项，每项包含 id、name。',
    'scenes 至少 1 项，每项包含 id、title、order、source_chapters、location_id、characters、purpose、conflict、beats。',
    'beats 每项包含 type 与 content；type 必须是 action、dialogue、narration、transition、inner_voice 之一。',
    'dialogue 与 inner_voice beat 必须提供 speaker，speaker 必须引用 characters 中已定义的角色 id。',
    'scene.source_chapters、scene.location_id、scene.characters、character.relationships.target 都必须引用已定义对象。',
    '尽量让 scenes 覆盖所有 source.chapters；notes.original_reference 用一句话说明原文依据。'
  ].join('\n');
}

function buildSingleStageUserPrompt(input: { novelText: string; adaptationType: string; adaptationIntensity: string }) {
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
