import type { ValidationResult } from '@story2script/shared';

interface ValidationPanelProps {
  hasYaml: boolean;
  validation: ValidationResult | null;
  validationError: string;
  validationStatus: 'idle' | 'validating' | 'error';
}

export function ValidationPanel({ hasYaml, validation, validationError, validationStatus }: ValidationPanelProps) {
  const errors = validation?.errors ?? [];
  const warnings = validation?.warnings ?? [];
  const showValidationDetails = validationStatus === 'idle';

  function renderValidationState() {
    if (!hasYaml) {
      return <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">未校验</span>;
    }

    if (validationStatus === 'validating') {
      return <span className="rounded bg-indigo-50 px-2 py-1 text-xs font-semibold text-accent">校验中...</span>;
    }

    if (validationStatus === 'error') {
      return <span className="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">请求失败</span>;
    }

    if (validation?.valid) {
      return <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-positive">校验通过</span>;
    }

    return <span className="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">发现 {errors.length} 个错误</span>;
  }

  return (
    <section className="rounded border border-line bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 className="text-base font-semibold">校验结果</h2>
        <div data-testid="validation-state">{renderValidationState()}</div>
      </div>
      <div className="space-y-3 px-4 py-3 text-sm">
        {!hasYaml ? <p className="text-slate-500">暂无 YAML。</p> : null}
        {validationStatus === 'error' ? (
          <p className="rounded border border-red-200 bg-red-50 p-3 text-red-700" data-testid="validation-request-error">
            {validationError}
          </p>
        ) : null}
        {showValidationDetails && hasYaml && validation?.valid ? (
          <p className="rounded border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
            结构与引用校验通过。
          </p>
        ) : null}
        {showValidationDetails && errors.length > 0 ? (
          <ul className="space-y-2" data-testid="validation-errors">
            {errors.map((item) => (
              <li className="rounded border border-red-200 bg-red-50 p-3 text-red-800" key={`${item.path}:${item.message}`}>
                <code className="font-mono text-xs font-semibold text-red-900">{item.path}</code>
                <span className="ml-2">{item.message}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {showValidationDetails && warnings.length > 0 ? (
          <ul className="space-y-2" data-testid="validation-warnings">
            {warnings.map((item) => (
              <li className="rounded border border-amber-200 bg-amber-50 p-3 text-amber-900" key={`${item.path}:${item.message}`}>
                <code className="font-mono text-xs font-semibold">{item.path}</code>
                <span className="ml-2">{item.message}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
