import { cleanup, fireEvent, render, screen, within } from '@testing-library/preact';
import { useReducer } from 'preact/hooks';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Actions } from './Actions';
import { Grid } from './Grid';
import { fixedGame } from './fixed-puzzle';
import { gameReducer, initialState, type UiAction } from './model/reducer';
import { controlsView, gridView, type ControlsView } from './model/view';

// Contrato assumido de Actions (o dev implementa; decisão registrada no retorno do RED):
//   <Actions controls={ControlsView} dispatch={(action: UiAction) => void} />
// Três <button type="button"> com nomes acessíveis exatos "Anotar", "Desfazer", "Refazer".
// Anotar: aria-pressed="true|false", classe is-on quando ligado, e dentro dele
//   <span class="action-state" aria-hidden="true">ligado|desligado</span> (fora do nome acessível).
// Desfazer/Refazer: aria-disabled="true" (nunca o atributo `disabled`) quando !canUndo / !canRedo.
// O clique sempre despacha a ação ({type:'toggle-mode'|'undo'|'redo'}); quem recusa é o reducer.

afterEach(cleanup);

const controls = (over: Partial<ControlsView> = {}): ControlsView => ({
  noteMode: false,
  canUndo: true,
  canRedo: true,
  ...over,
});

const btn = (name: string): HTMLElement => screen.getByRole('button', { name });

function Harness(): preact.JSX.Element {
  const [state, dispatch] = useReducer(gameReducer, fixedGame(), initialState);
  return (
    <>
      <Grid cells={gridView(state.game, state.selected)} dispatch={dispatch} />
      <Actions controls={controlsView(state.game, state.noteMode)} dispatch={dispatch} />
      <div role="log">{`${state.selected.row},${state.selected.col}`}</div>
    </>
  );
}

const cellAtRC = (row: number, col: number): HTMLElement => {
  const rows = screen.getAllByRole('row');
  return within(rows[row] as HTMLElement).getAllByRole('gridcell')[col] as HTMLElement;
};

