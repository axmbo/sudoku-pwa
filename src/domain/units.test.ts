import { describe, expect, it } from 'vitest';
import { ALL_UNITS, cellIndex, unitCells } from './units';

describe('units', () => {
  it.each([
    [0, 0, 0],
    [2, 7, 25],
    [7, 2, 65],
    [0, 8, 8],
    [8, 0, 72],
    [8, 8, 80],
  ])('INV: cellIndex(%i, %i) = %i (linha * 9 + coluna)', (row, col, expected) => {
    expect(cellIndex(row, col)).toBe(expected);
  });

  it('INV: ALL_UNITS tem 27 unidades em ordem fixa: 9 row, 9 column, 9 box', () => {
    expect(ALL_UNITS).toEqual([
      { kind: 'row', index: 0 },
      { kind: 'row', index: 1 },
      { kind: 'row', index: 2 },
      { kind: 'row', index: 3 },
      { kind: 'row', index: 4 },
      { kind: 'row', index: 5 },
      { kind: 'row', index: 6 },
      { kind: 'row', index: 7 },
      { kind: 'row', index: 8 },
      { kind: 'column', index: 0 },
      { kind: 'column', index: 1 },
      { kind: 'column', index: 2 },
      { kind: 'column', index: 3 },
      { kind: 'column', index: 4 },
      { kind: 'column', index: 5 },
      { kind: 'column', index: 6 },
      { kind: 'column', index: 7 },
      { kind: 'column', index: 8 },
      { kind: 'box', index: 0 },
      { kind: 'box', index: 1 },
      { kind: 'box', index: 2 },
      { kind: 'box', index: 3 },
      { kind: 'box', index: 4 },
      { kind: 'box', index: 5 },
      { kind: 'box', index: 6 },
      { kind: 'box', index: 7 },
      { kind: 'box', index: 8 },
    ]);
  });

  // Tabelas literais (índices escritos à mão, em ordem crescente), sem a fórmula do código.
  it.each([
    ['row', 0, [0, 1, 2, 3, 4, 5, 6, 7, 8]],
    ['row', 1, [9, 10, 11, 12, 13, 14, 15, 16, 17]],
    ['row', 2, [18, 19, 20, 21, 22, 23, 24, 25, 26]],
    ['row', 3, [27, 28, 29, 30, 31, 32, 33, 34, 35]],
    ['row', 4, [36, 37, 38, 39, 40, 41, 42, 43, 44]],
    ['row', 5, [45, 46, 47, 48, 49, 50, 51, 52, 53]],
    ['row', 6, [54, 55, 56, 57, 58, 59, 60, 61, 62]],
    ['row', 7, [63, 64, 65, 66, 67, 68, 69, 70, 71]],
    ['row', 8, [72, 73, 74, 75, 76, 77, 78, 79, 80]],
    ['column', 0, [0, 9, 18, 27, 36, 45, 54, 63, 72]],
    ['column', 1, [1, 10, 19, 28, 37, 46, 55, 64, 73]],
    ['column', 2, [2, 11, 20, 29, 38, 47, 56, 65, 74]],
    ['column', 3, [3, 12, 21, 30, 39, 48, 57, 66, 75]],
    ['column', 4, [4, 13, 22, 31, 40, 49, 58, 67, 76]],
    ['column', 5, [5, 14, 23, 32, 41, 50, 59, 68, 77]],
    ['column', 6, [6, 15, 24, 33, 42, 51, 60, 69, 78]],
    ['column', 7, [7, 16, 25, 34, 43, 52, 61, 70, 79]],
    ['column', 8, [8, 17, 26, 35, 44, 53, 62, 71, 80]],
    ['box', 0, [0, 1, 2, 9, 10, 11, 18, 19, 20]],
    ['box', 1, [3, 4, 5, 12, 13, 14, 21, 22, 23]],
    ['box', 2, [6, 7, 8, 15, 16, 17, 24, 25, 26]],
    ['box', 3, [27, 28, 29, 36, 37, 38, 45, 46, 47]],
    ['box', 4, [30, 31, 32, 39, 40, 41, 48, 49, 50]],
    ['box', 5, [33, 34, 35, 42, 43, 44, 51, 52, 53]],
    ['box', 6, [54, 55, 56, 63, 64, 65, 72, 73, 74]],
    ['box', 7, [57, 58, 59, 66, 67, 68, 75, 76, 77]],
    ['box', 8, [60, 61, 62, 69, 70, 71, 78, 79, 80]],
  ] as const)('INV: unitCells({ %s, %i }) = %j', (kind, index, expected) => {
    expect(unitCells({ kind, index })).toEqual(expected);
  });

  it.each([
    ['(2,2)', 20, 0],
    ['(2,3)', 21, 1],
    ['(3,2)', 29, 3],
    ['(5,5)', 50, 4],
    ['(5,6)', 51, 5],
    ['(6,5)', 59, 7],
  ])('INV: célula %s (índice %i) pertence só ao bloco %i', (_pos, cell, box) => {
    const boxes = ALL_UNITS.filter((u) => u.kind === 'box' && unitCells(u).includes(cell));
    expect(boxes).toEqual([{ kind: 'box', index: box }]);
  });

  it('INV: toda unidade tem 9 células', () => {
    for (const unit of ALL_UNITS) {
      expect(unitCells(unit)).toHaveLength(9);
    }
  });

  it('INV: toda célula está em exatamente 3 unidades, uma de cada tipo', () => {
    for (let cell = 0; cell < 81; cell++) {
      const kinds = ALL_UNITS.filter((u) => unitCells(u).includes(cell)).map((u) => u.kind);
      expect(kinds).toEqual(['row', 'column', 'box']);
    }
  });
});
