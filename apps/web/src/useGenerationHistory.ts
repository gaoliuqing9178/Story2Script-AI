import type { ValidationResult } from '@story2script/shared';
import { load } from 'js-yaml';
import { useCallback, useState } from 'react';

const HISTORY_STORAGE_KEY = 'story2script:generation-history';
const HISTORY_LIMIT = 8;

export interface GenerationHistoryItem {
  id: string;
  title: string;
  createdAt: string;
  yaml: string;
  characterCount: number;
  validation: ValidationResult | null;
}

export function useGenerationHistory() {
  const [items, setItems] = useState<GenerationHistoryItem[]>(readHistoryItems);

  const addGeneratedYaml = useCallback((payload: { yaml: string; validation: ValidationResult }) => {
    const yaml = payload.yaml.trim();

    if (!yaml) {
      return;
    }

    setItems((current) =>
      persistHistoryItems([
        buildHistoryItem(yaml, payload.validation),
        ...current.filter((item) => item.yaml.trim() !== yaml)
      ])
    );
  }, []);

  const clearHistory = useCallback(() => {
    setItems(persistHistoryItems([]));
  }, []);

  return {
    addGeneratedYaml,
    clearHistory,
    items
  };
}

function buildHistoryItem(yaml: string, validation: ValidationResult): GenerationHistoryItem {
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    title: readYamlTitle(yaml),
    createdAt: new Date().toISOString(),
    yaml,
    characterCount: yaml.length,
    validation
  };
}

function readHistoryItems() {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];

    return Array.isArray(parsed) ? parsed.filter(isHistoryItem).slice(0, HISTORY_LIMIT) : [];
  } catch {
    return [];
  }
}

function persistHistoryItems(items: GenerationHistoryItem[]) {
  const nextItems = items.slice(0, HISTORY_LIMIT);

  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextItems));
  } catch {
    return nextItems;
  }

  return nextItems;
}

function readYamlTitle(yaml: string) {
  try {
    const parsed = load(yaml);
    const project = readRecord(parsed).project;
    const title = readRecord(project).title;

    if (typeof title === 'string' && title.trim()) {
      return title.trim();
    }
  } catch {
    return '未命名剧本';
  }

  return '未命名剧本';
}

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function isHistoryItem(value: unknown): value is GenerationHistoryItem {
  const record = readRecord(value);

  return (
    typeof record.id === 'string' &&
    typeof record.title === 'string' &&
    typeof record.createdAt === 'string' &&
    typeof record.yaml === 'string' &&
    typeof record.characterCount === 'number' &&
    (record.validation === null || isValidationResult(record.validation))
  );
}

function isValidationResult(value: unknown) {
  const record = readRecord(value);

  return typeof record.valid === 'boolean' && Array.isArray(record.errors);
}
