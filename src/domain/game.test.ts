import { describe, expect, it } from 'vitest';
import { createBoard } from './board';
import { givensGrid, validPuzzleInput } from './__arbitraries__/puzzle';
import { canRedo, canUndo, createGame, getGameConflicts, notesAt, type Game } from './game';
import type { Notes } from './notes';

describe('game (criação)', () => {
  it('INV: createGame devolve Game com cursor 0, history vazio, 81 anotações vazias e board com as pistas', () => {
    // [símbolo novo: `createGame`]
    const expectedBoard = createBoard(givensGrid);
    expect(expectedBoard.ok).toBe(true);
    if (!expectedBoard.ok) return;

    const result = createGame(validPuzzleInput());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const game = result.value;
    expect(game.cursor).toBe(0);
    expect(game.history).toEqual([]);
    expect(game.notes).toHaveLength(81);
    expect(game.notes.every((notes: Notes) => notes.length === 0)).toBe(true);
    expect(game.board).toEqual(expectedBoard.value);
    expect(game.board.cells[2 * 9 + 0]).toEqual({ value: 7, given: true });
    expect(game.board.cells[2 * 9 + 7]).toEqual({ value: null, given: false });
    expect(game.puzzle).toEqual(validPuzzleInput());
  });

  const newGame = (): Game => {
    const result = createGame(validPuzzleInput());
    if (!result.ok) throw new Error('fixture inválida');
    return result.value;
  };

  it('INV: na partida nova canUndo e canRedo são falsos', () => {
    // [símbolo novo: `canUndo`, `canRedo`]
    const game = newGame();

    expect(canUndo(game)).toBe(false);
    expect(canRedo(game)).toBe(false);
  });

  it('INV: na partida nova getGameConflicts é vazio', () => {
    // [símbolo novo: `getGameConflicts`]
    expect(getGameConflicts(newGame())).toEqual([]);
  });

  it('INV: createGame com entrada inválida devolve a recusa de createPuzzle inteira', () => {
    expect(createGame({ ...validPuzzleInput(), seed: '' })).toEqual({
      ok: false,
      reason: 'malformed-puzzle',
    });
  });

  it.each([
    [2, 7],
    [7, 2],
  ] as const)('INV: notesAt(%i, %i) devolve anotações vazias na partida nova', (row, col) => {
    // [símbolo novo: `notesAt`]
    expect(notesAt(newGame(), row, col)).toEqual([]);
  });
});
