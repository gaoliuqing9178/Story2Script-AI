import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

const browserGlobals = {
  console: 'readonly',
  document: 'readonly',
  fetch: 'readonly',
  FileReader: 'readonly',
  HTMLInputElement: 'readonly',
  localStorage: 'readonly',
  navigator: 'readonly',
  URL: 'readonly',
  window: 'readonly'
};

const nodeGlobals = {
  console: 'readonly',
  Buffer: 'readonly',
  process: 'readonly',
  setTimeout: 'readonly'
};

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      'docs/**',
      'examples/**'
    ]
  },
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin
    },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'max-lines': [
        'error',
        {
          max: 300,
          skipBlankLines: true,
          skipComments: true
        }
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ]
    }
  },
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: browserGlobals
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@story2script/server',
                '@story2script/server/*',
                '../../server/*',
                '../../../server/*',
                '../../../../apps/server/*'
              ],
              message: '前端不能直接依赖 server 层，请通过 apps/web/src/api 客户端调用。'
            }
          ]
        }
      ]
    }
  },
  {
    files: ['apps/server/**/*.{ts,tsx}', 'scripts/**/*.js'],
    languageOptions: {
      globals: nodeGlobals
    }
  },
  {
    files: ['*.config.{js,ts}', 'apps/**/**/*.config.{js,ts}'],
    languageOptions: {
      globals: nodeGlobals
    }
  }
];
