import fc from 'fast-check';
import { describe, it } from 'vitest';
import { isDigit } from './digit';

describe('digit (propriedades)', () => {
  it('INV: para todo inteiro n, isDigit(n) equivale a 1 <= n <= 9', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => isDigit(n) === (n >= 1 && n <= 9)),
      { seed: 20260001, numRuns: 1000 },
    );
  });

  it('INV: todo inteiro de 1 a 9 é dígito', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 9 }), (n) => isDigit(n)),
      { seed: 20260002 },
    );
  });
});
