import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { findConflicts } from './conflicts';
import type { Digit } from './digit';
import type { Unit } from './units';

/** Grade de 81 caracteres (`.` = vazio) para a lista plana de valores. */
function values(grid: string): (Digit | null)[] {
  return [...grid].map((ch) => (ch === '.' ? null : (Number(ch) as Digit)));
}

/** Grade de 81 valores com `value` em cada posição `[linha, coluna]` dada. */
function placed(value: Digit, cells: readonly (readonly [number, number])[]): (Digit | null)[] {
  const grid: (Digit | null)[] = Array.from({ length: 81 }, () => null);
  for (const [r, c] of cells) grid[r * 9 + c] = value;
  return grid;
}

describe('findConflicts', () => {
  it('CA-001-09: duas células com 5 na mesma linha constam em conflito, com a linha como unidade', () => {
    // 5 em (2,1) e (2,7): mesma linha 2, colunas e blocos distintos.
    const grid = [
      '.........',
      '.........',
      '.5.....5.',
      '.........',
      '.........',
      '.........',
      '.........',
      '.........',
      '.........',
    ].join('');

    expect(findConflicts(values(grid))).toEqual([
      { row: 2, col: 1, value: 5, units: [{ kind: 'row', index: 2 }] },
      { row: 2, col: 7, value: 5, units: [{ kind: 'row', index: 2 }] },
    ]);
  });

  it('CA-001-10: duas células com 5 na mesma coluna constam em conflito, com a coluna como unidade', () => {
    // 5 em (1,6) e (7,6): mesma coluna 6, linhas e blocos distintos.
    const grid = [
      '.........',
      '......5..',
      '.........',
      '.........',
      '.........',
      '.........',
      '.........',
      '......5..',
      '.........',
    ].join('');

    expect(findConflicts(values(grid))).toEqual([
      { row: 1, col: 6, value: 5, units: [{ kind: 'column', index: 6 }] },
      { row: 7, col: 6, value: 5, units: [{ kind: 'column', index: 6 }] },
    ]);
  });

  it('CA-001-13: grade toda vazia não tem conflito', () => {
    expect(findConflicts(values('.'.repeat(81)))).toEqual([]);
  });

  it('CA-001-13: grade resolvida completa não tem conflito', () => {
    const solved = [
      '123456789',
      '456789123',
      '789123456',
      '234567891',
      '567891234',
      '891234567',
      '345678912',
      '678912345',
      '912345678',
    ].join('');

    expect(findConflicts(values(solved))).toEqual([]);
  });

  it('CA-001-12: 5 em (1,2) e (5,7), sem linha, coluna nem bloco em comum, não é conflito', () => {
    const grid = [
      '.........',
      '..5......',
      '.........',
      '.........',
      '.........',
      '.......5.',
      '.........',
      '.........',
      '.........',
    ].join('');

    expect(findConflicts(values(grid))).toEqual([]);
  });

  it('dois valores distintos repetidos (5 e 3) em ordem de índice crescente, sem misturar', () => {
    // 5 em (1,2),(1,8) e 3 em (2,1),(2,7): o 5 vem antes do 3 pelo índice, não pelo valor.
    const grid = [
      '.........',
      '..5.....5',
      '.3.....3.',
      '.........',
      '.........',
      '.........',
      '.........',
      '.........',
      '.........',
    ].join('');

    expect(findConflicts(values(grid))).toEqual([
      { row: 1, col: 2, value: 5, units: [{ kind: 'row', index: 1 }] },
      { row: 1, col: 8, value: 5, units: [{ kind: 'row', index: 1 }] },
      { row: 2, col: 1, value: 3, units: [{ kind: 'row', index: 2 }] },
      { row: 2, col: 7, value: 3, units: [{ kind: 'row', index: 2 }] },
    ]);
  });

  it('as células em conflito saem em índice crescente, não em ordem de valor', () => {
    // 9 em (0,3),(0,8) e 2 em (4,0),(4,5): o 9 vem antes do 2 pelo índice.
    const grid = [
      '...9....9',
      '.........',
      '.........',
      '.........',
      '2....2...',
      '.........',
      '.........',
      '.........',
      '.........',
    ].join('');

    expect(findConflicts(values(grid))).toEqual([
      { row: 0, col: 3, value: 9, units: [{ kind: 'row', index: 0 }] },
      { row: 0, col: 8, value: 9, units: [{ kind: 'row', index: 0 }] },
      { row: 4, col: 0, value: 2, units: [{ kind: 'row', index: 4 }] },
      { row: 4, col: 5, value: 2, units: [{ kind: 'row', index: 4 }] },
    ]);
  });

  it('CA-001-11: duas células com 5 no mesmo bloco, sem linha nem coluna em comum, constam em conflito, com o bloco como unidade', () => {
    // 5 em (6,7) e (7,8): bloco 8, linhas e colunas distintas.
    expect(
      findConflicts(
        placed(5, [
          [6, 7],
          [7, 8],
        ]),
      ),
    ).toEqual([
      { row: 6, col: 7, value: 5, units: [{ kind: 'box', index: 8 }] },
      { row: 7, col: 8, value: 5, units: [{ kind: 'box', index: 8 }] },
    ]);
  });

  it('CA-001-14: triângulo A=(0,0), B=(0,5), C=(5,0): A em row+column, B só row, C só column', () => {
    expect(
      findConflicts(
        placed(5, [
          [0, 0],
          [0, 5],
          [5, 0],
        ]),
      ),
    ).toEqual([
      {
        row: 0,
        col: 0,
        value: 5,
        units: [
          { kind: 'row', index: 0 },
          { kind: 'column', index: 0 },
        ],
      },
      { row: 0, col: 5, value: 5, units: [{ kind: 'row', index: 0 }] },
      { row: 5, col: 0, value: 5, units: [{ kind: 'column', index: 0 }] },
    ]);
  });

  it('CA-001-14: três células com 7 na mesma coluna constam todas em conflito', () => {
    expect(
      findConflicts(
        placed(7, [
          [0, 4],
          [4, 4],
          [8, 4],
        ]),
      ),
    ).toEqual([
      { row: 0, col: 4, value: 7, units: [{ kind: 'column', index: 4 }] },
      { row: 4, col: 4, value: 7, units: [{ kind: 'column', index: 4 }] },
      { row: 8, col: 4, value: 7, units: [{ kind: 'column', index: 4 }] },
    ]);
  });

  it('CA-001-19: célula que repete na linha e na coluna consta uma vez, com row e column', () => {
    // 5 em (2,3), (2,8) e (6,3): (2,3) repete na linha 2 e na coluna 3; blocos 1, 2 e 7.
    expect(
      findConflicts(
        placed(5, [
          [2, 3],
          [2, 8],
          [6, 3],
        ]),
      ),
    ).toEqual([
      {
        row: 2,
        col: 3,
        value: 5,
        units: [
          { kind: 'row', index: 2 },
          { kind: 'column', index: 3 },
        ],
      },
      { row: 2, col: 8, value: 5, units: [{ kind: 'row', index: 2 }] },
      { row: 6, col: 3, value: 5, units: [{ kind: 'column', index: 3 }] },
    ]);
  });

  it.each([
    [2, 2, 3, 3],
    [0, 2, 1, 3],
    [2, 0, 3, 1],
  ])(
    'CA-001-12: 5 em (%i,%i) e (%i,%i), em blocos vizinhos sem linha, coluna nem bloco em comum, não é conflito',
    (r1, c1, r2, c2) => {
      expect(
        findConflicts(
          placed(5, [
            [r1, c1],
            [r2, c2],
          ]),
        ),
      ).toEqual([]);
    },
  );

  it('linha e bloco juntos: 5 em (7,6) e (7,8) listam row e box, sem column', () => {
    const units: [Unit, Unit] = [
      { kind: 'row', index: 7 },
      { kind: 'box', index: 8 },
    ];
    expect(
      findConflicts(
        placed(5, [
          [7, 6],
          [7, 8],
        ]),
      ),
    ).toEqual([
      { row: 7, col: 6, value: 5, units },
      { row: 7, col: 8, value: 5, units },
    ]);
  });

  it('INV: P2a findConflicts equivale ao oráculo ingênuo por pares', () => {
    const cell = fc.option(fc.integer({ min: 1, max: 9 }), { nil: null });
    const boxOf = (i: number): number =>
      3 * Math.floor(Math.floor(i / 9) / 3) + Math.floor((i % 9) / 3);
    const rowOf = (i: number): number => Math.floor(i / 9);
    const colOf = (i: number): number => i % 9;

    fc.assert(
      fc.property(fc.array(cell, { minLength: 81, maxLength: 81 }), (raw) => {
        const vals = raw as (Digit | null)[];
        const expected: unknown[] = [];
        vals.forEach((value, i) => {
          if (value === null) return;
          const same = (key: (n: number) => number): boolean =>
            vals.some((o, j) => j !== i && o === value && key(j) === key(i));
          const units: Unit[] = [];
          if (same(rowOf)) units.push({ kind: 'row', index: rowOf(i) as Unit['index'] });
          if (same(colOf)) units.push({ kind: 'column', index: colOf(i) as Unit['index'] });
          if (same(boxOf)) units.push({ kind: 'box', index: boxOf(i) as Unit['index'] });
          if (units.length > 0) {
            expected.push({ row: rowOf(i), col: colOf(i), value, units });
          }
        });
        expect(findConflicts(vals)).toEqual(expected);
      }),
      { seed: 20260003, numRuns: 300 },
    );
  });
});
