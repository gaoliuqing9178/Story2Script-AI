import { dump, load } from 'js-yaml';
import type { AdaptationType } from '@story2script/shared';

export function normalizeGeneratedScreenplayYaml(
  yaml: string,
  input: {
    adaptationType?: AdaptationType;
  } = {}
) {
  const cleaned = unwrapCodeFence(yaml);
  let parsed: unknown;

  try {
    parsed = load(cleaned);
  } catch {
    return cleaned;
  }

  if (!isRecord(parsed) || !isRecord(parsed.project)) {
    return cleaned;
  }

  const project = parsed.project;
  let changed = false;

  if (!hasNonEmptyString(project.language)) {
    project.language = 'zh-CN';
    changed = true;
  }

  if (!hasNonEmptyString(project.source_type)) {
    project.source_type = 'novel';
    changed = true;
  }

  if (input.adaptationType && !hasNonEmptyString(project.adaptation_type)) {
    project.adaptation_type = input.adaptationType;
    changed = true;
  }

  if (!changed) {
    return cleaned;
  }

  return dump(parsed, {
    lineWidth: -1,
    noRefs: true
  }).trim();
}

function unwrapCodeFence(content: string) {
  const trimmed = content.trim();
  const fenced = /^```[a-zA-Z0-9_-]*\s*\r?\n([\s\S]*?)\r?\n```$/u.exec(trimmed);

  return (fenced?.[1] ?? trimmed).trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasNonEmptyString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0;
}
