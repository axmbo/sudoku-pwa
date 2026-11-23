import { describe, expect, it } from 'vitest';
import { createBoard } from './board';

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
});
