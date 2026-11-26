import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { Index } from '../../domain/units';
import { moveSelection, type NavigationKey, type Selection } from './navigation';

const indexArb: fc.Arbitrary<Index> = fc.constantFrom<Index>(0, 1, 2, 3, 4, 5, 6, 7, 8);
const selectionArb: fc.Arbitrary<Selection> = fc.record({ row: indexArb, col: indexArb });
const keyArb: fc.Arbitrary<NavigationKey> = fc.constantFrom<NavigationKey>(
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
);
const arrowArb = fc.constantFrom<keyof typeof delta>(
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
);

const delta: Record<
  'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight',
  readonly [number, number]
> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

describe('moveSelection (propriedades)', () => {
  it('CA-005-07: o resultado fica sempre em 0-8 e a função nunca lança', () => {
    fc.assert(
      fc.property(selectionArb, keyArb, fc.boolean(), (from, key, ctrl) => {
        const to = moveSelection(from, key, ctrl);
        expect(to.row).toBeGreaterThanOrEqual(0);
        expect(to.row).toBeLessThanOrEqual(8);
        expect(to.col).toBeGreaterThanOrEqual(0);
        expect(to.col).toBeLessThanOrEqual(8);
      }),
      { seed: 20260501, numRuns: 500 },
    );
  });

  it('CA-005-07: seta dentro da grade desloca exatamente 1 numa só coordenada', () => {
    fc.assert(
      fc.property(selectionArb, arrowArb, fc.boolean(), (from, key, ctrl) => {
        const [dr, dc] = delta[key];
        const row = from.row + dr;
        const col = from.col + dc;
        fc.pre(row >= 0 && row <= 8 && col >= 0 && col <= 8);
        expect(moveSelection(from, key, ctrl)).toEqual({ row, col });
      }),
      { seed: 20260502, numRuns: 500 },
    );
  });

  it('CA-005-08: seta em direção à borda devolve a mesma seleção (nunca dá volta)', () => {
    fc.assert(
      fc.property(selectionArb, arrowArb, fc.boolean(), (from, key, ctrl) => {
        const [dr, dc] = delta[key];
        const row = from.row + dr;
        const col = from.col + dc;
        fc.pre(row < 0 || row > 8 || col < 0 || col > 8);
        expect(moveSelection(from, key, ctrl)).toEqual(from);
      }),
      { seed: 20260503, numRuns: 500 },
    );
  });

  it('CA-005-08: a mesma seta aplicada 9 vezes converge à borda e fica lá', () => {
    fc.assert(
      fc.property(selectionArb, arrowArb, (from, key) => {
        let cur = from;
        for (let i = 0; i < 9; i++) cur = moveSelection(cur, key, false);
        const [dr, dc] = delta[key];
        const onEdge =
          (dr === -1 && cur.row === 0) ||
          (dr === 1 && cur.row === 8) ||
          (dc === -1 && cur.col === 0) ||
          (dc === 1 && cur.col === 8);
        expect(onEdge).toBe(true);
        expect(moveSelection(cur, key, false)).toEqual(cur);
      }),
      { seed: 20260504, numRuns: 500 },
    );
  });

  it('CA-005-09: Home e End preservam a linha e levam à coluna 0 e 8', () => {
    fc.assert(
      fc.property(selectionArb, (from) => {
        expect(moveSelection(from, 'Home', false)).toEqual({ row: from.row, col: 0 });
        expect(moveSelection(from, 'End', false)).toEqual({ row: from.row, col: 8 });
      }),
      { seed: 20260505, numRuns: 200 },
    );
  });

  it('CA-005-09: Ctrl+Home e Ctrl+End independem da origem', () => {
    fc.assert(
      fc.property(selectionArb, (from) => {
        expect(moveSelection(from, 'Home', true)).toEqual({ row: 0, col: 0 });
        expect(moveSelection(from, 'End', true)).toEqual({ row: 8, col: 8 });
      }),
      { seed: 20260506, numRuns: 200 },
    );
  });
});
