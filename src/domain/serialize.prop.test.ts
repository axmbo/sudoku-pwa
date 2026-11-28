import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { anyGame, anyGameAction, applyGameAction, prunedGame } from './__arbitraries__/moves';
import { validPuzzleInput } from './__arbitraries__/puzzle';
import { createGame, gameRedo, gameToggleNote, gameUndo, type Game } from './game';
import { deserializeGame, serializeGame } from './serialize';

/** Partida de `anyGame` seguida de ações do jogador (recusas e sem efeito ficam de fora do histórico). */
const playedGame: fc.Arbitrary<Game> = fc
  .tuple(anyGame, fc.array(anyGameAction, { maxLength: 60 }))
  .map(([start, actions]) =>
    actions.reduce((game, action) => {
      const next = applyGameAction(game, action);
      return next.ok ? next.value : game;
    }, start),
  );

const PROP_TIMEOUT = 30_000;

const REASONS = ['invalid-data', 'future-version', 'inconsistent-data'];

function mutate(text: string, at: number, char: string): string {
  const index = at % Math.max(text.length, 1);
  return text.slice(0, index) + char + text.slice(index + 1);
}

describe('serialize (propriedades)', () => {
  it('CA-004-26: para todo jogo, duas serializações são idênticas byte a byte, JSON válido e schemaVersion 1', () => {
    fc.assert(
      fc.property(anyGame, (game) => {
        const first = serializeGame(game);
        const parsed: unknown = JSON.parse(first);

        expect(serializeGame(game)).toBe(first);
        expect((parsed as { schemaVersion: unknown }).schemaVersion).toBe(1);
        expect(Number.isInteger((parsed as { schemaVersion: number }).schemaVersion)).toBe(true);
      }),
    );
  });

  it('CA-004-31: o texto nunca contém status, conflicts nem before', () => {
    fc.assert(
      fc.property(anyGame, (game) => {
        const text = serializeGame(game);

        for (const forbidden of ['status', 'conflicts', 'before']) {
          expect(text).not.toContain(forbidden);
        }
      }),
    );
  });

  it('CA-004-25 e invariante 7: deserializeGame(serializeGame(g)) é g, com undo, redo e refazíveis', () => {
    fc.assert(
      fc.property(playedGame, (game) => {
        expect(deserializeGame(serializeGame(game))).toEqual({ ok: true, value: game });
      }),
    );
  });

  it(
    'CA-005-43 e invariante 7: com place-prune de poda real, deserialize(serialize(g)) é g; undo e redo lidos coincidem com os do original',
    () => {
      fc.assert(
        fc.property(prunedGame, (game) => {
          const read = deserializeGame(serializeGame(game));

          expect(read).toEqual({ ok: true, value: game });
          const lido = (read as { value: Game }).value;
          expect(gameUndo(lido)).toEqual(gameUndo(game));
          expect(gameRedo(lido)).toEqual(gameRedo(game));
        }),
        { seed: 20261128, numRuns: 50 },
      );
    },
    PROP_TIMEOUT,
  );

  it('CA-004-28: qualquer valor e texto arbitrário nunca lançam; devolvem ok ou um dos três motivos', () => {
    fc.assert(
      fc.property(fc.oneof(fc.anything(), fc.string(), fc.json()), (input) => {
        const result = deserializeGame(input);
        expect(result.ok || REASONS.includes(result.reason)).toBe(true);
      }),
    );
  });

  it('CA-004-28: JSON válido com um caractere trocado nunca lança', () => {
    fc.assert(
      fc.property(
        playedGame,
        fc.nat(),
        fc.string({ minLength: 1, maxLength: 1 }),
        (game, at, char) => {
          const result = deserializeGame(mutate(serializeGame(game), at, char));
          expect(result.ok || REASONS.includes(result.reason)).toBe(true);
        },
      ),
    );
  });

  it('CA-004-27: qualquer schemaVersion inteira ≥ 2 é future-version, seja qual for o resto', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: Number.MAX_SAFE_INTEGER }),
        fc.anything(),
        (version, rest) => {
          const text = JSON.stringify({ schemaVersion: version, data: rest });
          expect(deserializeGame(text)).toEqual({ ok: false, reason: 'future-version' });
        },
      ),
    );
  });

  it('regressão de tempo: partida de 10.000 jogadas é lida e volta igual', () => {
    const created = createGame(validPuzzleInput());
    if (!created.ok) throw new Error('fixture inválida');
    let game = created.value;
    for (let i = 0; i < 10_000; i++) {
      const next = gameToggleNote(game, 2, 7, (i % 9) + 1);
      if (!next.ok) throw new Error('fixture inválida');
      game = next.value;
    }
    expect(game.history).toHaveLength(10_000);

    const read = deserializeGame(serializeGame(game));

    expect(read).toEqual({ ok: true, value: game });
    // Sem limiar de tempo: a duração do teste (saída do runner) é registrada em notas.md.
  }, 60_000);
});
