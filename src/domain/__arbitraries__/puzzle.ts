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
