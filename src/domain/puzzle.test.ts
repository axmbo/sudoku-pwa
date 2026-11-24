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

  const withoutField = (field: string): unknown =>
    Object.fromEntries(Object.entries(validPuzzleInput()).filter(([key]) => key !== field));

  it.each([
    ['givens ausente', withoutField('givens')],
    ['solution ausente', withoutField('solution')],
    ['difficulty ausente', withoutField('difficulty')],
    ['seed ausente', withoutField('seed')],
    ['generatorVersion ausente', withoutField('generatorVersion')],
    ['seed vazia', { ...validPuzzleInput(), seed: '' }],
    ['generatorVersion 0', { ...validPuzzleInput(), generatorVersion: 0 }],
    ['generatorVersion 1,5', { ...validPuzzleInput(), generatorVersion: 1.5 }],
  ])('INV: recusa malformed-puzzle quando %s', (_name, input) => {
    expect(createPuzzle(input)).toEqual({ ok: false, reason: 'malformed-puzzle' });
  });
});
