import type { ValidationResult } from '@story2script/shared';
import { useState } from 'react';
import { buildExportFileName, downloadTextFile, ensureTrailingNewline } from './download';
import { buildScreenplayMarkdown, parseScreenplayYaml } from './render/screenplay';
import { getExportStateText } from './ui-states';

type ValidationStatus = 'idle' | 'validating' | 'error';

interface UseScreenplayExportInput {
  validation: ValidationResult | null;
  validationStatus: ValidationStatus;
  yaml: string;
}

export function useScreenplayExport({ validation, validationStatus, yaml }: UseScreenplayExportInput) {
  const [exportError, setExportError] = useState('');
  const errors = validation?.errors ?? [];
  const hasYaml = yaml.trim().length > 0;
  const canExport = hasYaml && validationStatus === 'idle' && validation?.valid === true;
  const exportStateText = getExportStateText({
    errors,
    hasYaml,
    validation,
    validationStatus
  });

  function handleExportYaml() {
    if (!canExport) {
      setExportError('请先生成并通过校验后再导出。');
      return;
    }

    const screenplay = parseScreenplayYaml(yaml);
    downloadTextFile({
      content: ensureTrailingNewline(yaml),
      filename: buildExportFileName(screenplay?.project.title, 'yaml'),
      mimeType: 'application/x-yaml;charset=utf-8'
    });
    setExportError('');
  }

  function handleExportMarkdown() {
    if (!canExport) {
      setExportError('请先生成并通过校验后再导出。');
      return;
    }

    const screenplay = parseScreenplayYaml(yaml);

    if (!screenplay) {
      setExportError('当前 YAML 已校验通过，但前端无法解析为 Markdown。');
      return;
    }

    downloadTextFile({
      content: buildScreenplayMarkdown(screenplay),
      filename: buildExportFileName(screenplay.project.title, 'md'),
      mimeType: 'text/markdown;charset=utf-8'
    });
    setExportError('');
  }

  return {
    canExport,
    exportError,
    exportStateText,
    handleExportMarkdown,
    handleExportYaml,
    hasYaml,
    setExportError
  };
}
