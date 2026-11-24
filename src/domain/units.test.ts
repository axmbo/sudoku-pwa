import { describe, expect, it } from 'vitest';
import { ALL_UNITS, cellIndex } from './units';

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
});
