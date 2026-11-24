import type { Digit } from './digit';
import type { Notes } from './notes';

/** Jogada do jogador sobre uma célula (`index` = row * 9 + col). */
export type Move =
  | { readonly kind: 'place'; readonly index: number; readonly digit: Digit }
  | { readonly kind: 'erase'; readonly index: number }
  | { readonly kind: 'toggle-note'; readonly index: number; readonly digit: Digit }
  | { readonly kind: 'clear-notes'; readonly index: number };

/** Conteúdo da célula antes da jogada. */
export interface CellMemo {
  readonly value: Digit | null;
  readonly notes: Notes;
}

export interface HistoryEntry {
  readonly move: Move;
  readonly before: CellMemo;
}
