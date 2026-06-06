export function parseProviderJson<T>(text: string, stageName: string): T {
  const cleaned = unwrapCodeFence(text);

  try {
    return JSON.parse(cleaned) as T;
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`${stageName} JSON 解析失败: ${message}`);
  }
}

export function readRecord(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${path} must be an object`);
  }

  return value as Record<string, unknown>;
}

export function readString(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${path} must be a non-empty string`);
  }

  return value.trim();
}

export function readStringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${path} must be an array`);
  }

  const strings = value.map((item, index) => readString(item, `${path}[${index}]`));

  if (strings.length === 0) {
    throw new Error(`${path} must not be empty`);
  }

  return strings;
}

function unwrapCodeFence(text: string) {
  const trimmed = text.trim();
  const fenced = /^```[a-zA-Z0-9_-]*\s*\r?\n([\s\S]*?)\r?\n```$/u.exec(trimmed);

  return (fenced?.[1] ?? trimmed).trim();
}
