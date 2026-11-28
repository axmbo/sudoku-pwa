import fc from 'fast-check';
import type { Digit } from '../digit';
import type { Grid } from '../board';
import {
  createGame,
  gameClearNotes,
  gameErase,
  gamePlace,
  gamePlaceAndPrune,
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
  | {
      readonly op: 'place-prune';
      readonly row: unknown;
      readonly col: unknown;
      readonly value: unknown;
    }
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
    case 'place-prune':
      return gamePlaceAndPrune(game, action.row, action.col, action.value);
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
    fc.record({ op: fc.constant('place-prune' as const), row, col, value }),
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

/** Só ações de célula (place, place-prune, erase, toggle, clear) com argumentos válidos, sem undo/redo. */
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

function sharesUnit(a: number, b: number): boolean {
  const [ra, ca] = [Math.floor(a / 9), a % 9];
  const [rb, cb] = [Math.floor(b / 9), b % 9];
  const sameBox =
    Math.floor(ra / 3) === Math.floor(rb / 3) && Math.floor(ca / 3) === Math.floor(cb / 3);
  return a !== b && (ra === rb || ca === cb || sameBox);
}

/** Células vazias com ao menos uma vizinha vazia (alvos possíveis de uma poda real). */
function pruneCandidates(game: Game): readonly number[] {
  const empties = game.board.cells.flatMap((cell, i) => (cell.value === null ? [i] : []));
  return empties.filter((i) => empties.some((j) => sharesUnit(i, j)));
}

/**
 * Partida cujo histórico tem ao menos um `place-prune` com poda real (`pruned` não vazio):
 * anota X em vizinhas vazias de uma célula vazia, coloca X nela com poda e segue com ações
 * de célula quaisquer e, no fim, undo e redo (que podem desfazer a poda, mas o histórico a mantém).
 */
export const prunedGame: fc.Arbitrary<Game> = fc
  .tuple(
    anyGame.filter((game) => pruneCandidates(game).length > 0),
    fc.nat(),
    digit,
    fc.array(fc.nat(), { minLength: 1, maxLength: 4 }),
    fc.array(cellGameAction, { maxLength: 20 }),
    fc.array(fc.constantFrom<GameAction>({ op: 'undo' }, { op: 'redo' }), { maxLength: 4 }),
  )
  .map(([start, pick, noted, peerPicks, extra, tail]) => {
    const targets = pruneCandidates(start);
    const target = targets[pick % targets.length] as number;
    const peers = start.board.cells.flatMap((cell, i) =>
      cell.value === null && sharesUnit(target, i) ? [i] : [],
    );
    const steps: GameAction[] = [
      ...[...new Set(peerPicks.map((n) => n % peers.length))].map((n): GameAction => {
        const peer = peers[n] as number;
        return { op: 'toggle', row: Math.floor(peer / 9), col: peer % 9, value: noted };
      }),
      { op: 'place-prune', row: Math.floor(target / 9), col: target % 9, value: noted },
      ...extra,
      ...tail,
    ];
    return steps.reduce((game, action) => {
      const next = applyGameAction(game, action);
      return next.ok ? next.value : game;
    }, start);
  });
