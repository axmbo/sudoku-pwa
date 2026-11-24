import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { cellAt, createBoard, getConflicts, type Board } from './board';
import type { Digit } from './digit';
import type { Index } from './units';
import {
  anyBoard,
  anyMove,
  applyMove,
  boardWithConflicts,
  type BoardAction,
} from './__arbitraries__/board';
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

const isCoord = (n: unknown): boolean =>
  typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 8;
const isDigitValue = (n: unknown): boolean =>
  typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 9;

/** Oráculo ingênuo de conflitos: pares de células com o mesmo valor numa unidade (geometria própria). */
function oracleConflicts(board: Board): unknown[] {
  const out: unknown[] = [];
  for (let i = 0; i < 81; i++) {
    const value = board.cells[i]?.value ?? null;
    if (value === null) continue;
    const r = Math.floor(i / 9);
    const c = i % 9;
    const units: { kind: string; index: number }[] = [];
    const repeats = (same: (r2: number, c2: number) => boolean): boolean =>
      board.cells.some(
        (cell, j) => j !== i && cell.value === value && same(Math.floor(j / 9), j % 9),
      );
    if (repeats((r2) => r2 === r)) units.push({ kind: 'row', index: r });
    if (repeats((_r2, c2) => c2 === c)) units.push({ kind: 'column', index: c });
    const box = Math.floor(r / 3) * 3 + Math.floor(c / 3);
    if (repeats((r2, c2) => Math.floor(r2 / 3) * 3 + Math.floor(c2 / 3) === box)) {
      units.push({ kind: 'box', index: box });
    }
    if (units.length > 0) out.push({ row: r, col: c, value, units });
  }
  return out;
}

/** Modelo de precedência do plano: coordenada, depois valor, depois pista. */
function expectedReason(board: Board, move: BoardAction): string | null {
  if (!isCoord(move.row) || !isCoord(move.col)) return 'cell-not-found';
  if (move.op === 'place' && !isDigitValue(move.value)) return 'invalid-value';
  const cell = board.cells[(move.row as number) * 9 + (move.col as number)];
  return cell?.given ? 'cell-is-given' : null;
}

const snapshot = (board: Board): string => JSON.stringify(board.cells);

describe('board (propriedades de jogadas)', () => {
  it('CA-001-07, CA-001-08 (P1): pistas nunca mudam sob qualquer sequência de jogadas aceitas e recusadas', () => {
    fc.assert(
      fc.property(anyBoard, fc.array(anyMove, { maxLength: 40 }), (initial, moves) => {
        let board = initial;
        for (const move of moves) {
          const result = applyMove(board, move);
          if (result.ok) board = result.value;
          initial.cells.forEach((cell, i) => {
            if (cell.given) expect(board.cells[i]).toEqual(cell);
          });
        }
      }),
      { seed: 20260081 },
    );
  });

  it('CA-001-09 a CA-001-14 (P2): getConflicts coincide com o oráculo de pares', () => {
    fc.assert(
      fc.property(boardWithConflicts, (board) => {
        expect(getConflicts(board)).toEqual(oracleConflicts(board));
      }),
      { seed: 20260082, numRuns: 100 },
    );
  });

  it('CA-001-07, 08, 20, 21, 24 e 25 (P3): recusa mantém o tabuleiro e o motivo segue a precedência', () => {
    fc.assert(
      fc.property(boardWithConflicts, anyMove, (board, move) => {
        const before = snapshot(board);
        const conflictsBefore = getConflicts(board);
        let result: ReturnType<typeof applyMove> | undefined;
        expect(() => {
          result = applyMove(board, move);
        }).not.toThrow();
        const reason = expectedReason(board, move);
        if (reason === null) {
          expect(result?.ok).toBe(true);
        } else {
          expect(result).toEqual({ ok: false, reason });
        }
        expect(snapshot(board)).toBe(before);
        expect(getConflicts(board)).toEqual(conflictsBefore);
      }),
      { seed: 20260083, numRuns: 150 },
    );
  });

  it('CA-001-18 (P4): mesmo conteúdo por caminhos diferentes (um com valores intermediários e apagando) dá os mesmos conflitos', () => {
    const digit = fc.integer({ min: 1, max: 9 }) as fc.Arbitrary<Digit>;
    const target = fc.array(fc.option(digit, { nil: null }), { minLength: 81, maxLength: 81 });
    const detour = fc.array(digit, { minLength: 81, maxLength: 81 });
    fc.assert(
      fc.property(anyBoard, target, detour, (initial, wanted, detours) => {
        let direct = initial;
        let roundabout = initial;
        initial.cells.forEach((cell, i) => {
          if (cell.given) return;
          const row = Math.floor(i / 9);
          const col = i % 9;
          const goal = wanted[i] ?? null;
          if (goal !== null) {
            const r = applyMove(direct, { op: 'place', row, col, value: goal });
            if (r.ok) direct = r.value;
          }
        });
        for (let i = 80; i >= 0; i--) {
          if (initial.cells[i]?.given) continue;
          const row = Math.floor(i / 9);
          const col = i % 9;
          const goal = wanted[i] ?? null;
          const steps: BoardAction[] = [
            { op: 'place', row, col, value: detours[i] },
            goal === null ? { op: 'erase', row, col } : { op: 'place', row, col, value: goal },
          ];
          for (const step of steps) {
            const r = applyMove(roundabout, step);
            if (r.ok) roundabout = r.value;
          }
        }
        expect(roundabout.cells).toEqual(direct.cells);
        expect(getConflicts(roundabout)).toEqual(getConflicts(direct));
        expect(getConflicts(direct)).toEqual(oracleConflicts(direct));
      }),
      { seed: 20260084, numRuns: 100 },
    );
  });
});
