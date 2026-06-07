import type { ValidationResult } from '@story2script/shared';
import { useRef, useState } from 'react';
import { splitNovelChapters } from './api/chapters';
import { generateScreenplayStream } from './api/screenplay';
import { getGenerateErrorMessage } from './ui-states';
import type { useYamlStream } from './useYamlStream';

type GenerationStatus = 'idle' | 'loading' | 'error';
type GenerationPhase = 'idle' | 'checking' | 'generating';
type YamlStreamControls = Omit<ReturnType<typeof useYamlStream>, 'yamlRenderStatus'>;

interface UseScreenplayGenerationInput extends YamlStreamControls {
  novelText: string;
  onGenerationDone?: (payload: { yaml: string; validation: ValidationResult }) => void;
  setExportError: (value: string) => void;
}

export function useScreenplayGeneration(input: UseScreenplayGenerationInput) {
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [phase, setPhase] = useState<GenerationPhase>('idle');
  const [error, setError] = useState('');
  const generateInFlightRef = useRef(false);
  const generateAbortRef = useRef<AbortController | null>(null);

  async function handleGenerate() {
    if (generateInFlightRef.current) {
      return;
    }

    let activePhase: Exclude<GenerationPhase, 'idle'> = 'checking';
    generateInFlightRef.current = true;
    setStatus('loading');
    setPhase(activePhase);
    setError('');
    input.setExportError('');
    const abortController = new AbortController();
    generateAbortRef.current = abortController;

    try {
      const splitResult = await splitNovelChapters(input.novelText);
      activePhase = 'generating';
      setPhase(activePhase);
      input.beginYamlStream();
      await generateScreenplayStream({
        novelText: input.novelText,
        chapters: splitResult.chapters,
        signal: abortController.signal,
        onEvent: (event) => {
          if (event.type === 'yaml_reset') {
            input.resetYamlStream();
            return;
          }

          if (event.type === 'yaml_delta') {
            input.appendYamlDelta(event.delta);
            return;
          }

          if (event.type === 'yaml_snapshot') {
            input.replaceYamlSnapshot(event.yaml);
            return;
          }

          if (event.type === 'done') {
            input.finishYamlStream(event.validation);
            input.onGenerationDone?.({ yaml: event.yaml, validation: event.validation });
          }
        }
      });
      setStatus('idle');
      setPhase('idle');
    } catch (cause) {
      if (abortController.signal.aborted) {
        setStatus('idle');
        setPhase('idle');
        return;
      }

      setStatus('error');
      setPhase('idle');
      input.cancelYamlStream();
      setError(getGenerateErrorMessage(cause, activePhase));
    } finally {
      generateInFlightRef.current = false;
      generateAbortRef.current = null;
    }
  }

  function abort() {
    generateAbortRef.current?.abort();
  }

  function reset() {
    setStatus('idle');
    setPhase('idle');
    setError('');
  }

  return {
    abort,
    error,
    handleGenerate,
    phase,
    reset,
    setError,
    status
  };
}
