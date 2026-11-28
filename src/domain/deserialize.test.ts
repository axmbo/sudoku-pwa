import { describe, expect, it } from 'vitest';
import { almostSolvedInput, solutionGrid, validPuzzleInput } from './__arbitraries__/puzzle';
import {
  canRedo,
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
import type { Result } from './result';
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

describe('deserializeGame (formato das jogadas e das grades)', () => {
  const withMoves = (moves: unknown): string => withPatch((d) => (d.moves = moves));
  it.each<[string, string]>([
    ['kind de jogada fora de 0..3', withMoves([[9, 0, 1]])],
    ['kind de jogada negativo', withMoves([[-1, 0, 1]])],
    ['jogada que não é lista', withMoves([5])],
    ['jogada nula', withMoves([null])],
    ['jogada com 2 elementos', withMoves([[0, 0]])],
    ['jogada com 4 elementos', withMoves([[0, 0, 1, 1]])],
    ['jogada com índice texto', withMoves([[0, '0', 1]])],
    ['jogada com dígito texto', withMoves([[0, 0, '1']])],
    ['jogada com índice não inteiro', withMoves([[0, 0.5, 1]])],
    ['jogada com índice negativo', withMoves([[0, -1, 1]])],
    ['jogada com índice 81', withMoves([[0, 81, 1]])],
    ['givens com 80 caracteres', withPuzzle((p) => (p.givens = (p.givens as string).slice(1)))],
    [
      'givens com caractere fora de .1-9',
      withPuzzle((p) => (p.givens = setChar(p.givens as string, 3, '0'))),
    ],
    [
      'solution com caractere fora de .1-9',
      withPuzzle((p) => (p.solution = setChar(p.solution as string, 3, 'x'))),
    ],
    ['solution que não é texto', withPuzzle((p) => (p.solution = 5))],
  ])('CA-004-28: %s é recusado como invalid-data, sem lançar', (_nome, input) => {
    expect(deserializeGame(input)).toEqual({ ok: false, reason: 'invalid-data' });
  });
});

describe('deserializeGame (refazíveis)', () => {
  it.each([1, 2, 3])(
    'CA-004-25: partida com %i jogada(s) desfeita(s) volta igual, com refazíveis',
    (undone) => {
      let game = sample();
      for (let i = 0; i < undone; i++) {
        const result = gameUndo(game);
        if (!result.ok) throw new Error('fixture inválida');
        game = result.value;
      }
      const read = deserializeGame(serializeGame(game));
      expect(read).toEqual({ ok: true, value: game });
      expect(read.ok && canRedo(read.value)).toBe(true);
    },
  );
});

/** Aplica os passos em ordem sobre a partida; fixture inválida lança. */
const play = (start: Game, steps: readonly ((g: Game) => Result<Game, string>)[]): Game =>
  steps.reduce((game, step) => {
    const next = step(game);
    if (!next.ok) throw new Error('fixture inválida');
    return next.value;
  }, start);

describe('deserializeGame (vitória, conflitos e os quatro tipos de jogada)', () => {
  it('CA-004-30: partida vencida volta won, com o mesmo histórico', () => {
    const created = createGame(almostSolvedInput(2, 7));
    if (!created.ok) throw new Error('fixture inválida');
    const won = play(created.value, [
      (g) => gameToggleNote(g, 2, 7, 4),
      (g) => gamePlace(g, 2, 7, (solutionGrid[2] as number[])[7] as number),
    ]);
    expect(getGameStatus(won)).toBe('won');

    const read = deserializeGame(serializeGame(won));

    expect(read).toEqual({ ok: true, value: won });
    expect(read.ok && getGameStatus(read.value)).toBe('won');
    expect(read.ok && read.value.history).toEqual(won.history);
  });

  it('CA-004-31: conflitos e status voltam recalculados, iguais aos da original', () => {
    // 2 em (0,0) repete o 2 dado em (0,1): conflito derivado, nunca gravado.
    const conflicting = play(sample(), [(g) => gamePlace(g, 0, 0, 2)]);
    expect(getGameConflicts(conflicting).length).toBeGreaterThan(0);

    const read = deserializeGame(serializeGame(conflicting));

    expect(read.ok && getGameConflicts(read.value)).toEqual(getGameConflicts(conflicting));
    expect(read.ok && getGameStatus(read.value)).toBe(getGameStatus(conflicting));
  });

  it('CA-004-25: partida com place, erase, toggle-note e clear-notes volta igual', () => {
    const mixed = play(sample(), [
      (g) => gameErase(g, 0, 0),
      (g) => gameToggleNote(g, 3, 3, 5),
      (g) => gameToggleNote(g, 3, 3, 9),
      (g) => gameClearNotes(g, 3, 3),
      (g) => gamePlace(g, 4, 4, 5),
      (g) => gameToggleNote(g, 2, 7, 3),
    ]);

    expect(deserializeGame(serializeGame(mixed))).toEqual({ ok: true, value: mixed });
  });
});

describe('deserializeGame (jogadas sem efeito, bordas e leitura estrita)', () => {
  const moves = (list: unknown): string => withPatch((d) => (d.moves = list));
  const free = 30; // (3,3): vazia na fixture
  const given = 1; // (0,1): pista

  /**
   * Dado com `moves` e o estado gravado igual ao que uma leitura frouxa (que aceitasse a
   * jogada) produziria: assim só a recusa da jogada, e não a divergência de estado, causa o
   * `inconsistent-data`. `cells` e `notes` sobrescrevem a partida base (pistas, sem anotações).
   */
  const recorded = (
    list: unknown[],
    cells: Readonly<Record<number, string>> = {},
    notes: Readonly<Record<number, number>> = {},
  ): string =>
    withPatch((d) => {
      const base = [...(d.puzzle as { givens: string }).givens];
      d.values = base.map((char, i) => cells[i] ?? char).join('');
      d.notes = Array.from({ length: 81 }, (_zero, i) => notes[i] ?? 0);
      d.moves = list;
      d.cursor = list.length;
    });

  it.each<[string, string]>([
    [
      'place do valor que a célula já tem',
      recorded(
        [
          [0, free, 5],
          [0, free, 5],
        ],
        { [free]: '5' },
      ),
    ],
    ['erase de célula vazia', recorded([[1, free, 0]])],
    [
      'toggle-note em célula com valor',
      recorded(
        [
          [0, free, 5],
          [2, free, 3],
        ],
        { [free]: '5' },
        { [free]: 4 },
      ),
    ],
    ['clear-notes em célula sem anotação', recorded([[3, free, 0]])],
    ['erase em pista', recorded([[1, given, 0]], { [given]: '.' })],
    ['clear-notes em pista', recorded([[3, given, 0]])],
    ['toggle-note em pista', recorded([[2, given, 3]], {}, { [given]: 4 })],
    ['place com dígito 0 em célula livre', recorded([[0, free, 0]])],
    ['place com dígito 10 em célula livre', recorded([[0, free, 10]])],
    ['toggle-note com dígito 0 em célula livre', recorded([[2, free, 0]])],
    ['toggle-note com dígito 10 em célula livre', recorded([[2, free, 10]])],
  ])('CA-004-29: jogada sem efeito ou recusada (%s) é inconsistent-data', (_nome, input) => {
    expect(deserializeGame(input)).toEqual({ ok: false, reason: 'inconsistent-data' });
  });

  /**
   * Jogada com dígito fora de 1..9 como refazível (cursor 0, estado da partida nova): uma leitura
   * frouxa a aceitaria no replay e a desfaria, devolvendo `ok: true`; só a recusa da jogada dá
   * `inconsistent-data`.
   */
  const redoable = (move: unknown[]): string =>
    withPatch((d) => {
      d.values = (d.puzzle as { givens: string }).givens;
      d.notes = Array<number>(81).fill(0);
      d.moves = [move];
      d.cursor = 0;
    });

  it.each<[string, string]>([
    ['place com dígito 0 refazível', redoable([0, free, 0])],
    ['place com dígito 10 refazível', redoable([0, free, 10])],
    ['toggle-note com dígito 0 refazível', redoable([2, free, 0])],
    ['toggle-note com dígito 10 refazível', redoable([2, free, 10])],
  ])('CA-004-29: %s é inconsistent-data', (_nome, input) => {
    expect(deserializeGame(input)).toEqual({ ok: false, reason: 'inconsistent-data' });
  });

  it.each<[string, string]>([
    ['kind 5 (logo após o último válido, place-prune é 4)', moves([[5, 0, 1]])],
    ['kind 5 com dígito 0', moves([[5, 0, 0]])],
    ['givens com 82 caracteres', withPuzzle((p) => (p.givens = `${p.givens as string}1`))],
    ['solution com 82 caracteres', withPuzzle((p) => (p.solution = `${p.solution as string}1`))],
    [
      'givens com prefixo inválido e 80 válidos',
      withPuzzle((p) => (p.givens = `x${(p.givens as string).slice(1)}`)),
    ],
    [
      'solution com prefixo inválido e 80 válidos',
      withPuzzle((p) => (p.solution = `x${(p.solution as string).slice(1)}`)),
    ],
    [
      'givens com 80 válidos e sufixo inválido',
      withPuzzle((p) => (p.givens = `${(p.givens as string).slice(0, 80)}x`)),
    ],
    ['givens que não é texto', withPuzzle((p) => (p.givens = 5))],
    ['givens que é lista com o texto válido dentro', withPuzzle((p) => (p.givens = [p.givens]))],
    [
      'entrada que é lista com o texto válido dentro',
      [serializeGame(sample())] as unknown as string,
    ],
    [
      'entrada que é objeto String com o texto válido',
      new String(serializeGame(sample())) as unknown as string,
    ],
    ['entrada objeto vazio', {} as unknown as string],
  ])('CA-004-28: %s é invalid-data', (_nome, input) => {
    expect(deserializeGame(input)).toEqual({ ok: false, reason: 'invalid-data' });
  });

  it.each<[string, string]>([
    ['difficulty número', withPuzzle((p) => (p.difficulty = 5))],
    ['difficulty null', withPuzzle((p) => (p.difficulty = null))],
    ['difficulty objeto', withPuzzle((p) => (p.difficulty = {}))],
    ['seed número', withPuzzle((p) => (p.seed = 5))],
    ['generatorVersion texto', withPuzzle((p) => (p.generatorVersion = '1'))],
    ['generatorVersion não inteiro', withPuzzle((p) => (p.generatorVersion = 1.5))],
    ['generatorVersion null', withPuzzle((p) => (p.generatorVersion = null))],
    ['values com 80 caracteres', withPatch((d) => (d.values = (d.values as string).slice(1)))],
    ['values com 82 caracteres', withPatch((d) => (d.values = `${d.values as string}1`))],
    ['values com caractere 0', withPatch((d) => (d.values = setChar(d.values as string, 3, '0')))],
    ['values com caractere x', withPatch((d) => (d.values = setChar(d.values as string, 3, 'x')))],
    ['values que é lista com o texto dentro', withPatch((d) => (d.values = [d.values]))],
    ['notes com 80 elementos', withPatch((d) => (d.notes = (d.notes as number[]).slice(1)))],
    ['notes com 82 elementos', withPatch((d) => (d.notes = [...(d.notes as number[]), 0]))],
    ['notes com elemento 1.5', withNotes(3, 1.5)],
    ['notes com elemento texto', withNotes(3, '3' as unknown as number)],
    ['notes com elemento null', withNotes(3, null as unknown as number)],
    ['notes com elemento -1', withNotes(3, -1)],
    ['notes com elemento 512', withNotes(3, 512)],
    ['erase com dígito 5', withPatch((d) => (d.moves = [[1, 30, 5]]))],
    ['clear-notes com dígito 5', withPatch((d) => (d.moves = [[3, 30, 5]]))],
  ])('CA-004-28: %s é recusado como invalid-data (fronteira de tipo)', (_nome, input) => {
    expect(deserializeGame(input)).toEqual({ ok: false, reason: 'invalid-data' });
  });

  it('CA-004-25: jogada na última célula (índice 80) e no kind 3 voltam iguais', () => {
    const game = play(sample(), [(g) => gamePlace(g, 8, 8, 5), (g) => gameClearNotes(g, 2, 7)]);

    expect(deserializeGame(serializeGame(game))).toEqual({ ok: true, value: game });
  });
});
