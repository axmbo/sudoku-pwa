// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'dist/',
      'coverage/',
      'reports/',
      '.stryker-tmp/',
      'playwright-report/',
      'test-results/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  {
    // Constituição 5 e 6: domínio puro, sem relógio, aleatoriedade global, DOM, rede ou timers.
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: 'new Date() sem argumentos lê o relógio; injete o relógio (constituição 5).',
        },
        {
          selector: "CallExpression[callee.name='Date']",
          message: 'Date() lê o relógio; injete o relógio (constituição 5).',
        },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Injete o PRNG (constituição 6).' },
        { object: 'Date', property: 'now', message: 'Injete o relógio (constituição 5).' },
        { object: 'performance', property: 'now', message: 'Injete o relógio (constituição 5).' },
        {
          object: 'crypto',
          property: 'getRandomValues',
          message: 'Injete o PRNG (constituição 6).',
        },
        {
          object: 'globalThis',
          property: 'document',
          message: 'Domínio sem DOM (constituição 5).',
        },
        { object: 'globalThis', property: 'window', message: 'Domínio sem DOM (constituição 5).' },
      ],
      'no-restricted-globals': [
        'error',
        ...['window', 'document', 'navigator', 'self'].map((name) => ({
          name,
          message: 'Domínio sem DOM nem ambiente de navegador (constituição 5).',
        })),
        ...['localStorage', 'sessionStorage', 'indexedDB'].map((name) => ({
          name,
          message: 'Domínio sem armazenamento (constituição 5).',
        })),
        ...['fetch', 'XMLHttpRequest', 'WebSocket'].map((name) => ({
          name,
          message: 'Domínio sem rede (constituição 5).',
        })),
        ...['setTimeout', 'setInterval'].map((name) => ({
          name,
          message: 'Domínio sem timers; a passagem do tempo é injetada (constituição 5).',
        })),
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['preact', 'preact/*'],
              message: 'Domínio não depende de UI (constituição 5).',
            },
            { group: ['**/ui/**'], message: 'Domínio não importa de ui/ (constituição 5).' },
            {
              group: ['**/worker/**'],
              message: 'Domínio não importa de worker/ (constituição 5).',
            },
          ],
        },
      ],
    },
  },
  prettier,
);
