import { eraseValue, placeValue, type Board } from './board';
import type { Digit } from './digit';
import { emptyNotes, toggleNote, type Notes } from './notes';
import { cellIndex, unitCells, type Index } from './units';

/** Jogada do jogador sobre uma célula (`index` = row * 9 + col). */
export type Move =
  | { readonly kind: 'place'; readonly index: number; readonly digit: Digit }
  | { readonly kind: 'erase'; readonly index: number }
  | { readonly kind: 'toggle-note'; readonly index: number; readonly digit: Digit }
  | { readonly kind: 'clear-notes'; readonly index: number }
  | { readonly kind: 'place-prune'; readonly index: number; readonly digit: Digit };

/** Conteúdo da célula antes da jogada. */
export interface CellMemo {
  readonly value: Digit | null;
  readonly notes: Notes;
}

/** Anotações de uma vizinha antes da poda. */
export interface PrunedMemo {
  readonly index: number;
  readonly notes: Notes;
}

export interface HistoryEntry {
  readonly move: Move;
  readonly before: CellMemo;
  /** Só em `place-prune`: vizinhas que tinham o dígito, com as anotações de antes. */
  readonly pruned?: readonly PrunedMemo[];
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

/** Vizinhas (linha, coluna, caixa) de `index` cujas anotações contêm `digit`, em ordem crescente. */
export function pruneTargets(
  notes: readonly Notes[],
  index: number,
  digit: Digit,
): readonly PrunedMemo[] {
  const row = Math.floor(index / 9) as Index;
  const col = (index % 9) as Index;
  const box = (Math.floor(row / 3) * 3 + Math.floor(col / 3)) as Index;
  const peers = new Set([
    ...unitCells({ kind: 'row', index: row }),
    ...unitCells({ kind: 'column', index: col }),
    ...unitCells({ kind: 'box', index: box }),
  ]);
  peers.delete(cellIndex(row, col));
  return [...peers]
    .sort((a, b) => a - b)
    .filter((peer) => (notes[peer] as Notes).includes(digit))
    .map((peer) => ({ index: peer, notes: notes[peer] as Notes }));
}

/** Remove `digit` das anotações das células `pruned`. */
export function applyPrune(
  notes: readonly Notes[],
  pruned: readonly PrunedMemo[],
  digit: Digit,
): readonly Notes[] {
  const targets = new Set(pruned.map((memo) => memo.index));
  return Object.freeze(
    notes.map((existing, i) =>
      targets.has(i) ? (Object.freeze(existing.filter((d) => d !== digit)) as Notes) : existing,
    ),
  );
}

/** Desfaz a jogada em `cursor - 1` restaurando `before`; `null` se não houver o que desfazer. */
export function undo<T extends HistoryState>(state: T): T | null {
  if (state.cursor === 0) {
    return null;
  }
  const { move, before, pruned } = state.history[state.cursor - 1] as HistoryEntry;
  const restored = (pruned ?? []).reduce(
    (notes, memo) => withNotes(notes, memo.index, memo.notes),
    state.notes,
  );
  return Object.freeze({
    ...state,
    board: setValue(state.board, move.index, before.value),
    notes: withNotes(restored, move.index, before.notes),
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
  let notes = state.notes;
  let cellNotes = emptyNotes;
  if (move.kind === 'place' || move.kind === 'place-prune') {
    board = setValue(board, move.index, move.digit);
    if (move.kind === 'place-prune') {
      notes = applyPrune(notes, pruneTargets(notes, move.index, move.digit), move.digit);
    }
  } else if (move.kind === 'erase') {
    board = setValue(board, move.index, null);
  } else if (move.kind === 'toggle-note') {
    cellNotes = toggleNote(current, move.digit);
  }
  return Object.freeze({
    ...state,
    board,
    notes: withNotes(notes, move.index, cellNotes),
    cursor: state.cursor + 1,
  });
}
