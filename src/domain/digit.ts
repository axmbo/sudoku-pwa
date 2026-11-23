/** Dígito válido de uma célula de Sudoku: inteiro de 1 a 9. */
export function isDigit(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 9;
}

/** Valor de uma célula preenchida. */
export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
