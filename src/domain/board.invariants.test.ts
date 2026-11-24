import { describe, expect, it } from 'vitest';
import { createBoard, eraseValue, getConflicts, placeValue, type Board } from './board';

/** Tabuleiro a partir de 9 linhas de 9 caracteres (`.` = vazio). */
function boardOf(lines: readonly string[]): Board {
  const grid = lines.map((line) => [...line].map((ch) => (ch === '.' ? null : Number(ch))));
  const result = createBoard(grid);
  if (!result.ok) throw new Error(result.reason);
  return result.value;
}

function placed(board: Board, row: number, col: number, value: number): Board {
  const result = placeValue(board, row, col, value);
  if (!result.ok) throw new Error(result.reason);
  return result.value;
}

function erased(board: Board, row: number, col: number): Board {
  const result = eraseValue(board, row, col);
  if (!result.ok) throw new Error(result.reason);
  return result.value;
}

// Pista 5 em (2,1); o resto vazio. (2,7) e (2,4) estão na linha 2 de (2,1); (2,7) e (2,4) em blocos distintos.
const BASE = [
  '.........',
  '.........',
  '.5.......',
  '.........',
  '.........',
  '.........',
  '.........',
  '.........',
  '.........',
];

describe('board (invariantes)', () => {
  it('CA-001-17: apagar a célula do jogador remove o conflito das duas células', () => {
    const conflicting = placed(boardOf(BASE), 2, 7, 5);
    expect(getConflicts(conflicting)).toHaveLength(2);
    expect(getConflicts(erased(conflicting, 2, 7))).toEqual([]);
  });

  it('CA-001-17: trocar o valor da célula do jogador por um sem repetição remove o conflito', () => {
    const conflicting = placed(boardOf(BASE), 2, 7, 5);
    expect(getConflicts(placed(conflicting, 2, 7, 3))).toEqual([]);
  });

  it('CA-001-17: com três células iguais na linha, apagar uma deixa as outras duas em conflito', () => {
    const three = placed(placed(boardOf(BASE), 2, 7, 5), 2, 4, 5);
    expect(getConflicts(three)).toHaveLength(3);
    const after = getConflicts(erased(three, 2, 7));
    expect(after).toEqual([
      { row: 2, col: 1, value: 5, units: [{ kind: 'row', index: 2 }] },
      { row: 2, col: 4, value: 5, units: [{ kind: 'row', index: 2 }] },
    ]);
  });

  it('CA-001-18: 5 e depois 3 na célula A dá os mesmos conflitos que só 3', () => {
    const base = boardOf(['.........', '.........', '.3.......', ...BASE.slice(3)]);
    const viaFive = placed(placed(base, 2, 7, 5), 2, 7, 3);
    const direct = placed(base, 2, 7, 3);
    const expected = [
      { row: 2, col: 1, value: 3, units: [{ kind: 'row', index: 2 }] },
      { row: 2, col: 7, value: 3, units: [{ kind: 'row', index: 2 }] },
    ];
    expect(getConflicts(direct)).toEqual(expected);
    expect(getConflicts(viaFive)).toEqual(expected);
  });

  it('CA-001-18: colocar e apagar dá os mesmos conflitos que nunca colocar', () => {
    const base = boardOf(BASE);
    const roundTrip = erased(placed(base, 2, 7, 5), 2, 7);
    expect(getConflicts(roundTrip)).toEqual([]);
    expect(getConflicts(base)).toEqual([]);
  });

  it('CA-001-24: os três motivos de recusa de placeValue são distintos entre si', () => {
    const board = boardOf(BASE);
    const reasons = [
      placeValue(board, 9, 7, 3),
      placeValue(board, 3, 7, 10),
      placeValue(board, 2, 1, 3),
    ].map((r) => (r.ok ? 'ok' : r.reason));
    expect(reasons).toEqual(['cell-not-found', 'invalid-value', 'cell-is-given']);
    expect(new Set(reasons).size).toBe(3);
  });
});
