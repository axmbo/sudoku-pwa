import { describe, expect, it } from 'vitest';
import { almostSolvedInput, solutionGrid, validPuzzleInput } from './__arbitraries__/puzzle';
import { createGame, gamePlace, getGameStatus, type Game } from './game';

/** Partida com só (3,1) vazia; o valor correto ali é 3. */
const oneMissing = (): Game => {
  const result = createGame(almostSolvedInput(3, 1));
  if (!result.ok) throw new Error('fixture inválida');
  return result.value;
};

describe('game (estado derivado e vitória)', () => {
  it('CA-004-19: colocar o valor correto na única célula vazia vence a partida', () => {
    // [símbolo novo: `getGameStatus`]
    const placed = gamePlace(oneMissing(), 3, 1, 3);
    if (!placed.ok) throw new Error('fixture inválida');

    expect(getGameStatus(placed.value)).toBe('won');
  });

  it.each([
    ['80 de 81 células certas, sem jogadas', () => oneMissing()],
    ['9 de 10 células vazias preenchidas com o valor correto', () => nearlyFilled()],
  ])('CA-004-21: grade incompleta nunca vence (%s)', (_nome, build) => {
    expect(getGameStatus(build())).toBe('incomplete');
  });
});

/** Fixture padrão (10 vazias, (2,7) entre elas) com 9 preenchidas corretamente; (2,7) segue vazia. */
const nearlyFilled = (): Game => {
  const created = createGame(validPuzzleInput());
  if (!created.ok) throw new Error('fixture inválida');
  let game = created.value;
  for (const d of [0, 1, 2, 3, 4, 5, 6, 7, 8]) {
    const placed = gamePlace(game, d, d, (solutionGrid[d] as readonly (number | null)[])[d]);
    if (!placed.ok) throw new Error('fixture inválida');
    game = placed.value;
  }
  return game;
};
