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
  it('CA-004-01: alternar de novo o 4 em (2,7) remove só ele, mantendo as demais anotações da célula e de outras células', () => {
    const start = newGame();
    const withOther = gameToggleNote(start, 7, 2, 9);
    expect(withOther.ok).toBe(true);
    if (!withOther.ok) return;
    const withTwo = gameToggleNote(withOther.value, 2, 7, 2);
    expect(withTwo.ok).toBe(true);
    if (!withTwo.ok) return;
    const withFour = gameToggleNote(withTwo.value, 2, 7, 4);
    expect(withFour.ok).toBe(true);
    if (!withFour.ok) return;
    expect(notesAt(withFour.value, 2, 7)).toEqual([2, 4]);

    const result = gameToggleNote(withFour.value, 2, 7, 4);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(notesAt(result.value, 2, 7)).toEqual([2]);
    expect(notesAt(result.value, 7, 2)).toEqual([9]);
  });
});
