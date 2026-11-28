import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { getConflicts, type CellState } from '../../domain/board';
import type { Digit } from '../../domain/digit';
import {
  gameErase,
  gamePlace,
  getGameConflicts,
  getGameStatus,
  notesAt,
  type Game,
} from '../../domain/game';
import type { Index } from '../../domain/units';
import { fixedGame } from '../fixed-puzzle';
import { conflictMessage, messages } from './messages';
import { moveSelection, type NavigationKey, type Selection } from './navigation';
import { gameReducer, initialState, type UiAction, type UiState } from './reducer';

// Geração de sequências de UiAction a partir de `fixedGame()`.
// Alcançar vitória e grade cheia errada ao acaso é raro (51 células vazias), então o gerador
// mistura três "prefixos" (nenhum, quase vencida, quase vencida com a última errada) e macros
// que jogam a solução ou um valor errado numa célula. A prova de que ele alcança conflito,
// vitória e grade cheia errada é o teste "INV: o gerador alcança ..." (com mutante manual,
// descrito no commit): se o gerador perde o prefixo ou as macros, esse teste falha.

const SEED = 20260601;
// Timeout próprio (#23, precedente 55c4efa): isoladas levam de 1 a 4,7 s, mas com a suíte
// em paralelo estouram os 5 s padrão. Mesmas rodadas e seeds; só o limite muda.
const PROP_TIMEOUT = 30_000;

const indexArb: fc.Arbitrary<Index> = fc.constantFrom<Index>(0, 1, 2, 3, 4, 5, 6, 7, 8);
const digitArb: fc.Arbitrary<Digit> = fc.constantFrom<Digit>(1, 2, 3, 4, 5, 6, 7, 8, 9);
const keyArb: fc.Arbitrary<NavigationKey> = fc.constantFrom<NavigationKey>(
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
);

const GAME = fixedGame();
const SOLUTION = GAME.puzzle.solution;
function givenAt(row: number, col: number): Digit | null {
  const value = GAME.puzzle.givens[row]?.[col];
  if (value === undefined) throw new Error('pista fora da grade');
  return value;
}

function solutionAt(row: number, col: number): Digit {
  const value = SOLUTION[row]?.[col];
  if (value == null) throw new Error('solução incompleta');
  return value;
}

const LAST_EMPTY = 72; // (8,0): única célula deixada vazia nas partidas quase vencidas

function select(row: Index, col: Index): UiAction {
  return { type: 'select', to: { row, col } };
}

/** Selecionar + solução para todas as células vazias, exceto `skip` (índice linha*9+col). */
function solutionPrefix(skip: readonly number[]): UiAction[] {
  const actions: UiAction[] = [];
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if (givenAt(row, col) === null && !skip.includes(row * 9 + col)) {
        actions.push(select(row as Index, col as Index), {
          type: 'digit',
          digit: solutionAt(row, col),
        });
      }
    }
  }
  return actions;
}

const PREFIXES = {
  none: [] as UiAction[],
  almost: solutionPrefix([LAST_EMPTY]),
  almostWrong: [
    ...solutionPrefix([LAST_EMPTY]),
    select(8, 0),
    { type: 'digit', digit: 1 },
  ] as UiAction[],
};

// Cada item do gerador é uma lista (macro) de ações, achatada depois.
const macroArb: fc.Arbitrary<UiAction[]> = fc.oneof(
  {
    weight: 3,
    arbitrary: fc
      .record({ row: indexArb, col: indexArb })
      .map(({ row, col }) => [select(row, col)]),
  },
  {
    weight: 3,
    arbitrary: fc
      .record({ key: keyArb, ctrl: fc.boolean() })
      .map(({ key, ctrl }): UiAction[] => [{ type: 'move', key, ctrl }]),
  },
  { weight: 4, arbitrary: digitArb.map((digit): UiAction[] => [{ type: 'digit', digit }]) },
  { weight: 2, arbitrary: fc.constant<UiAction[]>([{ type: 'erase' }]) },
  {
    weight: 4,
    arbitrary: fc
      .record({ row: indexArb, col: indexArb })
      .map(({ row, col }): UiAction[] => [
        select(row, col),
        { type: 'digit', digit: solutionAt(row, col) },
      ]),
  },
  {
    weight: 3,
    arbitrary: fc
      .record({ row: indexArb, col: indexArb, digit: digitArb })
      .map(({ row, col, digit }): UiAction[] => [select(row, col), { type: 'digit', digit }]),
  },
  {
    weight: 3,
    arbitrary: digitArb.map((digit): UiAction[] => [select(8, 0), { type: 'digit', digit }]),
  },
);

