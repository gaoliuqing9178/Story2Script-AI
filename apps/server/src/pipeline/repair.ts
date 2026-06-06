import type { ValidationError, ValidationResult } from '@story2script/shared';
import type { LLMProvider } from '../provider/index.js';
import { validateScreenplayYamlStructure } from '../validate/structural.js';
import { buildRepairPrompt } from './prompts.js';
import type { RepairResult } from './types.js';

export async function repairScreenplayYaml(input: {
  yaml: string;
  validation?: ValidationResult;
  provider: LLMProvider;
  maxAttempts: number;
}): Promise<RepairResult> {
  const initialValidation = input.validation ?? validateScreenplayYamlStructure(input.yaml);
  let yaml = input.yaml;
  let validation = initialValidation;
  let attempts = 0;

  while (!validation.valid && attempts < input.maxAttempts) {
    attempts += 1;
    const prompt = buildRepairPrompt({
      yaml,
      errors: validation.errors,
      ...(validation.warnings ? { warnings: validation.warnings } : {})
    });

    yaml = await input.provider.complete({
      ...prompt,
      temperature: 0
    });
    validation = validateScreenplayYamlStructure(yaml);
  }

  return {
    yaml,
    validation,
    initialValidation,
    attempts,
    maxAttempts: input.maxAttempts
  };
}

export function normalizeRepairErrors(value: unknown): ValidationError[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    return undefined;
  }

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
    .filter((item) => typeof item.path === 'string' && typeof item.message === 'string')
    .map((item) => ({
      path: item.path as string,
      message: item.message as string
    }));
}
