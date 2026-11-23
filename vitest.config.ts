import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  test: {
    projects: [
      {
        extends: true,
        test: { name: 'domain', include: ['src/domain/**/*.test.ts'], environment: 'node' },
      },
      {
        extends: true,
        test: { name: 'ui', include: ['src/ui/**/*.test.{ts,tsx}'], environment: 'jsdom' },
      },
      {
        extends: true,
        test: {
          name: 'repo',
          include: ['tests/**/*.test.ts', 'scripts/**/*.test.ts'],
          environment: 'node',
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['src/domain/**/*.ts'],
      exclude: ['src/domain/**/*.test.ts', 'src/domain/__arbitraries__/**'],
      thresholds: { branches: 90 },
    },
  },
});
