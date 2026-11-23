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
    // Constituição 5 e 6: domínio puro, sem relógio, aleatoriedade global ou DOM.
    files: ['src/domain/**/*.ts'],
    languageOptions: { globals: {} },
    rules: {
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Injete o PRNG (constituição 6).' },
        { object: 'Date', property: 'now', message: 'Injete o relógio (constituição 5).' },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'Domínio sem DOM (constituição 5).' },
        { name: 'document', message: 'Domínio sem DOM (constituição 5).' },
        { name: 'fetch', message: 'Domínio sem rede (constituição 5).' },
      ],
    },
  },
  prettier,
);
