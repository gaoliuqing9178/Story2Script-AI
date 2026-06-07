import type { BeatType, Screenplay } from '@story2script/shared';
import { load } from 'js-yaml';

export interface PreviewBeat {
  type: BeatType;
  label: string;
  content: string;
  speakerName?: string;
}

export interface PreviewScene {
  id: string;
  number: number;
  title: string;
  locationName: string;
  time: string;
  characterNames: string[];
  beats: PreviewBeat[];
}

export function parseScreenplayYaml(yaml: string): Screenplay | null {
  const parsed = load(yaml);

  if (!isRecord(parsed) || !Array.isArray(parsed.scenes)) {
    return null;
  }

  return parsed as unknown as Screenplay;
}

export function buildScreenplayPreview(screenplay: Screenplay): PreviewScene[] {
  const characterNamesById = new Map(screenplay.characters.map((character) => [character.id, character.name] as const));
  const locationNamesById = new Map(screenplay.locations.map((location) => [location.id, location.name] as const));

  return [...screenplay.scenes]
    .sort((first, second) => first.order - second.order)
    .map((scene, index) => ({
      id: scene.id,
      number: scene.order || index + 1,
      title: scene.title,
      locationName: resolveName(locationNamesById, scene.location_id),
      time: scene.time?.trim() ? scene.time : '未标注',
      characterNames: scene.characters.map((characterId) => resolveName(characterNamesById, characterId)),
      beats: scene.beats.map((beat) => buildPreviewBeat(beat, characterNamesById))
    }));
}

export function buildScreenplayMarkdown(screenplay: Screenplay): string {
  const lines = [`# ${screenplay.project.title}`, '', `- 语言：${screenplay.project.language}`];

  if (screenplay.project.logline?.trim()) {
    lines.push(`- 梗概：${screenplay.project.logline}`);
  }

  if (screenplay.project.theme?.trim()) {
    lines.push(`- 主题：${screenplay.project.theme}`);
  }

  for (const scene of buildScreenplayPreview(screenplay)) {
    lines.push(
      '',
      `## 第 ${scene.number} 场 ${scene.title}`,
      '',
      `- 地点：${scene.locationName}`,
      `- 时间：${scene.time}`,
      `- 人物：${scene.characterNames.length > 0 ? scene.characterNames.join('、') : '未标注'}`,
      ''
    );

    for (const beat of scene.beats) {
      lines.push(renderMarkdownBeat(beat), '');
    }
  }

  return `${lines.join('\n').replace(/\n{3,}/g, '\n\n')}\n`;
}

function buildPreviewBeat(
  beat: Screenplay['scenes'][number]['beats'][number],
  characterNamesById: Map<string, string>
): PreviewBeat {
  const base = {
    type: beat.type,
    label: getBeatLabel(beat.type),
    content: beat.content
  };

  if (!beat.speaker) {
    return base;
  }

  return {
    ...base,
    speakerName: resolveName(characterNamesById, beat.speaker)
  };
}

function renderMarkdownBeat(beat: PreviewBeat) {
  switch (beat.type) {
    case 'action':
      return beat.content;
    case 'dialogue':
      return `**${beat.speakerName ?? '未标注角色'}**\n\n${beat.content}`;
    case 'narration':
      return `> 旁白：${beat.content}`;
    case 'transition':
      return `**${beat.content}**`;
    case 'inner_voice':
      return `_（内心）${beat.speakerName ?? '未标注角色'}：${beat.content}_`;
    default: {
      const exhaustive: never = beat.type;
      return exhaustive;
    }
  }
}

function getBeatLabel(type: BeatType) {
  switch (type) {
    case 'action':
      return '动作';
    case 'dialogue':
      return '对白';
    case 'narration':
      return '旁白';
    case 'transition':
      return '转场';
    case 'inner_voice':
      return '内心';
    default: {
      const exhaustive: never = type;
      return exhaustive;
    }
  }
}

function resolveName(namesById: Map<string, string>, id: string) {
  return namesById.get(id) ?? id;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
