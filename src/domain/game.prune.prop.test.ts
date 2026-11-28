import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { Grid } from './board';
import type { Digit } from './digit';
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
import { solutionGrid, validPuzzleInput } from './__arbitraries__/puzzle';
import { nearlyCompleteGame } from './__arbitraries__/moves';
import type { Index } from './units';

const PROP_TIMEOUT = 30_000;

/** Oráculo independente: as 20 vizinhas (linha, coluna, caixa) de uma célula. */
function peersOf(index: number): number[] {
  const row = Math.floor(index / 9);
  const col = index % 9;
  const result: number[] = [];
  for (let i = 0; i < 81; i += 1) {
    const r = Math.floor(i / 9);
    const c = i % 9;
    const sameBox =
      Math.floor(r / 3) === Math.floor(row / 3) && Math.floor(c / 3) === Math.floor(col / 3);
    if (i !== index && (r === row || c === col || sameBox)) result.push(i);
  }
  return result;
}

interface Case {
  readonly game: Game;
  readonly index: number;
  readonly digit: Digit;
  readonly peers: readonly number[];
}

const notesOf = (game: Game, index: number) =>
  notesAt(game, Math.floor(index / 9) as Index, (index % 9) as Index);

/**
 * Partida com anotações em que o alvo está vazio e ao menos uma vizinha vazia tem a anotação
 * `digit` (poda real); células vazias extras e anotações de ruído em qualquer vazia.
 */
const primedCase: fc.Arbitrary<Case> = fc
  .record({
    index: fc.integer({ min: 0, max: 80 }),
    digit: fc.integer({ min: 1, max: 9 }),
    extra: fc.uniqueArray(fc.integer({ min: 0, max: 80 }), { maxLength: 30 }),
    peerPick: fc.uniqueArray(fc.integer({ min: 0, max: 19 }), { minLength: 1, maxLength: 20 }),
    noise: fc.array(
      fc.record({ cell: fc.integer({ min: 0, max: 80 }), digit: fc.integer({ min: 1, max: 9 }) }),
      { maxLength: 40 },
    ),
  })
  .map(({ index, digit, extra, peerPick, noise }) => {
    const peers = peersOf(index);
    const primed = peerPick.map((i) => peers[i] as number);
    const empties = new Set<number>([index, ...extra, ...primed]);
    const givens: Grid = solutionGrid.map((line, r) =>
      line.map((value, c) => (empties.has(r * 9 + c) ? null : (value as Digit))),
    );
    const created = createGame({ ...validPuzzleInput(), givens });
    if (!created.ok) throw new Error(`gerador inválido: ${created.reason}`);
    let game = created.value;
    const toggles = [
      ...noise.filter((n) => empties.has(n.cell)),
      ...primed.map((cell) => ({ cell, digit })),
    ];
    for (const { cell, digit: d } of toggles) {
      const next = gameToggleNote(game, Math.floor(cell / 9), cell % 9, d);
      if (next.ok) game = next.value;
    }
    return { game, index, digit: digit as Digit, peers };
  });

function place(game: Game, index: number, digit: number): Game {
  const result = gamePlaceAndPrune(game, Math.floor(index / 9), index % 9, digit);
  if (!result.ok) throw new Error(`recusa inesperada: ${result.reason}`);
  return result.value;
}

describe('game (place-prune, propriedades)', () => {
  it(
    'CA-005-43: depois da poda nenhuma vizinha tem X; demais anotações e dígitos ficam intactos',
    () => {
      fc.assert(
        fc.property(primedCase, ({ game, index, digit, peers }) => {
          const next = place(game, index, digit);

          expect(next.board.cells[index]?.value).toBe(digit);
          expect(notesOf(next, index)).toEqual([]);
          for (let i = 0; i < 81; i += 1) {
            if (i === index) continue;
            const before = notesOf(game, i);
            const expected = peers.includes(i) ? before.filter((d) => d !== digit) : before;
            expect(notesOf(next, i)).toEqual(expected);
          }
          expect(next.history).toHaveLength(game.cursor + 1);
        }),
        { seed: 20261127, numRuns: 100 },
      );
    },
    PROP_TIMEOUT,
  );

  it(
    'CA-005-43: gamePlaceAndPrune com o valor já no lugar devolve o mesmo Game',
    () => {
      fc.assert(
        fc.property(primedCase, ({ game, index, digit }) => {
          const placed = place(game, index, digit);

          const again = gamePlaceAndPrune(placed, Math.floor(index / 9), index % 9, digit);

          expect(again.ok && again.value).toBe(placed);
        }),
        { seed: 20261128, numRuns: 100 },
      );
    },
    PROP_TIMEOUT,
  );

  it(
    'CA-005-23: undo ∘ gamePlaceAndPrune = id (invariante 8)',
    () => {
      fc.assert(
        fc.property(primedCase, ({ game, index, digit }) => {
          const undone = gameUndo(place(game, index, digit));

          expect(undone.ok).toBe(true);
          if (!undone.ok) return;
          expect(undone.value.board).toEqual(game.board);
          expect(undone.value.notes).toEqual(game.notes);
          expect(undone.value.cursor).toBe(game.cursor);
          expect(undone.value.history.slice(0, game.cursor)).toEqual(game.history);
        }),
        { seed: 20261129, numRuns: 100 },
      );
    },
    PROP_TIMEOUT,
  );

  it(
    'CA-005-24: redo ∘ undo = id enquanto não há jogada nova',
    () => {
      fc.assert(
        fc.property(primedCase, ({ game, index, digit }) => {
          const next = place(game, index, digit);
          const undone = gameUndo(next);
          expect(undone.ok).toBe(true);
          if (!undone.ok) return;

          const redone = gameRedo(undone.value);

          expect(redone.ok && redone.value).toEqual(next);
        }),
        { seed: 20261130, numRuns: 100 },
      );
    },
    PROP_TIMEOUT,
  );

  it(
    'CA-005-42: partida vencida recusa a jogada, undo e redo (invariante 8)',
    () => {
      fc.assert(
        fc.property(nearlyCompleteGame, ({ game, empties }) => {
          let won = game;
          for (const cell of empties) {
            const placed = gamePlace(
              won,
              Math.floor(cell / 9),
              cell % 9,
              solutionGrid.flat()[cell],
            );
            expect(placed.ok).toBe(true);
            if (placed.ok) won = placed.value;
          }
          const first = empties[0] as number;

          const refused = gamePlaceAndPrune(won, Math.floor(first / 9), first % 9, 1);

          expect(refused).toEqual({ ok: false, reason: 'game-over' });
          expect(gameUndo(won)).toEqual({ ok: false, reason: 'game-over' });
          expect(gameRedo(won)).toEqual({ ok: false, reason: 'game-over' });
        }),
        { seed: 20261131, numRuns: 50 },
      );
    },
    PROP_TIMEOUT,
  );
});
