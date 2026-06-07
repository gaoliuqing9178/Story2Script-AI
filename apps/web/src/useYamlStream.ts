import type { ValidationResult } from '@story2script/shared';
import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

type ValidationStatus = 'idle' | 'validating' | 'error';
export type YamlRenderStatus = 'idle' | 'streaming';

interface UseYamlStreamInput {
  setValidation: Dispatch<SetStateAction<ValidationResult | null>>;
  setValidationError: Dispatch<SetStateAction<string>>;
  setValidationStatus: Dispatch<SetStateAction<ValidationStatus>>;
  setYaml: Dispatch<SetStateAction<string>>;
}

const STREAM_FRAME_MS = 24;
const STREAM_STEPS = 48;
const MIN_CHUNK_SIZE = 24;

export function useYamlStream({
  setValidation,
  setValidationError,
  setValidationStatus,
  setYaml
}: UseYamlStreamInput) {
  const [yamlRenderStatus, setYamlRenderStatus] = useState<YamlRenderStatus>('idle');
  const activeTokenRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const resolveRef = useRef<(() => void) | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cancelYamlStream = useCallback(() => {
    activeTokenRef.current += 1;
    clearTimer();
    setYamlRenderStatus('idle');

    if (resolveRef.current) {
      resolveRef.current();
      resolveRef.current = null;
    }
  }, [clearTimer]);

  const streamYaml = useCallback(
    (nextYaml: string, nextValidation: ValidationResult) => {
      cancelYamlStream();
      setYaml('');
      setValidation(null);
      setValidationError('');
      setValidationStatus('validating');

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setYaml(nextYaml);
        setValidation(nextValidation);
        setValidationStatus('idle');
        return Promise.resolve();
      }

      const token = activeTokenRef.current + 1;
      activeTokenRef.current = token;
      const chunkSize = Math.max(MIN_CHUNK_SIZE, Math.ceil(nextYaml.length / STREAM_STEPS));
      let cursor = 0;

      setYamlRenderStatus('streaming');

      return new Promise<void>((resolve) => {
        resolveRef.current = resolve;

        const finish = () => {
          if (activeTokenRef.current !== token) {
            return;
          }

          clearTimer();
          resolveRef.current = null;
          setYaml(nextYaml);
          setValidation(nextValidation);
          setValidationStatus('idle');
          setYamlRenderStatus('idle');
          resolve();
        };

        const renderNextChunk = () => {
          if (activeTokenRef.current !== token) {
            return;
          }

          cursor = Math.min(nextYaml.length, cursor + chunkSize);
          setYaml(nextYaml.slice(0, cursor));

          if (cursor >= nextYaml.length) {
            finish();
            return;
          }

          timerRef.current = window.setTimeout(renderNextChunk, STREAM_FRAME_MS);
        };

        renderNextChunk();
      });
    },
    [cancelYamlStream, clearTimer, setValidation, setValidationError, setValidationStatus, setYaml]
  );

  useEffect(() => {
    return () => {
      activeTokenRef.current += 1;
      clearTimer();
    };
  }, [clearTimer]);

  return {
    cancelYamlStream,
    streamYaml,
    yamlRenderStatus
  };
}
