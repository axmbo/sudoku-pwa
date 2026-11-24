import type { Grid } from './board';
import type { Result } from './result';

/** Puzzle: pistas, solução e metadados de geração; `difficulty` e `seed` são opacos aqui. */
export interface Puzzle {
  readonly givens: Grid;
  readonly solution: Grid;
  readonly difficulty: string;
  readonly seed: string;
  readonly generatorVersion: number;
}

export type PuzzleRefusal = 'malformed-puzzle' | 'conflicting-givens' | 'invalid-solution';

function freezeGrid(grid: Grid): Grid {
  return Object.freeze(grid.map((row) => Object.freeze([...row])));
}

export function createPuzzle(input: unknown): Result<Puzzle, PuzzleRefusal> {
  const { givens, solution, difficulty, seed, generatorVersion } = input as Puzzle;
  return {
    ok: true,
    value: Object.freeze({
      givens: freezeGrid(givens),
      solution: freezeGrid(solution),
      difficulty,
      seed,
      generatorVersion,
    }),
  };
}