const actionsArb: fc.Arbitrary<UiAction[]> = fc
  .record({
    prefix: fc.constantFrom<keyof typeof PREFIXES>('none', 'almost', 'almostWrong'),
    tail: fc.array(macroArb, { maxLength: 30 }),
  })
  .map(({ prefix, tail }) => [...PREFIXES[prefix], ...tail.flat()]);

/** Estados sucessivos (o inicial e um por ação), com a ação e o estado anterior. */
interface Step {
  readonly before: UiState;
  readonly action: UiAction;
  readonly after: UiState;
}

function replay(actions: readonly UiAction[]): { initial: UiState; steps: Step[] } {
  const initial = initialState(fixedGame());
  const steps: Step[] = [];
  let state = initial;
  for (const action of actions) {
    const after = gameReducer(state, action);
    steps.push({ before: state, action, after });
    state = after;
  }
  return { initial, steps };
}

describe('gameReducer (propriedades)', () => {
  it(
    'INV: o gerador alcança conflito, vitória e grade cheia errada (sem usar o reducer)',
    () => {
      // 50 amostras (seed fixa, determinísticas) bastam para alcançar os três estados; eram 300, que
      // estouram o PROP_TIMEOUT sob o Stryker, onde `fc.sample` não é limitado pelo mock de
      // tests/stryker.setup.ts (limitá-lo derrubaria outros testes que dependem de 100 amostras).
      // Decisão do Diretor, 27/11/2026 (revisão da 005a).
      // Interpretador mínimo só com o domínio, para provar o alcance do gerador de forma independente.
      const reached = { conflict: false, won: false, fullIncorrect: false };
      const samples = fc.sample(actionsArb, { seed: SEED, numRuns: 50 });
      for (const actions of samples) {
        let game: Game = fixedGame();
        let selected: Selection = { row: 0, col: 0 };
        for (const action of actions) {
          if (action.type === 'select') selected = action.to;
          else if (action.type === 'move')
            selected = moveSelection(selected, action.key, action.ctrl);
          else {
            const result =
              action.type === 'digit'
                ? gamePlace(game, selected.row, selected.col, action.digit)
                : gameErase(game, selected.row, selected.col);
            if (result.ok) game = result.value;
          }
          if (getGameConflicts(game).length > 0) reached.conflict = true;
          const status = getGameStatus(game);
          if (status === 'won') reached.won = true;
          if (status === 'full-incorrect') reached.fullIncorrect = true;
        }
      }
      expect(reached).toEqual({ conflict: true, won: true, fullIncorrect: true });
    },
    PROP_TIMEOUT,
  );

  it(
    'CA-005-31: para qualquer sequência o reducer é total e o anúncio, quando existe, é um só e bem formado',
    () => {
      fc.assert(
        fc.property(actionsArb, (actions) => {
          const { steps } = replay(actions); // lançar derruba a propriedade
          for (const { after } of steps) {
            if (after.announcement !== null) {
              expect(Number.isInteger(after.announcement.id)).toBe(true);
              expect(after.announcement.id).toBeGreaterThanOrEqual(1);
              expect(typeof after.announcement.text).toBe('string');
              expect(after.announcement.text).not.toBe('');
            }
          }
        }),
        { seed: SEED + 1, numRuns: 100 },
      );
    },
    PROP_TIMEOUT,
  );

  it(
    'CA-005-31: ids de anúncios em ações seguidas crescem estritamente (de 1 em 1)',
    () => {
      fc.assert(
        fc.property(actionsArb, (actions) => {
          for (const { before, after } of replay(actions).steps) {
            if (before.announcement !== null && after.announcement !== null) {
              expect(after.announcement.id).toBe(before.announcement.id + 1);
            }
          }
        }),
        { seed: SEED + 2, numRuns: 100 },
      );
    },
    PROP_TIMEOUT,
  );

  it(
    'CA-005-31: o anúncio de cada ação segue a precedência e nunca é herdado do estado anterior',
    () => {
      fc.assert(
        fc.property(actionsArb, (actions) => {
          for (const { before, action, after } of replay(actions).steps) {
            const text = after.announcement?.text ?? null;
            if (action.type === 'select' || action.type === 'move') {
              expect(after.announcement).toBeNull();
              continue;
            }
            const { row, col } = before.selected;
            if (getGameStatus(before.game) === 'won') {
              expect(after.announcement).toBeNull(); // game-over: sem anúncio
              continue;
            }
            if (before.game.board.cells[row * 9 + col]?.given) {
              expect(text).toBe(messages.givenImmutable);
              continue;
            }
            if (after.game === before.game) {
              expect(after.announcement).toBeNull(); // jogada sem efeito
              continue;
            }
            const status = getGameStatus(after.game);
            const conflictsBefore = getGameConflicts(before.game);
            const conflictsAfter = getGameConflicts(after.game);
            const mine = conflictsAfter.find((c) => c.row === row && c.col === col);
            const wasMine = conflictsBefore.some((c) => c.row === row && c.col === col);
            if (status === 'won') {
              expect(text).toBe(messages.won);
            } else if (status === 'full-incorrect') {
              expect(text).toBe(messages.fullWithErrors);
            } else if (mine !== undefined && !wasMine) {
              expect(text).toBe(conflictMessage(mine));
            } else if (conflictsBefore.length > 0 && conflictsAfter.length === 0) {
              expect(text).toBe(messages.noConflicts);
            } else {
              expect(text).not.toBeNull();
              expect(text).not.toMatch(/^Conflito:/);
              expect(text).not.toBe(messages.noConflicts);
              expect(text).not.toBe(messages.won);
              expect(text).not.toBe(messages.fullWithErrors);
              expect(text).not.toBe(messages.givenImmutable);
            }
          }
        }),
        { seed: SEED + 3, numRuns: 150 },
      );
    },
    PROP_TIMEOUT,
  );

  it(
    'INV: pistas ficam inalteradas e selected fica sempre em 0-8',
    () => {
      fc.assert(
        fc.property(actionsArb, (actions) => {
          const { initial, steps } = replay(actions);
          for (const { after } of [{ after: initial }, ...steps]) {
            expect(Number.isInteger(after.selected.row)).toBe(true);
            expect(Number.isInteger(after.selected.col)).toBe(true);
            expect(after.selected.row).toBeGreaterThanOrEqual(0);
            expect(after.selected.row).toBeLessThanOrEqual(8);
            expect(after.selected.col).toBeGreaterThanOrEqual(0);
            expect(after.selected.col).toBeLessThanOrEqual(8);
            after.game.board.cells.forEach((cell: CellState, i: number) => {
              const given = givenAt(Math.floor(i / 9), i % 9);
              expect(cell.given).toBe(given !== null);
              if (given !== null) expect(cell.value).toBe(given);
            });
          }
        }),
        { seed: SEED + 4, numRuns: 100 },
      );
    },
    PROP_TIMEOUT,
  );

  it(
    'INV: conflito nunca fica no estado, só derivado do tabuleiro (invariante 9)',
    () => {
      fc.assert(
        fc.property(actionsArb, (actions) => {
          for (const { after } of replay(actions).steps) {
            expect(Object.keys(after).sort()).toEqual([
              'announcement',
              'focusTick',
              'game',
              'noteMode',
              'selected',
            ]);
            expect(getGameConflicts(after.game)).toEqual(getConflicts(after.game.board));
          }
        }),
        { seed: SEED + 5, numRuns: 100 },
      );
    },
    PROP_TIMEOUT,
  );

  it(
    'CA-005-29: depois de won, digit e erase não alteram o Game nem anunciam',
    () => {
      fc.assert(
        fc.property(actionsArb, (actions) => {
          for (const { before, action, after } of replay(actions).steps) {
            if (getGameStatus(before.game) === 'won') {
              expect(after.game).toBe(before.game);
              expect(getGameStatus(after.game)).toBe('won');
              if (action.type === 'digit' || action.type === 'erase') {
                expect(after.announcement).toBeNull();
              }
            }
          }
        }),
        { seed: SEED + 6, numRuns: 100 },
      );
    },
    PROP_TIMEOUT,
  );

  it(
    'INV: o reducer é puro (mesmo estado e ação, mesmo resultado, sem alterar a entrada)',
    () => {
      fc.assert(
        fc.property(actionsArb, macroArb, (actions, extra) => {
          const { steps } = replay(actions);
          const state = steps.at(-1)?.after ?? initialState(fixedGame());
          const snapshot = structuredClone(state);
          for (const action of extra) {
            const first = gameReducer(state, action);
            const second = gameReducer(state, action);
            expect(second).toEqual(first);
            expect(state).toEqual(snapshot);
          }
        }),
        { seed: SEED + 7, numRuns: 100 },
      );
    },
    PROP_TIMEOUT,
  );
});

