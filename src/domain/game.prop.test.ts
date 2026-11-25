import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { getConflicts } from './board';
import {
  canRedo,
  canUndo,
  gamePlace,
  gameRedo,
  gameUndo,
  getGameConflicts,
  getGameStatus,
  notesAt,
  type Game,
} from './game';
import { solutionGrid } from './__arbitraries__/puzzle';
import {
  anyGame,
  anyGameAction,
  applyGameAction,
  cellGameAction,
  nearlyCompleteGame,
  swapPairGame,
  type GameAction,
} from './__arbitraries__/moves';

/** Oráculo independente: grade cheia, sem conflito e igual à solução. */
const solutionFlat = solutionGrid.flat();

function oracleWon(game: Game): boolean {
  return (
    game.board.cells.every((c, i) => c.value !== null && c.value === solutionFlat[i]) &&
    getConflicts(game.board).length === 0
  );
}

/** Notas de toda célula em ordem estritamente crescente (crescentes e únicas). */
function expectNotesSorted(game: Game): void {
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const notes = notesAt(game, row as never, col as never);
      notes.forEach((d, i) => {
        if (i > 0) expect(d).toBeGreaterThan(notes[i - 1] as number);
      });
    }
  }
}

/** Aplica as ações e devolve todos os estados visitados (o primeiro é o inicial). */
function play(initial: Game, actions: readonly GameAction[]): Game[] {
  const visited = [initial];
  let current = initial;
  for (const action of actions) {
    const result = applyGameAction(current, action);
    if (result.ok) {
      current = result.value;
      visited.push(current);
    }
  }
  return visited;
}

const gameAndActions = fc.tuple(anyGame, fc.array(anyGameAction, { maxLength: 80 }));

/** Campos que desfazer/refazer devolvem (o histórico pode diferir se houve refazível truncado). */
function sameState(a: Game, b: Game): void {
  expect(a.board).toEqual(b.board);
  expect(a.notes).toEqual(b.notes);
  expect(a.cursor).toBe(b.cursor);
  expect(a.puzzle).toBe(b.puzzle);
}

