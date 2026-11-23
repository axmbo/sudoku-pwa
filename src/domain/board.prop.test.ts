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
