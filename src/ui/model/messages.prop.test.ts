import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { Digit } from '../../domain/digit';
import type { Index } from '../../domain/units';
import { cellLabel, type CellView } from './messages';

const indexArb: fc.Arbitrary<Index> = fc.constantFrom<Index>(0, 1, 2, 3, 4, 5, 6, 7, 8);
const digitArb: fc.Arbitrary<Digit> = fc.constantFrom<Digit>(1, 2, 3, 4, 5, 6, 7, 8, 9);

// CellView válida: pista sempre tem valor (given => value != null); conflito só com valor.
const viewArb: fc.Arbitrary<CellView> = fc
  .record({
    value: fc.option(digitArb, { nil: null }),
    given: fc.boolean(),
    conflicted: fc.boolean(),
  })
  .map(({ value, given, conflicted }) => ({
    value,
    given: value !== null && given,
    conflicted: value !== null && conflicted,
  }));

const SEED = 20261126;

describe('messages.cellLabel (propriedades)', () => {
  it('CA-005-02: o rótulo traz row+1 e col+1; "pista" só se given; "em conflito" só se conflicted (CA-005-03, CA-005-19)', () => {
    fc.assert(
      fc.property(indexArb, indexArb, viewArb, (row, col, view) => {
        const label = cellLabel(row, col, view);
        expect(label).toContain(`Linha ${row + 1},`);
        expect(label).toContain(`coluna ${col + 1},`);
        expect(label.includes('pista')).toBe(view.given);
        expect(label.includes('em conflito')).toBe(view.conflicted);
        expect(label.includes('vazia')).toBe(view.value === null);
      }),
      { seed: SEED, numRuns: 200 },
    );
  });

  it('INV: o gerador alcança given e conflicted verdadeiros e falsos, valor nulo e as bordas 0 e 8', () => {
    const samples = fc.sample(fc.tuple(indexArb, indexArb, viewArb), { seed: SEED, numRuns: 500 });
    expect(samples.some(([, , v]) => v.given)).toBe(true);
    expect(samples.some(([, , v]) => !v.given)).toBe(true);
    expect(samples.some(([, , v]) => v.conflicted)).toBe(true);
    expect(samples.some(([, , v]) => !v.conflicted)).toBe(true);
    expect(samples.some(([, , v]) => v.value === null)).toBe(true);
    expect(samples.some(([r]) => r === 0)).toBe(true);
    expect(samples.some(([r]) => r === 8)).toBe(true);
    expect(samples.some(([, c]) => c === 0)).toBe(true);
    expect(samples.some(([, c]) => c === 8)).toBe(true);
  });
});
