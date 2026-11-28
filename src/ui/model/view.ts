import { cellAt } from '../../domain/board';
import {
  canRedo,
  canUndo,
  getGameConflicts,
  getGameStatus,
  notesAt,
  type Game,
} from '../../domain/game';
import type { Index } from '../../domain/units';
import type { CellView } from './messages';
import type { Selection } from './navigation';

export interface GridCellView extends CellView {
  readonly row: Index;
  readonly col: Index;
  readonly selected: boolean;
  readonly peer: boolean;
  readonly sameValue: boolean;
}

const INDEXES: readonly Index[] = [0, 1, 2, 3, 4, 5, 6, 7, 8];

const boxOf = (row: number, col: number): number => Math.floor(row / 3) * 3 + Math.floor(col / 3);

/** Visão das 81 células (linha a linha), derivada do jogo e da seleção. */
export function gridView(game: Game, selected: Selection): readonly GridCellView[] {
  const conflicts = getGameConflicts(game);
  const selectedValue = cellAt(game.board, selected.row, selected.col).value;
  const selectedBox = boxOf(selected.row, selected.col);
  return INDEXES.flatMap((row) =>
    INDEXES.map((col) => {
      const { value, given } = cellAt(game.board, row, col);
      const isSelected = row === selected.row && col === selected.col;
      return {
        row,
        col,
        value,
        given,
        notes: value === null ? notesAt(game, row, col) : [],
        conflicted: conflicts.some((c) => c.row === row && c.col === col),
        selected: isSelected,
        peer:
          !isSelected &&
          (row === selected.row || col === selected.col || boxOf(row, col) === selectedBox),
        sameValue: !isSelected && selectedValue !== null && value === selectedValue,
      };
    }),
  );
}

export interface ControlsView {
  readonly noteMode: boolean;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
}

/** Estado dos controles; desfazer e refazer ficam desligados com a partida vencida. */
export function controlsView(game: Game, noteMode: boolean): ControlsView {
  const open = getGameStatus(game) !== 'won';
  return { noteMode, canUndo: open && canUndo(game), canRedo: open && canRedo(game) };
}
