import type { ValidationResult } from '@story2script/shared';
import { ChapterSplitError } from './api/chapters';

interface GenerationStateInput {
  generationPhase: 'idle' | 'checking' | 'generating';
  hasYaml: boolean;
  status: 'idle' | 'loading' | 'error';
}

export function renderGenerationState({ generationPhase, hasYaml, status }: GenerationStateInput) {
  if (status === 'loading' && generationPhase === 'checking') {
    return (
      <p className="rounded border border-indigo-200 bg-indigo-50 p-3 text-sm leading-6 text-accent">
        正在识别章节结构，确认可以进入生成。
      </p>
    );
  }

  if (status === 'loading' && generationPhase === 'generating') {
    return (
      <p className="rounded border border-indigo-200 bg-indigo-50 p-3 text-sm leading-6 text-accent">
        正在生成剧本 YAML，请稍等，按钮已暂时锁定。
      </p>
    );
  }

  if (status === 'error') {
    return (
      <p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
        生成没有完成，请看下方具体阶段提示。
      </p>
    );
  }

  if (hasYaml) {
    return (
      <p className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-800">
        最近一次生成已完成，YAML 已进入右侧工作区。
      </p>
    );
  }

  return (
    <p className="rounded border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
      等待生成：会先识别章节结构，再调用剧本生成接口。
    </p>
  );
}

export function getGenerateButtonLabel(
  status: 'idle' | 'loading' | 'error',
  generationPhase: 'idle' | 'checking' | 'generating'
) {
  if (status !== 'loading') {
    return '用样例生成';
  }

  return generationPhase === 'checking' ? '识别章节...' : '生成中...';
}

interface ExportStateInput {
  errors: ValidationResult['errors'];
  hasYaml: boolean;
  validation: ValidationResult | null;
  validationStatus: 'idle' | 'validating' | 'error';
}

export function getExportStateText({ errors, hasYaml, validation, validationStatus }: ExportStateInput) {
  if (!hasYaml) {
    return '暂无可导出的 YAML。生成并通过校验后可导出 YAML 或 Markdown。';
  }

  if (validationStatus === 'validating') {
    return '校验中，导出暂不可用。';
  }

  if (validationStatus === 'error') {
    return '校验请求失败，导出已暂停。';
  }

  if (validation?.valid) {
    return '可导出 YAML 或 Markdown。';
  }

  return `当前 YAML 未通过校验，导出已暂停（${errors.length} 个错误）。`;
}

export function getGenerateErrorMessage(cause: unknown, phase: 'checking' | 'generating') {
  if (cause instanceof ChapterSplitError && cause.code === 'BAD_REQUEST') {
    return '请先输入小说正文，再生成剧本。';
  }

  const message = cause instanceof Error ? cause.message : '生成请求失败';
  const phaseLabel = phase === 'checking' ? '章节预检阶段失败（/api/chapters/split）' : '剧本生成阶段失败（/api/screenplay/generate）';

  return `${phaseLabel}：${message}`;
}

export function formatValidationRequestError(cause: unknown) {
  const message = cause instanceof Error ? cause.message : 'YAML 校验请求失败';

  return `校验阶段失败（/api/yaml/validate）：${message}`;
}
