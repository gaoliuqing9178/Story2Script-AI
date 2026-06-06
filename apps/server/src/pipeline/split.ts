import type { Chapter } from '@story2script/shared';

interface ChapterDraft {
  title: string | undefined;
  lines: string[];
}

type ChapterMarker =
  | {
      kind: 'separator';
    }
  | {
      kind: 'title';
      title: string;
    };

const separatorPattern = /^---\s*chapter\s*---$/i;
const markdownHeadingPattern = /^#{1,6}\s+(.+?)\s*#*$/;
const chineseChapterTitlePattern = /^第\s*(?:[0-9０-９]+|[一二三四五六七八九十百千万零〇两]+)\s*[章节回卷部].*$/u;
const englishChapterTitlePattern = /^chapter\s+[a-z0-9ivxlcdm]+(?:\b.*)?$/i;

export function splitChapters(text: string): Chapter[] {
  const drafts = collectChapterDrafts(text);
  const nonEmptyDrafts = drafts
    .map((draft) => ({
      title: draft.title,
      content: trimContentLines(draft.lines)
    }))
    .filter((draft) => draft.content.length > 0);

  return nonEmptyDrafts.map((draft, index) => {
    const order = index + 1;

    return {
      id: `chapter_${order.toString().padStart(3, '0')}`,
      title: draft.title ?? `Chapter ${order}`,
      order,
      content: draft.content,
      word_count: countChapterWords(draft.content)
    };
  });
}

function collectChapterDrafts(text: string) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  if (lines.some((line) => separatorPattern.test(line.trim()))) {
    return collectSeparatorDrafts(lines);
  }

  return collectTitleDrafts(lines);
}

function collectSeparatorDrafts(lines: string[]) {
  const drafts: ChapterDraft[] = [];
  let currentLines: string[] = [];

  for (const line of lines) {
    if (separatorPattern.test(line.trim())) {
      pushSeparatorDraft(drafts, currentLines);
      currentLines = [];
      continue;
    }

    currentLines.push(line);
  }

  pushSeparatorDraft(drafts, currentLines);

  return drafts;
}

function pushSeparatorDraft(drafts: ChapterDraft[], lines: string[]) {
  const trimmedLines = trimOuterBlankLines(lines);

  if (trimmedLines.length === 0) {
    return;
  }

  const firstLineMarker = getChapterMarker(trimmedLines[0] ?? '');

  if (firstLineMarker?.kind === 'title') {
    drafts.push({
      title: firstLineMarker.title,
      lines: trimmedLines.slice(1)
    });
    return;
  }

  drafts.push({
    title: undefined,
    lines: trimmedLines
  });
}

function collectTitleDrafts(lines: string[]) {
  const drafts: ChapterDraft[] = [];
  let currentDraft: ChapterDraft | undefined;

  for (const line of lines) {
    const marker = getChapterMarker(line);

    if (marker?.kind === 'separator') {
      currentDraft = { title: undefined, lines: [] };
      drafts.push(currentDraft);
      continue;
    }

    if (marker?.kind === 'title') {
      currentDraft = { title: marker.title, lines: [] };
      drafts.push(currentDraft);
      continue;
    }

    currentDraft?.lines.push(line);
  }

  return drafts;
}

function getChapterMarker(line: string): ChapterMarker | undefined {
  const trimmed = line.trim();

  if (!trimmed) {
    return undefined;
  }

  if (separatorPattern.test(trimmed)) {
    return { kind: 'separator' };
  }

  const markdownMatch = trimmed.match(markdownHeadingPattern);
  const titleCandidate = markdownMatch?.[1]?.trim() ?? trimmed;

  if (isChapterTitle(titleCandidate)) {
    return {
      kind: 'title',
      title: titleCandidate
    };
  }

  return undefined;
}

function isChapterTitle(title: string) {
  return chineseChapterTitlePattern.test(title) || englishChapterTitlePattern.test(title);
}

function trimContentLines(lines: string[]) {
  return trimOuterBlankLines(lines).join('\n').trim();
}

function trimOuterBlankLines(lines: string[]) {
  let start = 0;
  let end = lines.length;

  while (start < end && lines[start]?.trim() === '') {
    start += 1;
  }

  while (end > start && lines[end - 1]?.trim() === '') {
    end -= 1;
  }

  return lines.slice(start, end);
}

function countChapterWords(content: string) {
  return Array.from(content.replace(/\s+/g, '')).length;
}
