import { describe, expect, it } from 'vitest';
import {
  almostSolvedInput,
  solutionGrid,
  swapPairInput,
  validPuzzleInput,
} from './__arbitraries__/puzzle';
import { createGame, gamePlace, getGameConflicts, getGameStatus, type Game } from './game';

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

  it.each([
    ['com conflito (4 no lugar do 3 em (3,1))', () => wrongWithConflict(), true],
    ['sem conflito (1 e 2 trocados em toda a grade)', () => swappedFull(), false],
  ])('CA-004-20: grade cheia e errada é full-incorrect, %s', (_nome, build, hasConflict) => {
    const game = build();

    expect(getGameConflicts(game).length > 0).toBe(hasConflict);
    expect(getGameStatus(game)).toBe('full-incorrect');
  });

  it('CA-004-33: colocar valor errado sem conflito é aceito e a partida segue incomplete', () => {
    const created = createGame(swapPairInput());
    if (!created.ok) throw new Error('fixture inválida');

    const placed = gamePlace(created.value, 0, 0, 2);

    expect(placed.ok).toBe(true);
    if (!placed.ok) return;
    expect(getGameConflicts(placed.value)).toEqual([]);
    expect(getGameStatus(placed.value)).toBe('incomplete');
  });
});

const wrongWithConflict = (): Game => {
  const placed = gamePlace(oneMissing(), 3, 1, 4);
  if (!placed.ok) throw new Error('fixture inválida');
  return placed.value;
};

const swappedFull = (): Game => {
  const created = createGame(swapPairInput());
  if (!created.ok) throw new Error('fixture inválida');
  let game = created.value;
  for (const [r, line] of solutionGrid.entries()) {
    for (const [c, value] of line.entries()) {
      if (value !== 1 && value !== 2) continue;
      const placed = gamePlace(game, r, c, value === 1 ? 2 : 1);
      if (!placed.ok) throw new Error('fixture inválida');
      game = placed.value;
    }
  }
  return game;
};

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