describe('Actions: Anotar', () => {
  it('CA-005-16: o botão Anotar tem nome acessível exato "Anotar" nos dois estados', () => {
    const { rerender } = render(<Actions controls={controls()} dispatch={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Anotar' })).toBeTruthy();
    rerender(<Actions controls={controls({ noteMode: true })} dispatch={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Anotar' })).toBeTruthy();
  });

  it('CA-005-16: aria-pressed informa o estado do modo ao leitor de tela', () => {
    const { rerender } = render(<Actions controls={controls()} dispatch={vi.fn()} />);
    expect(btn('Anotar').getAttribute('aria-pressed')).toBe('false');
    rerender(<Actions controls={controls({ noteMode: true })} dispatch={vi.fn()} />);
    expect(btn('Anotar').getAttribute('aria-pressed')).toBe('true');
  });

  it('CA-005-16: o estado é visível além da cor (texto ligado/desligado, aria-hidden, classe is-on)', () => {
    const { rerender } = render(<Actions controls={controls()} dispatch={vi.fn()} />);
    let state = btn('Anotar').querySelector('.action-state');
    expect(state?.textContent).toBe('desligado');
    expect(state?.getAttribute('aria-hidden')).toBe('true');
    expect(btn('Anotar').classList.contains('is-on')).toBe(false);
    rerender(<Actions controls={controls({ noteMode: true })} dispatch={vi.fn()} />);
    state = btn('Anotar').querySelector('.action-state');
    expect(state?.textContent).toBe('ligado');
    expect(btn('Anotar').classList.contains('is-on')).toBe(true);
  });

  it('CA-005-38: clicar em Anotar despacha toggle-mode', () => {
    const dispatch = vi.fn<(action: UiAction) => void>();
    render(<Actions controls={controls()} dispatch={dispatch} />);
    fireEvent.click(btn('Anotar'));
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: 'toggle-mode' });
  });

  it('CA-005-38: clicar em Anotar alterna o modo, anuncia pelo estado e não muda a célula selecionada', () => {
    render(<Harness />);
    fireEvent.click(cellAtRC(4, 4));
    fireEvent.click(btn('Anotar'));
    expect(btn('Anotar').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('log').textContent).toBe('4,4');
    expect(cellAtRC(4, 4).classList.contains('is-selected')).toBe(true);
    fireEvent.click(btn('Anotar'));
    expect(btn('Anotar').getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByRole('log').textContent).toBe('4,4');
  });
});

describe('Actions: Desfazer e Refazer', () => {
  it('CA-005-25: com histórico, Desfazer e Refazer não têm aria-disabled', () => {
    render(<Actions controls={controls()} dispatch={vi.fn()} />);
    expect(btn('Desfazer').getAttribute('aria-disabled')).not.toBe('true');
    expect(btn('Refazer').getAttribute('aria-disabled')).not.toBe('true');
  });

  it('CA-005-25: indisponíveis, ficam aria-disabled=true e continuam focáveis (sem atributo disabled)', () => {
    render(<Actions controls={controls({ canUndo: false, canRedo: false })} dispatch={vi.fn()} />);
    for (const name of ['Desfazer', 'Refazer']) {
      const b = btn(name) as HTMLButtonElement;
      expect(b.getAttribute('aria-disabled')).toBe('true');
      expect(b.hasAttribute('disabled')).toBe(false);
      b.focus();
      expect(document.activeElement).toBe(b);
    }
  });

  it('CA-005-23: clicar em Desfazer despacha undo; em Refazer, redo', () => {
    const dispatch = vi.fn<(action: UiAction) => void>();
    render(<Actions controls={controls()} dispatch={dispatch} />);
    fireEvent.click(btn('Desfazer'));
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'undo' });
    fireEvent.click(btn('Refazer'));
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'redo' });
    expect(dispatch).toHaveBeenCalledTimes(2);
  });

  it('CA-005-25: clicar em indisponível ainda despacha a ação (o reducer anuncia "nada para…")', () => {
    const dispatch = vi.fn<(action: UiAction) => void>();
    render(<Actions controls={controls({ canUndo: false, canRedo: false })} dispatch={dispatch} />);
    fireEvent.click(btn('Desfazer'));
    fireEvent.click(btn('Refazer'));
    expect(dispatch.mock.calls.map(([a]) => a.type)).toEqual(['undo', 'redo']);
  });

  it('CA-005-25: nada a desfazer, nada muda na seleção nem na grade', () => {
    render(<Harness />);
    fireEvent.click(cellAtRC(4, 4));
    fireEvent.click(btn('Desfazer'));
    fireEvent.click(btn('Refazer'));
    expect(screen.getByRole('log').textContent).toBe('4,4');
    expect(cellAtRC(4, 4).classList.contains('is-selected')).toBe(true);
  });

  it('CA-005-42: sem desfazer nem refazer possíveis (partida vencida), os dois são aria-disabled', () => {
    render(<Actions controls={controls({ canUndo: false, canRedo: false })} dispatch={vi.fn()} />);
    expect(btn('Desfazer').getAttribute('aria-disabled')).toBe('true');
    expect(btn('Refazer').getAttribute('aria-disabled')).toBe('true');
  });
});

describe('Actions: estrutura', () => {
  it('CA-005-38: são exatamente três botões, na ordem Anotar, Desfazer, Refazer', () => {
    render(<Actions controls={controls()} dispatch={vi.fn()} />);
    const names = screen
      .getAllByRole('button')
      .map((b) => b.getAttribute('aria-label') ?? b.textContent);
    expect(names).toHaveLength(3);
    expect(names[0]).toMatch(/^Anotar/);
    expect(names[1]).toBe('Desfazer');
    expect(names[2]).toBe('Refazer');
  });
});
