import fc from 'fast-check';
import { describe, it } from 'vitest';
import type { Digit } from './digit';
import { emptyNotes, toggleNote } from './notes';

const anyDigit = fc.integer({ min: 1, max: 9 }) as fc.Arbitrary<Digit>;

describe('notes (propriedades)', () => {
  it('CA-004-02: qualquer sequência de alternâncias dá lista crescente, sem repetição e congelada', () => {
    fc.assert(
      fc.property(fc.array(anyDigit, { maxLength: 40 }), (digits) => {
        const notes = digits.reduce(toggleNote, emptyNotes);
        return (
          Object.isFrozen(notes) && notes.every((d, i) => i === 0 || (notes[i - 1] as number) < d)
        );
      }),
    );
  });

  it('CA-004-02: a lista final é exatamente os dígitos alternados um número ímpar de vezes', () => {
    fc.assert(
      fc.property(fc.array(anyDigit, { maxLength: 40 }), (digits) => {
        const notes = digits.reduce(toggleNote, emptyNotes);
        const expected = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(
          (d) => digits.filter((x) => x === d).length % 2 === 1,
        );
        return JSON.stringify(notes) === JSON.stringify(expected);
      }),
    );
  });
});
