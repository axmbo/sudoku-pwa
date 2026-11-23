/** Dígito válido de uma célula de Sudoku: inteiro de 1 a 9. */
export function isDigit(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 9;
}
