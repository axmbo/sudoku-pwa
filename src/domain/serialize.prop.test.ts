import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { anyGame } from './__arbitraries__/moves';
import { serializeGame } from './serialize';

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
});
