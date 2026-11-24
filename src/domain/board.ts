import { findConflicts, type CellConflict } from './conflicts';
import { isDigit, type Digit } from './digit';
import type { Result } from './result';
import { cellIndex, type Index } from './units';

/** Conteúdo de uma célula: valor (ou vazio) e se é pista. */
export interface CellState {
  readonly value: Digit | null;
  readonly given: boolean;
}

/** Tabuleiro: 81 células, índice `row * 9 + col`; congelado. */
export interface Board {
  readonly cells: readonly CellState[];
}

/** Forma esperada da entrada (9x9, `null` = vazio). */
export type Grid = readonly (readonly (Digit | null)[])[];

export type CreateRefusal = 'malformed-grid' | 'conflicting-givens';

export function createBoard(input: unknown): Result<Board, CreateRefusal> {
  const values = flattenGrid(input);
  if (values === null) {
    return { ok: false, reason: 'malformed-grid' };
  }
  if (findConflicts(values).length > 0) {
    return { ok: false, reason: 'conflicting-givens' };
  }
  const cells = values.map((value) => Object.freeze({ value, given: value !== null }));
  return { ok: true, value: Object.freeze({ cells: Object.freeze(cells) }) };
}

/** Achata a entrada em 81 valores; `null` se não for 9x9 de dígitos ou `null` (buracos incluídos). */
function flattenGrid(input: unknown): (Digit | null)[] | null {
  if (!Array.isArray(input) || input.length !== 9) {
    return null;
  }
  const values: (Digit | null)[] = [];
  for (let r = 0; r < 9; r++) {
    const row: unknown = Object.hasOwn(input, r) ? input[r] : undefined;
    if (!Array.isArray(row) || row.length !== 9) {
      return null;
    }
    for (let c = 0; c < 9; c++) {
      const value: unknown = Object.hasOwn(row, c) ? row[c] : undefined;
      if (value !== null && !isDigit(value)) {
        return null;
      }
      values.push(value);
    }
  }
  return values;
}

/** Conteúdo da célula na linha `row` e coluna `col` (0–8). */
export function cellAt(board: Board, row: Index, col: Index): CellState {
  return board.cells[cellIndex(row, col)] as CellState;
}

/** Conflitos do tabuleiro, derivados dos valores (nunca armazenados). */
export function getConflicts(board: Board): readonly CellConflict[] {
  return findConflicts(board.cells.map((cell) => cell.value));
}
