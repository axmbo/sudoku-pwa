import { describe, expect, it } from 'vitest';
import { placeValue } from './board';
import { solutionGrid, validPuzzleInput } from './__arbitraries__/puzzle';
import { createGame, gameClearNotes, gameToggleNote, notesAt, type Game } from './game';
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
    expect(notesAt(result.value, 3, 3)).toEqual([]);
    expect(result.value.notes.filter((notes: Notes) => notes.length > 0)).toHaveLength(1);
  });
  it('CA-004-01: alternar de novo o 4 em (2,7) remove só ele, mantendo as demais anotações da célula e de outras células', () => {
    const start = newGame();
    const withOther = gameToggleNote(start, 3, 3, 9);
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
    expect(notesAt(result.value, 3, 3)).toEqual([9]);
  });
  it('CA-004-07: limpar três anotações de (2,7) esvazia a célula numa só entrada de histórico', () => {
    // [símbolo novo: `gameClearNotes`]
    let game = newGame();
    for (const digit of [7, 2, 4] as const) {
      const toggled = gameToggleNote(game, 2, 7, digit);
      if (!toggled.ok) throw new Error('fixture inválida');
      game = toggled.value;
    }
    const other = gameToggleNote(game, 3, 3, 9);
    if (!other.ok) throw new Error('fixture inválida');
    game = other.value;
    const before = game.history.length;

    const result = gameClearNotes(game, 2, 7);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(notesAt(result.value, 2, 7)).toEqual([]);
    expect(notesAt(result.value, 3, 3)).toEqual([9]);
    expect(result.value.history).toHaveLength(before + 1);
  });

  it('CA-004-07: limpar célula sem anotações é aceito sem efeito, na mesma referência', () => {
    const game = newGame();

    const result = gameClearNotes(game, 2, 7);

    expect(result).toEqual({ ok: true, value: game });
    if (!result.ok) return;
    expect(result.value).toBe(game);
  });

  it('INV: limpar anotações em célula com valor é aceito sem efeito, na mesma referência e com histórico igual (CA-004-07, CA-004-18)', () => {
    // Helper provisório: troca por `gamePlace` na T03.
    const placed = placeValue(newGame().board, 2, 7, solutionGrid[2]?.[7]);
    if (!placed.ok) throw new Error('fixture inválida');
    const game: Game = { ...newGame(), board: placed.value };

    const result = gameClearNotes(game, 2, 7);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toBe(game);
    expect(result.value.history).toEqual(game.history);
  });
  it('CA-004-01: cada alternância com efeito soma uma entrada ao histórico e avança o cursor', () => {
    const game = newGame();

    const first = gameToggleNote(game, 2, 7, 4);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.value.history).toHaveLength(1);
    expect(first.value.cursor).toBe(1);

    const second = gameToggleNote(first.value, 2, 7, 4);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.value.history).toHaveLength(2);
    expect(second.value.cursor).toBe(2);
    expect(game.history).toHaveLength(0);
  });
  it('CA-004-03: alternar anotação em pista (2,0) é recusado com cell-is-given e a partida não muda', () => {
    const toggled = gameToggleNote(newGame(), 2, 7, 4);
    if (!toggled.ok) throw new Error('fixture inválida');
    const game = toggled.value;
    const snapshot = structuredClone(game);

    const result = gameToggleNote(game, 2, 0, 5);

    expect(result).toEqual({ ok: false, reason: 'cell-is-given' });
    expect(game).toEqual(snapshot);
    expect(game.history).toHaveLength(1);
  });

  it('CA-004-07: limpar anotações em pista (2,0) é recusado com cell-is-given', () => {
    const game = newGame();

    const result = gameClearNotes(game, 2, 0);

    expect(result).toEqual({ ok: false, reason: 'cell-is-given' });
    expect(game.history).toHaveLength(0);
  });
});
