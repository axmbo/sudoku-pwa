import type { Grid } from './board';
import type { Game } from './game';
import type { Move } from './history';
import type { Notes } from './notes';
import type { Result } from './result';

/** Versão do formato serializado da partida (ADR 0004). */
export const GAME_FORMAT_VERSION = 1;

const MOVE_KIND_CODE: Record<Move['kind'], number> = {
  place: 0,
  erase: 1,
  'toggle-note': 2,
  'clear-notes': 3,
};

function gridText(cells: readonly (number | null)[]): string {
  return cells.map((value) => (value === null ? '.' : String(value))).join('');
}

function notesMask(notes: Notes): number {
  return notes.reduce((mask, digit) => mask | (1 << (digit - 1)), 0);
}

function moveTuple(move: Move): readonly [number, number, number] {
  return [MOVE_KIND_CODE[move.kind], move.index, 'digit' in move ? move.digit : 0];
}

/** Serializa a partida em JSON compacto, com chaves em ordem fixa (formato v1). */
export function serializeGame(game: Game): string {
  const { puzzle } = game;
  return JSON.stringify({
    schemaVersion: GAME_FORMAT_VERSION,
    data: {
      puzzle: {
        givens: gridText((puzzle.givens as Grid).flat()),
        solution: gridText((puzzle.solution as Grid).flat()),
        difficulty: puzzle.difficulty,
        seed: puzzle.seed,
        generatorVersion: puzzle.generatorVersion,
      },
      values: gridText(game.board.cells.map((cell) => cell.value)),
      notes: game.notes.map(notesMask),
      moves: game.history.map((entry) => moveTuple(entry.move)),
      cursor: game.cursor,
    },
  });
}

export type DeserializeRefusal = 'invalid-data' | 'future-version' | 'inconsistent-data';

/** Lê a partida serializada; por ora só recusa tudo como `invalid-data` (T08, em construção). */
export function deserializeGame(input: unknown): Result<Game, DeserializeRefusal> {
  void input;
  return { ok: false, reason: 'invalid-data' };
}
