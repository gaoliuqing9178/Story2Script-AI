import type { ValidationResult } from '@story2script/shared';
import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useState } from 'react';

type ValidationStatus = 'idle' | 'validating' | 'error';
export type YamlRenderStatus = 'idle' | 'streaming';

interface UseYamlStreamInput {
  setValidation: Dispatch<SetStateAction<ValidationResult | null>>;
  setValidationError: Dispatch<SetStateAction<string>>;
  setValidationStatus: Dispatch<SetStateAction<ValidationStatus>>;
  setYaml: Dispatch<SetStateAction<string>>;
}

export function useYamlStream({
  setValidation,
  setValidationError,
  setValidationStatus,
  setYaml
}: UseYamlStreamInput) {
  const [yamlRenderStatus, setYamlRenderStatus] = useState<YamlRenderStatus>('idle');

  const cancelYamlStream = useCallback(() => {
    setYamlRenderStatus('idle');
  }, []);

  const beginYamlStream = useCallback(() => {
    setYaml('');
    setValidation(null);
    setValidationError('');
    setValidationStatus('validating');
    setYamlRenderStatus('streaming');
  }, [setValidation, setValidationError, setValidationStatus, setYaml]);

  const resetYamlStream = useCallback(() => {
    setYaml('');
    setValidation(null);
    setValidationError('');
    setValidationStatus('validating');
    setYamlRenderStatus('streaming');
  }, [setValidation, setValidationError, setValidationStatus, setYaml]);

  const appendYamlDelta = useCallback(
    (delta: string) => {
      if (delta.length > 0) {
        setYaml((current) => `${current}${delta}`);
      }
    },
    [setYaml]
  );

  const replaceYamlSnapshot = useCallback(
    (nextYaml: string) => {
      setYaml(nextYaml);
    },
    [setYaml]
  );

  const finishYamlStream = useCallback(
    (nextValidation: ValidationResult) => {
      cancelYamlStream();
      setValidation(nextValidation);
      setValidationStatus('idle');
    },
    [cancelYamlStream, setValidation, setValidationStatus]
  );

  return {
    appendYamlDelta,
    beginYamlStream,
    cancelYamlStream,
    finishYamlStream,
    replaceYamlSnapshot,
    resetYamlStream,
    yamlRenderStatus
  };
}
