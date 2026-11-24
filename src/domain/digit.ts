/** Dígito válido de uma célula de Sudoku: inteiro de 1 a 9 (sem coerção de tipo). */
export function isDigit(value: unknown): value is Digit {
  // Stryker disable next-line ConditionalExpression: mutante equivalente; Number.isInteger já recusa não numéricos, o typeof só estreita o tipo.
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 9;
}

/** Valor de uma célula preenchida. */
export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
