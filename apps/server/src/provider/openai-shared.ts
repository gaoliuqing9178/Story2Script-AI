export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function readScalar(value: unknown) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return undefined;
}

export function readString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function readRawString(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

export function summarize(value: string) {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  return trimmed.length > 300 ? `${trimmed.slice(0, 300)}...` : trimmed;
}

export function extractHtmlTitle(value: string) {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/iu.exec(value);
  const title = match?.[1];
  return title ? summarize(decodeBasicHtmlEntities(title)) : undefined;
}

function decodeBasicHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/giu, ' ')
    .replace(/&amp;/giu, '&')
    .replace(/&lt;/giu, '<')
    .replace(/&gt;/giu, '>')
    .replace(/&quot;/giu, '"')
    .replace(/&#39;/giu, "'");
}
