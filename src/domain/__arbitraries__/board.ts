import fc from 'fast-check';
import { createBoard, eraseValue, placeValue, type Board } from '../board';
import type { Result } from '../result';
import { gridWithoutConflicts } from './grid';

/** Jogada com argumentos de qualquer tipo (fronteira `unknown`). */
export type Move =
  | { readonly op: 'place'; readonly row: unknown; readonly col: unknown; readonly value: unknown }
  | { readonly op: 'erase'; readonly row: unknown; readonly col: unknown };

/** Aplica a jogada pela API pública; os `unknown` são repassados como estão (o domínio valida). */
export function applyMove(board: Board, move: Move): Result<Board, string> {
  if (move.op === 'place') {
    return placeValue(board, move.row as number, move.col as number, move.value as number);
  }
  return eraseValue(board, move.row as number, move.col as number);
}

/** Tabuleiro criado de uma grade sem conflito (pistas = máscara aleatória sobre a solução fixa). */
export const anyBoard: fc.Arbitrary<Board> = gridWithoutConflicts.map((grid) => {
  const result = createBoard(grid);
  if (!result.ok) throw new Error(`gerador inválido: ${result.reason}`);
  return result.value;
});

const coordinate = fc.integer({ min: 0, max: 8 });
const digit = fc.integer({ min: 1, max: 9 });

/** Coordenada "suja": maioria válida, o resto fora da grade ou de qualquer tipo. */
export const dirtyCoordinate: fc.Arbitrary<unknown> = fc.oneof(
  { weight: 6, arbitrary: coordinate },
  {
    weight: 2,
    arbitrary: fc.constantFrom<unknown>(
      -1,
      9,
      10,
      1.5,
      Number.NaN,
      Infinity,
      -0,
      '3',
      null,
      undefined,
      {},
      [],
      4n,
    ),
  },
  { weight: 1, arbitrary: fc.anything() },
);

/** Valor "sujo": maioria dígito, o resto inválido ou de qualquer tipo. */
export const dirtyValue: fc.Arbitrary<unknown> = fc.oneof(
  { weight: 6, arbitrary: digit },
  {
    weight: 2,
    arbitrary: fc.constantFrom<unknown>(
      0,
      10,
      -1,
      2.5,
      Number.NaN,
      Infinity,
      -0,
      '5',
      null,
      undefined,
      {},
      [],
      5n,
    ),
  },
  { weight: 1, arbitrary: fc.anything() },
);

/** Jogada com coordenadas e valor possivelmente sujos. */
export const anyMove: fc.Arbitrary<Move> = fc.oneof(
  fc.record({
    op: fc.constant('place' as const),
    row: dirtyCoordinate,
    col: dirtyCoordinate,
    value: dirtyValue,
  }),
  fc.record({ op: fc.constant('erase' as const), row: dirtyCoordinate, col: dirtyCoordinate }),
);

/** Colocação com coordenadas e valor válidos (pode recair numa pista e ser recusada). */
export const wellFormedPlace: fc.Arbitrary<Move> = fc.record({
  op: fc.constant('place' as const),
  row: coordinate,
  col: coordinate,
  value: digit,
});

/** Aplica as jogadas em ordem, mantendo o tabuleiro quando a jogada é recusada. */
export function playAll(board: Board, moves: readonly Move[]): Board {
  return moves.reduce((current, move) => {
    const result = applyMove(current, move);
    return result.ok ? result.value : current;
  }, board);
}

/** Tabuleiro com valores do jogador colocados sobre as pistas; com frequência há conflito. */
export const boardWithConflicts: fc.Arbitrary<Board> = fc
  .tuple(anyBoard, fc.array(wellFormedPlace, { minLength: 8, maxLength: 30 }))
  .map(([board, moves]) => playAll(board, moves));
