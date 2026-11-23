import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const eslint = new ESLint();

async function errorCount(code: string, filePath: string): Promise<number> {
  const [result] = await eslint.lintText(code, { filePath });
  return result?.errorCount ?? -1;
}

const proibidos: readonly string[] = [
  'new Date()',
  'Date()',
  'Date.now()',
  'Math.random()',
  'performance.now()',
  'crypto.getRandomValues(new Uint8Array(1))',
  "localStorage.getItem('a')",
  'sessionStorage',
  'indexedDB',
  'navigator',
  'self',
  'window',
  'document',
  'globalThis.document',
  "fetch('x')",
  'new XMLHttpRequest()',
  "new WebSocket('x')",
  'setTimeout(() => {}, 1)',
  'setInterval(() => {}, 1)',
];

const importsProibidos: readonly string[] = [
  "import { h } from 'preact';\nexport const v = h;",
  "import x from '../ui/a';\nexport const v = x;",
  "import y from '../worker/b';\nexport const v = y;",
];

const trechos: readonly string[] = [
  ...proibidos.map((expr) => `export const v = ${expr};`),
  ...importsProibidos,
];

describe('lint do domínio (constituição 5 e 6)', () => {
  describe.each(['src/domain/x.ts', 'src/domain/x.tsx'])('em %s', (filePath) => {
    it.each(trechos)('INV: rejeita %s', async (code) => {
      expect(await errorCount(code, filePath)).toBeGreaterThanOrEqual(1);
    });
  });

  it.each([
    ['new Date(0)', 'export const v = new Date(0);'],
    [
      'função com relógio injetado',
      'export const age = (now: () => number, t: number): number => now() - t;',
    ],
  ])('INV: aceita código puro (%s)', async (_nome, code) => {
    expect(await errorCount(code, 'src/domain/x.ts')).toBe(0);
  });

  it('INV: a regra vale só para o domínio (new Date() em src/ui/x.ts passa)', async () => {
    expect(await errorCount('export const v = new Date();', 'src/ui/x.ts')).toBe(0);
  });
});
