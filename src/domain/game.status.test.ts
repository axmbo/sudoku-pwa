import { describe, expect, it } from 'vitest';
import {
  almostSolvedInput,
  sevenForThreeInput,
  solutionGrid,
  swapPairInput,
  validPuzzleInput,
} from './__arbitraries__/puzzle';
import {
  createGame,
  gameClearNotes,
  gameErase,
  gamePlace,
  gameRedo,
  gameToggleNote,
  gameUndo,
  getGameConflicts,
  getGameStatus,
  type Game,
} from './game';

/** Partida com só (3,1) vazia; o valor correto ali é 3. */
const oneMissing = (): Game => {
  const result = createGame(almostSolvedInput(3, 1));
  if (!result.ok) throw new Error('fixture inválida');
  return result.value;
};

describe('game (estado derivado e vitória)', () => {
  it.each([
    ['única célula vazia (3,1), correto 3', () => oneMissing(), 3, 1, 3],
    [
      'grade cheia certa, contando as pistas (fixture padrão, 10 vazias)',
      () => nearlyFilled(),
      2,
      7,
      5,
    ],
  ])('CA-004-19: completar igual à solução vence a partida, %s', (_nome, build, r, c, digit) => {
    // [símbolo novo: `getGameStatus`]
    const placed = gamePlace(build(), r, c, digit);
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

  it('CA-004-33: colocar 7 onde o correto é 3, sem conflito, é aceito e a partida segue incomplete', () => {
    const created = createGame(sevenForThreeInput());
    if (!created.ok) throw new Error('fixture inválida');

    const placed = gamePlace(created.value, 3, 1, 7);

    expect(placed.ok).toBe(true);
    if (!placed.ok) return;
    expect(getGameConflicts(placed.value)).toEqual([]);
    expect(getGameStatus(placed.value)).toBe('incomplete');
  });

  it.each([
    ['gamePlace', (g: Game) => gamePlace(g, 3, 1, 5)],
    ['gameErase', (g: Game) => gameErase(g, 3, 1)],
    // sem o guard, a recusa seria `cell-has-value` (grade vencida não tem vazia)
    ['gameToggleNote', (g: Game) => gameToggleNote(g, 3, 1, 5)],
    // sem o guard, devolveria `ok` sem efeito (célula sem anotações)
    ['gameClearNotes', (g: Game) => gameClearNotes(g, 3, 1)],
    // sem o guard, desfaria a vitória com sucesso (há uma jogada no histórico)
    ['gameUndo', (g: Game) => gameUndo(g)],
    // sem o guard, a recusa seria `nothing-to-redo`
    ['gameRedo', (g: Game) => gameRedo(g)],
  ])('CA-004-23: %s em partida vencida é recusado com game-over', (_nome, operation) => {
    const won = gamePlace(oneMissing(), 3, 1, 3);
    if (!won.ok) throw new Error('fixture inválida');

    expect(operation(won.value)).toEqual({ ok: false, reason: 'game-over' });
  });

  it.each([
    ['gamePlace', 'cell-not-found', (g: Game) => gamePlace(g, 9, 0, 5)],
    ['gamePlace', 'invalid-value', (g: Game) => gamePlace(g, 3, 1, 10)],
    ['gamePlace', 'cell-is-given', (g: Game) => gamePlace(g, 0, 0, 5)],
    ['gameErase', 'cell-not-found', (g: Game) => gameErase(g, 9, 0)],
    ['gameErase', 'cell-is-given', (g: Game) => gameErase(g, 0, 0)],
    ['gameToggleNote', 'cell-not-found', (g: Game) => gameToggleNote(g, 9, 0, 5)],
    ['gameToggleNote', 'invalid-value', (g: Game) => gameToggleNote(g, 3, 1, 10)],
    ['gameToggleNote', 'cell-is-given', (g: Game) => gameToggleNote(g, 0, 0, 5)],
    ['gameClearNotes', 'cell-not-found', (g: Game) => gameClearNotes(g, 9, 0)],
    ['gameClearNotes', 'cell-is-given', (g: Game) => gameClearNotes(g, 0, 0)],
  ])('CA-004-23: game-over vence %s com %s em partida vencida', (_nome, _outra, operation) => {
    const won = gamePlace(oneMissing(), 3, 1, 3);
    if (!won.ok) throw new Error('fixture inválida');

    expect(operation(won.value)).toEqual({ ok: false, reason: 'game-over' });
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
