import { Ajv2020 } from 'ajv/dist/2020.js';
import type { ErrorObject } from 'ajv';
import { load } from 'js-yaml';
import { screenplayJsonSchema, type Screenplay, type ValidationError, type ValidationResult } from '@story2script/shared';
import { validateScreenplayReferences } from './reference.js';

const ajv = new Ajv2020({
  allErrors: true,
  strict: true
});

const validateScreenplayStructure = ajv.compile(screenplayJsonSchema);

export function validateScreenplayYamlStructure(yamlText: string): ValidationResult {
  let parsed: unknown;

  try {
    parsed = load(yamlText);
  } catch (cause) {
    return {
      valid: false,
      errors: [
        {
          path: '(root)',
          message: `YAML 解析失败: ${getErrorMessage(cause)}`
        }
      ],
      warnings: []
    };
  }

  const valid = validateScreenplayStructure(parsed);

  if (valid) {
    return validateScreenplayReferences(parsed as Screenplay);
  }

  return {
    valid: false,
    errors: (validateScreenplayStructure.errors ?? []).map(formatAjvError),
    warnings: []
  };
}

function formatAjvError(error: ErrorObject): ValidationError {
  return {
    path: formatAjvPath(error),
    message: formatAjvMessage(error)
  };
}

function formatAjvPath(error: ErrorObject) {
  const params = error.params as Record<string, unknown>;
  const segments = decodeJsonPointer(error.instancePath);

  if (error.keyword === 'required' && typeof params.missingProperty === 'string') {
    segments.push(params.missingProperty);
  }

  return formatPathSegments(segments);
}

function decodeJsonPointer(instancePath: string) {
  if (!instancePath) {
    return [];
  }

  return instancePath
    .split('/')
    .slice(1)
    .map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'));
}

function formatPathSegments(segments: string[]) {
  if (segments.length === 0) {
    return '(root)';
  }

  return segments.reduce((path, segment) => {
    if (/^(0|[1-9]\d*)$/.test(segment)) {
      return `${path}[${segment}]`;
    }

    return path ? `${path}.${segment}` : segment;
  }, '');
}

function formatAjvMessage(error: ErrorObject) {
  const params = error.params as Record<string, unknown>;

  switch (error.keyword) {
    case 'required':
      return '必填字段缺失';
    case 'enum':
      return `必须是以下值之一: ${formatAllowedValues(params.allowedValues)}`;
    case 'const':
      return `必须等于 ${formatValue(params.allowedValue)}`;
    case 'minItems':
      return `至少需要 ${String(params.limit)} 项`;
    case 'minLength':
      return '不能为空';
    case 'type':
      return `必须是 ${String(params.type)}`;
    default:
      return error.message ? `不符合结构规则: ${error.message}` : `不符合结构规则: ${error.keyword}`;
  }
}

function formatAllowedValues(value: unknown) {
  if (!Array.isArray(value)) {
    return '合法枚举值';
  }

  return value.map(formatValue).join(', ');
}

function formatValue(value: unknown) {
  if (typeof value === 'string') {
    return `"${value}"`;
  }

  return JSON.stringify(value) ?? String(value);
}

function getErrorMessage(cause: unknown) {
  return cause instanceof Error ? cause.message : String(cause);
}
