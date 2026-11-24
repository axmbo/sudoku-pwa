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
});
