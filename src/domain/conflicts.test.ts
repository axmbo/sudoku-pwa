import { describe, expect, it } from 'vitest';
import { findConflicts } from './conflicts';
import type { Digit } from './digit';

/** Grade de 81 caracteres (`.` = vazio) para a lista plana de valores. */
function values(grid: string): (Digit | null)[] {
  return [...grid].map((ch) => (ch === '.' ? null : (Number(ch) as Digit)));
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
});
