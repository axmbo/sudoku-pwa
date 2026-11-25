import fc from 'fast-check';
import type { Digit } from '../digit';
import type { Grid } from '../board';
import {
  createGame,
  gameClearNotes,
  gameErase,
  gamePlace,
  gameRedo,
  gameToggleNote,
  gameUndo,
  type Game,
} from '../game';
import type { Result } from '../result';
import { dirtyCoordinate, dirtyValue } from './board';
import { solutionGrid, swapPairInput, validPuzzleInput } from './puzzle';

/** Ação do jogador sobre um `Game`, com argumentos de qualquer tipo (fronteira `unknown`). */
export type GameAction =
  | { readonly op: 'place'; readonly row: unknown; readonly col: unknown; readonly value: unknown }
  | { readonly op: 'erase'; readonly row: unknown; readonly col: unknown }
  | { readonly op: 'toggle'; readonly row: unknown; readonly col: unknown; readonly value: unknown }
  | { readonly op: 'clear'; readonly row: unknown; readonly col: unknown }
  | { readonly op: 'undo' }
  | { readonly op: 'redo' };

/** Aplica a ação pela API pública do jogo; os `unknown` são repassados como estão. */
export function applyGameAction(game: Game, action: GameAction): Result<Game, string> {
  switch (action.op) {
    case 'place':
      return gamePlace(game, action.row, action.col, action.value);
    case 'erase':
      return gameErase(game, action.row, action.col);
    case 'toggle':
      return gameToggleNote(game, action.row, action.col, action.value);
    case 'clear':
      return gameClearNotes(game, action.row, action.col);
    case 'undo':
      return gameUndo(game);
    case 'redo':
      return gameRedo(game);
  }
}

const coordinate = fc.integer({ min: 0, max: 8 });
const digit = fc.integer({ min: 1, max: 9 });

function actionOf(
  row: fc.Arbitrary<unknown>,
  col: fc.Arbitrary<unknown>,
  value: fc.Arbitrary<unknown>,
  withHistory: boolean,
): fc.Arbitrary<GameAction> {
  const cellActions = fc.oneof(
    fc.record({ op: fc.constant('place' as const), row, col, value }),
    fc.record({ op: fc.constant('erase' as const), row, col }),
    fc.record({ op: fc.constant('toggle' as const), row, col, value }),
    fc.record({ op: fc.constant('clear' as const), row, col }),
  );
  if (!withHistory) {
    return cellActions;
  }
  return fc.oneof(
    { weight: 6, arbitrary: cellActions },
    { weight: 2, arbitrary: fc.constant<GameAction>({ op: 'undo' }) },
    { weight: 1, arbitrary: fc.constant<GameAction>({ op: 'redo' }) },
  );
}

/** Ação do jogador com coordenadas e dígitos válidos (pode ser recusada por pista/valor, ou sem efeito). */
export const cleanGameAction: fc.Arbitrary<GameAction> = actionOf(
  coordinate,
  coordinate,
  digit,
  true,
);

/** Ação do jogador: maioria limpa, parte "suja" (recusas por argumento inválido); inclui undo e redo. */
export const anyGameAction: fc.Arbitrary<GameAction> = fc.oneof(
  { weight: 3, arbitrary: cleanGameAction },
  { weight: 1, arbitrary: actionOf(dirtyCoordinate, dirtyCoordinate, dirtyValue, true) },
);

/** Só ações de célula (place, erase, toggle, clear) com argumentos válidos, sem undo/redo. */
export const cellGameAction: fc.Arbitrary<GameAction> = actionOf(
  coordinate,
  coordinate,
  digit,
  false,
);

function gameFromGivens(givens: Grid): Game {
  const created = createGame({ ...validPuzzleInput(), givens });
  if (!created.ok) throw new Error(`gerador inválido: ${created.reason}`);
  return created.value;
}

function emptiedGrid(emptied: ReadonlySet<number>): Grid {
  return solutionGrid.map((line, r) =>
    line.map((value, c) => (emptied.has(r * 9 + c) ? null : (value as Digit))),
  );
}

/** Partida em andamento: de 10 a 70 células vazias (nunca vencida na criação). */
export const anyGame: fc.Arbitrary<Game> = fc
  .uniqueArray(fc.integer({ min: 0, max: 80 }), { minLength: 10, maxLength: 70 })
  .map((indices) => gameFromGivens(emptiedGrid(new Set(indices))));

/** Partida quase completa: de 1 a 4 células vazias; devolve também os índices vazios. */
export const nearlyCompleteGame: fc.Arbitrary<{ game: Game; empties: readonly number[] }> = fc
  .uniqueArray(fc.integer({ min: 0, max: 80 }), { minLength: 1, maxLength: 4 })
  .map((empties) => ({ game: gameFromGivens(emptiedGrid(new Set(empties))), empties }));

/**
 * Partida em que só as células com 1 ou 2 na solução estão vazias: trocar 1 por 2 em todas
 * elas dá grade cheia, sem conflito e diferente da solução.
 */
export const swapPairGame: Game = (() => {
  const created = createGame(swapPairInput());
  if (!created.ok) throw new Error(`gerador inválido: ${created.reason}`);
  return created.value;
})();
