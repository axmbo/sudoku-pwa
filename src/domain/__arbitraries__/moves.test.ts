import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { canRedo, getGameStatus, type Game } from '../game';
import {
  anyGame,
  anyGameAction,
  applyGameAction,
  cellGameAction,
  nearlyCompleteGame,
  prunedGame,
  swapPairGame,
} from './moves';

const emptyCount = (cells: readonly { value: unknown }[]): number =>
  cells.filter((c) => c.value === null).length;

describe('moves (geradores de jogo)', () => {
  it('INV: anyGame tem de 10 a 70 células vazias e nunca nasce vencido', () => {
    fc.assert(
      fc.property(anyGame, (game) => {
        const empties = emptyCount(game.board.cells);
        expect(empties).toBeGreaterThanOrEqual(10);
        expect(empties).toBeLessThanOrEqual(70);
        expect(getGameStatus(game)).toBe('incomplete');
      }),
      { seed: 20260401 },
    );
  });

  it('INV: nearlyCompleteGame tem de 1 a 4 células vazias, exatamente as indicadas', () => {
    fc.assert(
      fc.property(nearlyCompleteGame, ({ game, empties }) => {
        expect(empties.length).toBeGreaterThanOrEqual(1);
        expect(empties.length).toBeLessThanOrEqual(4);
        const found = game.board.cells.flatMap((c, i) => (c.value === null ? [i] : []));
        expect([...found].sort((a, b) => a - b)).toEqual([...empties].sort((a, b) => a - b));
      }),
      { seed: 20260402 },
    );
  });

  it('INV: swapPairGame só tem vazias as células com 1 ou 2 na solução', () => {
    const solution = swapPairGame.puzzle.solution.flat();
    swapPairGame.board.cells.forEach((cell, i) => {
      expect(cell.value === null).toBe(solution[i] === 1 || solution[i] === 2);
    });
  });

  it('INV: anyGameAction cobre as sete operações, recusas, sem efeito, undo e redo aceitos', () => {
    const [game] = fc.sample(anyGame, { numRuns: 1, seed: 20260403 });
    const actions = fc.sample(anyGameAction, { numRuns: 600, seed: 20260404 });
    expect(new Set(actions.map((a) => a.op))).toEqual(
      new Set(['place', 'place-prune', 'erase', 'toggle', 'clear', 'undo', 'redo']),
    );
    let current = game as Game;
    let refused = 0;
    let noEffect = 0;
    let undone = 0;
    let redone = 0;
    for (const action of actions) {
      const result = applyGameAction(current, action);
      if (!result.ok) {
        refused += 1;
        continue;
      }
      if (result.value === current) noEffect += 1;
      if (action.op === 'undo') undone += 1;
      if (action.op === 'redo') redone += 1;
      current = result.value;
    }
    expect(refused).toBeGreaterThan(20);
    expect(noEffect).toBeGreaterThan(0);
    expect(undone).toBeGreaterThan(0);
    expect(redone).toBeGreaterThan(0);
    expect(typeof canRedo(current)).toBe('boolean');
  });

  it('INV: anyGameAction gera a operação place-prune em sequências a partir de anyGame', () => {
    const cases = fc.sample(
      fc.tuple(anyGame, fc.array(anyGameAction, { minLength: 40, maxLength: 80 })),
      { numRuns: 100, seed: 20261127 },
    );
    let withPrune = 0;
    for (const [start, actions] of cases) {
      const end = actions.reduce((game, action) => {
        const next = applyGameAction(game, action);
        return next.ok ? next.value : game;
      }, start);
      for (const entry of end.history) {
        if (entry.move.kind === 'place-prune') withPrune += 1;
      }
    }
    expect(withPrune).toBeGreaterThan(0);
  });

  it('INV: prunedGame sempre tem place-prune com poda real (pruned não vazio) no histórico', () => {
    fc.assert(
      fc.property(prunedGame, (game) => {
        expect(
          game.history.some(
            (entry) =>
              entry.move.kind === 'place-prune' &&
              entry.pruned !== undefined &&
              entry.pruned.length > 0,
          ),
        ).toBe(true);
      }),
      { seed: 20261129 },
    );
  });

  it('INV: cellGameAction nunca gera undo nem redo', () => {
    const actions = fc.sample(cellGameAction, { numRuns: 300, seed: 20260405 });
    expect(actions.some((a) => a.op === 'undo' || a.op === 'redo')).toBe(false);
  });
});
