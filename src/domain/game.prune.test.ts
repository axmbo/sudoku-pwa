import { describe, expect, it } from 'vitest';
import type { Grid } from './board';
import type { Digit } from './digit';
import { solutionGrid, validPuzzleInput } from './__arbitraries__/puzzle';
import {
  canRedo,
  canUndo,
  createGame,
  gamePlace,
  gamePlaceAndPrune,
  gameRedo,
  gameToggleNote,
  gameUndo,
  notesAt,
  type Game,
} from './game';
import type { Index } from './units';

/**
 * Fixture: solução com 7 células vazias. Alvo (4,4); vizinhas vazias: (4,0) linha,
 * (0,4) coluna, (3,3) caixa; não vizinhas vazias: (0,0) e (8,8). (1,1) não é vazia
 * (valor da solução); (4,1) é pista.
 */
const EMPTY_CELLS = new Set([36 + 4, 36, 4, 27 + 3, 0, 80]);

const gameWith = (empties: ReadonlySet<number>): Game => {
  const givens: Grid = solutionGrid.map((line, r) =>
    line.map((value, c) => (empties.has(r * 9 + c) ? null : (value as Digit))),
  );
  const created = createGame({ ...validPuzzleInput(), givens });
  if (!created.ok) throw new Error('fixture inválida');
  return created.value;
};

const toggle = (game: Game, row: number, col: number, digit: number): Game => {
  const result = gameToggleNote(game, row, col, digit);
  if (!result.ok) throw new Error(`fixture: toggle recusado (${result.reason})`);
  return result.value;
};

const ix = (n: number) => n as Index;

/** Partida com anotações: 7 nas vizinhas e nas não vizinhas, outros dígitos misturados. */
const noted = (): Game => {
  let game = gameWith(EMPTY_CELLS);
  game = toggle(game, 4, 0, 7);
  game = toggle(game, 4, 0, 2);
  game = toggle(game, 0, 4, 7);
  game = toggle(game, 3, 3, 7);
  game = toggle(game, 3, 3, 9);
  game = toggle(game, 0, 0, 7);
  game = toggle(game, 8, 8, 7);
  game = toggle(game, 4, 4, 7);
  game = toggle(game, 4, 4, 5);
  return game;
};

const ok = (result: { ok: boolean }): Game => {
  expect(result.ok).toBe(true);
  return (result as unknown as { value: Game }).value;
};

describe('game (place-prune)', () => {
  it('CA-005-43: coloca X e remove X só das vizinhas (linha, coluna, caixa) que o tinham', () => {
    // [símbolo novo: `gamePlaceAndPrune`]
    const game = noted();

    const next = ok(gamePlaceAndPrune(game, 4, 4, 7));

    expect(next.board.cells[40]?.value).toBe(7);
    expect(notesAt(next, ix(4), ix(0))).toEqual([2]);
    expect(notesAt(next, ix(0), ix(4))).toEqual([]);
    expect(notesAt(next, ix(3), ix(3))).toEqual([9]);
  });

  it('CA-005-43: anotações de não vizinhas e a limpeza da própria célula ficam como em gamePlace', () => {
    const game = noted();

    const next = ok(gamePlaceAndPrune(game, 4, 4, 7));

    expect(notesAt(next, ix(0), ix(0))).toEqual([7]);
    expect(notesAt(next, ix(8), ix(8))).toEqual([7]);
    expect(notesAt(next, ix(4), ix(4))).toEqual([]);
  });

  it('CA-005-43: sem vizinhas com X comporta-se como gamePlace (mesmo tabuleiro e anotações)', () => {
    const game = noted();

    const pruned = ok(gamePlaceAndPrune(game, 4, 4, 3));
    const plain = ok(gamePlace(game, 4, 4, 3));

    expect(pruned.board).toEqual(plain.board);
    expect(pruned.notes).toEqual(plain.notes);
    expect(pruned.history).toHaveLength(game.history.length + 1);
  });

  it('CA-005-43: colocar o valor que a célula já tem devolve o mesmo Game', () => {
    const placed = ok(gamePlaceAndPrune(noted(), 4, 4, 7));

    const again = gamePlaceAndPrune(placed, 4, 4, 7);

    expect(again.ok).toBe(true);
    if (!again.ok) return;
    expect(again.value).toBe(placed);
  });

  it('CA-005-43: recusa pista, valor inválido, coordenada inexistente e partida vencida', () => {
    const game = noted();

    expect(gamePlaceAndPrune(game, 4, 1, 7)).toEqual({ ok: false, reason: 'cell-is-given' });
    expect(gamePlaceAndPrune(game, 4, 4, 0)).toEqual({ ok: false, reason: 'invalid-value' });
    expect(gamePlaceAndPrune(game, 9, 4, 7)).toEqual({ ok: false, reason: 'cell-not-found' });
    const won = ok(gamePlace(gameWith(new Set([40])), 4, 4, solutionGrid[4]?.[4] as number));
    expect(gamePlaceAndPrune(won, 4, 4, 1)).toEqual({ ok: false, reason: 'game-over' });
  });

  it('CA-005-43: a jogada entra no histórico como uma só entrada', () => {
    const game = noted();

    const next = ok(gamePlaceAndPrune(game, 4, 4, 7));

    expect(next.history).toHaveLength(game.history.length + 1);
    expect(next.cursor).toBe(game.cursor + 1);
    expect(next.history[next.cursor - 1]?.move).toEqual({
      kind: 'place-prune',
      index: 40,
      digit: 7,
    });
  });

  it('CA-005-23: desfazer restaura valor, anotações da célula e as das vizinhas podadas, num só passo', () => {
    const game = noted();
    const next = ok(gamePlaceAndPrune(game, 4, 4, 7));

    const undone = gameUndo(next);

    expect(undone.ok).toBe(true);
    if (!undone.ok) return;
    expect(undone.value.board).toEqual(game.board);
    expect(undone.value.notes).toEqual(game.notes);
    expect(undone.value.cursor).toBe(game.cursor);
    expect(canUndo(undone.value)).toBe(true);
  });

  it('CA-005-24: refazer reaplica o valor e a poda', () => {
    const next = ok(gamePlaceAndPrune(noted(), 4, 4, 7));
    const undone = ok(gameUndo(next));

    const redone = gameRedo(undone);

    expect(canRedo(undone)).toBe(true);
    expect(redone.ok).toBe(true);
    if (!redone.ok) return;
    expect(redone.value.board).toEqual(next.board);
    expect(redone.value.notes).toEqual(next.notes);
    expect(redone.value.cursor).toBe(next.cursor);
  });
});
