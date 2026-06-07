import type { Chapter, ChapterAnalysis } from '@story2script/shared';
import type { LLMProvider } from '../provider/index.js';
import { buildChapterAnalysisPrompt } from './prompts.js';
import { parseProviderJson, readRecord, readString } from './json.js';

export async function analyzeChapters(chapters: Chapter[], provider: LLMProvider): Promise<ChapterAnalysis[]> {
  return Promise.all(chapters.map((chapter) => analyzeChapter(chapter, provider)));
}

async function analyzeChapter(chapter: Chapter, provider: LLMProvider): Promise<ChapterAnalysis> {
  const prompt = buildChapterAnalysisPrompt(chapter);
  const response = await provider.complete({
    ...prompt,
    temperature: 0.1
  });
  const parsed = parseProviderJson<unknown>(response, `chapter ${chapter.id} analysis`);

  return normalizeChapterAnalysis(parsed, chapter);
}

function normalizeChapterAnalysis(value: unknown, chapter: Chapter): ChapterAnalysis {
  const record = readRecord(value, 'chapter analysis');
  const summary = readString(record.summary, 'chapter analysis.summary');

  return {
    chapter_id: readOptionalString(record.chapter_id) ?? chapter.id,
    summary,
    characters: readTextArray(record.characters, ['待识别人物']),
    locations: readTextArray(record.locations, ['待识别地点']),
    key_events: readTextArray(record.key_events, [summary]),
    conflicts: readTextArray(record.conflicts, ['核心冲突待提炼']),
    adaptation_notes: readTextArray(record.adaptation_notes, ['保留章节来源并转化为可视化场面'])
  };
}

function readOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readTextArray(value: unknown, fallback: string[]) {
  const strings = Array.isArray(value)
    ? uniqueStrings(value.flatMap((item) => readTextItem(item, false)))
    : uniqueStrings(readTextItem(value, true));

  return strings.length > 0 ? strings : fallback;
}

function readTextItem(value: unknown, splitString: boolean): string[] {
  if (typeof value === 'string') {
    return splitString ? splitInlineList(value) : readWholeString(value);
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }

  const record = value as Record<string, unknown>;
  const preferredKeys = ['name', 'title', 'summary', 'description', 'content', 'event', 'conflict', 'note', 'text', 'location'];

  for (const key of preferredKeys) {
    const nested = readTextItem(record[key], splitString);

    if (nested.length > 0) {
      return nested;
    }
  }

  return Object.values(record).flatMap((item) => readTextItem(item, splitString));
}

function readWholeString(value: string) {
  const trimmed = value.trim();
  return trimmed ? [trimmed] : [];
}

function splitInlineList(value: string) {
  return value
    .split(/\r?\n|[、;；]/u)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function uniqueStrings(values: string[]) {
  return [...new Set(values)];
}
