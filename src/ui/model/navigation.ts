import type { Index } from '../../domain/units';

export interface Selection {
  readonly row: Index;
  readonly col: Index;
}

export type NavigationKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End';

const FIRST: Index = 0;
const LAST: Index = 8;

/** Move a seleção; nas bordas fica parada (sem volta). */
export function moveSelection(from: Selection, key: NavigationKey, ctrl: boolean): Selection {
  switch (key) {
    case 'ArrowUp':
      return from.row === FIRST ? from : { row: (from.row - 1) as Index, col: from.col };
    case 'ArrowDown':
      return from.row === LAST ? from : { row: (from.row + 1) as Index, col: from.col };
    case 'ArrowLeft':
      return from.col === FIRST ? from : { row: from.row, col: (from.col - 1) as Index };
    case 'ArrowRight':
      return from.col === LAST ? from : { row: from.row, col: (from.col + 1) as Index };
    case 'Home':
      return { row: ctrl ? FIRST : from.row, col: FIRST };
    case 'End':
      return { row: ctrl ? LAST : from.row, col: LAST };
  }
}
