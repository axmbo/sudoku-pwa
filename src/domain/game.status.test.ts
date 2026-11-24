import { describe, expect, it } from 'vitest';
import { almostSolvedInput } from './__arbitraries__/puzzle';
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
});
