import type { Digit } from '../digit';
import type { Grid } from '../board';
import { SOLUTION } from './grid';

/** Solução completa como `Grid` (derivada da fixture fixa de `grid.ts`). */
export const solutionGrid: Grid = SOLUTION.map((line) =>
  [...line].map((ch) => Number(ch) as Digit),
);

/** Pistas da fixture: a solução com as células da diagonal (r, r) e a (2,7) vazias. */
export const givensGrid: Grid = solutionGrid.map((row, r) =>
  row.map((value, c) => (r === c || (r === 2 && c === 7) ? null : value)),
);

/** Entrada válida para `createPuzzle` (formato `unknown`, como vem de fora). */
export function validPuzzleInput(): {
  givens: Grid;
  solution: Grid;
  difficulty: string;
  seed: string;
  generatorVersion: number;
} {
  return {
    givens: givensGrid,
    solution: solutionGrid,
    difficulty: 'easy',
    seed: 'seed-004',
    generatorVersion: 1,
  };
}

/** Entrada de `createPuzzle` com uma única célula não pista vazia, em (row, col). */
export function almostSolvedInput(row: number, col: number): ReturnType<typeof validPuzzleInput> {
  return {
    ...validPuzzleInput(),
    givens: solutionGrid.map((line, r) =>
      line.map((value, c) => (r === row && c === col ? null : value)),
    ),
  };
}

/**
 * Entrada em que só as células com 1 ou 2 na solução estão vazias. Trocar 1 por 2 em todas
 * elas dá uma grade cheia, válida (sem conflito) e diferente da solução; e colocar 2 onde a
 * solução tem 1 não gera conflito enquanto o 2 daquela unidade segue vazio.
 */
export function swapPairInput(): ReturnType<typeof validPuzzleInput> {
  return {
    ...validPuzzleInput(),
    givens: solutionGrid.map((line) =>
      line.map((value) => (value === 1 || value === 2 ? null : value)),
    ),
  };
}