// ---------------------------------------------------------------------------------------------
// 005b T04: ações novas (toggle-mode, undo, redo) e modo anotação. `act` porque o tipo `UiAction`
// ainda não as declara (símbolo novo, PROCESSO.md §6). O gerador estendido reaproveita `macroArb` e
// acrescenta macros das ações novas; a prova de que alcança o estado coberto é o teste
// "INV: o gerador estendido alcança ..." (mutante manual descrito no commit).
// ---------------------------------------------------------------------------------------------

const act = (type: string): UiAction => ({ type }) as UiAction;
const TOGGLE = act('toggle-mode');
const UNDO = act('undo');
const REDO = act('redo');

const extMacroArb: fc.Arbitrary<UiAction[]> = fc.oneof(
  { weight: 10, arbitrary: macroArb },
  { weight: 4, arbitrary: fc.constant<UiAction[]>([TOGGLE]) },
  { weight: 4, arbitrary: fc.constant<UiAction[]>([UNDO]) },
  { weight: 3, arbitrary: fc.constant<UiAction[]>([REDO]) },
  {
    weight: 4,
    arbitrary: fc
      .record({ row: indexArb, col: indexArb, digit: digitArb })
      .map(({ row, col, digit }): UiAction[] => [
        select(row, col),
        TOGGLE,
        { type: 'digit', digit },
      ]),
  },
);

