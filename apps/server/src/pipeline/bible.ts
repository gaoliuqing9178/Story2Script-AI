import type { ChapterAnalysis } from '@story2script/shared';
import type { LLMProvider } from '../provider/index.js';
import { buildBiblePrompt } from './prompts.js';
import { parseProviderJson, readRecord, readString, readStringArray } from './json.js';
import type { ScreenplayBible } from './types.js';

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

  return normalizeBible(parsed);
}

function normalizeBible(value: unknown): ScreenplayBible {
  const record = readRecord(value, 'screenplay bible');

  return {
    logline: readString(record.logline, 'screenplay bible.logline'),
    theme: readString(record.theme, 'screenplay bible.theme'),
    characters: readObjectArray(record.characters, 'screenplay bible.characters') as ScreenplayBible['characters'],
    locations: readObjectArray(record.locations, 'screenplay bible.locations') as ScreenplayBible['locations'],
    timeline: readStringArray(record.timeline, 'screenplay bible.timeline'),
    main_conflict: readString(record.main_conflict, 'screenplay bible.main_conflict'),
    adaptation_principles: readStringArray(record.adaptation_principles, 'screenplay bible.adaptation_principles')
  };
}

function readObjectArray(value: unknown, path: string): Record<string, unknown>[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${path} must be a non-empty array`);
  }

  return value.map((item, index) => readRecord(item, `${path}[${index}]`));
}
