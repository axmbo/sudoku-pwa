import type { JSX } from 'preact';
import { cellLabel } from './model/messages';
import type { GridCellView } from './model/view';

export interface CellProps {
  readonly cell: GridCellView;
  readonly onClick: () => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
}

export function Cell({ cell, onClick, onKeyDown }: CellProps): JSX.Element {
  const classes = [
    'cell',
    cell.selected && 'is-selected',
    cell.peer && 'is-peer',
    cell.sameValue && 'is-same-value',
    cell.given && 'is-given',
    cell.conflicted && 'is-conflict',
    (cell.col === 2 || cell.col === 5) && 'box-end-col',
    (cell.row === 2 || cell.row === 5) && 'box-end-row',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div
      role="gridcell"
      class={classes}
      tabIndex={cell.selected ? 0 : -1}
      aria-label={cellLabel(cell.row, cell.col, cell)}
      data-row={cell.row}
      data-col={cell.col}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <span class="cell-digit">{cell.value ?? ''}</span>
    </div>
  );
}