const extActionsArb: fc.Arbitrary<UiAction[]> = fc
  .record({
    prefix: fc.constantFrom<keyof typeof PREFIXES>('none', 'none', 'almost', 'almostWrong'),
    tail: fc.array(extMacroArb, { maxLength: 30 }),
  })
  .map(({ prefix, tail }) => [...PREFIXES[prefix], ...tail.flat()]);

/** Tipo da ação como `string`: o union `UiAction` ainda não declara as ações novas. */
const kind = (action: UiAction): string => action.type;

const isWon = (state: UiState): boolean => getGameStatus(state.game) === 'won';

/** Valores do tabuleiro, sem anotações nem histórico. */
function values(game: Game): (Digit | null)[] {
  return game.board.cells.map((cell: CellState) => cell.value);
}

/** Parte do `Game` que `undo`/`redo` devem devolver (o histórico acompanha só o cursor). */
function position(game: Game): { board: unknown; notes: unknown; cursor: number } {
  return { board: game.board, notes: game.notes, cursor: game.cursor };
}

const EMPTY_CELLS: readonly number[] = Array.from({ length: 81 }, (_, i) => i).filter(
  (i) => givenAt(Math.floor(i / 9), i % 9) === null,
);

describe('gameReducer (propriedades da 005b T04)', () => {
  it(
    'INV: o gerador estendido alcança modo anotação com anotação, undo e redo aplicados e "nada para..."',
    () => {
      const reached = {
        noteDigit: false,
        undoApplied: false,
        redoApplied: false,
        nothingToUndo: false,
        nothingToRedo: false,
        wonThenExtra: false,
      };
      for (const actions of fc.sample(extActionsArb, { seed: SEED + 20, numRuns: 100 })) {
        for (const { before, action, after } of replay(actions).steps) {
          if (action.type === 'digit' && before.noteMode && after.game !== before.game)
            reached.noteDigit = true;
          if (kind(action) === 'undo' && after.game !== before.game) reached.undoApplied = true;
          if (kind(action) === 'redo' && after.game !== before.game) reached.redoApplied = true;
          if (after.announcement?.text === messages.nothingToUndo) reached.nothingToUndo = true;
          if (after.announcement?.text === messages.nothingToRedo) reached.nothingToRedo = true;
          if (isWon(before) && (kind(action) === 'undo' || kind(action) === 'redo'))
            reached.wonThenExtra = true;
        }
      }
      expect(reached).toEqual({
        noteDigit: true,
        undoApplied: true,
        redoApplied: true,
        nothingToUndo: true,
        nothingToRedo: true,
        wonThenExtra: true,
      });
    },
    PROP_TIMEOUT,
  );

  it(
    'CA-005-31: com as ações novas, cada ação gera no máximo um anúncio, bem formado, com id de 1 em 1',
    () => {
      fc.assert(
        fc.property(extActionsArb, (actions) => {
          for (const { before, action, after } of replay(actions).steps) {
            if (action.type === 'select' || action.type === 'move') {
              expect(after.announcement).toBeNull();
            }
            if (after.announcement !== null) {
              expect(Number.isInteger(after.announcement.id)).toBe(true);
              expect(after.announcement.text).not.toBe('');
              expect(after.announcement.id).toBe((before.announcement?.id ?? 0) + 1);
            }
            if (!isWon(before) && kind(action) === 'toggle-mode') {
              expect(after.announcement?.text).toBe(
                after.noteMode ? messages.noteModeOn : messages.noteModeOff,
              );
            }
          }
        }),
        { seed: SEED + 21, numRuns: 100 },
      );
    },
    PROP_TIMEOUT,
  );

  it(
    'CA-005-23: jogada do jogo seguida de undo devolve o tabuleiro, as anotações e o cursor anteriores',
    () => {
      fc.assert(
        fc.property(extActionsArb, (actions) => {
          for (const { before, action, after } of replay(actions).steps) {
            const isPlay = action.type === 'digit' || action.type === 'erase';
            if (!isPlay || after.game === before.game || isWon(after)) continue;
            const undone = gameReducer(after, UNDO);
            expect(position(undone.game)).toEqual(position(before.game));
          }
        }),
        { seed: SEED + 22, numRuns: 100 },
      );
    },
    PROP_TIMEOUT,
  );

  it(
    'CA-005-23: undo seguido de redo devolve o game (e o inverso), inclusive valor com poda',
    () => {
      fc.assert(
        fc.property(extActionsArb, (actions) => {
          for (const { after } of replay(actions).steps) {
            if (isWon(after)) continue;
            const undone = gameReducer(after, UNDO);
            if (undone.game !== after.game) {
              expect(gameReducer(undone, REDO).game).toEqual(after.game);
            }
            const redone = gameReducer(after, REDO);
            if (redone.game !== after.game) {
              expect(gameReducer(redone, UNDO).game).toEqual(after.game);
            }
          }
        }),
        { seed: SEED + 23, numRuns: 100 },
      );
    },
    PROP_TIMEOUT,
  );

  it(
    'CA-005-24: undo e redo aplicados levam a seleção à célula afetada e sobem focusTick; sem efeito não sobem',
    () => {
      fc.assert(
        fc.property(extActionsArb, (actions) => {
          for (const { before, action, after } of replay(actions).steps) {
            if (kind(action) !== 'undo' && kind(action) !== 'redo') {
              expect(after.focusTick).toBe(before.focusTick);
              continue;
            }
            if (after.game === before.game) {
              expect(after.focusTick).toBe(before.focusTick);
              expect(after.selected).toEqual(before.selected);
            } else {
              expect(after.focusTick).toBe(before.focusTick + 1);
              const index = after.selected.row * 9 + after.selected.col;
              const moved = kind(action) === 'undo' ? before.game.cursor - 1 : before.game.cursor;
              expect(index).toBe(before.game.history[moved]?.move.index);
            }
          }
        }),
        { seed: SEED + 24, numRuns: 100 },
      );
    },
    PROP_TIMEOUT,
  );

  it(
    'CA-005-44: erase em célula vazia com anotações zera as anotações e registra uma jogada nova',
    () => {
      const noted = fc.uniqueArray(
        fc.record({ cell: fc.constantFrom(...EMPTY_CELLS), digit: digitArb }),
        {
          minLength: 1,
          maxLength: 8,
          selector: (item) => item.cell,
        },
      );
      fc.assert(
        fc.property(noted, (items) => {
          const annotate = items.flatMap(({ cell, digit }): UiAction[] => [
            select(Math.floor(cell / 9) as Index, (cell % 9) as Index),
            { type: 'digit', digit },
          ]);
          let state = [TOGGLE, ...annotate].reduce(gameReducer, initialState(fixedGame()));
          for (const { cell } of items) {
            const row = Math.floor(cell / 9) as Index;
            const col = (cell % 9) as Index;
            const before = gameReducer(state, select(row, col));
            expect(notesAt(before.game, row, col)).toHaveLength(1); // pré-condição: a célula tem anotação
            state = gameReducer(before, { type: 'erase' });
            expect(notesAt(state.game, row, col)).toEqual([]);
            expect(state.game.cursor).toBe(before.game.cursor + 1);
            expect(state.announcement?.text).toContain('vazia');
          }
        }),
        { seed: SEED + 25, numRuns: 100 },
      );
    },
    PROP_TIMEOUT,
  );

  it(
    'CA-005-17: anotar o mesmo dígito duas vezes seguidas devolve tabuleiro e anotações originais',
    () => {
      fc.assert(
        fc.property(extActionsArb, indexArb, indexArb, digitArb, (actions, row, col, digit) => {
          const { steps } = replay(actions);
          const base = steps.at(-1)?.after ?? initialState(fixedGame());
          const inNoteMode = base.noteMode ? base : gameReducer(base, TOGGLE);
          const start = gameReducer(inNoteMode, select(row, col));
          const twice = gameReducer(gameReducer(start, { type: 'digit', digit }), {
            type: 'digit',
            digit,
          });
          expect(twice.game.board).toEqual(start.game.board);
          expect(twice.game.notes).toEqual(start.game.notes);
          const cell = start.game.board.cells[row * 9 + col];
          if (!isWon(start) && cell?.value === null) {
            expect(twice.game.cursor).toBe(start.game.cursor + 2); // não vacuoso: as duas anotaram
          }
        }),
        { seed: SEED + 26, numRuns: 100 },
      );
    },
    PROP_TIMEOUT,
  );

  it(
    'CA-005-16: no modo anotação, nenhum dígito altera valores; toggle-mode não toca no jogo',
    () => {
      fc.assert(
        fc.property(extActionsArb, (actions) => {
          for (const { before, action, after } of replay(actions).steps) {
            if (before.noteMode && action.type === 'digit') {
              expect(values(after.game)).toEqual(values(before.game));
            }
            if (kind(action) === 'toggle-mode') {
              expect(after.game).toBe(before.game);
              expect(after.selected).toEqual(before.selected);
              expect(after.noteMode).toBe(isWon(before) ? before.noteMode : !before.noteMode);
            }
          }
        }),
        { seed: SEED + 27, numRuns: 100 },
      );
    },
    PROP_TIMEOUT,
  );

  it(
    'CA-005-42: depois de won, toggle-mode, anotação, undo e redo não alteram o estado nem anunciam',
    () => {
      fc.assert(
        fc.property(extActionsArb, (actions) => {
          for (const { before, action, after } of replay(actions).steps) {
            if (!isWon(before)) continue;
            expect(after.game).toBe(before.game);
            expect(after.noteMode).toBe(before.noteMode);
            expect(after.focusTick).toBe(before.focusTick);
            if (action.type !== 'select' && action.type !== 'move') {
              expect(after.announcement).toBeNull();
              expect(after.selected).toEqual(before.selected);
            }
          }
        }),
        { seed: SEED + 28, numRuns: 100 },
      );
    },
    PROP_TIMEOUT,
  );
});
