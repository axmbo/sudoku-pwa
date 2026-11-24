import { describe, expect, it } from 'vitest';
import { cellAt, type Grid } from './board';
import { validPuzzleInput } from './__arbitraries__/puzzle';
import { createGame, gameErase, gamePlace, gameToggleNote, notesAt, type Game } from './game';

const newGame = (blank: readonly (readonly [number, number])[] = []): Game => {
  const input = validPuzzleInput();
  const givens: Grid = input.givens.map((row) => [...row]);
  for (const [r, c] of blank) {
    (givens[r] as (number | null)[])[c] = null;
  }
  const result = createGame({ ...input, givens });
  if (!result.ok) throw new Error('fixture inválida');
  return result.value;
};

const must = (result: { ok: boolean; value?: Game }): Game => {
  if (!result.ok) throw new Error('fixture inválida');
  return result.value as Game;
};

const raw = (value: unknown): never => value as never;

describe('game (valores)', () => {
  it('CA-004-08: colocar o 9 em (2,7) com anotações 2 e 9 deixa o valor 9, sem anotações, e não mexe nas demais células', () => {
    // [símbolos novos: `gamePlace`]
    let game = newGame();
    game = must(gameToggleNote(game, 2, 7, 2));
    game = must(gameToggleNote(game, 2, 7, 9));
    game = must(gameToggleNote(game, 3, 3, 4));

    const result = gamePlace(game, 2, 7, 9);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(cellAt(result.value.board, 2, 7)).toEqual({ value: 9, given: false });
    expect(notesAt(result.value, 2, 7)).toEqual([]);
    expect(notesAt(result.value, 3, 3)).toEqual([4]);
    expect(result.value.history).toHaveLength(3);
    expect(result.value.history[2]).toEqual({
      move: { kind: 'place', index: 2 * 9 + 7, digit: 9 },
      before: { value: null, notes: [2, 9] },
    });
    expect(result.value.cursor).toBe(3);
  });

  it('CA-004-09: apagar o valor de (2,7), colocado após limpar as anotações, deixa a célula vazia e sem anotações', () => {
    // [símbolo novo: `gameErase`]
    let game = newGame();
    game = must(gameToggleNote(game, 2, 7, 2));
    game = must(gamePlace(game, 2, 7, 9));

    const result = gameErase(game, 2, 7);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(cellAt(result.value.board, 2, 7)).toEqual({ value: null, given: false });
    expect(notesAt(result.value, 2, 7)).toEqual([]);
    expect(result.value.history).toHaveLength(3);
    expect(result.value.history[2]).toEqual({
      move: { kind: 'erase', index: 2 * 9 + 7 },
      before: { value: 9, notes: [] },
    });
    expect(result.value.cursor).toBe(3);
  });

  it('CA-004-10: colocar o 6 em (2,7) mantém a anotação 6 dos vizinhos de linha, coluna e bloco, com uma só entrada', () => {
    // (2,2) linha; (7,7) coluna; (0,6) bloco (esvaziada na fixture)
    let game = newGame([[0, 6]]);
    for (const [r, c] of [
      [2, 2],
      [7, 7],
      [0, 6],
    ] as const) {
      game = must(gameToggleNote(game, r, c, 6));
    }
    const before = game.history.length;

    const result = gamePlace(game, 2, 7, 6);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(notesAt(result.value, 2, 2)).toEqual([6]);
    expect(notesAt(result.value, 7, 7)).toEqual([6]);
    expect(notesAt(result.value, 0, 6)).toEqual([6]);
    expect(result.value.history).toHaveLength(before + 1);
  });

  it('CA-004-08: valor errado, sem conflito, é aceito normalmente', () => {
    const game = newGame();

    const result = gamePlace(game, 2, 7, 1);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(cellAt(result.value.board, 2, 7).value).toBe(1);
  });

  describe('CA-004-18: recusas e jogadas sem efeito', () => {
    // partida com uma jogada feita e desfeita (cursor 0): há algo refazível a preservar
    const withRedoable = (): Game => {
      const game = must(gameToggleNote(newGame(), 3, 3, 4));
      return { ...game, cursor: 0 };
    };

    it.each([
      ['cell-not-found', -1, 7, 5],
      ['cell-not-found', 2, 9, 5],
      ['cell-not-found', 2.5, 7, 5],
      ['invalid-value', 2, 7, 0],
      ['invalid-value', 2, 7, 10],
      ['invalid-value', 2, 7, '5'],
      ['cell-is-given', 0, 1, 5],
    ])(
      'CA-004-18: gamePlace recusa com %s (linha %o, coluna %o, valor %o) sem tocar no histórico',
      (reason, row, col, value) => {
        const game = withRedoable();

        const result = gamePlace(game, raw(row), raw(col), raw(value));

        expect(result).toEqual({ ok: false, reason });
        expect(game.history).toHaveLength(1);
        expect(game.cursor).toBe(0);
      },
    );

    it.each([
      ['cell-not-found', -1, 7],
      ['cell-not-found', 2, 9],
      ['cell-is-given', 0, 1],
    ])(
      'CA-004-18: gameErase recusa com %s (linha %o, coluna %o) sem tocar no histórico',
      (reason, row, col) => {
        const game = withRedoable();

        const result = gameErase(game, raw(row), raw(col));

        expect(result).toEqual({ ok: false, reason });
        expect(game.history).toHaveLength(1);
        expect(game.cursor).toBe(0);
      },
    );

    it('CA-004-18: colocar o valor que a célula já tem devolve ok com a mesma referência e preserva o refazível', () => {
      const placed = must(gamePlace(newGame(), 2, 7, 9));
      const redoable = must(gameToggleNote(newGame(), 3, 3, 4)).history;
      const withValue: Game = { ...placed, history: [...placed.history, ...redoable] };

      const result = gamePlace(withValue, 2, 7, 9);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toBe(withValue);
      expect(result.value.history).toHaveLength(2);
      expect(result.value.cursor).toBe(1);
    });

    it('CA-004-18: apagar célula já vazia devolve ok com a mesma referência e preserva o refazível', () => {
      const game = withRedoable();

      const result = gameErase(game, 2, 7);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toBe(game);
      expect(result.value.history).toHaveLength(1);
      expect(result.value.cursor).toBe(0);
    });
  });
});
