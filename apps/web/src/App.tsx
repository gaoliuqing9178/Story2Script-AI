import type { ValidationResult } from '@story2script/shared';
import { useEffect, useRef, useState } from 'react';
import { splitNovelChapters } from './api/chapters';
import { generateMockScreenplay, validateYaml } from './api/screenplay';
import { ScreenplayPreview } from './components/ScreenplayPreview';
import { buildExportFileName, downloadTextFile, ensureTrailingNewline } from './download';
import { buildScreenplayMarkdown, parseScreenplayYaml } from './render/screenplay';
import {
  formatValidationRequestError,
  getExportStateText,
  getGenerateButtonLabel,
  getGenerateErrorMessage,
  renderGenerationState
} from './ui-states';

const sampleText = `# 第一章 雨夜归来

林舟在雨夜回到旧火车站，沈念在出口等他。

# 第二章 旧信

林舟在老屋发现父亲留下的旧信。

# 第三章 巷口的灯

两人在南街照相馆发现有人跟踪。`;

export function App() {
  const [novelText, setNovelText] = useState(sampleText);
  const [yaml, setYaml] = useState('');
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [generationPhase, setGenerationPhase] = useState<'idle' | 'checking' | 'generating'>('idle');
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'error'>('idle');
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [exportError, setExportError] = useState('');
  const generateInFlightRef = useRef(false);

  useEffect(() => {
    if (!yaml.trim()) {
      setValidation(null);
      setValidationStatus('idle');
      setValidationError('');
      return;
    }

    let canceled = false;
    setValidationStatus('validating');
    setValidationError('');

    const timer = window.setTimeout(() => {
      void validateYaml(yaml)
        .then((result) => {
          if (canceled) {
            return;
          }

          setValidation(result);
          setValidationStatus('idle');
        })
        .catch((cause) => {
          if (canceled) {
            return;
          }

          setValidationStatus('error');
          setValidationError(formatValidationRequestError(cause));
        });
    }, 350);

    return () => {
      canceled = true;
      window.clearTimeout(timer);
    };
  }, [yaml]);

  async function handleGenerate() {
    if (generateInFlightRef.current) {
      return;
    }

    let phase: 'checking' | 'generating' = 'checking';
    generateInFlightRef.current = true;
    setStatus('loading');
    setGenerationPhase(phase);
    setError('');
    setExportError('');

    try {
      await splitNovelChapters(novelText);
      phase = 'generating';
      setGenerationPhase(phase);
      const result = await generateMockScreenplay(novelText);
      setYaml(result.yaml);
      setValidation(result.validation);
      setStatus('idle');
      setGenerationPhase('idle');
    } catch (cause) {
      setStatus('error');
      setGenerationPhase('idle');
      setError(getGenerateErrorMessage(cause, phase));
    } finally {
      generateInFlightRef.current = false;
    }
  }

  const errors = validation?.errors ?? [];
  const warnings = validation?.warnings ?? [];
  const hasYaml = yaml.trim().length > 0;
  const showValidationDetails = validationStatus === 'idle';
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
    <main className="min-h-screen bg-surface text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-2 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-accent">Mock-first harness</p>
            <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">Story2Script AI</h1>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            小说转结构化剧本的工作台骨架。当前支持 mock 生成、YAML 校验、剧本预览和导出。
          </p>
        </header>

        <section className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="flex min-h-[420px] flex-col rounded border border-line bg-white">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-base font-semibold">小说输入</h2>
              <p className="mt-1 text-sm text-slate-600">默认 mock provider，生成结果会进入右侧 YAML 工作区。</p>
              <div className="mt-3" data-testid="generation-state" role="status" aria-live="polite">
                {renderGenerationState({ generationPhase, hasYaml, status })}
              </div>
            </div>
            <textarea
              className="min-h-[280px] flex-1 resize-none border-0 p-4 text-sm leading-6 text-slate-800 outline-none"
              value={novelText}
              onChange={(event) => {
                setNovelText(event.target.value);
                setError('');
              }}
              aria-label="小说输入"
              id="novel-input"
              name="novel"
            />
            {error ? (
              <div className="mx-4 mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900" data-testid="generation-error">
                {error}
              </div>
            ) : null}
            <div className="flex items-center justify-between border-t border-line px-4 py-3">
              <span className="text-sm text-slate-500">{novelText.length} 字符</span>
              <button
                className="cursor-pointer rounded bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-accent disabled:cursor-not-allowed disabled:bg-slate-400"
                type="button"
                onClick={handleGenerate}
                disabled={status === 'loading'}
              >
                {getGenerateButtonLabel(status, generationPhase)}
              </button>
            </div>
          </div>

          <div className="grid min-h-[420px] gap-4">
            <div className="flex min-h-[360px] flex-col rounded border border-line bg-white">
              <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
                <div>
                  <h2 className="text-base font-semibold">YAML 编辑器</h2>
                  <p className="mt-1 text-sm text-slate-600">当前剧本 YAML</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="text-sm text-slate-500">{yaml.length} 字符</span>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      className="cursor-pointer rounded border border-line bg-white px-3 py-1.5 text-sm font-semibold text-ink transition-colors duration-200 hover:border-accent hover:text-accent focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-accent disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
                      data-testid="export-yaml-button"
                      disabled={!canExport}
                      onClick={handleExportYaml}
                      title={canExport ? '下载当前 YAML' : '生成并通过校验后可导出'}
                      type="button"
                    >
                      导出 YAML
                    </button>
                    <button
                      className="cursor-pointer rounded border border-line bg-white px-3 py-1.5 text-sm font-semibold text-ink transition-colors duration-200 hover:border-accent hover:text-accent focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-accent disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
                      data-testid="export-markdown-button"
                      disabled={!canExport}
                      onClick={handleExportMarkdown}
                      title={canExport ? '下载 Markdown 剧本稿' : '生成并通过校验后可导出'}
                      type="button"
                    >
                      导出 Markdown
                    </button>
                  </div>
                  <p className="max-w-xs text-right text-xs leading-5 text-slate-500" data-testid="export-state">
                    {exportStateText}
                  </p>
                </div>
              </div>
              {exportError ? (
                <div className="mx-4 mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{exportError}</div>
              ) : null}
              <textarea
                aria-label="YAML 编辑器"
                className="min-h-[340px] flex-1 resize-none border-0 p-4 font-mono text-sm leading-6 text-slate-800 outline-none focus:bg-slate-50"
                data-testid="yaml-output"
                id="yaml-editor"
                name="yaml"
                onChange={(event) => {
                  setYaml(event.target.value);
                  setExportError('');
                }}
                placeholder="点击“用样例生成”后，这里会显示后端 mock YAML。"
                spellCheck={false}
                value={yaml}
              />
            </div>

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

            <ScreenplayPreview hasYaml={hasYaml} validation={validation} validationStatus={validationStatus} yaml={yaml} />
          </div>
        </section>
      </div>
    </main>
  );
}
