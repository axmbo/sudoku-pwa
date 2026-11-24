import { describe, expect, it } from 'vitest';
import { validPuzzleInput } from './__arbitraries__/puzzle';
import { createPuzzle } from './puzzle';

describe('puzzle', () => {
  it('INV: createPuzzle aceita entrada válida e devolve o Puzzle congelado', () => {
    // [símbolo novo: `createPuzzle`]
    const input = validPuzzleInput();

    const result = createPuzzle(input);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual(input);
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.givens)).toBe(true);
    expect(Object.isFrozen(result.value.givens[2])).toBe(true);
    expect(Object.isFrozen(result.value.solution)).toBe(true);
    expect(Object.isFrozen(result.value.solution[2])).toBe(true);
  });
});
