import { describe, expect, it } from 'vitest';
import { cellIndex } from './units';

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
});
