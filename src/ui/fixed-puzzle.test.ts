import { describe, expect, it } from 'vitest';
import { gamePlace, getGameConflicts, type Game } from '../domain/game';
import { findConflicts } from '../domain/conflicts';
import type { Digit } from '../domain/digit';
import { FIXED_PUZZLE, fixedGame } from './fixed-puzzle';

const MAX_SOLVE_MS = 5_000;

function givensOf(game: Game): (Digit | null)[] {
  return game.puzzle.givens.flat();
}

/**
 * Contador de soluções só para o teste: escolhe a célula vazia com menos candidatos,
 * corta em `limit` soluções e aborta ao passar do prazo (evita teste instável).
 */
function countSolutions(cells: (Digit | null)[], limit: number, deadline: number): number {
  const candidates = (i: number): Digit[] => {
    const row = Math.floor(i / 9);
    const col = i % 9;
    const used = new Set<Digit | null>();
    for (let k = 0; k < 9; k += 1) {
      used.add(cells[row * 9 + k] ?? null);
      used.add(cells[k * 9 + col] ?? null);
      used.add(
        cells[
          (Math.floor(row / 3) * 3 + Math.floor(k / 3)) * 9 + Math.floor(col / 3) * 3 + (k % 3)
        ] ?? null,
      );
    }
    return ([1, 2, 3, 4, 5, 6, 7, 8, 9] as Digit[]).filter((d) => !used.has(d));
  };

  const search = (): number => {
    if (Date.now() > deadline) {
      throw new Error('contador de soluções passou do prazo');
    }
    let best = -1;
    let bestCandidates: Digit[] = [];
    for (let i = 0; i < 81; i += 1) {
      if (cells[i] === null) {
        const options = candidates(i);
        if (best === -1 || options.length < bestCandidates.length) {
          best = i;
          bestCandidates = options;
          if (options.length === 0) {
            return 0;
          }
        }
      }
    }
    if (best === -1) {
      return 1;
    }
    let found = 0;
    for (const digit of bestCandidates) {
      cells[best] = digit;
      found += search();
      cells[best] = null;
      if (found >= limit) {
        return found;
      }
    }
    return found;
  };
  return search();
}

function firstEmpty(game: Game): { row: number; col: number } {
  const index = game.board.cells.findIndex((cell) => cell.value === null);
  return { row: Math.floor(index / 9), col: index % 9 };
}

describe('fixedGame', () => {
  it('CA-005-01: devolve um Game válido sem lançar', () => {
    const game = fixedGame();

    expect(game.board.cells).toHaveLength(81);
    expect(game.puzzle.givens).toHaveLength(9);
  });

  it('CA-005-01: tem pistas e células vazias, e as pistas não têm conflito', () => {
    const game = fixedGame();
    const givens = givensOf(game);
    const filled = givens.filter((value) => value !== null).length;

    expect(filled).toBeGreaterThanOrEqual(17);
    expect(filled).toBeLessThan(81);
    expect(findConflicts(givens)).toEqual([]);
    expect(getGameConflicts(game)).toEqual([]);
  });

  it('CA-005-01: a solução é única (contador com corte em 2)', () => {
    const game = fixedGame();

    const solutions = countSolutions(givensOf(game), 2, Date.now() + MAX_SOLVE_MS);

    expect(solutions).toBe(1);
  });

  it('CA-005-01: a solução do jogo é a de FIXED_PUZZLE e respeita as pistas', () => {
    const game = fixedGame();
    const fixed = FIXED_PUZZLE as { solution: unknown };

    expect(game.puzzle.solution).toEqual(fixed.solution);
    const solution = game.puzzle.solution.flat();
    expect(solution.every((value: Digit | null) => value !== null)).toBe(true);
    givensOf(game).forEach((given, i) => {
      if (given !== null) {
        expect(solution[i]).toBe(given);
      }
    });
  });

  it('CA-005-37: duas chamadas nascem da mesma grade de pistas', () => {
    expect(fixedGame().puzzle.givens).toEqual(fixedGame().puzzle.givens);
  });

  it('CA-005-37: as chamadas são independentes (jogar numa não altera a outra)', () => {
    const first = fixedGame();
    const second = fixedGame();
    const { row, col } = firstEmpty(first);

    const played = gamePlace(first, row, col, 1);

    expect(played.ok).toBe(true);
    expect(second.board.cells[row * 9 + col]?.value).toBeNull();
    expect(fixedGame().board.cells[row * 9 + col]?.value).toBeNull();
  });

  it('CA-005-37: a partida nasce sem jogada prévia (cursor 0, histórico vazio)', () => {
    const game = fixedGame();

    expect(game.cursor).toBe(0);
    expect(game.history).toEqual([]);
  });
});
