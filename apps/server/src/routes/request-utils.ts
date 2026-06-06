import type { AdaptationType, Chapter, ChapterAnalysis } from '@story2script/shared';

const adaptationTypes = new Set<AdaptationType>(['screenplay', 'stage_play', 'audio_drama', 'short_drama']);

export function getOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function getNovelText(requestBody: { novel?: unknown; novel_text?: unknown; text?: unknown }) {
  return getOptionalString(requestBody.novel) ?? getOptionalString(requestBody.novel_text) ?? getOptionalString(requestBody.text);
}

export function getAdaptationType(requestBody: { adaptation_type?: unknown }): AdaptationType {
  const requested = getOptionalString(requestBody.adaptation_type);

  if (requested && adaptationTypes.has(requested as AdaptationType)) {
    return requested as AdaptationType;
  }

  return 'screenplay';
}

export function getRepairMaxAttempts(value: unknown) {
  const requested = typeof value === 'number' && Number.isInteger(value) ? value : readEnvRepairMaxAttempts();
  return Math.min(Math.max(requested, 0), 5);
}

export function parseChaptersInput(value: unknown): Chapter[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    return undefined;
  }

  const chapters = value.map(readChapter).filter((chapter): chapter is Chapter => chapter !== undefined);

  return chapters.length === value.length ? chapters : undefined;
}

export function parseAnalysesInput(value: unknown): ChapterAnalysis[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    return undefined;
  }

  const analyses = value.map(readAnalysis).filter((analysis): analysis is ChapterAnalysis => analysis !== undefined);

  return analyses.length === value.length ? analyses : undefined;
}

function readEnvRepairMaxAttempts() {
  const parsed = Number.parseInt(process.env.REPAIR_MAX_RETRY ?? '2', 10);
  return Number.isInteger(parsed) ? parsed : 2;
}

function readChapter(value: unknown): Chapter | undefined {
  const record = readRecord(value);
  const id = readString(record?.id);
  const title = readString(record?.title);
  const content = readString(record?.content);
  const order = typeof record?.order === 'number' ? record.order : undefined;

  if (!id || !title || !content || order === undefined) {
    return undefined;
  }

  return {
    id,
    title,
    order,
    content,
    ...(typeof record?.word_count === 'number' ? { word_count: record.word_count } : {})
  };
}

function readAnalysis(value: unknown): ChapterAnalysis | undefined {
  const record = readRecord(value);
  const chapterId = readString(record?.chapter_id);

  if (!chapterId) {
    return undefined;
  }

  const analysis = {
    chapter_id: chapterId,
    summary: readString(record?.summary),
    characters: readStringArray(record?.characters),
    locations: readStringArray(record?.locations),
    key_events: readStringArray(record?.key_events),
    conflicts: readStringArray(record?.conflicts),
    adaptation_notes: readStringArray(record?.adaptation_notes)
  };

  return Object.values(analysis).every((value) => value !== undefined) ? (analysis as ChapterAnalysis) : undefined;
}

function readRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

function readString(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const strings = value.map(readString);
  return strings.every((item): item is string => item !== undefined) ? strings : undefined;
}