describe('game (propriedades)', () => {
  it('CA-004-16: desfazer tudo volta ao inicial e refazer tudo reproduz o final (500 jogadas)', () => {
    fc.assert(
      fc.property(
        anyGame,
        fc.array(cellGameAction, { minLength: 500, maxLength: 500 }),
        (initial, actions) => {
          let current = initial;
          let applied = 0;
          for (const action of actions) {
            const result = applyGameAction(current, action);
            if (result.ok && result.value !== current && getGameStatus(result.value) !== 'won') {
              current = result.value;
              applied += 1;
              expectNotesSorted(current);
            }
          }
          expect(current.history.length).toBe(applied);
          expect(current.cursor).toBe(applied);
          const final = current;
          for (let i = 0; i < applied; i += 1) {
            const undone = gameUndo(current);
            expect(undone.ok).toBe(true);
            current = (undone as { value: Game }).value;
            expectNotesSorted(current);
          }
          sameState(current, { ...initial, cursor: 0 } as Game);
          expect(current.cursor).toBe(0);
          expect(canUndo(current)).toBe(false);
          for (let i = 0; i < applied; i += 1) {
            const redone = gameRedo(current);
            expect(redone.ok).toBe(true);
            current = (redone as { value: Game }).value;
          }
          expect(current).toEqual(final);
          expect(canRedo(current)).toBe(false);
        },
      ),
      { seed: 20260411, numRuns: 20 },
    );
  });

  it('CA-004-17: desfazer a jogada aceita devolve o estado anterior; refazer o desfeito devolve o atual', () => {
    fc.assert(
      fc.property(
        gameAndActions,
        fc.array(cellGameAction, { minLength: 1, maxLength: 1 }),
        ([initial, actions], [move]) => {
          for (const g of play(initial, actions)) {
            expectNotesSorted(g);
            const applied = applyGameAction(g, move as GameAction);
            if (applied.ok && applied.value !== g && getGameStatus(applied.value) !== 'won') {
              const undone = gameUndo(applied.value);
              expect(undone.ok).toBe(true);
              const back = (undone as { value: Game }).value;
              sameState(back, g);
              expect(back.history.slice(0, back.cursor)).toEqual(g.history.slice(0, g.cursor));
              expect(canRedo(back)).toBe(true);
            }
            if (canUndo(g) && getGameStatus(g) !== 'won') {
              const undone = gameUndo(g);
              expect(undone.ok).toBe(true);
              const redone = gameRedo((undone as { value: Game }).value);
              expect(redone).toEqual({ ok: true, value: g });
            }
          }
        },
      ),
      { seed: 20260412, numRuns: 100 },
    );
  });

  it('CA-004-23: jogada que vence encerra a partida (desfazer e refazer recusados, segue won)', () => {
    fc.assert(
      fc.property(nearlyCompleteGame, ({ game, empties }) => {
        let current = game;
        for (const index of empties) {
          const row = Math.floor(index / 9);
          const col = index % 9;
          const placed = gamePlace(current, row, col, solutionGrid.flat()[index]);
          expect(placed.ok).toBe(true);
          current = (placed as { value: Game }).value;
        }
        expect(getGameStatus(current)).toBe('won');
        expect(gameUndo(current)).toEqual({ ok: false, reason: 'game-over' });
        expect(gameRedo(current)).toEqual({ ok: false, reason: 'game-over' });
        expect(getGameStatus(current)).toBe('won');
      }),
      { seed: 20260413 },
    );
  });

  it('CA-004-18: recusa ou jogada sem efeito não altera o histórico nem o refazível', () => {
    fc.assert(
      fc.property(
        gameAndActions,
        fc.array(anyGameAction, { minLength: 1, maxLength: 20 }),
        ([initial, actions], probes) => {
          for (const g of play(initial, actions)) {
            for (const probe of probes) {
              const snapshot = JSON.stringify(g);
              const result = applyGameAction(g, probe);
              expect(JSON.stringify(g)).toBe(snapshot);
              if (result.ok && result.value === g) {
                expect(result.value.history).toBe(g.history);
                expect(canRedo(result.value)).toBe(canRedo(g));
              }
              if (result.ok && result.value !== g && probe.op !== 'undo' && probe.op !== 'redo') {
                // jogada nova de verdade: trunca o refazível e acrescenta uma só entrada
                expect(result.value.history.length).toBe(g.cursor + 1);
                expect(canRedo(result.value)).toBe(false);
              }
            }
          }
        },
      ),
      { seed: 20260414, numRuns: 100 },
    );
  });

  it('CA-004-21: jogo incompleto, com todos os valores colocados corretos, nunca é won', () => {
    fc.assert(
      fc.property(anyGame, fc.infiniteStream(fc.nat()), (initial, picks) => {
        const empties = initial.board.cells.flatMap((c, i) => (c.value === null ? [i] : []));
        const skip = (picks.next().value as number) % empties.length;
        let current = initial;
        empties.forEach((index, n) => {
          if (n === skip) return;
          const row = Math.floor(index / 9);
          const col = index % 9;
          const placed = gamePlace(current, row, col, solutionGrid.flat()[index]);
          expect(placed.ok).toBe(true);
          current = (placed as { value: Game }).value;
          expect(getGameStatus(current)).toBe('incomplete');
        });
        expect(getGameStatus(current)).toBe('incomplete');
      }),
      { seed: 20260415 },
    );
  });

  // Timeout explícito: ~1,1 s local, mas a instrumentação do Stryker no runner do CI (job mutation)
  // estoura os 5 s padrão no dry run.
  it('CA-004-22: won se e só se a grade está cheia, sem conflito e igual à solução', () => {
    const fillAll = (initial: Game, values: readonly number[]): void => {
      const empties = initial.board.cells.flatMap((c, i) => (c.value === null ? [i] : []));
      let current = initial;
      empties.forEach((index, n) => {
        const placed = gamePlace(current, Math.floor(index / 9), index % 9, values[n]);
        expect(placed.ok).toBe(true);
        current = (placed as { value: Game }).value;
        // status e conflitos calculados uma vez por passo (custo da propriedade)
        const won = getGameStatus(current) === 'won';
        const conflicts = getGameConflicts(current);
        expect(won).toBe(oracleWon(current));
        if (won) expect(conflicts).toEqual([]);
        if (conflicts.length > 0) expect(won).toBe(false);
      });
      expect(getGameStatus(current) === 'won').toBe(oracleWon(current));
    };
    const flat = solutionGrid.flat();
    // quase completos: valor certo ou perturbado por célula
    fc.assert(
      fc.property(
        nearlyCompleteGame,
        fc.array(fc.option(fc.integer({ min: 1, max: 9 })), { minLength: 4, maxLength: 4 }),
        ({ game, empties }, tweaks) => {
          fillAll(
            game,
            empties.map((index, n) => tweaks[n] ?? (flat[index] as number)),
          );
        },
      ),
      { seed: 20260416 },
    );
    // grade cheia sem conflito e diferente da solução (troca 1 por 2) e parciais dela
    fc.assert(
      fc.property(fc.array(fc.boolean(), { minLength: 18, maxLength: 18 }), (swaps) => {
        const empties = swapPairGame.board.cells.flatMap((c, i) => (c.value === null ? [i] : []));
        fillAll(
          swapPairGame,
          empties.map((index, n) =>
            swaps[n] ? (flat[index] === 1 ? 2 : 1) : (flat[index] as number),
          ),
        );
      }),
      { seed: 20260417 },
    );
    const full = swapPairGame.board.cells.flatMap((c, i) => (c.value === null ? [i] : []));
    let current: Game = swapPairGame;
    for (const index of full) {
      current = (
        gamePlace(current, Math.floor(index / 9), index % 9, flat[index] === 1 ? 2 : 1) as {
          value: Game;
        }
      ).value;
    }
    expect(getConflicts(current.board)).toEqual([]);
    expect(getGameStatus(current)).toBe('full-incorrect');
  }, 20_000);

  it('INV: conflito é derivado: getGameConflicts(g) = getConflicts(g.board) em todo jogo gerado', () => {
    fc.assert(
      fc.property(gameAndActions, ([initial, actions]) => {
        for (const g of play(initial, actions)) {
          expect(getGameConflicts(g)).toEqual(getConflicts(g.board));
        }
      }),
      { seed: 20260418, numRuns: 100 },
    );
  });

  it('CA-004-24: puzzle e pistas ficam inalterados após qualquer sequência de jogadas, undo e redo', () => {
    fc.assert(
      fc.property(gameAndActions, ([initial, actions]) => {
        for (const g of play(initial, actions)) {
          expect(g.puzzle).toBe(initial.puzzle);
          g.board.cells.forEach((cell, i) => {
            const given = initial.board.cells[i] as typeof cell;
            expect(cell.given).toBe(given.given);
            if (given.given) expect(cell.value).toBe(given.value);
          });
        }
      }),
      { seed: 20260419, numRuns: 100 },
    );
  });
});
