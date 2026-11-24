import { describe, expect, it } from 'vitest';
import { emptyNotes, toggleNote } from './notes';

describe('notes', () => {
  it('CA-004-02: alternar 7, 2 e 4 nessa ordem dá [2, 4, 7] em ordem crescente', () => {
    const afterSeven = toggleNote(emptyNotes, 7);
    const afterTwo = toggleNote(afterSeven, 2);
    const afterFour = toggleNote(afterTwo, 4);

    expect(afterFour).toEqual([2, 4, 7]);
  });

  it('CA-004-02: alternar de novo um dígito já presente remove a anotação', () => {
    const withNotes = toggleNote(toggleNote(toggleNote(emptyNotes, 7), 2), 4);

    expect(toggleNote(withNotes, 2)).toEqual([4, 7]);
  });

  it('CA-004-02: o resultado é congelado e a entrada não é mutada', () => {
    const before = toggleNote(toggleNote(emptyNotes, 7), 2);

    const inserted = toggleNote(before, 4);
    const removed = toggleNote(before, 2);

    expect(before).toEqual([2, 7]);
    expect(Object.isFrozen(inserted)).toBe(true);
    expect(Object.isFrozen(removed)).toBe(true);
    expect(Object.isFrozen(toggleNote(emptyNotes, 5))).toBe(true);
  });
});
