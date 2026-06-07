import type { GenerationHistoryItem } from '../useGenerationHistory';

interface HistorySidebarProps {
  currentYaml: string;
  items: GenerationHistoryItem[];
  onClear: () => void;
  onLoad: (item: GenerationHistoryItem) => void;
}

export function HistorySidebar({ currentYaml, items, onClear, onLoad }: HistorySidebarProps) {
  const activeYaml = currentYaml.trim();

  return (
    <aside className="flex min-h-[180px] flex-col rounded border border-line bg-white" data-testid="history-sidebar">
      <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-3">
        <div>
          <h2 className="text-base font-semibold">历史记录</h2>
          <p className="mt-1 text-xs text-slate-500">最近 {items.length} 条</p>
        </div>
        <button
          className="cursor-pointer rounded border border-line bg-white px-2 py-1 text-xs font-semibold text-slate-600 transition-colors duration-200 hover:border-accent hover:text-accent focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-accent disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
          disabled={items.length === 0}
          onClick={onClear}
          type="button"
        >
          清空
        </button>
      </div>

      {items.length === 0 ? (
        <p className="px-3 py-4 text-sm text-slate-500">暂无记录</p>
      ) : (
        <ol className="flex flex-col gap-2 overflow-y-auto p-2">
          {items.map((item) => {
            const isActive = activeYaml.length > 0 && item.yaml.trim() === activeYaml;

            return (
              <li key={item.id}>
                <button
                  aria-pressed={isActive}
                  className={`w-full cursor-pointer rounded border px-3 py-2 text-left transition-colors duration-200 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-accent ${
                    isActive
                      ? 'border-accent bg-indigo-50 text-ink'
                      : 'border-transparent bg-white text-slate-700 hover:border-line hover:bg-slate-50'
                  }`}
                  data-testid="history-item"
                  onClick={() => onLoad(item)}
                  type="button"
                >
                  <span className="block truncate text-sm font-semibold">{item.title}</span>
                  <span className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span>{formatHistoryTime(item.createdAt)}</span>
                    <span>{item.characterCount} 字符</span>
                  </span>
                  <span className={`mt-1 block text-xs font-medium ${item.validation?.valid ? 'text-positive' : 'text-amber-700'}`}>
                    {item.validation?.valid ? '校验通过' : '待修复'}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </aside>
  );
}

function formatHistoryTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '刚刚';
  }

  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
