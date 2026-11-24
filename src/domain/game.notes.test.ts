import { describe, expect, it } from 'vitest';
import { placeValue } from './board';
import { solutionGrid, validPuzzleInput } from './__arbitraries__/puzzle';
import {
  createGame,
  gameClearNotes,
  gameToggleNote,
  getGameConflicts,
  notesAt,
  type Game,
} from './game';
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
  it('CA-004-04: alternar anotação em célula com valor (2,7) é recusado com cell-has-value e a partida não muda', () => {
    // Helper provisório: troca por `gamePlace` na T03.
    const placed = placeValue(newGame().board, 2, 7, solutionGrid[2]?.[7]);
    if (!placed.ok) throw new Error('fixture inválida');
    const game: Game = { ...newGame(), board: placed.value };
    const snapshot = structuredClone(game);

    const result = gameToggleNote(game, 2, 7, 4);

    expect(result).toEqual({ ok: false, reason: 'cell-has-value' });
    expect(game).toEqual(snapshot);
    expect(game.history).toHaveLength(0);
  });
  // Entradas de fora entram como `unknown` (plan.md#Tipos públicos); o cast `never` mantém o
  // typecheck passando enquanto a assinatura ainda é estreita e continua válido com `unknown`.
  const raw = (value: unknown): never => value as never;

  it.each([[0], [10], [2.5], ['5'], [undefined], [-0]])(
    'CA-004-05: dígito %o é recusado com invalid-value e a partida não muda',
    (digit) => {
      const game = newGame();

      const result = gameToggleNote(game, 2, 7, raw(digit));

      expect(result).toEqual({ ok: false, reason: 'invalid-value' });
      expect(game.history).toHaveLength(0);
      expect(notesAt(game, 2, 7)).toEqual([]);
    },
  );

  it.each([[-1], [9], [2.5], ['2'], [undefined]])(
    'CA-004-05: linha ou coluna %o é recusada com cell-not-found, em gameToggleNote e gameClearNotes',
    (bad) => {
      const game = newGame();

      expect(gameToggleNote(game, raw(bad), 7, 4)).toEqual({ ok: false, reason: 'cell-not-found' });
      expect(gameToggleNote(game, 2, raw(bad), 4)).toEqual({ ok: false, reason: 'cell-not-found' });
      expect(gameClearNotes(game, raw(bad), 7)).toEqual({ ok: false, reason: 'cell-not-found' });
      expect(gameClearNotes(game, 2, raw(bad))).toEqual({ ok: false, reason: 'cell-not-found' });
      expect(game.history).toHaveLength(0);
    },
  );

  it('CA-004-05: -0 é aceito como linha e coluna (célula (0,0)), mas recusado como dígito', () => {
    const game = newGame();

    const accepted = gameToggleNote(game, -0, -0, 4);

    expect(accepted.ok).toBe(true);
    if (!accepted.ok) return;
    expect(notesAt(accepted.value, 0, 0)).toEqual([4]);
    expect(gameToggleNote(game, 0, 0, raw(-0))).toEqual({ ok: false, reason: 'invalid-value' });
  });
  it('CA-004-06: anotar o 5 em (0,0) com o 5 já na linha (0,4) é aceito e getGameConflicts não muda', () => {
    const game = newGame();
    expect(game.board.cells[0 * 9 + 4]).toEqual({ value: 5, given: true });
    const conflictsBefore = getGameConflicts(game);

    const result = gameToggleNote(game, 0, 0, 5);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(notesAt(result.value, 0, 0)).toEqual([5]);
    expect(getGameConflicts(result.value)).toEqual(conflictsBefore);
  });

  it('INV: precedência de recusas cell-not-found > invalid-value > cell-is-given > cell-has-value (CA-004-03, 04, 05)', () => {
    const game = newGame();
    const placed = placeValue(game.board, 2, 7, solutionGrid[2]?.[7]);
    if (!placed.ok) throw new Error('fixture inválida');
    const withValue: Game = { ...game, board: placed.value };

    // posição inválida e dígito inválido: vence cell-not-found
    expect(gameToggleNote(game, 9, 7, 0)).toEqual({ ok: false, reason: 'cell-not-found' });
    // pista e dígito inválido: vence invalid-value
    expect(gameToggleNote(game, 2, 0, 0)).toEqual({ ok: false, reason: 'invalid-value' });
    // célula com valor e dígito inválido: vence invalid-value
    expect(gameToggleNote(withValue, 2, 7, 0)).toEqual({ ok: false, reason: 'invalid-value' });
    // pista tem valor: vence cell-is-given sobre cell-has-value
    expect(gameToggleNote(game, 2, 0, 5)).toEqual({ ok: false, reason: 'cell-is-given' });
    // em gameClearNotes, posição inválida vence também
    expect(gameClearNotes(game, 9, 0)).toEqual({ ok: false, reason: 'cell-not-found' });
  });
  it('INV: a entrada de histórico de gameToggleNote guarda a jogada e o estado anterior da célula (CA-004-01, 07)', () => {
    const first = gameToggleNote(newGame(), 2, 7, 2);
    if (!first.ok) throw new Error('fixture inválida');

    const second = gameToggleNote(first.value, 2, 7, 4);

    expect(first.value.history).toEqual([
      {
        move: { kind: 'toggle-note', index: 2 * 9 + 7, digit: 2 },
        before: { value: null, notes: [] },
      },
    ]);
    if (!second.ok) throw new Error('fixture inválida');
    expect(second.value.history[1]).toEqual({
      move: { kind: 'toggle-note', index: 2 * 9 + 7, digit: 4 },
      before: { value: null, notes: [2] },
    });
  });

  it('INV: a entrada de histórico de gameClearNotes guarda as anotações que havia antes (CA-004-07)', () => {
    let game = newGame();
    for (const digit of [7, 2] as const) {
      const toggled = gameToggleNote(game, 2, 7, digit);
      if (!toggled.ok) throw new Error('fixture inválida');
      game = toggled.value;
    }

    const result = gameClearNotes(game, 2, 7);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.history[2]).toEqual({
      move: { kind: 'clear-notes', index: 2 * 9 + 7 },
      before: { value: null, notes: [2, 7] },
    });
  });

  it('INV: jogada nova com o cursor atrás do fim descarta o refazível antes de acrescentar (CA-004-01)', () => {
    // Estado pós-desfazer montado à mão: troca por `gameUndo` na T04.
    const first = gameToggleNote(newGame(), 2, 7, 2);
    if (!first.ok) throw new Error('fixture inválida');
    const second = gameToggleNote(first.value, 2, 7, 4);
    if (!second.ok) throw new Error('fixture inválida');
    const rewound: Game = { ...second.value, cursor: 1 };

    const result = gameToggleNote(rewound, 0, 0, 9);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.history).toHaveLength(2);
    expect(result.value.history[1]).toEqual({
      move: { kind: 'toggle-note', index: 0, digit: 9 },
      before: { value: null, notes: [] },
    });
    expect(result.value.cursor).toBe(2);
  });
});
