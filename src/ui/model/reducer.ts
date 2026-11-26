import type { Digit } from '../../domain/digit';
import {
  gameErase,
  gamePlace,
  getGameConflicts,
  getGameStatus,
  type Game,
} from '../../domain/game';
import { cellLabel, conflictMessage, messages } from './messages';
import { moveSelection, type NavigationKey, type Selection } from './navigation';

export interface Announcement {
  readonly id: number;
  readonly text: string;
}

export interface UiState {
  readonly game: Game;
  readonly selected: Selection;
  /** Só da última ação; null se ela não anuncia (nunca herdado). */
  readonly announcement: Announcement | null;
}

export type UiAction =
  | { readonly type: 'select'; readonly to: Selection }
  | { readonly type: 'move'; readonly key: NavigationKey; readonly ctrl: boolean }
  | { readonly type: 'digit'; readonly digit: Digit }
  | { readonly type: 'erase' };

export function initialState(game: Game): UiState {
  return { game, selected: { row: 0, col: 0 }, announcement: null };
}

function announce(state: UiState, game: Game, text: string): UiState {
  // Sem contador no estado: o id segue o anúncio da ação anterior (1 se ela não anunciou).
  const id = (state.announcement?.id ?? 0) + 1;
  return { game, selected: state.selected, announcement: { id, text } };
}

function silent(state: UiState, game: Game): UiState {
  return { game, selected: state.selected, announcement: null };
}

/** Precedência: vitória > grade cheia com erros > conflito criado > sem conflitos > conteúdo da célula. */
function playText(before: Game, after: Game, selected: Selection): string {
  const { row, col } = selected;
  const status = getGameStatus(after);
  if (status === 'won') return messages.won;
  if (status === 'full-incorrect') return messages.fullWithErrors;
  const conflictsBefore = getGameConflicts(before);
  const conflictsAfter = getGameConflicts(after);
  const isHere = (c: { row: number; col: number }): boolean => c.row === row && c.col === col;
  const created = conflictsAfter.find(isHere);
  if (created !== undefined && !conflictsBefore.some(isHere)) return conflictMessage(created);
  if (conflictsBefore.length > 0 && conflictsAfter.length === 0) return messages.noConflicts;
  const cell = after.board.cells[row * 9 + col];
  return cellLabel(row, col, {
    value: cell?.value ?? null,
    given: false,
    conflicted: false,
  });
}

function play(state: UiState, result: ReturnType<typeof gamePlace>): UiState {
  if (!result.ok) {
    return result.reason === 'cell-is-given'
      ? announce(state, state.game, messages.givenImmutable)
      : silent(state, state.game);
  }
  if (result.value === state.game) return silent(state, state.game);
  return announce(state, result.value, playText(state.game, result.value, state.selected));
}

export function gameReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case 'select':
      return { game: state.game, selected: action.to, announcement: null };
    case 'move':
      return {
        game: state.game,
        selected: moveSelection(state.selected, action.key, action.ctrl),
        announcement: null,
      };
    case 'digit':
      return play(
        state,
        gamePlace(state.game, state.selected.row, state.selected.col, action.digit),
      );
    case 'erase':
      return play(state, gameErase(state.game, state.selected.row, state.selected.col));
  }
}
