import type { ChapterAnalysis } from '@story2script/shared';
import type { LLMProvider } from '../provider/index.js';
import { buildBiblePrompt } from './prompts.js';
import { parseProviderJson } from './json.js';
import type { ScreenplayBible } from './types.js';

type BibleCharacter = ScreenplayBible['characters'][number];

export async function generateScreenplayBible(
  analyses: ChapterAnalysis[],
  provider: LLMProvider
): Promise<ScreenplayBible> {
  const prompt = buildBiblePrompt(analyses);
  const response = await provider.complete({
    ...prompt,
    temperature: 0.1
  });
  const parsed = parseProviderJson<unknown>(response, 'screenplay bible');

  return normalizeBible(parsed, analyses);
}

function normalizeBible(value: unknown, analyses: ChapterAnalysis[]): ScreenplayBible {
  const record = readLooseRecord(value);
  const analysisSummaries = analyses.map((analysis) => analysis.summary).filter(Boolean);
  const analysisConflicts = uniqueStrings(analyses.flatMap((analysis) => analysis.conflicts));

  return {
    logline: readText(record.logline) ?? analysisSummaries[0] ?? '待提炼故事主线',
    theme: readTheme(record) ?? '真相、记忆与选择',
    characters: readCharacters(record.characters, analyses),
    locations: readLocations(record.locations, analyses),
    timeline: readTextArray(record.timeline, analysisSummaries.length > 0 ? analysisSummaries : ['关键时间线待提炼']),
    main_conflict: readText(record.main_conflict) ?? analysisConflicts[0] ?? '核心冲突待提炼',
    adaptation_principles: readTextArray(record.adaptation_principles, ['保留章节来源', '每场有明确冲突'])
  };
}

function readLooseRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function readTheme(record: Record<string, unknown>) {
  return (
    readText(record.theme) ??
    readText(record.themes) ??
    readText(record.topic) ??
    readText(record.core_theme) ??
    readText(record.main_theme)
  );
}

function readCharacters(value: unknown, analyses: ChapterAnalysis[]): ScreenplayBible['characters'] {
  const fromBible = readArrayItems(value).flatMap((item, index) => readCharacter(item, index));

  if (fromBible.length > 0) {
    return dedupeById(fromBible);
  }

  const fromAnalyses: ScreenplayBible['characters'] = uniqueStrings(analyses.flatMap((analysis) => analysis.characters)).map(
    (name, index) => ({
      id: buildStableId('char', name, index),
      name,
      role: readRole(undefined, index)
    })
  );

  return fromAnalyses.length > 0
    ? fromAnalyses
    : [{ id: 'char_protagonist', name: '待识别人物', role: 'protagonist' }];
}

function readCharacter(value: unknown, index: number): ScreenplayBible['characters'] {
  const name = readText(value);

  if (name) {
    return [{ id: buildStableId('char', name, index), name, role: readRole(undefined, index) }];
  }

  const record = readLooseRecord(value);
  const recordName = readText(record.name) ?? readText(record.title);

  if (!recordName) {
    return [];
  }

  const character = {
    id: readText(record.id) ?? buildStableId('char', recordName, index),
    name: recordName,
    role: readRole(record.role, index)
  };
  const description = readText(record.description) ?? readText(record.summary);
  const goals = readTextArray(record.goals, []);

  return [
    {
      ...character,
      ...(description ? { description } : {}),
      ...(goals.length > 0 ? { goals } : {})
    }
  ];
}

function readLocations(value: unknown, analyses: ChapterAnalysis[]): ScreenplayBible['locations'] {
  const fromBible = readArrayItems(value).flatMap((item, index) => readLocation(item, index));

  if (fromBible.length > 0) {
    return dedupeById(fromBible);
  }

  const fromAnalyses = uniqueStrings(analyses.flatMap((analysis) => analysis.locations)).map((name, index) => ({
    id: buildStableId('loc', name, index),
    name
  }));

  return fromAnalyses.length > 0 ? fromAnalyses : [{ id: 'loc_primary', name: '待识别地点' }];
}

function readLocation(value: unknown, index: number): ScreenplayBible['locations'] {
  const name = readText(value);

  if (name) {
    return [{ id: buildStableId('loc', name, index), name }];
  }

  const record = readLooseRecord(value);
  const recordName = readText(record.name) ?? readText(record.title) ?? readText(record.location);

  if (!recordName) {
    return [];
  }

  const type = readText(record.type);
  const description = readText(record.description) ?? readText(record.summary);

  return [
    {
      id: readText(record.id) ?? buildStableId('loc', recordName, index),
      name: recordName,
      ...(type ? { type } : {}),
      ...(description ? { description } : {})
    }
  ];
}

function readRole(value: unknown, index: number): BibleCharacter['role'] {
  const role = readText(value);

  if (role === 'protagonist' || role === 'antagonist' || role === 'supporting' || role === 'minor') {
    return role;
  }

  return index === 0 ? 'protagonist' : 'supporting';
}

function readArrayItems(value: unknown) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === undefined || value === null) {
    return [];
  }

  return [value];
}

function readTextArray(value: unknown, fallback: string[]) {
  const values = Array.isArray(value) ? value.flatMap(readTextItem) : readTextItem(value);
  const strings = uniqueStrings(values);

  return strings.length > 0 ? strings : fallback;
}

function readTextItem(value: unknown): string[] {
  const text = readText(value);

  if (text) {
    return splitInlineList(text);
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }

  const record = value as Record<string, unknown>;
  const preferredKeys = ['name', 'title', 'summary', 'description', 'content', 'event', 'conflict', 'note', 'text'];

  for (const key of preferredKeys) {
    const nested = readTextItem(record[key]);

    if (nested.length > 0) {
      return nested;
    }
  }

  return Object.values(record).flatMap(readTextItem);
}

function readText(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

function splitInlineList(value: string) {
  return value
    .split(/\r?\n|、|;|；/u)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function buildStableId(prefix: 'char' | 'loc', name: string, index: number) {
  const slug = name
    .normalize('NFKD')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '_')
    .replace(/^_+|_+$/gu, '')
    .toLowerCase();

  return `${prefix}_${slug || index + 1}`;
}

function dedupeById<TItem extends { id: string }>(items: TItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))];
}
