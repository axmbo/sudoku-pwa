import { describe, expect, it } from 'vitest';
import { cellAt, createBoard } from './board';

const _ = null;

// Entrada válida, sem conflito, com pistas em posições assimétricas e nos cantos.
const input = [
  [3, _, _, _, _, _, _, _, 1],
  [_, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, 5, _],
  [_, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _],
  [7, _, _, _, _, _, _, _, 9],
];

describe('board', () => {
  it('CA-001-01: cria o tabuleiro com 81 células, cada uma vazia ou com valor de 1 a 9', () => {
    const result = createBoard(input);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { cells } = result.value;
    expect(cells.length).toBe(81);
    expect(
      cells.every(
        (cell: { readonly value: number | null }) =>
          cell.value === null ||
          (Number.isInteger(cell.value) && cell.value >= 1 && cell.value <= 9),
      ),
    ).toBe(true);
  });

  it('CA-001-02: as pistas são exatamente as células com valor na entrada, nas mesmas posições', () => {
    const result = createBoard(input);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { cells } = result.value;
    // Índices escritos à mão: (0,0)=0, (0,8)=8, (2,7)=25, (8,0)=72, (8,8)=80.
    expect(cells[0]).toEqual({ value: 3, given: true });
    expect(cells[8]).toEqual({ value: 1, given: true });
    expect(cells[25]).toEqual({ value: 5, given: true });
    expect(cells[72]).toEqual({ value: 7, given: true });
    expect(cells[80]).toEqual({ value: 9, given: true });
  });

  it('CA-001-02: as demais células estão vazias e não são pistas', () => {
    const result = createBoard(input);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const givenIndexes = [0, 8, 25, 72, 80];
    const others = result.value.cells.filter((_cell, i) => !givenIndexes.includes(i));
    expect(others.length).toBe(76);
    expect(others.every((cell) => cell.value === null && cell.given === false)).toBe(true);
  });

  it('CA-001-02: tabuleiro, cells e cada célula são congelados', () => {
    const result = createBoard(input);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.cells)).toBe(true);
    expect(result.value.cells.every((cell) => Object.isFrozen(cell))).toBe(true);
  });

  it('CA-001-02: mutar a entrada depois de criar não altera o tabuleiro', () => {
    const mutable = input.map((row) => [...row]);
    const result = createBoard(mutable);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    mutable[0]?.splice(0, 1, 4);
    mutable[2]?.splice(7, 1, null);
    mutable[4]?.splice(4, 1, 8);

    expect(result.value.cells[0]).toEqual({ value: 3, given: true });
    expect(result.value.cells[25]).toEqual({ value: 5, given: true });
    expect(result.value.cells[40]).toEqual({ value: null, given: false });
  });

  it('CA-001-01: cellAt(linha, coluna) devolve a célula do índice literal, nos cantos e em posições assimétricas', () => {
    const result = createBoard(input);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { cells } = result.value;
    expect(cellAt(result.value, 0, 0)).toBe(cells[0]);
    expect(cellAt(result.value, 0, 8)).toBe(cells[8]);
    expect(cellAt(result.value, 2, 7)).toBe(cells[25]);
    expect(cellAt(result.value, 8, 0)).toBe(cells[72]);
    expect(cellAt(result.value, 8, 8)).toBe(cells[80]);
    expect(cellAt(result.value, 2, 7)).toEqual({ value: 5, given: true });
    // célula vazia assimétrica: (7,2) = cells[65]
    expect(cellAt(result.value, 7, 2)).toBe(cells[65]);
    expect(cellAt(result.value, 7, 2)).toEqual({ value: null, given: false });
  });
});
