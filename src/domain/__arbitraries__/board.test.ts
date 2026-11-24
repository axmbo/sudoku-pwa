import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { getConflicts } from '../board';
import { anyBoard, anyMove, boardWithConflicts, dirtyCoordinate, dirtyValue } from './board';

const isCoordinate = (n: unknown): boolean =>
  typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 8;
const isDigitValue = (n: unknown): boolean =>
  typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 9;

describe('board (geradores)', () => {
  it('INV: boardWithConflicts produz conflito em fração relevante das amostras', () => {
    const boards = fc.sample(boardWithConflicts, { numRuns: 300, seed: 20260071 });
    const withConflict = boards.filter((b) => getConflicts(b).length > 0).length;
    expect(withConflict).toBeGreaterThanOrEqual(90);
  });

  it('INV: boardWithConflicts também produz tabuleiros sem conflito (não degenera)', () => {
    const boards = fc.sample(boardWithConflicts, { numRuns: 300, seed: 20260072 });
    expect(boards.some((b) => getConflicts(b).length === 0)).toBe(true);
  });

  it('INV: anyBoard sempre tem 81 células e pistas ⇔ valor inicial', () => {
    fc.assert(
      fc.property(anyBoard, (board) => {
        expect(board.cells.length).toBe(81);
        expect(board.cells.every((c) => c.given === (c.value !== null))).toBe(true);
      }),
      { seed: 20260073 },
    );
  });

  it('INV: coordenadas sujas misturam válidas e inválidas', () => {
    const sample = fc.sample(dirtyCoordinate, { numRuns: 300, seed: 20260074 });
    expect(sample.filter(isCoordinate).length).toBeGreaterThan(100);
    expect(sample.filter((v) => !isCoordinate(v)).length).toBeGreaterThan(30);
    expect(sample.some((v) => typeof v !== 'number')).toBe(true);
  });

  it('INV: valores sujos misturam dígitos e não-dígitos', () => {
    const sample = fc.sample(dirtyValue, { numRuns: 300, seed: 20260075 });
    expect(sample.filter(isDigitValue).length).toBeGreaterThan(100);
    expect(sample.filter((v) => !isDigitValue(v)).length).toBeGreaterThan(30);
    expect(sample.some((v) => typeof v !== 'number')).toBe(true);
  });

  it('INV: jogadas incluem colocar e apagar', () => {
    const sample = fc.sample(anyMove, { numRuns: 200, seed: 20260076 });
    expect(sample.some((m) => m.op === 'place')).toBe(true);
    expect(sample.some((m) => m.op === 'erase')).toBe(true);
  });
});
