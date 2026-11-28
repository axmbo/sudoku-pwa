import type { Digit } from '../../domain/digit';
import {
  gameClearNotes,
  gameErase,
  gamePlaceAndPrune,
  gameRedo,
  gameToggleNote,
  gameUndo,
  getGameConflicts,
  getGameStatus,
  notesAt,
  type Game,
} from '../../domain/game';
import type { Index } from '../../domain/units';
import { cellLabel, conflictMessage, historyMessage, messages, notesMessage } from './messages';
import { moveSelection, type NavigationKey, type Selection } from './navigation';

export interface Announcement {
  readonly id: number;
  readonly text: string;
}

export interface UiState {
  readonly game: Game;
  readonly selected: Selection;
  /** Modo anotação ligado: `digit` alterna candidato em vez de colocar valor. */
  readonly noteMode: boolean;
  /** Sobe a cada undo/redo aplicado; a UI move o foco para a célula afetada. */
  readonly focusTick: number;
  /** Só da última ação; null se ela não anuncia (nunca herdado). */
  readonly announcement: Announcement | null;
}

export type UiAction =
  | { readonly type: 'select'; readonly to: Selection }
  | { readonly type: 'move'; readonly key: NavigationKey; readonly ctrl: boolean }
  | { readonly type: 'digit'; readonly digit: Digit }
  | { readonly type: 'erase' }
  | { readonly type: 'toggle-mode' }
  | { readonly type: 'undo' }
  | { readonly type: 'redo' };

export function initialState(game: Game): UiState {
  return { game, selected: { row: 0, col: 0 }, noteMode: false, focusTick: 0, announcement: null };
}

function announce(state: UiState, game: Game, text: string): UiState {
  // Sem contador no estado: o id segue o anúncio da ação anterior (1 se ela não anunciou).
  const id = (state.announcement?.id ?? 0) + 1;
  return { ...state, game, announcement: { id, text } };
}

function silent(state: UiState, game: Game): UiState {
  return { ...state, game, announcement: null };
}

type Outcome =
  { readonly ok: true; readonly value: Game } | { readonly ok: false; readonly reason: string };

/** Aviso de conflito criado na célula selecionada ou de conflitos eliminados; null se nenhum. */
function conflictTail(before: Game, after: Game, selected: Selection): string | null {
  const { row, col } = selected;
  const conflictsBefore = getGameConflicts(before);
  const conflictsAfter = getGameConflicts(after);
  const isHere = (c: { row: number; col: number }): boolean => c.row === row && c.col === col;
  const created = conflictsAfter.find(isHere);
  if (created !== undefined && !conflictsBefore.some(isHere)) return conflictMessage(created);
  if (conflictsBefore.length > 0 && conflictsAfter.length === 0) return messages.noConflicts;
  return null;
}

/** Precedência: vitória > grade cheia com erros > conflito criado > sem conflitos > conteúdo da célula. */
function playText(before: Game, after: Game, selected: Selection): string {
  const { row, col } = selected;
  const status = getGameStatus(after);
  if (status === 'won') return messages.won;
  if (status === 'full-incorrect') return messages.fullWithErrors;
  const tail = conflictTail(before, after, selected);
  if (tail !== null) return tail;
  const cell = after.board.cells[row * 9 + col];
  return cellLabel(row, col, {
    value: cell?.value ?? null,
    given: false,
    conflicted: false,
    notes: [],
  });
}

function play(
  state: UiState,
  result: Outcome,
  text: (after: Game) => string = (after) => playText(state.game, after, state.selected),
): UiState {
  if (!result.ok) {
    if (result.reason === 'cell-is-given')
      return announce(state, state.game, messages.givenImmutable);
    if (result.reason === 'cell-has-value')
      return announce(state, state.game, messages.cellHasValue);
    return silent(state, state.game);
  }
  if (result.value === state.game) return silent(state, state.game);
  return announce(state, result.value, text(result.value));
}

function erase(state: UiState): UiState {
  const { row, col } = state.selected;
  const erased = gameErase(state.game, row, col);
  if (erased.ok && erased.value === state.game) {
    return play(state, gameClearNotes(state.game, row, col));
  }
  return play(state, erased);
}

function travel(state: UiState, kind: 'Desfeito' | 'Refeito'): UiState {
  const undoing = kind === 'Desfeito';
  const result = undoing ? gameUndo(state.game) : gameRedo(state.game);
  if (!result.ok) {
    if (result.reason === 'game-over') return silent(state, state.game);
    return announce(state, state.game, undoing ? messages.nothingToUndo : messages.nothingToRedo);
  }
  const after = result.value;
  const move = state.game.history[Math.min(state.game.cursor, after.cursor)]?.move;
  const index = move?.index ?? 0;
  const selected: Selection = { row: Math.floor(index / 9) as Index, col: (index % 9) as Index };
  const base = { ...state, game: after, selected, focusTick: state.focusTick + 1 };
  if (getGameStatus(after) === 'won') return announce(base, after, messages.won);
  const head = historyMessage(kind, move as NonNullable<typeof move>, selected.row, selected.col);
  const tail = conflictTail(state.game, after, selected);
  return announce(base, after, tail === null ? head : `${head}. ${tail}`);
}

export function gameReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case 'select':
      return { ...state, selected: action.to, announcement: null };
    case 'move':
      return {
        ...state,
        selected: moveSelection(state.selected, action.key, action.ctrl),
        announcement: null,
      };
    case 'digit': {
      const { row, col } = state.selected;
      if (!state.noteMode) {
        return play(state, gamePlaceAndPrune(state.game, row, col, action.digit));
      }
      return play(state, gameToggleNote(state.game, row, col, action.digit), (after) =>
        notesMessage(notesAt(after, row, col)),
      );
    }
    case 'erase':
      return erase(state);
    case 'toggle-mode': {
      if (getGameStatus(state.game) === 'won') return silent(state, state.game);
      const noteMode = !state.noteMode;
      return announce(
        { ...state, noteMode },
        state.game,
        noteMode ? messages.noteModeOn : messages.noteModeOff,
      );
    }
    case 'undo':
      return travel(state, 'Desfeito');
    case 'redo':
      return travel(state, 'Refeito');
  }
}
