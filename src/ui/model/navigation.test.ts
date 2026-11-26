import { describe, expect, it } from 'vitest';
import type { Index } from '../../domain/units';
import { moveSelection, type Selection } from './navigation';

const at = (row: Index, col: Index): Selection => ({ row, col });

describe('moveSelection', () => {
  it('CA-005-07: seta para cima vai à vizinha de cima', () => {
    expect(moveSelection(at(4, 4), 'ArrowUp', false)).toEqual(at(3, 4));
  });

  it('CA-005-07: seta para baixo vai à vizinha de baixo', () => {
    expect(moveSelection(at(4, 4), 'ArrowDown', false)).toEqual(at(5, 4));
  });

  it('CA-005-07: seta para a esquerda vai à vizinha da esquerda', () => {
    expect(moveSelection(at(4, 4), 'ArrowLeft', false)).toEqual(at(4, 3));
  });

  it('CA-005-07: seta para a direita vai à vizinha da direita', () => {
    expect(moveSelection(at(4, 4), 'ArrowRight', false)).toEqual(at(4, 5));
  });

  it('CA-005-08: seta para cima na linha 0 não se move nem dá volta', () => {
    expect(moveSelection(at(0, 4), 'ArrowUp', false)).toEqual(at(0, 4));
  });

  it('CA-005-08: seta para baixo na linha 8 não se move nem dá volta', () => {
    expect(moveSelection(at(8, 4), 'ArrowDown', false)).toEqual(at(8, 4));
  });

  it('CA-005-08: seta para a esquerda na coluna 0 não se move nem dá volta', () => {
    expect(moveSelection(at(4, 0), 'ArrowLeft', false)).toEqual(at(4, 0));
  });

  it('CA-005-08: seta para a direita na coluna 8 não se move nem dá volta', () => {
    expect(moveSelection(at(4, 8), 'ArrowRight', false)).toEqual(at(4, 8));
  });

  it.each([
    ['canto (0,0)', 'ArrowUp', at(0, 0), at(0, 0)],
    ['canto (0,0)', 'ArrowLeft', at(0, 0), at(0, 0)],
    ['canto (0,8)', 'ArrowUp', at(0, 8), at(0, 8)],
    ['canto (0,8)', 'ArrowRight', at(0, 8), at(0, 8)],
    ['canto (8,0)', 'ArrowDown', at(8, 0), at(8, 0)],
    ['canto (8,0)', 'ArrowLeft', at(8, 0), at(8, 0)],
    ['canto (8,8)', 'ArrowDown', at(8, 8), at(8, 8)],
    ['canto (8,8)', 'ArrowRight', at(8, 8), at(8, 8)],
  ] as const)('CA-005-08: %s, %s para fora fica parado', (_canto, key, from, expected) => {
    expect(moveSelection(from, key, false)).toEqual(expected);
  });

  it('CA-005-08: no canto (0,0) as setas para dentro ainda movem', () => {
    expect(moveSelection(at(0, 0), 'ArrowDown', false)).toEqual(at(1, 0));
    expect(moveSelection(at(0, 0), 'ArrowRight', false)).toEqual(at(0, 1));
  });

  it('CA-005-09: Home vai à primeira célula da linha, mantendo a linha', () => {
    expect(moveSelection(at(5, 6), 'Home', false)).toEqual(at(5, 0));
  });

  it('CA-005-09: End vai à última célula da linha, mantendo a linha', () => {
    expect(moveSelection(at(5, 2), 'End', false)).toEqual(at(5, 8));
  });

  it('CA-005-09: Ctrl+Home vai à primeira célula da grade (1,1)', () => {
    expect(moveSelection(at(5, 6), 'Home', true)).toEqual(at(0, 0));
  });

  it('CA-005-09: Ctrl+End vai à última célula da grade (9,9)', () => {
    expect(moveSelection(at(5, 2), 'End', true)).toEqual(at(8, 8));
  });
});
