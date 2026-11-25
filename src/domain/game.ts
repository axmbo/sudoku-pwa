import {
  cellAt,
  createBoard,
  eraseValue,
  getConflicts,
  isCoordinate,
  placeValue,
  type Board,
  type EraseRefusal,
  type PlaceRefusal,
} from './board';
import type { CellConflict } from './conflicts';
import { redo, undo, type HistoryEntry } from './history';
import { cellIndex, type Index } from './units';
import { isDigit, type Digit } from './digit';
import { emptyNotes, toggleNote, type Notes } from './notes';
import { createPuzzle, type Puzzle, type PuzzleRefusal } from './puzzle';
import type { Result } from './result';

/** Partida: puzzle, tabuleiro atual, anotações por célula e histórico com cursor. */
export interface Game {
  readonly puzzle: Puzzle;
  readonly board: Board;
  readonly notes: readonly Notes[];
  readonly history: readonly HistoryEntry[];
  readonly cursor: number;
}

export type NoteRefusal = 'cell-not-found' | 'invalid-value' | 'cell-is-given' | 'cell-has-value';
export type ClearNotesRefusal = 'cell-not-found' | 'cell-is-given';

export type UndoRefusal = 'nothing-to-undo';
export type RedoRefusal = 'nothing-to-redo';

export type GameStatus = 'incomplete' | 'full-incorrect' | 'won';

export function createGame(input: unknown): Result<Game, PuzzleRefusal> {
  const puzzle = createPuzzle(input);
  if (!puzzle.ok) {
    return puzzle;
  }
  const board = createBoard(puzzle.value.givens) as { readonly ok: true; readonly value: Board };
  return {
    ok: true,
    value: Object.freeze({
      puzzle: puzzle.value,
      board: board.value,
      notes: Object.freeze(Array.from({ length: 81 }, () => emptyNotes)),
      history: Object.freeze([]),
      cursor: 0,
    }),
  };
}

/** Conflitos da partida, derivados do tabuleiro atual. */
export function getGameConflicts(game: Game): readonly CellConflict[] {
  return getConflicts(game.board);
}

export function canUndo(game: Game): boolean {
  return game.cursor > 0;
}

export function canRedo(game: Game): boolean {
  return game.cursor < game.history.length;
}

export function notesAt(game: Game, row: Index, col: Index): Notes {
  return game.notes[cellIndex(row, col)] as Notes;
}

/** Alterna a anotação `digit` na célula (row, col). */
export function gameToggleNote(
  game: Game,
  row: unknown,
  col: unknown,
  digit: unknown,
): Result<Game, NoteRefusal> {
  if (!isCoordinate(row) || !isCoordinate(col)) {
    return { ok: false, reason: 'cell-not-found' };
  }
  if (!isDigit(digit)) {
    return { ok: false, reason: 'invalid-value' };
  }
  const cell = cellAt(game.board, row, col);
  if (cell.given) {
    return { ok: false, reason: 'cell-is-given' };
  }
  if (cell.value !== null) {
    return { ok: false, reason: 'cell-has-value' };
  }
  const index = cellIndex(row, col);
  const current = game.notes[index] as Notes;
  const entry: HistoryEntry = {
    move: { kind: 'toggle-note', index, digit },
    before: { value: cell.value, notes: current },
  };
  return { ok: true, value: commit(game, entry, toggleNote(current, digit)) };
}

/** Esvazia as anotações da célula (row, col); sem anotações, não há efeito. */
export function gameClearNotes(
  game: Game,
  row: unknown,
  col: unknown,
): Result<Game, ClearNotesRefusal> {
  if (!isCoordinate(row) || !isCoordinate(col)) {
    return { ok: false, reason: 'cell-not-found' };
  }
  const cell = cellAt(game.board, row, col);
  if (cell.given) {
    return { ok: false, reason: 'cell-is-given' };
  }
  const index = cellIndex(row, col);
  const current = game.notes[index] as Notes;
  if (current.length === 0) {
    return { ok: true, value: game };
  }
  const entry: HistoryEntry = {
    move: { kind: 'clear-notes', index },
    before: { value: cell.value, notes: current },
  };
  return { ok: true, value: commit(game, entry, emptyNotes) };
}

/** Coloca `digit` na célula (row, col), limpando as anotações dela; mesmo valor não tem efeito. */
export function gamePlace(
  game: Game,
  row: unknown,
  col: unknown,
  digit: unknown,
): Result<Game, PlaceRefusal> {
  const placed = placeValue(game.board, row, col, digit);
  if (!placed.ok) {
    return placed;
  }
  const r = row as Index;
  const c = col as Index;
  const cell = cellAt(game.board, r, c);
  if (cell.value === digit) {
    return { ok: true, value: game };
  }
  const index = cellIndex(r, c);
  const entry: HistoryEntry = {
    move: { kind: 'place', index, digit: digit as Digit },
    before: { value: cell.value, notes: game.notes[index] as Notes },
  };
  return { ok: true, value: commit(game, entry, emptyNotes, placed.value) };
}

/** Apaga o valor da célula (row, col), limpando as anotações dela; célula vazia não tem efeito. */
export function gameErase(game: Game, row: unknown, col: unknown): Result<Game, EraseRefusal> {
  const erased = eraseValue(game.board, row, col);
  if (!erased.ok) {
    return erased;
  }
  const r = row as Index;
  const c = col as Index;
  const cell = cellAt(game.board, r, c);
  if (cell.value === null) {
    return { ok: true, value: game };
  }
  const index = cellIndex(r, c);
  const entry: HistoryEntry = {
    move: { kind: 'erase', index },
    before: { value: cell.value, notes: game.notes[index] as Notes },
  };
  return { ok: true, value: commit(game, entry, emptyNotes, erased.value) };
}

/** Desfaz a última jogada, restaurando valor e anotações da célula. */
export function gameUndo(game: Game): Result<Game, UndoRefusal> {
  const undone = undo(game);
  return undone === null ? { ok: false, reason: 'nothing-to-undo' } : { ok: true, value: undone };
}

/** Refaz a jogada desfeita mais recentemente. */
export function gameRedo(game: Game): Result<Game, RedoRefusal> {
  const redone = redo(game);
  return redone === null ? { ok: false, reason: 'nothing-to-redo' } : { ok: true, value: redone };
}

/** Jogada nova: grava tabuleiro e anotações da célula, trunca o histórico em `cursor` e acrescenta a entrada. */
function commit(
  game: Game,
  entry: HistoryEntry,
  cellNotes: Notes,
  board: Board = game.board,
): Game {
  const notes = game.notes.map((existing, i) => (i === entry.move.index ? cellNotes : existing));
  return Object.freeze({
    ...game,
    board,
    notes: Object.freeze(notes),
    history: Object.freeze([...game.history.slice(0, game.cursor), entry]),
    cursor: game.cursor + 1,
  });
}

/** Estado derivado da partida: vazia ⇒ incompleta; cheia ⇒ vitória só se igual à solução. */
export function getGameStatus(game: Game): GameStatus {
  const { cells } = game.board;
  if (cells.some((cell) => cell.value === null)) {
    return 'incomplete';
  }
  const solution = game.puzzle.solution;
  const matches = cells.every(
    (cell, index) => cell.value === solution[Math.floor(index / 9)]?.[index % 9],
  );
  return matches ? 'won' : 'full-incorrect';
}
