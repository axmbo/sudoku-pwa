import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const script = fileURLToPath(new URL('./tsc-red-filter.mjs', import.meta.url));

function run(input: string) {
  const result = spawnSync(process.execPath, [script], { input, encoding: 'utf8' });
  return { status: result.status, stderr: result.stderr };
}

describe('tsc-red-filter', () => {
  describe('erros de símbolo inexistente (toleráveis no commit RED)', () => {
    it('INV: tolera uma linha TS2307 (módulo inexistente)', () => {
      const input =
        "src/domain/units.test.ts(2,27): error TS2307: Cannot find module './units' or its corresponding type declarations.\n";
      expect(run(input).status).toBe(0);
    });

    it.each([
      ['TS2305', "src/a.test.ts(1,10): error TS2305: Module './a' has no exported member 'foo'.\n"],
      [
        'TS2339',
        "src/a.test.ts(5,12): error TS2339: Property 'bar' does not exist on type 'Baz'.\n",
      ],
      [
        'TS2724',
        "src/a.test.ts(1,10): error TS2724: './a' has no exported member named 'fo'. Did you mean 'foo'?\n",
      ],
    ])('INV: tolera uma linha %s', (_codigo, input) => {
      expect(run(input).status).toBe(0);
    });

    it('INV: tolera várias linhas toleradas com linha de continuação indentada', () => {
      const input = [
        "src/a.test.ts(1,10): error TS2305: Module './a' has no exported member 'foo'.",
        "src/b.test.ts(5,12): error TS2339: Property 'bar' does not exist on type 'Baz'.",
        "  Type 'Baz' is missing the following properties from type 'Qux': x, y",
        "src/c.test.ts(2,27): error TS2307: Cannot find module './c' or its corresponding type declarations.",
        '',
      ].join('\n');
      expect(run(input).status).toBe(0);
    });
  });
  describe('erros não toleráveis (falha fechado)', () => {
    const ts2322 =
      "src/x.test.ts(3,5): error TS2322: Type 'string' is not assignable to type 'number'.";

    it('INV: rejeita uma linha TS2322 e a imprime no stderr', () => {
      const result = run(`${ts2322}\n`);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(ts2322);
    });

    it('INV: linha tolerada misturada com TS2322 rejeita e imprime só a TS2322', () => {
      const tolerated =
        "src/a.test.ts(1,10): error TS2305: Module './a' has no exported member 'foo'.";
      const result = run(`${tolerated}\n${ts2322}\n`);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(ts2322);
      expect(result.stderr).not.toContain('TS2305');
    });

    it.each([
      ['vazia', ''],
      ['sem linha error TS', 'error: something\n'],
    ])('INV: entrada %s falha fechado', (_nome, input) => {
      expect(run(input).status).toBe(1);
    });

    it('INV: continuação indentada de erro não tolerado não conta como erro próprio', () => {
      const input = `${ts2322}\n  Type 'string' is not assignable to type 'number'.\n`;
      const result = run(input);
      expect(result.status).toBe(1);
      expect(result.stderr.match(/error TS/g)).toHaveLength(1);
    });
  });
});
