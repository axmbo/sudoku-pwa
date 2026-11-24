import { describe, expect, it } from 'vitest';
import { createBoard } from './board';
import { givensGrid, validPuzzleInput } from './__arbitraries__/puzzle';
import { createGame } from './game';
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
});
