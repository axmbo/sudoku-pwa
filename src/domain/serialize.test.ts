import { describe, expect, it } from 'vitest';
import { almostSolvedInput, validPuzzleInput } from './__arbitraries__/puzzle';
import {
  createGame,
  gameClearNotes,
  gameErase,
  gamePlace,
  gameToggleNote,
  gameUndo,
  getGameConflicts,
  getGameStatus,
  type Game,
} from './game';
import { serializeGame } from './serialize';

/** Partida pequena e conhecida: anotações 7 e 2 em (2,7), depois o 1 em (0,0). */
const sample = (): Game => {
  const created = createGame(validPuzzleInput());
  if (!created.ok) throw new Error('fixture inválida');
  const steps = [
    (g: Game) => gameToggleNote(g, 2, 7, 7),
    (g: Game) => gameToggleNote(g, 2, 7, 2),
    (g: Game) => gamePlace(g, 0, 0, 1),
  ];
  return steps.reduce((game, step) => {
    const next = step(game);
    if (!next.ok) throw new Error('fixture inválida');
    return next.value;
  }, created.value);
};

describe('serialize (formato v1)', () => {
  it('CA-004-26: serializa no formato v1 com ordem de chaves fixa (exemplo dourado)', () => {
    // [símbolo novo: `serializeGame`]
    const notes = Array<number>(81).fill(0);
    notes[25] = 66; // dígitos 2 (bit 1) e 7 (bit 6) em (2,7)
    const expected =
      '{"schemaVersion":1,"data":{' +
      '"puzzle":{"givens":".23456789' +
      '4.6789123' +
      '78.1234.6' +
      '234.67891' +
      '5678.1234' +
      '89123.567' +
      '345678.12' +
      '6789123.5' +
      '91234567.",' +
      '"solution":"123456789456789123789123456234567891567891234891234567345678912678912345912345678",' +
      '"difficulty":"easy","seed":"seed-004","generatorVersion":1},' +
      '"values":"123456789' +
      '4.6789123' +
      '78.1234.6' +
      '234.67891' +
      '5678.1234' +
      '89123.567' +
      '345678.12' +
      '6789123.5' +
      '91234567.",' +
      `"notes":[${notes.join(',')}],` +
      '"moves":[[2,25,7],[2,25,2],[0,0,1]],' +
      '"cursor":3}}';

    expect(serializeGame(sample())).toBe(expected);
  });

  it('CA-004-26: duas serializações do mesmo jogo são idênticas byte a byte', () => {
    const game = sample();

    expect(serializeGame(game)).toBe(serializeGame(game));
  });

  it('CA-004-26: notas como máscara de bits e jogadas como [tipo, índice, dígito] (tabela literal)', () => {
    let game = fresh();
    game = step(game, (g) => gameToggleNote(g, 2, 7, 1)); // índice 25
    game = step(game, (g) => gameToggleNote(g, 2, 7, 9));
    game = step(game, (g) => gameToggleNote(g, 1, 1, 3)); // índice 10
    game = step(game, (g) => gameClearNotes(g, 2, 7));
    game = step(game, (g) => gamePlace(g, 0, 0, 1));
    game = step(game, (g) => gameErase(g, 0, 0));

    const data = parsed(game).data;

    expect(data.moves).toEqual([
      [2, 25, 1],
      [2, 25, 9],
      [2, 10, 3],
      [3, 25, 0],
      [0, 0, 1],
      [1, 0, 0],
    ]);
    const expectedNotes = Array<number>(81).fill(0);
    expectedNotes[10] = 4; // dígito 3 = bit 2
    expect(data.notes).toEqual(expectedNotes);
  });

  it('CA-004-26: máscara com todos os dígitos 1-9 vale 511', () => {
    let game = fresh();
    for (const d of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      game = step(game, (g) => gameToggleNote(g, 2, 7, d));
    }

    expect(parsed(game).data.notes[25]).toBe(511);
  });

  it('CA-004-31: com conflito presente, o texto não traz conflitos, status, before nem tempo', () => {
    const game = step(fresh(), (g) => gamePlace(g, 0, 0, 2)); // 2 repetido na linha 0
    expect(getGameConflicts(game).length).toBeGreaterThan(0);

    const text = serializeGame(game);

    expect(Object.keys(parsed(game))).toEqual(['schemaVersion', 'data']);
    expect(Object.keys(parsed(game).data)).toEqual([
      'puzzle',
      'values',
      'notes',
      'moves',
      'cursor',
    ]);
    for (const forbidden of ['conflict', 'status', 'before', 'elapsed', 'time']) {
      expect(text).not.toContain(forbidden);
    }
  });

  it('CA-004-26: depois de desfazer, o histórico segue inteiro e o cursor fica abaixo dele', () => {
    let game = step(fresh(), (g) => gamePlace(g, 0, 0, 1));
    game = step(game, (g) => gamePlace(g, 1, 1, 5));
    game = step(game, (g) => gameUndo(g));

    const { data } = parsed(game);

    expect(data.moves).toEqual([
      [0, 0, 1],
      [0, 10, 5],
    ]);
    expect(data.cursor).toBe(1);
    expect(data.values.slice(0, 1)).toBe('1');
    expect(data.values[10]).toBe('.');
  });

  it('CA-004-30: partida vencida serializa com o mesmo histórico e cursor', () => {
    const created = createGame(almostSolvedInput(3, 1));
    if (!created.ok) throw new Error('fixture inválida');
    const won = step(created.value, (g) => gamePlace(g, 3, 1, 3));
    expect(getGameStatus(won)).toBe('won');

    const { data } = parsed(won);

    expect(data.moves).toEqual([[0, 28, 3]]);
    expect(data.cursor).toBe(1);
    expect(data.values[28]).toBe('3');
  });
});

function fresh(): Game {
  const created = createGame(validPuzzleInput());
  if (!created.ok) throw new Error('fixture inválida');
  return created.value;
}

function step(game: Game, act: (g: Game) => { ok: boolean; value?: Game }): Game {
  const next = act(game);
  if (!next.ok || next.value === undefined) throw new Error('fixture inválida');
  return next.value;
}

function parsed(game: Game): {
  schemaVersion: number;
  data: { moves: number[][]; notes: number[]; cursor: number; values: string };
} {
  return JSON.parse(serializeGame(game));
}
