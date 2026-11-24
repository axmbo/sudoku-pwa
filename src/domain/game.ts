import { cellAt, createBoard, getConflicts, isCoordinate, type Board } from './board';
import type { CellConflict } from './conflicts';
import type { HistoryEntry } from './history';
import { cellIndex, type Index } from './units';
import { isDigit } from './digit';
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
  if (cellAt(game.board, row, col).given) {
    return { ok: false, reason: 'cell-is-given' };
  }
  if (cellAt(game.board, row, col).value !== null) {
    return { ok: false, reason: 'cell-has-value' };
  }
  const index = cellIndex(row, col);
  const current = game.notes[index] as Notes;
  const entry: HistoryEntry = {
    move: { kind: 'toggle-note', index, digit },
    before: { value: cellAt(game.board, row, col).value, notes: current },
  };
  return { ok: true, value: commit(game, entry, toggleNote(current, digit)) };
}

/** Esvazia as anotações da célula (row, col); sem anotações, não há efeito. */
export function gameClearNotes(
  game: Game,
  row: unknown,
  col: Index,
): Result<Game, ClearNotesRefusal> {
  if (!isCoordinate(row) || !isCoordinate(col)) {
    return { ok: false, reason: 'cell-not-found' };
  }
  if (cellAt(game.board, row, col).given) {
    return { ok: false, reason: 'cell-is-given' };
  }
  const index = cellIndex(row, col);
  const current = game.notes[index] as Notes;
  if (current.length === 0) {
    return { ok: true, value: game };
  }
  const entry: HistoryEntry = {
    move: { kind: 'clear-notes', index },
    before: { value: cellAt(game.board, row, col).value, notes: current },
  };
  return { ok: true, value: commit(game, entry, emptyNotes) };
}

/** Jogada nova: grava as anotações da célula, trunca o histórico em `cursor` e acrescenta a entrada. */
function commit(game: Game, entry: HistoryEntry, cellNotes: Notes): Game {
  const notes = game.notes.map((existing, i) => (i === entry.move.index ? cellNotes : existing));
  return Object.freeze({
    ...game,
    notes: Object.freeze(notes),
    history: Object.freeze([...game.history.slice(0, game.cursor), entry]),
    cursor: game.cursor + 1,
  });
}
