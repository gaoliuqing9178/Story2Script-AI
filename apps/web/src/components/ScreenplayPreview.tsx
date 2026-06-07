import type { ValidationResult } from '@story2script/shared';
import { useMemo } from 'react';
import type { PreviewBeat } from '../render/screenplay';
import { buildScreenplayPreview, parseScreenplayYaml } from '../render/screenplay';

interface ScreenplayPreviewProps {
  yaml: string;
  hasYaml: boolean;
  validation: ValidationResult | null;
  validationStatus: 'idle' | 'validating' | 'error';
}

export function ScreenplayPreview({ yaml, hasYaml, validation, validationStatus }: ScreenplayPreviewProps) {
  const canRenderPreview = hasYaml && validationStatus === 'idle' && validation?.valid === true;
  const preview = useMemo(() => {
    if (!canRenderPreview) {
      return { parsed: false, scenes: [] };
    }

    const screenplay = parseScreenplayYaml(yaml);

    if (!screenplay) {
      return { parsed: false, scenes: [] };
    }

    return { parsed: true, scenes: buildScreenplayPreview(screenplay) };
  }, [canRenderPreview, yaml]);

  function renderPreviewState() {
    if (!hasYaml) {
      return <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">未生成</span>;
    }

    if (validationStatus === 'validating') {
      return <span className="rounded bg-indigo-50 px-2 py-1 text-xs font-semibold text-accent">等待校验</span>;
    }

    if (validationStatus === 'error') {
      return <span className="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">预览暂停</span>;
    }

    if (validation?.valid) {
      return <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-positive">预览已更新</span>;
    }

    return <span className="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">预览已暂停</span>;
  }

  function renderPreviewBody() {
    if (!hasYaml) {
      return <p className="text-sm text-slate-500">暂无 YAML。</p>;
    }

    if (validationStatus === 'validating') {
      return <p className="rounded border border-indigo-200 bg-indigo-50 p-3 text-sm text-accent">校验中，预览暂不更新。</p>;
    }

    if (validationStatus === 'error') {
      return <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">校验请求失败，预览已暂停。</p>;
    }

    if (!validation?.valid) {
      return <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">当前 YAML 未通过校验，预览已暂停。</p>;
    }

    if (!preview.parsed) {
      return <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">YAML 已通过校验，但前端预览解析失败。</p>;
    }

    if (preview.scenes.length === 0) {
      return <p className="text-sm text-slate-500">暂无可预览场景。</p>;
    }

    return (
      <div className="space-y-5">
        {preview.scenes.map((scene) => (
          <article className="border-b border-line pb-5 last:border-b-0 last:pb-0" key={scene.id}>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold tracking-normal text-ink">
                第 {scene.number} 场 {scene.title}
              </h3>
              <dl className="grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                <div>
                  <dt className="font-semibold text-slate-700">地点</dt>
                  <dd>地点：{scene.locationName}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-700">时间</dt>
                  <dd>时间：{scene.time}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-700">人物</dt>
                  <dd>人物：{scene.characterNames.join('、')}</dd>
                </div>
              </dl>
            </div>
            <div className="mt-4 space-y-3">{scene.beats.map(renderPreviewBeat)}</div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <section
      aria-labelledby="screenplay-preview-heading"
      className="rounded border border-line bg-white"
      data-testid="screenplay-preview"
    >
      <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <h2 className="text-base font-semibold" id="screenplay-preview-heading">
            剧本预览
          </h2>
          <p className="mt-1 text-sm text-slate-600">当前 YAML 的可读剧本稿</p>
        </div>
        <div className="shrink-0" data-testid="preview-state">
          {renderPreviewState()}
        </div>
      </div>
      <div className="max-h-[560px] overflow-y-auto px-4 py-4">{renderPreviewBody()}</div>
    </section>
  );
}

function renderPreviewBeat(beat: PreviewBeat, index: number) {
  switch (beat.type) {
    case 'action':
      return (
        <p className="leading-7 text-slate-800" data-testid="preview-beat-action" key={`${beat.type}-${index}`}>
          {beat.content}
        </p>
      );
    case 'dialogue':
      return (
        <div
          className="rounded border-l-4 border-accent bg-indigo-50 px-3 py-2"
          data-testid="preview-beat-dialogue"
          key={`${beat.type}-${index}`}
        >
          <p className="text-sm font-semibold text-accent">{beat.speakerName}</p>
          <p className="mt-1 leading-7 text-slate-900">{beat.content}</p>
        </div>
      );
    case 'narration':
      return (
        <p
          className="rounded border border-slate-200 bg-slate-50 px-3 py-2 leading-7 text-slate-700"
          data-testid="preview-beat-narration"
          key={`${beat.type}-${index}`}
        >
          <span className="font-semibold">旁白：</span>
          {beat.content}
        </p>
      );
    case 'transition':
      return (
        <p
          className="rounded border border-slate-200 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-700"
          data-testid="preview-beat-transition"
          key={`${beat.type}-${index}`}
        >
          {beat.content}
        </p>
      );
    case 'inner_voice':
      return (
        <div
          className="rounded border border-violet-200 bg-violet-50 px-3 py-2"
          data-testid="preview-beat-inner_voice"
          key={`${beat.type}-${index}`}
        >
          <p className="text-sm font-semibold text-violet-800">（内心）{beat.speakerName}</p>
          <p className="mt-1 leading-7 text-violet-950">{beat.content}</p>
        </div>
      );
    default: {
      const exhaustive: never = beat.type;
      return exhaustive;
    }
  }
}
