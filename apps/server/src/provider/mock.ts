import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { dump } from 'js-yaml';
import type { AdaptationType, Chapter, ChapterAnalysis, Screenplay } from '@story2script/shared';
import type { LLMProvider, ProviderRequest } from './index.js';
import { STAGE_MARKERS } from '../pipeline/prompts.js';
import type { ScreenplayBible } from '../pipeline/types.js';

function findRepoFile(relativePath: string) {
  const candidates = [
    resolve(process.cwd(), relativePath),
    resolve(process.cwd(), '..', relativePath),
    resolve(process.cwd(), '..', '..', relativePath)
  ];
  const found = candidates.find((candidate) => existsSync(candidate));

  if (!found) {
    throw new Error(`Cannot find ${relativePath} from ${process.cwd()}`);
  }

  return found;
}

export class MockProvider implements LLMProvider {
  async complete(input: ProviderRequest): Promise<string> {
    if (input.system.includes(STAGE_MARKERS.analysis)) {
      return JSON.stringify(buildMockAnalysis(readJsonBlock<Chapter>(input.user, 'chapter-json')), null, 2);
    }

    if (input.system.includes(STAGE_MARKERS.bible)) {
      return JSON.stringify(buildMockBible(readJsonBlock<ChapterAnalysis[]>(input.user, 'analyses-json')), null, 2);
    }

    if (input.system.includes(STAGE_MARKERS.sceneGeneration)) {
      return buildMockScreenplayYaml({
        chapters: readJsonBlock<Chapter[]>(input.user, 'chapters-json'),
        adaptationType: readAdaptationType(input.user)
      });
    }

    if (input.system.includes(STAGE_MARKERS.repair)) {
      const samplePath = findRepoFile('examples/screenplay-sample.yaml');
      return readFile(samplePath, 'utf8');
    }

    const samplePath = findRepoFile('examples/screenplay-sample.yaml');
    return readFile(samplePath, 'utf8');
  }

  async *stream(input: ProviderRequest): AsyncIterable<string> {
    const text = await this.complete(input);

    for (const chunk of chunkText(text, 180)) {
      yield chunk;
      await waitForStreamFrame();
    }
  }
}

function chunkText(text: string, size: number) {
  const chunks: string[] = [];

  for (let index = 0; index < text.length; index += size) {
    chunks.push(text.slice(index, index + size));
  }

  return chunks;
}

function waitForStreamFrame() {
  return new Promise((resolve) => {
    setTimeout(resolve, 8);
  });
}

function buildMockAnalysis(chapter: Chapter): ChapterAnalysis {
  return {
    chapter_id: chapter.id,
    summary: `${chapter.title} 的核心情节被整理为可改编段落。`,
    characters: ['林舟', '沈念'],
    locations: ['旧火车站'],
    key_events: [`${chapter.title} 推进主线线索。`],
    conflicts: ['林舟想继续追查，沈念担心他被过去拖住。'],
    adaptation_notes: ['把心理描写转成动作、对白和可视化线索。']
  };
}

function buildMockBible(analyses: ChapterAnalysis[]): ScreenplayBible {
  return {
    logline: '一个离乡多年的青年回到故乡，追查父亲死亡真相。',
    theme: '记忆、真相与和解',
    characters: [
      {
        id: 'char_linzhou',
        name: '林舟',
        aliases: ['阿舟'],
        role: 'protagonist',
        description: '沉默克制，带着旧案线索回到故乡。',
        goals: ['查清父亲死亡真相'],
        relationships: [{ target: 'char_shennian', relation: '旧友，也可能是最理解他的人' }]
      },
      {
        id: 'char_shennian',
        name: '沈念',
        role: 'supporting',
        description: '林舟的旧友，敏锐而克制。',
        goals: ['阻止林舟再次被过去吞没']
      }
    ],
    locations: [
      {
        id: 'loc_old_station',
        name: '旧火车站',
        type: 'station',
        description: '雨夜里的旧站台，是林舟回乡的入口。'
      }
    ],
    timeline: analyses.map((analysis) => `${analysis.chapter_id}: ${analysis.summary}`),
    main_conflict: '林舟执意追查旧案，沈念必须判断该保护他还是帮助他。',
    adaptation_principles: ['保留来源章节追踪', '把内心描写外化为动作和对白', '每场都保留明确冲突']
  };
}

function buildMockScreenplayYaml(input: { chapters: Chapter[]; adaptationType: AdaptationType }) {
  const bible = buildMockBible([]);
  const screenplay: Screenplay = {
    schema_version: '1.0',
    project: {
      title: '雨夜归来',
      source_type: 'novel',
      adaptation_type: input.adaptationType,
      language: 'zh-CN',
      logline: '一个离乡多年的青年在雨夜回到故乡，试图查清父亲死亡真相。',
      theme: '记忆、真相与和解'
    },
    source: {
      chapters: input.chapters.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        order: chapter.order,
        summary: `${chapter.title} 的剧情被压缩为一场关键戏。`
      }))
    },
    characters: bible.characters,
    locations: bible.locations,
    scenes: input.chapters.map((chapter) => ({
      id: `scene_${chapter.order.toString().padStart(3, '0')}`,
      title: chapter.title.replace(/^第\s*\S+\s*章\s*/u, '') || chapter.title,
      order: chapter.order,
      source_chapters: [chapter.id],
      location_id: 'loc_old_station',
      time: '夜晚',
      mood: '悬疑、克制',
      characters: ['char_linzhou', 'char_shennian'],
      purpose: `承接 ${chapter.title} 的核心事件。`,
      conflict: '林舟坚持追查，沈念试图让他保持清醒。',
      beats: [
        {
          type: 'action',
          content: `${chapter.title} 的关键线索在雨声中浮出水面。`
        },
        {
          type: 'dialogue',
          speaker: 'char_shennian',
          content: '你确定还要继续查下去吗？'
        },
        {
          type: 'dialogue',
          speaker: 'char_linzhou',
          content: '如果现在停下，我就再也回不来了。'
        }
      ],
      notes: {
        adaptation_reason: '将章节内容压缩为一场具备动作和对白的戏。',
        original_reference: `${chapter.title}: ${chapter.content.slice(0, 40)}`
      }
    }))
  };

  return dump(screenplay, {
    lineWidth: -1,
    noRefs: true
  });
}

function readJsonBlock<T>(text: string, blockName: string): T {
  const start = `[${blockName}]`;
  const end = `[/${blockName}]`;
  const startIndex = text.indexOf(start);
  const endIndex = text.indexOf(end);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error(`MockProvider cannot find ${blockName}.`);
  }

  return JSON.parse(text.slice(startIndex + start.length, endIndex).trim()) as T;
}

function readAdaptationType(text: string): AdaptationType {
  const match = /^adaptation_type:\s*(screenplay|stage_play|audio_drama|short_drama)$/mu.exec(text);
  return (match?.[1] as AdaptationType | undefined) ?? 'screenplay';
}
