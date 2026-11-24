import { describe, expect, it } from 'vitest';
import { validPuzzleInput } from './__arbitraries__/puzzle';
import { createGame, gameToggleNote, notesAt, type Game } from './game';
import type { Notes } from './notes';

const newGame = (): Game => {
  const result = createGame(validPuzzleInput());
  if (!result.ok) throw new Error('fixture inválida');
  return result.value;
};

describe('game (anotações)', () => {
  it('CA-004-01: alternar o 4 numa célula vazia (2,7) liga a anotação e não mexe nas demais células', () => {
    // [símbolo novo: `gameToggleNote`]
    const game = newGame();

    const result = gameToggleNote(game, 2, 7, 4);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(notesAt(result.value, 2, 7)).toEqual([4]);
    expect(notesAt(result.value, 7, 2)).toEqual([]);
    expect(result.value.notes.filter((notes: Notes) => notes.length > 0)).toHaveLength(1);
  });
});
