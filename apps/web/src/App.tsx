import { useState } from 'react';
import { generateMockScreenplay } from './api/screenplay';

const sampleText = `# 第一章 雨夜归来

林舟在雨夜回到旧火车站，沈念在出口等他。

# 第二章 旧信

林舟在老屋发现父亲留下的旧信。

# 第三章 巷口的灯

两人在南街照相馆发现有人跟踪。`;

export function App() {
  const [novelText, setNovelText] = useState(sampleText);
  const [yaml, setYaml] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState('');

  async function handleGenerate() {
    setStatus('loading');
    setError('');

    try {
      const result = await generateMockScreenplay();
      setYaml(result.yaml);
      setStatus('idle');
    } catch (cause) {
      setStatus('error');
      setError(cause instanceof Error ? cause.message : '生成请求失败');
    }
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
            小说转结构化剧本的工作台骨架。当前只验证前后端通信和 mock YAML 显示，不代表任何功能项通过。
          </p>
        </header>

        <section className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="flex min-h-[420px] flex-col rounded border border-line bg-white">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-base font-semibold">小说输入</h2>
              <p className="mt-1 text-sm text-slate-600">Phase 0 只保留输入占位，切章与校验从后续 feature 开始。</p>
            </div>
            <textarea
              className="min-h-[280px] flex-1 resize-none border-0 p-4 text-sm leading-6 text-slate-800 outline-none"
              value={novelText}
              onChange={(event) => setNovelText(event.target.value)}
              aria-label="小说输入"
            />
            <div className="flex items-center justify-between border-t border-line px-4 py-3">
              <span className="text-sm text-slate-500">{novelText.length} 字符</span>
              <button
                className="cursor-pointer rounded bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-accent disabled:cursor-not-allowed disabled:bg-slate-400"
                type="button"
                onClick={handleGenerate}
                disabled={status === 'loading'}
              >
                {status === 'loading' ? '生成中...' : '用样例生成'}
              </button>
            </div>
          </div>

          <div className="flex min-h-[420px] flex-col rounded border border-line bg-white">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-base font-semibold">YAML 输出</h2>
              <p className="mt-1 text-sm text-slate-600">这里显示 MockProvider 返回的固定合法 YAML。</p>
            </div>
            {error ? (
              <div className="m-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
            ) : null}
            <pre
              className="min-h-[320px] flex-1 overflow-auto whitespace-pre-wrap p-4 text-sm leading-6 text-slate-800"
              data-testid="yaml-output"
            >
              {yaml || '点击“用样例生成”后，这里会显示后端 mock YAML。'}
            </pre>
          </div>
        </section>
      </div>
    </main>
  );
}
