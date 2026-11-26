import { cleanup, fireEvent, render, screen, within } from '@testing-library/preact';
import { useReducer } from 'preact/hooks';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Grid } from './Grid';
import { Keypad } from './Keypad';
import { fixedGame } from './fixed-puzzle';
import { gameReducer, initialState, type UiAction } from './model/reducer';
import { gridView } from './model/view';

// Contrato assumido de Keypad (o dev implementa; decisão registrada no retorno do RED):
//   <Keypad dispatch={(action: UiAction) => void} />
// Dez <button type="button">: nome acessível "Inserir 1" a "Inserir 9" e "Apagar".
// Cada botão dispara a mesma UiAction do atalho de teclado ({type:'digit', digit} / {type:'erase'}).
// O Keypad não conhece a seleção: ela vive no reducer e não muda ao focar/clicar o botão.

afterEach(cleanup);

function Harness(): preact.JSX.Element {
  const [state, dispatch] = useReducer(gameReducer, fixedGame(), initialState);
  return (
    <>
      <Grid cells={gridView(state.game, state.selected)} dispatch={dispatch} />
      <Keypad dispatch={dispatch} />
    </>
  );
}

const cellAtRC = (row: number, col: number): HTMLElement => {
  const rows = screen.getAllByRole('row');
  return within(rows[row] as HTMLElement).getAllByRole('gridcell')[col] as HTMLElement;
};

describe('Keypad', () => {
  it('CA-005-27: há botões 1 a 9 e Apagar com nome acessível em pt-BR', () => {
    render(<Keypad dispatch={vi.fn()} />);
    for (let d = 1; d <= 9; d += 1) {
      expect(screen.getByRole('button', { name: `Inserir ${d}` })).toBeTruthy();
    }
    expect(screen.getByRole('button', { name: 'Apagar' })).toBeTruthy();
    expect(screen.getAllByRole('button')).toHaveLength(10);
  });

  it('CA-005-27: cada botão de dígito dispara a ação digit igual ao atalho de teclado', () => {
    const dispatch = vi.fn<(action: UiAction) => void>();
    render(<Keypad dispatch={dispatch} />);
    for (let d = 1; d <= 9; d += 1) {
      fireEvent.click(screen.getByRole('button', { name: `Inserir ${d}` }));
      expect(dispatch).toHaveBeenLastCalledWith({ type: 'digit', digit: d });
    }
    expect(dispatch).toHaveBeenCalledTimes(9);
  });

  it('CA-005-27: Apagar dispara a ação erase igual ao atalho de teclado', () => {
    const dispatch = vi.fn<(action: UiAction) => void>();
    render(<Keypad dispatch={dispatch} />);
    fireEvent.click(screen.getByRole('button', { name: 'Apagar' }));
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: 'erase' });
  });

  it('CA-005-27: o botão aplica o valor à célula selecionada, que continua selecionada com o botão focado', () => {
    render(<Harness />);
    fireEvent.click(cellAtRC(4, 4));
    const botao = screen.getByRole('button', { name: 'Inserir 7' });
    botao.focus();
    fireEvent.click(botao);
    const cell = cellAtRC(4, 4);
    expect(cell.querySelector('.cell-digit')?.textContent).toBe('7');
    expect(cell.getAttribute('tabindex')).toBe('0');
    expect(cell.classList.contains('is-selected')).toBe(true);
    expect(
      screen.getAllByRole('gridcell').filter((c) => c.getAttribute('tabindex') === '0'),
    ).toHaveLength(1);
  });

  it('CA-005-27: Apagar limpa a célula selecionada e ela continua selecionada', () => {
    render(<Harness />);
    fireEvent.click(cellAtRC(4, 4));
    fireEvent.click(screen.getByRole('button', { name: 'Inserir 7' }));
    const apagar = screen.getByRole('button', { name: 'Apagar' });
    apagar.focus();
    fireEvent.click(apagar);
    const cell = cellAtRC(4, 4);
    expect(cell.querySelector('.cell-digit')?.textContent ?? '').toBe('');
    expect(cell.classList.contains('is-selected')).toBe(true);
    expect(cell.getAttribute('tabindex')).toBe('0');
  });

  it('CA-005-27: botão sobre uma pista não altera o valor e a seleção permanece', () => {
    render(<Harness />);
    fireEvent.click(cellAtRC(0, 0));
    fireEvent.click(screen.getByRole('button', { name: 'Inserir 9' }));
    const cell = cellAtRC(0, 0);
    expect(cell.querySelector('.cell-digit')?.textContent).toBe('5');
    expect(cell.classList.contains('is-selected')).toBe(true);
  });
});
