import { describe, expect, it } from 'vitest';
import { isDigit } from './digit';

describe('digit', () => {
  it.each([1, 9])('INV: aceita %i como dígito', (value) => {
    expect(isDigit(value)).toBe(true);
  });

  it.each([0, 10, 1.5, -1, Number.NaN])('INV: rejeita %s como dígito', (value) => {
    expect(isDigit(value)).toBe(false);
  });

  it.each([['5'], [null], [undefined], [-0], [Infinity]])(
    'INV: rejeita %o (entrada unknown, sem coerção) como dígito',
    (value) => {
      expect(isDigit(value)).toBe(false);
    },
  );
});
