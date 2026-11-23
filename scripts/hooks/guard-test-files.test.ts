import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const script = fileURLToPath(new URL('./guard-test-files.mjs', import.meta.url));

function run(input: string) {
  const result = spawnSync(process.execPath, [script], { input, encoding: 'utf8' });
  return { status: result.status, stderr: result.stderr };
}

function runWithPath(path: string, key: 'file_path' | 'notebook_path' = 'file_path') {
  return run(JSON.stringify({ tool_name: 'Edit', tool_input: { [key]: path } }));
}

describe('guard-test-files', () => {
  describe('caminhos permitidos', () => {
    it.each([
      'src/domain/digit.ts',
      '/abs/src/ui/latest.tsx',
      'docs/testes.md',
      'src/contest.ts',
      'src/test.ts',
      'docs/guia.test.md',
      'src/attests/x.ts',
      'src/mytests/x.ts',
      'src/e2eish/x.ts',
      '/abs/src/domain/arbitraries/grid.ts',
    ])('INV: permite %s (exit 0, sem stderr)', (path) => {
      expect(runWithPath(path)).toEqual({ status: 0, stderr: '' });
    });

    it('INV: permite notebook_path de arquivo comum', () => {
      expect(runWithPath('notebooks/analise.ipynb', 'notebook_path')).toEqual({
        status: 0,
        stderr: '',
      });
    });
  });

  describe('caminhos bloqueados', () => {
    it.each([
      'src/domain/digit.test.ts',
      'src/domain/digit.prop.test.ts',
      'src/ui/app.spec.tsx',
      'a.test.js',
      'a.test.jsx',
      'a.spec.mjs',
      'a.spec.cjs',
      'a.test.mts',
      'a.spec.cts',
      '/abs/src/ui/app.test.tsx',
      'e2e/fumaca.ts',
      '/abs/e2e/fumaca.spec.ts',
      'tests/repo/readme.ts',
      '/abs/tests/helper.ts',
      'src/domain/__arbitraries__/grid.ts',
      '__arbitraries__/grid.ts',
      'src/x/e2e/helper.ts',
      'src/ui/__snapshots__/grid.test.tsx.snap',
      'src/ui/x.snap',
    ])('INV: bloqueia %s (exit 2, stderr cita eng-testes)', (path) => {
      const { status, stderr } = runWithPath(path);
      expect(status).toBe(2);
      expect(stderr).toContain('eng-testes');
    });

    it('INV: bloqueia notebook_path de teste', () => {
      const { status, stderr } = runWithPath('tests/analise.ipynb', 'notebook_path');
      expect(status).toBe(2);
      expect(stderr).toContain('eng-testes');
    });
  });

  describe('falha fechado', () => {
    it.each([
      ['stdin vazio', ''],
      ['JSON inválido', '{nao eh json'],
      ['sem tool_input', JSON.stringify({ tool_name: 'Edit' })],
      ['tool_input sem caminho', JSON.stringify({ tool_input: { content: 'x' } })],
      ['caminho vazio', JSON.stringify({ tool_input: { file_path: '' } })],
      ['caminho não textual', JSON.stringify({ tool_input: { file_path: 42 } })],
    ])('INV: entrada inválida (%s) bloqueia com exit 2', (_nome, input) => {
      const { status, stderr } = run(input);
      expect(status).toBe(2);
      expect(stderr).not.toBe('');
    });
  });
});
