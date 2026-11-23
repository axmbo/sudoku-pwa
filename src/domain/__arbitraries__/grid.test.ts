import fc from 'fast-check';
import { describe, it } from 'vitest';
import { SOLUTION, gridWithoutConflicts } from './grid';

describe('gridWithoutConflicts', () => {
  it('INV: gera 9x9 em que cada célula é vazia ou igual à solução fixa', () => {
    fc.assert(
      fc.property(
        gridWithoutConflicts,
        (grid) =>
          grid.length === 9 &&
          grid.every(
            (row, r) =>
              row.length === 9 && row.every((v, c) => v === null || v === Number(SOLUTION[r]?.[c])),
          ),
      ),
      { seed: 20260011 },
    );
  });
});
