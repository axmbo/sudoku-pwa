import type { Grid } from './board';
import {
  gameClearNotes,
  gameErase,
  gamePlace,
  gameToggleNote,
  gameUndo,
  createGame,
  type Game,
} from './game';
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

const MOVE_KINDS: readonly Move['kind'][] = ['place', 'erase', 'toggle-note', 'clear-notes'];

function parseGrid(text: unknown): (number | null)[][] | null {
  if (typeof text !== 'string' || !/^[.1-9]{81}$/.test(text)) {
    return null;
  }
  const cells = [...text].map((char) => (char === '.' ? null : Number(char)));
  return Array.from({ length: 9 }, (_row, r) => cells.slice(r * 9, r * 9 + 9));
}

function parseEnvelope(input: unknown): unknown {
  try {
    return typeof input === 'string' ? JSON.parse(input) : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const INCONSISTENT = Object.freeze({ ok: false, reason: 'inconsistent-data' } as const);

/** Valores e anotações gravados batem com os do jogo reconstruído. */
function sameState(game: Game, values: string, notes: readonly unknown[]): boolean {
  const rebuilt = game.notes.map(notesMask);
  return (
    values === gridText(game.board.cells.map((cell) => cell.value)) &&
    notes.length === rebuilt.length &&
    notes.every((mask, i) => mask === rebuilt[i])
  );
}

function applyTuple(game: Game, tuple: unknown): Result<Game, DeserializeRefusal> {
  const [code, index, digit] = tuple as readonly [number, number, number];
  const row = Math.floor(index / 9);
  const col = index % 9;
  const kind = MOVE_KINDS[code];
  const result =
    kind === 'place'
      ? gamePlace(game, row, col, digit)
      : kind === 'erase'
        ? gameErase(game, row, col)
        : kind === 'toggle-note'
          ? gameToggleNote(game, row, col, digit)
          : gameClearNotes(game, row, col);
  return result.ok ? result : INCONSISTENT;
}

/** Reaplica todas as jogadas e recua até `target`, reconstruindo `before` e os refazíveis. */
function replay(
  start: Game,
  moves: readonly unknown[],
  target: number,
): Result<Game, DeserializeRefusal> {
  let game = start;
  for (const tuple of moves) {
    const applied = applyTuple(game, tuple);
    if (!applied.ok) {
      return applied;
    }
    game = applied.value;
  }
  for (let i = moves.length; i > target; i--) {
    const undone = gameUndo(game);
    if (!undone.ok) {
      return INCONSISTENT;
    }
    game = undone.value;
  }
  return { ok: true, value: game };
}

/** Lê a partida serializada, reaplicando as jogadas para reconstruir o histórico. */
export function deserializeGame(input: unknown): Result<Game, DeserializeRefusal> {
  const envelope = parseEnvelope(input);
  if (!isRecord(envelope)) {
    return { ok: false, reason: 'invalid-data' };
  }
  const { schemaVersion } = envelope;
  if (!Number.isInteger(schemaVersion) || (schemaVersion as number) < 1) {
    return { ok: false, reason: 'invalid-data' };
  }
  if ((schemaVersion as number) > GAME_FORMAT_VERSION) {
    return { ok: false, reason: 'future-version' };
  }
  if (!isRecord(envelope.data)) {
    return { ok: false, reason: 'invalid-data' };
  }
  const { puzzle, values, notes, moves, cursor } = envelope.data;
  const givens = isRecord(puzzle) ? parseGrid(puzzle.givens) : null;
  const solution = isRecord(puzzle) ? parseGrid(puzzle.solution) : null;
  if (
    !isRecord(puzzle) ||
    givens === null ||
    solution === null ||
    typeof values !== 'string' ||
    !Array.isArray(notes) ||
    !Array.isArray(moves) ||
    !Number.isInteger(cursor)
  ) {
    return { ok: false, reason: 'invalid-data' };
  }
  const target = cursor as number;
  if (target < 0 || target > moves.length) {
    return INCONSISTENT;
  }
  const created = createGame({ ...puzzle, givens, solution });
  if (!created.ok) {
    return INCONSISTENT;
  }
  const replayed = replay(created.value, moves, target);
  return replayed.ok && sameState(replayed.value, values, notes) ? replayed : INCONSISTENT;
}
