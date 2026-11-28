import { describe, expect, it } from 'vitest';
import type { Grid } from './board';
import type { Digit } from './digit';
import { solutionGrid, validPuzzleInput } from './__arbitraries__/puzzle';
import {
  createGame,
  gamePlace,
  gamePlaceAndPrune,
  gameRedo,
  gameToggleNote,
  gameUndo,
  notesAt,
  type Game,
} from './game';
import { deserializeGame, serializeGame } from './serialize';
import type { Index } from './units';

/**
 * Fixture: solução com 6 células vazias. Alvo (4,4) = índice 40; vizinhas vazias: (4,0) = 36
 * linha, (0,4) = 4 coluna, (3,3) = 30 caixa; não vizinhas vazias: (0,0) e (8,8). (4,1) é pista.
 * Células vazias fora da lista acima: nenhuma.
 */
const EMPTY_CELLS = new Set([40, 36, 4, 30, 0, 80]);

const toggle = (game: Game, row: number, col: number, digit: number): Game => {
  const result = gameToggleNote(game, row, col, digit);
  if (!result.ok) throw new Error(`fixture: toggle recusado (${result.reason})`);
  return result.value;
};

/** Partida com anotações 7 nas vizinhas do alvo e fora delas, outros dígitos misturados. */
const noted = (): Game => {
  const givens: Grid = solutionGrid.map((line, r) =>
    line.map((value, c) => (EMPTY_CELLS.has(r * 9 + c) ? null : (value as Digit))),
  );
  const created = createGame({ ...validPuzzleInput(), givens });
  if (!created.ok) throw new Error('fixture inválida');
  let game = created.value;
  game = toggle(game, 4, 0, 7);
  game = toggle(game, 4, 0, 2);
  game = toggle(game, 0, 4, 7);
  game = toggle(game, 3, 3, 7);
  game = toggle(game, 3, 3, 9);
  game = toggle(game, 0, 0, 7);
  game = toggle(game, 8, 8, 7);
  game = toggle(game, 4, 4, 5);
  return game;
};

const pruned = (): Game => {
  const result = gamePlaceAndPrune(noted(), 4, 4, 7);
  if (!result.ok) throw new Error('fixture: place-prune recusado');
  return result.value;
};

type Envelope = { schemaVersion: number; data: Record<string, unknown> & { moves: unknown[][] } };
const envelopeOf = (game: Game): Envelope => JSON.parse(serializeGame(game)) as Envelope;

describe('serialize (place-prune)', () => {
  it('CA-005-43: partida com place-prune serializa e volta igual (histórico, anotações, cursor)', () => {
    const game = pruned();

    expect(deserializeGame(serializeGame(game))).toEqual({ ok: true, value: game });
  });

  it('CA-005-43: o JSON não ganha campo novo; a jogada vai como [4, índice, dígito]', () => {
    const env = envelopeOf(pruned());

    expect(Object.keys(env.data)).toEqual(['puzzle', 'values', 'notes', 'moves', 'cursor']);
    expect(env.data.moves.at(-1)).toEqual([4, 40, 7]);
    expect(serializeGame(pruned())).not.toContain('pruned');
  });

  it('CA-005-43: pruned é reconstruído pelo replay, igual ao do original', () => {
    const original = pruned();
    const read = deserializeGame(serializeGame(original));

    expect(read.ok).toBe(true);
    const entry = (read as { value: Game }).value.history.at(-1);
    expect(entry?.pruned?.map((p) => p.index)).toEqual([4, 30, 36]);
    expect(entry?.pruned).toEqual(original.history.at(-1)?.pruned);
  });

  it('CA-005-43: depois de ler, desfazer devolve o estado anterior à poda e refazer reaplica', () => {
    const before = noted();
    const readResult = deserializeGame(serializeGame(pruned()));
    expect(readResult.ok).toBe(true);
    const read = (readResult as { value: Game }).value;

    const undone = gameUndo(read);

    expect(undone).toEqual({
      ok: true,
      value: { ...before, history: pruned().history, cursor: 8 },
    });
    const back = (undone as { value: Game }).value;
    expect(notesAt(back, 4 as Index, 0 as Index)).toEqual([2, 7]);
    expect(gameRedo(back)).toEqual({ ok: true, value: read });
  });

  it('CA-005-43: anotações gravadas sem a poda não batem com o replay (inconsistent-data)', () => {
    const env = envelopeOf(pruned());
    (env.data.notes as number[])[36] = 66; // 2 e 7 em (4,0), como antes da poda

    expect(deserializeGame(JSON.stringify(env))).toEqual({
      ok: false,
      reason: 'inconsistent-data',
    });
  });

  it('INV: CA-005-43: place desfeito (refazível) lido do JSON deixa notes só com as 81 chaves de índice', () => {
    const placed = gamePlace(noted(), 4, 4, 7);
    expect(placed.ok).toBe(true);
    const undone = gameUndo((placed as { value: Game }).value);
    expect(undone.ok).toBe(true);

    const result = deserializeGame(serializeGame((undone as { value: Game }).value));

    expect(result.ok).toBe(true);
    const { notes } = (result as { value: Game }).value;
    expect(Object.keys(notes)).toHaveLength(81);
  });

  it('CA-005-43: place-prune em célula pista é inconsistent-data', () => {
    const env = envelopeOf(noted());
    env.data.moves.push([4, 37, 7]); // (4,1) é pista
    env.data.cursor = env.data.moves.length;

    expect(deserializeGame(JSON.stringify(env))).toEqual({
      ok: false,
      reason: 'inconsistent-data',
    });
  });

  it('CA-005-43: place-prune sem efeito (mesmo valor já colocado) é inconsistent-data', () => {
    const env = envelopeOf(pruned());
    env.data.moves.push([4, 40, 7]);
    env.data.cursor = env.data.moves.length;

    expect(deserializeGame(JSON.stringify(env))).toEqual({
      ok: false,
      reason: 'inconsistent-data',
    });
  });

  it('CA-005-43: place-prune com dígito 0 refazível é inconsistent-data', () => {
    const env = envelopeOf(noted());
    env.data.moves.push([4, 40, 0]);

    expect(deserializeGame(JSON.stringify(env))).toEqual({
      ok: false,
      reason: 'inconsistent-data',
    });
  });

  it('CA-005-43: place-prune com índice 81 é invalid-data', () => {
    const env = envelopeOf(noted());
    env.data.moves.push([4, 81, 7]);

    expect(deserializeGame(JSON.stringify(env))).toEqual({ ok: false, reason: 'invalid-data' });
  });
});
