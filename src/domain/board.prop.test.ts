import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { cellAt, createBoard } from './board';
import type { Index } from './units';
import { gridWithoutConflicts } from './__arbitraries__/grid';

const INDEXES: readonly Index[] = [0, 1, 2, 3, 4, 5, 6, 7, 8];

describe('board (propriedades de criação)', () => {
  it('CA-001-01 e CA-001-02: para toda grade sem conflito, 81 células, valor igual à entrada e given ⇔ valor não vazio', () => {
    fc.assert(
      fc.property(gridWithoutConflicts, (grid) => {
        const result = createBoard(grid);
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.value.cells.length).toBe(81);
        for (const r of INDEXES) {
          for (const c of INDEXES) {
            const expected = grid[r]?.[c] ?? null;
            const cell = cellAt(result.value, r, c);
            expect(cell.value).toBe(expected);
            expect(cell.given).toBe(expected !== null);
          }
        }
      }),
      { seed: 20260012 },
    );
  });
});

const isValidCell = (v: unknown): boolean =>
  v === null || (typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 9);

describe('board (propriedades de grade malformada)', () => {
  // Regressão: se falhar, copie a seed e o path impressos para um teste fixo
  // `fc.assert(prop, { seed, path })` com comentário do caso.
  it('CA-001-22: grade válida com UMA célula trocada por não-dígito é recusada como malformed-grid', () => {
    const notACell = fc.anything().filter((v) => !isValidCell(v));
    fc.assert(
      fc.property(gridWithoutConflicts, fc.nat(8), fc.nat(8), notACell, (grid, row, col, bad) => {
        const mutated: unknown[][] = grid.map((line) => [...line]);
        (mutated[row] as unknown[])[col] = bad;
        let result: ReturnType<typeof createBoard> | undefined;
        expect(() => {
          result = createBoard(mutated);
        }).not.toThrow();
        expect(result).toEqual({ ok: false, reason: 'malformed-grid' });
      }),
      { seed: 20260022 },
    );
  });

  it('CA-001-22: grade válida com uma linha truncada ou estendida é recusada como malformed-grid', () => {
    const wrongLength = fc.nat(20).filter((n) => n !== 9);
    fc.assert(
      fc.property(gridWithoutConflicts, fc.nat(8), wrongLength, (grid, row, length) => {
        const mutated: unknown[][] = grid.map((line) => [...line]);
        const original = mutated[row] as unknown[];
        mutated[row] = Array.from({ length }, (_v, i) => original[i] ?? null);
        let result: ReturnType<typeof createBoard> | undefined;
        expect(() => {
          result = createBoard(mutated);
        }).not.toThrow();
        expect(result).toEqual({ ok: false, reason: 'malformed-grid' });
      }),
      { seed: 20260023 },
    );
  });
});
