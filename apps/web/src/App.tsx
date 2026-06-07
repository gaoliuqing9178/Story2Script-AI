import type { ValidationResult } from '@story2script/shared';
import { useEffect, useRef, useState } from 'react';
import { splitNovelChapters } from './api/chapters';
import { generateMockScreenplay, validateYaml } from './api/screenplay';
import { DemoRoutePanel } from './components/DemoRoutePanel';
import { ScreenplayPreview } from './components/ScreenplayPreview';
import { ValidationPanel } from './components/ValidationPanel';
import { brokenDemoYaml, demoNovelText, isDemoRoutePath, stableDemoYaml } from './demo-assets';
import { buildExportFileName, downloadTextFile, ensureTrailingNewline } from './download';
import { buildScreenplayMarkdown, parseScreenplayYaml } from './render/screenplay';
import {
  formatValidationRequestError,
  getExportStateText,
  getGenerateButtonLabel,
  getGenerateErrorMessage,
  renderGenerationState
} from './ui-states';
import { useYamlStream } from './useYamlStream';

export function App() {
  const isDemoRoute = isDemoRoutePath(window.location.pathname);
  const [novelText, setNovelText] = useState(demoNovelText);
  const [yaml, setYaml] = useState(() => (isDemoRoute ? stableDemoYaml : ''));
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [generationPhase, setGenerationPhase] = useState<'idle' | 'checking' | 'generating'>('idle');
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'error'>(() =>
    isDemoRoute ? 'validating' : 'idle'
  );
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [exportError, setExportError] = useState('');
  const generateInFlightRef = useRef(false);
  const { cancelYamlStream, streamYaml, yamlRenderStatus } = useYamlStream({
    setValidation,
    setValidationError,
    setValidationStatus,
    setYaml
  });

  useEffect(() => {
    if (yamlRenderStatus === 'streaming') {
      setValidation(null);
      setValidationStatus('validating');
      setValidationError('');
      return;
    }

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
  }, [yaml, yamlRenderStatus]);

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
      await streamYaml(result.yaml, result.validation);
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

  function loadDemoYaml(nextYaml: string) {
    cancelYamlStream();
    setValidation(null);
    setValidationStatus('validating');
    setValidationError('');
    setStatus('idle');
    setGenerationPhase('idle');
    setError('');
    setExportError('');

    if (nextYaml === yaml) {
      void validateYaml(nextYaml)
        .then((result) => {
          setValidation(result);
          setValidationStatus('idle');
        })
        .catch((cause) => {
          setValidationStatus('error');
          setValidationError(formatValidationRequestError(cause));
        });
      return;
    }

    setYaml(nextYaml);
  }

  function resetDemoNovel() {
    setNovelText(demoNovelText);
    setError('');
  }

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

  return (
    <main className="min-h-screen bg-surface text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-2 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-accent">{isDemoRoute ? '3-minute demo route' : 'Mock-first harness'}</p>
            <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">Story2Script AI</h1>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            小说转结构化剧本的工作台骨架。当前支持 mock 生成、YAML 校验、剧本预览和导出。
          </p>
        </header>

        {isDemoRoute ? (
          <DemoRoutePanel
            onLoadBrokenYaml={() => loadDemoYaml(brokenDemoYaml)}
            onLoadValidYaml={() => loadDemoYaml(stableDemoYaml)}
            onResetNovel={resetDemoNovel}
          />
        ) : null}

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
                  <p className="mt-1 text-xs leading-5 text-slate-500" data-state={yamlRenderStatus} data-testid="yaml-render-state" role="status" aria-live="polite">
                    {yamlRenderStatus === 'streaming' ? '正在流式写入 YAML' : hasYaml ? 'YAML 展示就绪' : '等待 YAML'}
                  </p>
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
                  cancelYamlStream();
                  setYaml(event.target.value);
                  setExportError('');
                }}
                placeholder="点击“用样例生成”后，这里会显示后端 mock YAML。"
                spellCheck={false}
                value={yaml}
              />
            </div>

            <ValidationPanel
              hasYaml={hasYaml}
              validation={validation}
              validationError={validationError}
              validationStatus={validationStatus}
            />

            <ScreenplayPreview hasYaml={hasYaml} validation={validation} validationStatus={validationStatus} yaml={yaml} />
          </div>
        </section>
      </div>
    </main>
  );
}
