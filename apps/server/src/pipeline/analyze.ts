import type { Chapter, ChapterAnalysis } from '@story2script/shared';
import type { LLMProvider } from '../provider/index.js';
import { buildChapterAnalysisPrompt } from './prompts.js';
import { parseProviderJson, readRecord, readString, readStringArray } from './json.js';

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

  return normalizeChapterAnalysis(parsed, chapter.id);
}

function normalizeChapterAnalysis(value: unknown, fallbackChapterId: string): ChapterAnalysis {
  const record = readRecord(value, 'chapter analysis');

  return {
    chapter_id: readOptionalString(record.chapter_id) ?? fallbackChapterId,
    summary: readString(record.summary, 'chapter analysis.summary'),
    characters: readStringArray(record.characters, 'chapter analysis.characters'),
    locations: readStringArray(record.locations, 'chapter analysis.locations'),
    key_events: readStringArray(record.key_events, 'chapter analysis.key_events'),
    conflicts: readStringArray(record.conflicts, 'chapter analysis.conflicts'),
    adaptation_notes: readStringArray(record.adaptation_notes, 'chapter analysis.adaptation_notes')
  };
}

function readOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
