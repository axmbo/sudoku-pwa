import type { JSX } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import type { Digit } from '../domain/digit';
import { Cell } from './Cell';
import type { NavigationKey } from './model/navigation';
import type { UiAction } from './model/reducer';
import type { GridCellView } from './model/view';

export interface GridProps {
  readonly cells: readonly GridCellView[];
  readonly dispatch: (action: UiAction) => void;
  /** Sobe a cada undo/redo aplicado; o foco real vai para a célula selecionada. */
  readonly focusTick?: number;
}

const NAVIGATION_KEYS: readonly string[] = [
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
];

function actionFor(event: KeyboardEvent): UiAction | null {
  const { key } = event;
  if (/^[1-9]$/.test(key)) return { type: 'digit', digit: Number(key) as Digit };
  if (key === 'Backspace' || key === 'Delete' || key === '0') return { type: 'erase' };
  if (NAVIGATION_KEYS.includes(key)) {
    return { type: 'move', key: key as NavigationKey, ctrl: event.ctrlKey };
  }
  return null;
}

export function Grid({ cells, dispatch, focusTick = 0 }: GridProps): JSX.Element {
  const root = useRef<HTMLDivElement>(null);
  const byKeyboard = useRef(false);
  const lastSelected = useRef(-1);

  // Depois de uma tecla de navegação, o foco real acompanha a célula selecionada.
  // O efeito roda após a pintura e o Preact o executa de forma adiada, até no início do
  // render seguinte; por isso a decisão usa só a seleção do próprio render (`changed`) e
  // a marca, armada só por navegação, nunca é apagada por efeito (T10). Clique a desarma.
  useEffect(() => {
    const selected = cells.findIndex((cell) => cell.selected);
    const changed = selected !== lastSelected.current;
    lastSelected.current = selected;
    if (!changed || !byKeyboard.current) return;
    root.current?.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]')?.focus();
  });

  const lastTick = useRef(focusTick);
  useEffect(() => {
    if (focusTick === lastTick.current) return;
    lastTick.current = focusTick;
    root.current?.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]')?.focus();
  }, [focusTick]);

  const onKeyDown = (event: KeyboardEvent): void => {
    const action = actionFor(event);
    if (action === null) return;
    event.preventDefault();
    if (action.type === 'move') byKeyboard.current = true;
    dispatch(action);
  };

  const rows = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((r) => cells.slice(r * 9, r * 9 + 9));
  return (
    <div role="grid" class="grid" aria-label="Grade de Sudoku" ref={root}>
      {rows.map((row) => (
        <div role="row" class="grid-row" key={row[0]?.row}>
          {row.map((cell) => (
            <Cell
              key={cell.col}
              cell={cell}
              onClick={() => {
                byKeyboard.current = false;
                dispatch({ type: 'select', to: { row: cell.row, col: cell.col } });
              }}
              onKeyDown={onKeyDown}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
