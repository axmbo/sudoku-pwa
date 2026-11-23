import type { Digit } from './digit';
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
  // A validação da forma da entrada é da T02; por ora confia-se em `Grid`.
  const grid = input as Grid;
  const cells = grid.flat().map((value) => Object.freeze({ value, given: value !== null }));
  return { ok: true, value: Object.freeze({ cells: Object.freeze(cells) }) };
}

/** Conteúdo da célula na linha `row` e coluna `col` (0–8). */
export function cellAt(board: Board, row: Index, col: Index): CellState {
  return board.cells[cellIndex(row, col)] as CellState;
}
