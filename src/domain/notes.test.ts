import { describe, expect, it } from 'vitest';
import { emptyNotes, toggleNote } from './notes';

describe('notes', () => {
  it('CA-004-02: alternar 7, 2 e 4 nessa ordem dá [2, 4, 7] em ordem crescente', () => {
    const afterSeven = toggleNote(emptyNotes, 7);
    const afterTwo = toggleNote(afterSeven, 2);
    const afterFour = toggleNote(afterTwo, 4);

    expect(afterFour).toEqual([2, 4, 7]);
  });
});
