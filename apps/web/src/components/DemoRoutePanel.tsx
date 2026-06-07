interface DemoRoutePanelProps {
  onLoadBrokenYaml: () => void;
  onLoadValidYaml: () => void;
  onResetNovel: () => void;
}

const demoSteps = ['00:00 样例小说', '00:40 合法 YAML', '01:30 预览导出', '02:20 坏 YAML 校验'];

export function DemoRoutePanel({ onLoadBrokenYaml, onLoadValidYaml, onResetNovel }: DemoRoutePanelProps) {
  return (
    <section
      aria-labelledby="demo-route-heading"
      className="rounded border border-indigo-200 bg-white px-4 py-4"
      data-testid="demo-route"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <div>
            <h2 className="text-base font-semibold" id="demo-route-heading">
              3 分钟演示路线
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              稳定 YAML 已预载，可一键切换到坏 YAML 展示精确校验错误，再恢复到可预览、可导出的状态。
            </p>
          </div>
          <ol className="grid gap-2 text-sm text-slate-700 sm:grid-cols-4">
            {demoSteps.map((item) => (
              <li className="rounded border border-line bg-slate-50 px-3 py-2" key={item}>
                {item}
              </li>
            ))}
          </ol>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <button
            className="cursor-pointer rounded bg-accent px-3 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-accent"
            data-testid="load-valid-yaml-button"
            onClick={onLoadValidYaml}
            type="button"
          >
            加载合法 YAML
          </button>
          <button
            className="cursor-pointer rounded border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 transition-colors duration-200 hover:border-red-300 hover:bg-red-100 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-red-500"
            data-testid="load-broken-yaml-button"
            onClick={onLoadBrokenYaml}
            type="button"
          >
            加载坏 YAML
          </button>
          <button
            className="cursor-pointer rounded border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition-colors duration-200 hover:border-accent hover:text-accent focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-accent"
            onClick={onResetNovel}
            type="button"
          >
            还原样例小说
          </button>
        </div>
      </div>
    </section>
  );
}
