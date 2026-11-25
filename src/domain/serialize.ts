import type { CellState, Grid } from './board';
import { isDigit, type Digit } from './digit';
import { createGame, type Game } from './game';
import type { CellMemo, HistoryEntry, Move } from './history';
import { emptyNotes, toggleNote, type Notes } from './notes';
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

function isIntegerIn(value: unknown, min: number, max: number): boolean {
  return Number.isInteger(value) && (value as number) >= min && (value as number) <= max;
}

/** Jogada bem formada: lista de 3 inteiros, tipo 0..3, índice 0..80 e dígito 0 em erase/clear-notes. */
function isMoveTuple(tuple: unknown): boolean {
  return (
    Array.isArray(tuple) &&
    tuple.length === 3 &&
    isIntegerIn(tuple[0], 0, MOVE_KINDS.length - 1) &&
    isIntegerIn(tuple[1], 0, 80) &&
    Number.isInteger(tuple[2]) &&
    (tuple[0] === 0 || tuple[0] === 2 || tuple[2] === 0)
  );
}

/** Anotações bem formadas: 81 máscaras inteiras em 0..511. */
function isNotesList(notes: unknown): notes is readonly unknown[] {
  return Array.isArray(notes) && notes.length === 81 && notes.every((m) => isIntegerIn(m, 0, 511));
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

type MoveTuple = readonly [number, number, number];

/** Estado mutável local do replay; só existe dentro de `replay` e é congelado no fim. */
interface Scratch {
  readonly cells: CellState[];
  readonly notes: Notes[];
  readonly history: HistoryEntry[];
}

/** Aplica a jogada ao estado local; `false` se o jogo a recusaria ou ela não tiver efeito. */
function applyTuple(scratch: Scratch, [code, index, digit]: MoveTuple): boolean {
  const cell = scratch.cells[index] as CellState;
  const current = scratch.notes[index] as Notes;
  const kind = MOVE_KINDS[code] as Move['kind'];
  const needsDigit = kind === 'place' || kind === 'toggle-note';
  if (cell.given || (needsDigit && !isDigit(digit))) {
    return false;
  }
  if (kind === 'place') {
    if (cell.value === digit) {
      return false;
    }
    scratch.cells[index] = Object.freeze({ value: digit as Digit, given: false });
    scratch.notes[index] = emptyNotes;
    scratch.history.push({
      move: { kind, index, digit: digit as Digit },
      before: memo(cell, current),
    });
  } else if (kind === 'erase') {
    if (cell.value === null) {
      return false;
    }
    scratch.cells[index] = Object.freeze({ value: null, given: false });
    scratch.notes[index] = emptyNotes;
    scratch.history.push({ move: { kind, index }, before: memo(cell, current) });
  } else if (kind === 'toggle-note') {
    if (cell.value !== null) {
      return false;
    }
    scratch.notes[index] = toggleNote(current, digit as Digit);
    scratch.history.push({
      move: { kind, index, digit: digit as Digit },
      before: memo(cell, current),
    });
  } else {
    if (current.length === 0) {
      return false;
    }
    scratch.notes[index] = emptyNotes;
    scratch.history.push({ move: { kind, index }, before: memo(cell, current) });
  }
  return true;
}

function memo(cell: CellState, notes: Notes): CellMemo {
  return { value: cell.value, notes };
}

/** Partida cheia e igual à solução. */
function isWon(cells: readonly CellState[], solution: readonly (Digit | null)[]): boolean {
  return cells.every((cell, i) => cell.value === solution[i]);
}

/** Reaplica todas as jogadas em arrays locais e recua até `target`, reconstruindo `before`. */
function replay(
  start: Game,
  moves: readonly MoveTuple[],
  target: number,
): Result<Game, DeserializeRefusal> {
  const solution = start.puzzle.solution.flat();
  const scratch: Scratch = {
    cells: [...start.board.cells],
    notes: [...start.notes],
    history: [],
  };
  for (const tuple of moves) {
    if (isWon(scratch.cells, solution) || !applyTuple(scratch, tuple)) {
      return INCONSISTENT;
    }
  }
  if (target < moves.length && isWon(scratch.cells, solution)) {
    return INCONSISTENT;
  }
  for (let i = moves.length - 1; i >= target; i--) {
    const { move, before } = scratch.history[i] as HistoryEntry;
    scratch.cells[move.index] = Object.freeze({ value: before.value, given: false });
    scratch.notes[move.index] = before.notes;
  }
  return {
    ok: true,
    value: Object.freeze({
      puzzle: start.puzzle,
      board: Object.freeze({ cells: Object.freeze(scratch.cells) }),
      notes: Object.freeze(scratch.notes),
      history: Object.freeze(scratch.history),
      cursor: target,
    }),
  };
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
    typeof puzzle.difficulty !== 'string' ||
    typeof puzzle.seed !== 'string' ||
    !Number.isInteger(puzzle.generatorVersion) ||
    parseGrid(values) === null ||
    !isNotesList(notes) ||
    !Array.isArray(moves) ||
    !moves.every(isMoveTuple) ||
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
  const replayed = replay(created.value, moves as MoveTuple[], target);
  return replayed.ok && sameState(replayed.value, values as string, notes)
    ? replayed
    : INCONSISTENT;
}
