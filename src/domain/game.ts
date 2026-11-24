import { createBoard, getConflicts, type Board } from './board';
import type { CellConflict } from './conflicts';
import type { HistoryEntry } from './history';
import { cellIndex, type Index } from './units';
import { emptyNotes, type Notes } from './notes';
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
