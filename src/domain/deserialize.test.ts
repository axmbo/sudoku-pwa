import { describe, expect, it } from 'vitest';
import { validPuzzleInput } from './__arbitraries__/puzzle';
import { createGame, gamePlace, gameToggleNote, type Game } from './game';
import { deserializeGame, serializeGame } from './serialize';

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

/** Envelope válido da partida de exemplo, como objeto, para os casos mutados. */
const envelope = (): { schemaVersion: unknown; data: Record<string, unknown> } =>
  JSON.parse(serializeGame(sample())) as { schemaVersion: unknown; data: Record<string, unknown> };

const withData = (key: string, value: unknown): string => {
  const env = envelope();
  env.data[key] = value;
  return JSON.stringify(env);
};

const withoutData = (key: string): string => {
  const env = envelope();
  const rest = Object.fromEntries(Object.entries(env.data).filter(([name]) => name !== key));
  return JSON.stringify({ ...env, data: rest });
};

const withVersion = (version: unknown): string => {
  const env = envelope();
  env.schemaVersion = version;
  return JSON.stringify(env);
};

describe('deserializeGame (leitura)', () => {
  it('CA-004-25: o texto de serializeGame volta como a mesma partida', () => {
    const game = sample();
    expect(deserializeGame(serializeGame(game))).toEqual({ ok: true, value: game });
  });
});

describe('deserializeGame (recusas)', () => {
  it('CA-004-28: texto vazio é recusado como invalid-data, sem lançar', () => {
    expect(deserializeGame('')).toEqual({ ok: false, reason: 'invalid-data' });
  });

  it.each<[string, unknown]>([
    ['texto que não é JSON', '{"schemaVersion":1,'],
    ['JSON que é número', '42'],
    ['JSON que é lista', '[]'],
    ['JSON null', 'null'],
    ['entrada que não é texto', 42],
    ['envelope sem data', JSON.stringify({ schemaVersion: 1 })],
    ['data sem puzzle', withoutData('puzzle')],
    ['data sem values', withoutData('values')],
    ['data sem notes', withoutData('notes')],
    ['data sem moves', withoutData('moves')],
    ['data sem cursor', withoutData('cursor')],
    ['values com tipo errado', withData('values', 5)],
    ['notes com tipo errado', withData('notes', 'x')],
    ['moves com tipo errado', withData('moves', {})],
    ['cursor com tipo errado', withData('cursor', '0')],
    ['schemaVersion ausente', JSON.stringify({ data: envelope().data })],
    ['schemaVersion 1,5', withVersion(1.5)],
    ['schemaVersion texto "1"', withVersion('1')],
    ['schemaVersion 0', withVersion(0)],
    ['schemaVersion -1', withVersion(-1)],
  ])('CA-004-28: %s é recusado como invalid-data, sem lançar', (_nome, input) => {
    expect(deserializeGame(input)).toEqual({ ok: false, reason: 'invalid-data' });
  });
});
