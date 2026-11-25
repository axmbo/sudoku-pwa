import { describe, expect, it } from 'vitest';
import { almostSolvedInput, solutionGrid, validPuzzleInput } from './__arbitraries__/puzzle';
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
    ['cursor não inteiro (1,5)', withPatch((d) => (d.cursor = 1.5))],
  ])('CA-004-28: %s é recusado como invalid-data, sem lançar', (_nome, input) => {
    expect(deserializeGame(input)).toEqual({ ok: false, reason: 'invalid-data' });
  });
});

describe('deserializeGame (versão futura)', () => {
  it.each<[string, string]>([
    ['versão 2 com o resto íntegro', withVersion(2)],
    ['versão 99 com o resto íntegro', withVersion(99)],
    ['versão 2 sem data', JSON.stringify({ schemaVersion: 2 })],
    ['versão 99 com data ilegível', JSON.stringify({ schemaVersion: 99, data: 'lixo' })],
    [
      'versão 2 com campo de tipo errado',
      withData('cursor', '0').replace('"schemaVersion":1', '"schemaVersion":2'),
    ],
  ])('CA-004-27: %s é recusada como future-version', (_nome, input) => {
    const antes = input;
    expect(deserializeGame(input)).toEqual({ ok: false, reason: 'future-version' });
    expect(input).toBe(antes);
  });
});

/** Troca o caractere `at` do texto por `char`. */
const setChar = (text: string, at: number, char: string): string =>
  text.slice(0, at) + char + text.slice(at + 1);

/** Envelope da partida de exemplo (cursor 3, moves place/toggle) com `data` ajustado por `patch`. */
const withPatch = (patch: (data: Record<string, unknown>) => void): string => {
  const env = envelope();
  patch(env.data);
  return JSON.stringify(env);
};

const withPuzzle = (patch: (puzzle: Record<string, unknown>) => void): string =>
  withPatch((data) => patch(data.puzzle as Record<string, unknown>));

const withNotes = (index: number, mask: number): string =>
  withPatch((data) => {
    (data.notes as number[])[index] = mask;
  });

/** Partida vencida (falta só (2,7)), serializada e depois ajustada para `cursor` 0 e sem o valor. */
const wonThenRewound = (): string => {
  const created = createGame(almostSolvedInput(2, 7));
  if (!created.ok) throw new Error('fixture inválida');
  const won = gamePlace(created.value, 2, 7, (solutionGrid[2] as number[])[7] as number);
  if (!won.ok) throw new Error('fixture inválida');
  const env = JSON.parse(serializeGame(won.value)) as { data: Record<string, unknown> };
  env.data.cursor = 0;
  env.data.values = setChar(env.data.values as string, 25, '.');
  return JSON.stringify(env);
};

describe('deserializeGame (dado incoerente)', () => {
  it.each<[string, string]>([
    ['INV: puzzle com seed vazia (malformed-puzzle)', withPuzzle((p) => (p.seed = ''))],
    [
      'INV: puzzle com generatorVersion 0 (malformed-puzzle)',
      withPuzzle((p) => (p.generatorVersion = 0)),
    ],
    [
      'INV: pistas com valor repetido na linha (conflicting-givens)',
      withPuzzle((p) => (p.givens = setChar(p.givens as string, 2, '2'))),
    ],
    [
      'solução que contradiz as pistas',
      withPuzzle((p) => (p.solution = setChar(p.solution as string, 1, '5'))),
    ],
    [
      'valor sobre pista diferente do dado',
      withPatch((d) => (d.values = setChar(d.values as string, 1, '5'))),
    ],
    [
      'valor gravado ausente: o histórico coloca o 1 em (0,0) mas values não o tem',
      withPatch((d) => (d.values = setChar(d.values as string, 0, '.'))),
    ],
    [
      'valor gravado sem jogada que o explique em (2,7)',
      withPatch((d) => (d.values = setChar(d.values as string, 25, '5'))),
    ],
    ['anotação em célula com valor', withNotes(0, 2)],
    ['anotação em pista', withNotes(1, 2)],
    ['máscara de anotações diferente da reconstruída em (2,7)', withNotes(25, 2)],
    ['anotação gravada sem jogada que a explique em (7,2)', withNotes(65, 4)],
    [
      'histórico truncado que não leva ao estado gravado',
      withPatch((d) => {
        d.moves = (d.moves as unknown[]).slice(0, 2);
        d.cursor = 2;
      }),
    ],
    ['cursor negativo', withPatch((d) => (d.cursor = -1))],
    ['cursor maior que moves.length', withPatch((d) => (d.cursor = 4))],
    ['jogada que o jogo recusaria (valor sobre pista)', withPatch((d) => (d.moves = [[0, 1, 5]]))],
    [
      'refazíveis inaplicáveis em sequência',
      withPatch((d) => {
        d.moves = [
          [0, 0, 1],
          [2, 0, 5],
        ];
        d.cursor = 1;
        d.notes = Array<number>(81).fill(0);
        d.values = setChar('.'.repeat(81), 0, '1');
      }),
    ],
    ['vencida antes do último movimento aplicado (undo após vitória)', wonThenRewound()],
  ])('CA-004-29: %s é recusado como inconsistent-data', (_nome, input) => {
    expect(deserializeGame(input)).toEqual({ ok: false, reason: 'inconsistent-data' });
  });
});
