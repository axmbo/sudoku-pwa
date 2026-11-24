import { findConflicts } from './conflicts';
import { flattenGrid, type Grid } from './board';
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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value !== '';
}

export function createPuzzle(input: unknown): Result<Puzzle, PuzzleRefusal> {
  if (typeof input !== 'object' || input === null) {
    return { ok: false, reason: 'malformed-puzzle' };
  }
  const { givens, solution, difficulty, seed, generatorVersion } = input as Record<string, unknown>;
  const givenValues = flattenGrid(givens);
  if (
    givenValues === null ||
    flattenGrid(solution) === null ||
    !isNonEmptyString(difficulty) ||
    !isNonEmptyString(seed) ||
    !Number.isInteger(generatorVersion) ||
    (generatorVersion as number) < 1
  ) {
    return { ok: false, reason: 'malformed-puzzle' };
  }
  if (findConflicts(givenValues).length > 0) {
    return { ok: false, reason: 'conflicting-givens' };
  }
  return {
    ok: true,
    value: Object.freeze({
      givens: freezeGrid(givens as Grid),
      solution: freezeGrid(solution as Grid),
      difficulty,
      seed,
      generatorVersion: generatorVersion as number,
    }),
  };
}
