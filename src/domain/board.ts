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
export function flattenGrid(input: unknown): (Digit | null)[] | null {
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

export type PlaceRefusal = 'cell-not-found' | 'invalid-value' | 'cell-is-given';

/** Coloca `value` na célula (`row`, `col`); recusa célula inexistente, valor inválido e pista (nessa ordem). */
export function placeValue(
  board: Board,
  row: unknown,
  col: unknown,
  value: unknown,
): Result<Board, PlaceRefusal> {
  if (!isCoordinate(row) || !isCoordinate(col)) {
    return { ok: false, reason: 'cell-not-found' };
  }
  if (!isDigit(value)) {
    return { ok: false, reason: 'invalid-value' };
  }
  if (isGivenAt(board, row, col)) {
    return { ok: false, reason: 'cell-is-given' };
  }
  return { ok: true, value: replaceCell(board, row, col, value) };
}

export type EraseRefusal = 'cell-not-found' | 'cell-is-given';

/** Apaga o valor da célula (`row`, `col`); recusa célula inexistente e pista (nessa ordem). */
export function eraseValue(board: Board, row: unknown, col: unknown): Result<Board, EraseRefusal> {
  if (!isCoordinate(row) || !isCoordinate(col)) {
    return { ok: false, reason: 'cell-not-found' };
  }
  if (isGivenAt(board, row, col)) {
    return { ok: false, reason: 'cell-is-given' };
  }
  return { ok: true, value: replaceCell(board, row, col, null) };
}

/** Coordenada válida: inteiro de 0 a 8 (`-0` equivale a 0); não lança para `bigint` ou objetos. */
export function isCoordinate(n: unknown): n is Index {
  // Stryker disable next-line ConditionalExpression: mutante equivalente; Number.isInteger já recusa não numéricos, o typeof só estreita o tipo.
  return typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 8;
}

function isGivenAt(board: Board, row: number, col: number): boolean {
  return (board.cells[cellIndex(row, col)] as CellState).given;
}

/** Novo `Board` congelado com só a célula alvo trocada por uma do jogador. */
function replaceCell(board: Board, row: number, col: number, value: Digit | null): Board {
  const target = cellIndex(row, col);
  const cells = board.cells.map((cell, i) =>
    i === target ? Object.freeze({ value, given: false }) : cell,
  );
  return Object.freeze({ cells: Object.freeze(cells) });
}
