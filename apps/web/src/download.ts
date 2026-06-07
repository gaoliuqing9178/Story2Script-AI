interface DownloadTextFileInput {
  content: string;
  filename: string;
  mimeType: string;
}

export function downloadTextFile({ content, filename, mimeType }: DownloadTextFileInput) {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
}

export function buildExportFileName(title: string | undefined, extension: 'yaml' | 'md') {
  const safeTitle = [...(title ?? '').trim()]
    .map((character) => (isUnsafeFileNameCharacter(character) ? '-' : character))
    .join('')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return `${safeTitle || 'story2script-screenplay'}.${extension}`;
}

export function ensureTrailingNewline(value: string) {
  return value.endsWith('\n') ? value : `${value}\n`;
}

function isUnsafeFileNameCharacter(character: string) {
  return character.charCodeAt(0) < 32 || '<>:"/\\|?*'.includes(character);
}
