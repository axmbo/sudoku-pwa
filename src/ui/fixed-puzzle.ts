import { createGame, type Game } from '../domain/game';

/**
 * Parseia 9 linhas de 9 caracteres ('.' = vazio) para a grade do domínio.
 * Os dígitos já são 1-9; a validação real é de `createGame`.
 */
function parseGrid(rows: readonly string[]): (number | null)[][] {
  return rows.map((row) => [...row].map((char) => (char === '.' ? null : Number(char))));
}

/**
 * Puzzle fixo da 005a: o exemplo clássico do artigo "Sudoku" da Wikipédia
 * (grade de 30 pistas, solução única, também conhecida por sua solução publicada).
 * A unicidade é provada por `fixed-puzzle.test.ts`, não assumida.
 * `difficulty`, `seed` e `generatorVersion` são rótulos opacos que o gerador (002/003) substitui.
 */
export const FIXED_PUZZLE: unknown = {
  givens: parseGrid([
    '53..7....',
    '6..195...',
    '.98....6.',
    '8...6...3',
    '4..8.3..1',
    '7...2...6',
    '.6....28.',
    '...419..5',
    '....8..79',
  ]),
  solution: parseGrid([
    '534678912',
    '672195348',
    '198342567',
    '859761423',
    '426853791',
    '713924856',
    '961537284',
    '287419635',
    '345286179',
  ]),
  difficulty: 'fixo',
  seed: '005a',
  generatorVersion: 1,
};

/** Partida nova do puzzle fixo; lança se o domínio recusar (erro de programação). */
export function fixedGame(): Game {
  const result = createGame(FIXED_PUZZLE);
  if (!result.ok) {
    throw new Error(`Puzzle fixo recusado pelo domínio: ${result.reason}`);
  }
  return result.value;
}
