import { describe, expect, it } from 'vitest';
import { validPuzzleInput } from './__arbitraries__/puzzle';
import { createGame, gamePlace, gameToggleNote, type Game } from './game';
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
});
