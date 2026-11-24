import { eraseValue, placeValue, type Board } from './board';
import type { Digit } from './digit';
import { emptyNotes, toggleNote, type Notes } from './notes';

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

/** Parte da partida que desfazer e refazer alteram. */
export interface HistoryState {
  readonly board: Board;
  readonly notes: readonly Notes[];
  readonly history: readonly HistoryEntry[];
  readonly cursor: number;
}

function setValue(board: Board, index: number, value: Digit | null): Board {
  const row = Math.floor(index / 9);
  const col = index % 9;
  const result = value === null ? eraseValue(board, row, col) : placeValue(board, row, col, value);
  return (result as { readonly ok: true; readonly value: Board }).value;
}

function withNotes(notes: readonly Notes[], index: number, cellNotes: Notes): readonly Notes[] {
  return Object.freeze(notes.map((existing, i) => (i === index ? cellNotes : existing)));
}

/** Desfaz a jogada em `cursor - 1` restaurando `before`; `null` se não houver o que desfazer. */
export function undo<T extends HistoryState>(state: T): T | null {
  if (state.cursor === 0) {
    return null;
  }
  const { move, before } = state.history[state.cursor - 1] as HistoryEntry;
  return Object.freeze({
    ...state,
    board: setValue(state.board, move.index, before.value),
    notes: withNotes(state.notes, move.index, before.notes),
    cursor: state.cursor - 1,
  });
}

/** Refaz a jogada em `cursor`; `null` se não houver o que refazer. */
export function redo<T extends HistoryState>(state: T): T | null {
  if (state.cursor >= state.history.length) {
    return null;
  }
  const { move } = state.history[state.cursor] as HistoryEntry;
  const current = state.notes[move.index] as Notes;
  let board = state.board;
  let cellNotes = emptyNotes;
  if (move.kind === 'place') {
    board = setValue(board, move.index, move.digit);
  } else if (move.kind === 'erase') {
    board = setValue(board, move.index, null);
  } else if (move.kind === 'toggle-note') {
    cellNotes = toggleNote(current, move.digit);
  }
  return Object.freeze({
    ...state,
    board,
    notes: withNotes(state.notes, move.index, cellNotes),
    cursor: state.cursor + 1,
  });
}
