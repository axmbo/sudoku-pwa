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
    notes: [] as readonly Digit[],
  }));

interface NotedView {
  readonly value: Digit | null;
  readonly given: boolean;
  readonly conflicted: boolean;
  readonly notes: readonly Digit[];
}
// Evita TS2353 (propriedade excedente) enquanto CellView ainda não tem `notes` (RED da T03).
const noted = (v: NotedView): NotedView => v;

const SEED = 20261126;
const PROP_TIMEOUT = 30_000;

// Anotações: subconjunto de 1 a 9 em ordem crescente (como `Notes` do domínio).
const notesArb: fc.Arbitrary<readonly Digit[]> = fc
  .subarray<Digit>([1, 2, 3, 4, 5, 6, 7, 8, 9])
  .map((ds) => [...ds].sort((a, b) => a - b));

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

  it(
    'CA-005-45: o rótulo da célula vazia lista as anotações em ordem crescente, sem repetição; vazio não traz o trecho',
    () => {
      fc.assert(
        fc.property(indexArb, indexArb, notesArb, fc.boolean(), (row, col, notes, conflicted) => {
          const label = cellLabel(
            row,
            col,
            noted({ value: null, given: false, conflicted, notes }),
          );
          if (notes.length === 0) {
            expect(label).not.toContain('anotações');
            return;
          }
          const match = /anotações ((?:\d)(?: \d)*)/.exec(label);
          expect(match).not.toBeNull();
          const listed = ((match as RegExpExecArray)[1] ?? '').split(' ').map(Number);
          expect(listed).toEqual([...new Set(listed)].sort((a, b) => a - b));
          expect(listed).toEqual([...notes]);
          expect(label.endsWith('em conflito')).toBe(conflicted);
        }),
        { seed: SEED, numRuns: 200 },
      );
    },
    PROP_TIMEOUT,
  );

  it('INV: o gerador de anotações alcança vazio, unitário e cheio', () => {
    const samples = fc.sample(notesArb, { seed: SEED, numRuns: 500 });
    expect(samples.some((n) => n.length === 0)).toBe(true);
    expect(samples.some((n) => n.length === 1)).toBe(true);
    expect(samples.some((n) => n.length >= 5)).toBe(true);
  });
});
