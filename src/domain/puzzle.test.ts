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

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['número', 42],
    ['texto', 'puzzle'],
    ['array', []],
  ])('INV: recusa malformed-puzzle (sem lançar) quando a entrada é %s', (_name, input) => {
    expect(createPuzzle(input)).toEqual({ ok: false, reason: 'malformed-puzzle' });
  });

  const gridWith = (edit: (rows: unknown[][]) => void): unknown => {
    const rows = validPuzzleInput().solution.map((row) => [...row]);
    edit(rows);
    return rows;
  };

  const badGrids: [string, unknown][] = [
    ['com 8 linhas', gridWith((rows) => rows.pop())],
    ['com 10 linhas', gridWith((rows) => rows.push([...(rows[0] ?? [])]))],
    ['com uma linha de 8 colunas', gridWith((rows) => rows[2]?.pop())],
    ['com uma linha de 10 colunas', gridWith((rows) => rows[2]?.push(1))],
    ['com uma linha que não é array', gridWith((rows) => rows.splice(2, 1, 'abcdefghi' as never))],
    ['com célula 10 em (2,7)', gridWith((rows) => rows[2]?.splice(7, 1, 10))],
    ['com célula 0 em (2,7)', gridWith((rows) => rows[2]?.splice(7, 1, 0))],
    ['com célula -1 em (2,7)', gridWith((rows) => rows[2]?.splice(7, 1, -1))],
    ['com célula 1,5 em (2,7)', gridWith((rows) => rows[2]?.splice(7, 1, 1.5))],
    ['com célula "5" (texto) em (2,7)', gridWith((rows) => rows[2]?.splice(7, 1, '5'))],
    ['com célula undefined em (2,7)', gridWith((rows) => rows[2]?.splice(7, 1, undefined))],
  ];

  it.each(badGrids)('INV: recusa malformed-puzzle quando givens vem %s', (_name, givens) => {
    expect(createPuzzle({ ...validPuzzleInput(), givens })).toEqual({
      ok: false,
      reason: 'malformed-puzzle',
    });
  });

  it.each(badGrids)('INV: recusa malformed-puzzle quando solution vem %s', (_name, solution) => {
    expect(createPuzzle({ ...validPuzzleInput(), solution })).toEqual({
      ok: false,
      reason: 'malformed-puzzle',
    });
  });
});
