import { describe, expect, it } from 'vitest';
import { cellAt, type Grid } from './board';
import { validPuzzleInput } from './__arbitraries__/puzzle';
import {
  canRedo,
  canUndo,
  createGame,
  gameClearNotes,
  gameErase,
  gamePlace,
  gameRedo,
  gameToggleNote,
  gameUndo,
  notesAt,
  type Game,
} from './game';

const newGame = (): Game => {
  const input = validPuzzleInput();
  const givens: Grid = input.givens.map((row) => [...row]);
  const result = createGame({ ...input, givens });
  if (!result.ok) throw new Error('fixture inválida');
  return result.value;
};

const must = (result: { ok: boolean; value?: Game }): Game => {
  if (!result.ok) throw new Error('fixture inválida');
  return result.value as Game;
};

/** Parte do jogo que desfazer/refazer restaura: tabuleiro e anotações. */
const state = (game: Game) => ({ board: game.board, notes: game.notes });

describe('game (desfazer e refazer)', () => {
  it('CA-004-11: desfazer a última jogada volta valores e anotações e deixa a jogada refazível', () => {
    // [símbolo novo: `gameUndo`]
    let game = newGame();
    game = must(gameToggleNote(game, 2, 7, 2));
    game = must(gameToggleNote(game, 2, 7, 9));
    const antes = must(gameToggleNote(game, 3, 3, 4));
    const depois = must(gamePlace(antes, 2, 7, 9));

    const result = gameUndo(depois);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(state(result.value)).toEqual(state(antes));
    expect(cellAt(result.value.board, 2, 7)).toEqual({ value: null, given: false });
    expect(notesAt(result.value, 2, 7)).toEqual([2, 9]);
    expect(result.value.cursor).toBe(3);
    expect(canUndo(result.value)).toBe(true);
    expect(canRedo(result.value)).toBe(true);
  });

  it('CA-004-12: refazer a jogada desfeita devolve exatamente o estado de antes do desfazer', () => {
    // [símbolo novo: `gameRedo`]
    let game = newGame();
    game = must(gameToggleNote(game, 2, 7, 2));
    game = must(gamePlace(game, 2, 7, 9));
    const desfeito = must(gameUndo(game));

    const result = gameRedo(desfeito);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual(game);
    expect(cellAt(result.value.board, 2, 7)).toEqual({ value: 9, given: false });
    expect(notesAt(result.value, 2, 7)).toEqual([]);
    expect(canRedo(result.value)).toBe(false);
  });

  it('CA-004-13: desfazer sem nenhuma jogada é recusado com nothing-to-undo, na mesma referência', () => {
    const game = newGame();

    const result = gameUndo(game);

    expect(result).toEqual({ ok: false, reason: 'nothing-to-undo' });
    expect(game.cursor).toBe(0);
    expect(game.history).toHaveLength(0);
  });

  it('CA-004-13: desfazer tudo e desfazer de novo é recusado com nothing-to-undo', () => {
    const game = must(gameUndo(must(gameToggleNote(newGame(), 2, 7, 2))));

    expect(gameUndo(game)).toEqual({ ok: false, reason: 'nothing-to-undo' });
  });

  it('CA-004-14: refazer numa partida em que nada foi desfeito é recusado com nothing-to-redo', () => {
    const game = must(gameToggleNote(newGame(), 2, 7, 2));

    expect(gameRedo(game)).toEqual({ ok: false, reason: 'nothing-to-redo' });
    expect(gameRedo(newGame())).toEqual({ ok: false, reason: 'nothing-to-redo' });
  });

  it('CA-004-14: refazer depois de refazer tudo é recusado com nothing-to-redo', () => {
    let game = newGame();
    game = must(gameToggleNote(game, 2, 7, 2));
    game = must(gamePlace(game, 3, 3, 4));
    const refeito = must(gameRedo(must(gameRedo(must(gameUndo(must(gameUndo(game))))))));

    expect(refeito).toEqual(game);
    expect(gameRedo(refeito)).toEqual({ ok: false, reason: 'nothing-to-redo' });
  });

  it('CA-004-15: jogada nova depois de desfazer descarta o refazível e trunca o histórico', () => {
    let game = newGame();
    game = must(gameToggleNote(game, 2, 7, 2));
    game = must(gameToggleNote(game, 2, 7, 5));
    game = must(gameUndo(game));
    expect(canRedo(game)).toBe(true);

    const result = gameToggleNote(game, 3, 3, 4);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(canRedo(result.value)).toBe(false);
    expect(result.value.history).toHaveLength(2);
    expect(result.value.history[1]).toEqual({
      move: { kind: 'toggle-note', index: 3 * 9 + 3, digit: 4 },
      before: { value: null, notes: [] },
    });
    expect(result.value.cursor).toBe(2);
    expect(gameRedo(result.value)).toEqual({ ok: false, reason: 'nothing-to-redo' });
    expect(notesAt(result.value, 2, 7)).toEqual([2]);
  });

  it('CA-004-18: jogada sem efeito depois de desfazer preserva o que é refazível', () => {
    // usa gameUndo para montar o refazível (sem montar estado à mão, M-010)
    const game = must(gameUndo(must(gameToggleNote(newGame(), 3, 3, 4))));

    const result = gameClearNotes(game, 2, 7);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toBe(game);
    expect(canRedo(result.value)).toBe(true);
  });

  describe('CA-004-17: um exemplo por tipo de jogada', () => {
    it('CA-004-17: desfazer place restaura a célula vazia com as anotações anteriores', () => {
      const antes = must(gameToggleNote(newGame(), 2, 7, 3));
      const depois = must(gamePlace(antes, 2, 7, 6));

      const result = gameUndo(depois);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(state(result.value)).toEqual(state(antes));
      expect(notesAt(result.value, 2, 7)).toEqual([3]);
    });

    it('CA-004-17: desfazer erase devolve o valor apagado', () => {
      const antes = must(gamePlace(newGame(), 2, 7, 6));
      const depois = must(gameErase(antes, 2, 7));

      const result = gameUndo(depois);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(state(result.value)).toEqual(state(antes));
      expect(cellAt(result.value.board, 2, 7)).toEqual({ value: 6, given: false });
    });

    it('CA-004-17: desfazer toggle-note restaura as anotações anteriores', () => {
      const antes = must(gameToggleNote(newGame(), 2, 7, 3));
      const depois = must(gameToggleNote(antes, 2, 7, 8));

      const result = gameUndo(depois);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(state(result.value)).toEqual(state(antes));
      expect(notesAt(result.value, 2, 7)).toEqual([3]);
    });

    it('CA-004-17: desfazer clear-notes devolve as anotações limpas', () => {
      let antes = newGame();
      for (const d of [2, 5, 7] as const) antes = must(gameToggleNote(antes, 2, 7, d));
      const depois = must(gameClearNotes(antes, 2, 7));

      const result = gameUndo(depois);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(state(result.value)).toEqual(state(antes));
      expect(notesAt(result.value, 2, 7)).toEqual([2, 5, 7]);
    });
  });

  it('CA-004-32: alternar 2, 5 e 8 e desfazer uma vez remove só o 8', () => {
    let game = newGame();
    for (const d of [2, 5, 8] as const) game = must(gameToggleNote(game, 2, 7, d));

    const result = gameUndo(game);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(notesAt(result.value, 2, 7)).toEqual([2, 5]);
    expect(result.value.cursor).toBe(2);
  });

  it('CA-004-07: desfazer o limpar de três anotações devolve as três', () => {
    let game = newGame();
    for (const d of [1, 4, 9] as const) game = must(gameToggleNote(game, 2, 7, d));
    game = must(gameClearNotes(game, 2, 7));
    expect(notesAt(game, 2, 7)).toEqual([]);

    const result = gameUndo(game);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(notesAt(result.value, 2, 7)).toEqual([1, 4, 9]);
  });

  it('CA-004-08: desfazer a colocação do 9 sobre as anotações 2 e 9 devolve célula vazia com 2 e 9', () => {
    let game = newGame();
    game = must(gameToggleNote(game, 2, 7, 2));
    game = must(gameToggleNote(game, 2, 7, 9));
    game = must(gamePlace(game, 2, 7, 9));

    const result = gameUndo(game);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(cellAt(result.value.board, 2, 7)).toEqual({ value: null, given: false });
    expect(notesAt(result.value, 2, 7)).toEqual([2, 9]);
  });

  it('CA-004-09: desfazer a exclusão devolve o valor, sem anotações', () => {
    let game = newGame();
    game = must(gameToggleNote(game, 2, 7, 2));
    game = must(gamePlace(game, 2, 7, 9));
    game = must(gameErase(game, 2, 7));

    const result = gameUndo(game);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(cellAt(result.value.board, 2, 7)).toEqual({ value: 9, given: false });
    expect(notesAt(result.value, 2, 7)).toEqual([]);
  });

  describe('CA-004-12: refazer cobre todos os tipos de jogada', () => {
    it('CA-004-12: refazer erase tira o valor de novo', () => {
      const game = must(gameErase(must(gamePlace(newGame(), 2, 7, 6)), 2, 7));

      const result = gameRedo(must(gameUndo(game)));

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toEqual(game);
      expect(cellAt(result.value.board, 2, 7)).toEqual({ value: null, given: false });
    });

    it('CA-004-12: refazer clear-notes esvazia as três anotações', () => {
      let game = newGame();
      for (const d of [2, 5, 7] as const) game = must(gameToggleNote(game, 2, 7, d));
      game = must(gameClearNotes(game, 2, 7));

      const result = gameRedo(must(gameUndo(game)));

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toEqual(game);
      expect(notesAt(result.value, 2, 7)).toEqual([]);
    });

    it('CA-004-12: refazer toggle-note devolve só aquela anotação, mantendo as outras', () => {
      let game = newGame();
      for (const d of [2, 5, 8] as const) game = must(gameToggleNote(game, 2, 7, d));

      const result = gameRedo(must(gameUndo(game)));

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toEqual(game);
      expect(notesAt(result.value, 2, 7)).toEqual([2, 5, 8]);
    });
  });
});
