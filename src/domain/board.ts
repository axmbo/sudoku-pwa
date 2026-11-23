import type { Digit } from './digit';
import type { Result } from './result';

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
  void input; // fake it: a entrada só passa a ser lida no vermelho (3)
  const empty: CellState = Object.freeze({ value: null, given: false });
  const cells = Object.freeze(Array.from({ length: 81 }, () => empty));
  return { ok: true, value: Object.freeze({ cells }) };
}
