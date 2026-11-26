import { cleanup, fireEvent, render, screen, within } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { FIXED_PUZZLE, fixedGame } from './fixed-puzzle';
import { messages } from './model/messages';

// Contrato assumido de App (o dev implementa; decisão registrada no retorno do RED):
//   <App game={Game} />   // useReducer(gameReducer, game, initialState); main.tsx monta <App game={fixedGame()} />
// Compõe <h1>, <Grid>, <Keypad>, <Announcer> (único role="status") e, derivado de getGameStatus,
// um banner visível FORA da região viva: messages.won (vitória) ou messages.fullWithErrors.

afterEach(cleanup);

// M-018: a solução e as pistas saem de FIXED_PUZZLE por código, nunca digitadas à mão.
const { givens, solution } = FIXED_PUZZLE as {
  givens: (number | null)[][];
  solution: number[][];
};

const cellAtRC = (row: number, col: number): HTMLElement => {
  const rows = screen.getAllByRole('row');
  return within(rows[row] as HTMLElement).getAllByRole('gridcell')[col] as HTMLElement;
};

const put = (row: number, col: number, digit: number): void => {
  fireEvent.click(cellAtRC(row, col));
  fireEvent.click(screen.getByRole('button', { name: `Inserir ${digit}` }));
};

/** Preenche todas as vazias com a solução; `wrongLast` troca o valor da última vazia por outro. */
function fillGrid(wrongLast: boolean): void {
  const empties: [number, number][] = [];
  for (let r = 0; r < 9; r += 1) {
    for (let c = 0; c < 9; c += 1) if (givens[r]?.[c] === null) empties.push([r, c]);
  }
  empties.forEach(([r, c], i) => {
    const right = solution[r]?.[c] as number;
    const isLast = i === empties.length - 1;
    put(r, c, wrongLast && isLast ? (right % 9) + 1 : right);
  });
}

const outsideStatus = (text: string): HTMLElement[] => {
  const status = screen.getByRole('status');
  return screen.queryAllByText(text).filter((el) => !status.contains(el));
};

describe('App', () => {
  it('CA-005-36: há exatamente um h1, em pt-BR', () => {
    render(<App game={fixedGame()} />);
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]?.textContent).toBe('Sudoku');
  });

  it('CA-005-31: há um único role=status, vazio no início', () => {
    render(<App game={fixedGame()} />);
    const regions = screen.getAllByRole('status');
    expect(regions).toHaveLength(1);
    expect(regions[0]?.textContent).toBe('');
  });

  it('CA-005-31: rajada de jogadas deixa na região só o texto da última', () => {
    render(<App game={fixedGame()} />);
    fireEvent.click(cellAtRC(0, 2));
    fireEvent.click(screen.getByRole('button', { name: 'Inserir 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Inserir 2' }));
    const status = screen.getByRole('status');
    expect(status.textContent).toBe('Linha 1, coluna 3, 2');
    expect(status.childElementCount).toBe(1);
  });

  it('CA-005-31: uma ação sem anúncio (mover seleção) esvazia a região', () => {
    render(<App game={fixedGame()} />);
    fireEvent.click(cellAtRC(0, 2));
    fireEvent.click(screen.getByRole('button', { name: 'Inserir 1' }));
    fireEvent.click(cellAtRC(0, 3));
    expect(screen.getByRole('status').textContent).toBe('');
  });

  it('CA-005-27: o teclado na tela joga na célula selecionada dentro do App', () => {
    render(<App game={fixedGame()} />);
    put(4, 4, 5);
    expect(cellAtRC(4, 4).querySelector('.cell-digit')?.textContent).toBe('5');
    expect(cellAtRC(4, 4).classList.contains('is-selected')).toBe(true);
  });

  it('CA-005-29: preencher a grade igual à solução mostra o banner de vitória e anuncia', () => {
    render(<App game={fixedGame()} />);
    expect(outsideStatus(messages.won)).toHaveLength(0);
    fillGrid(false);
    expect(outsideStatus(messages.won)).toHaveLength(1);
    expect(screen.getByRole('status').textContent).toBe(messages.won);
    expect(outsideStatus(messages.fullWithErrors)).toHaveLength(0);
  });

  it('CA-005-29: após a vitória o banner persiste e a grade segue navegável', () => {
    render(<App game={fixedGame()} />);
    fillGrid(false);
    fireEvent.click(cellAtRC(0, 2));
    expect(outsideStatus(messages.won)).toHaveLength(1);
    expect(cellAtRC(0, 2).getAttribute('tabindex')).toBe('0');
    fireEvent.click(screen.getByRole('button', { name: 'Apagar' }));
    expect(cellAtRC(0, 2).querySelector('.cell-digit')?.textContent).toBe(String(solution[0]?.[2]));
  });

  it('CA-005-30: preencher a grade errado mostra o aviso de erros sem declarar vitória', () => {
    render(<App game={fixedGame()} />);
    fillGrid(true);
    const avisos = outsideStatus(messages.fullWithErrors);
    expect(avisos).toHaveLength(1);
    expect(screen.getByRole('status').textContent).toBe(messages.fullWithErrors);
    expect(screen.queryByText(messages.won)).toBeNull();
  });

  it('CA-005-30: o aviso de erros não diz onde estão os erros', () => {
    render(<App game={fixedGame()} />);
    fillGrid(true);
    const aviso = outsideStatus(messages.fullWithErrors)[0] as HTMLElement;
    expect(aviso.textContent).toBe(messages.fullWithErrors);
    expect(aviso.textContent).not.toMatch(/linha|coluna|caixa|\d/i);
  });

  it('CA-005-30: o jogo continua depois do aviso (corrigir a última célula vence)', () => {
    render(<App game={fixedGame()} />);
    fillGrid(true);
    let last: [number, number] = [0, 0];
    for (let r = 0; r < 9; r += 1) {
      for (let c = 0; c < 9; c += 1) if (givens[r]?.[c] === null) last = [r, c];
    }
    put(last[0], last[1], solution[last[0]]?.[last[1]] as number);
    expect(outsideStatus(messages.won)).toHaveLength(1);
    expect(outsideStatus(messages.fullWithErrors)).toHaveLength(0);
  });

  it('CA-005-37: nenhum texto promete salvamento ou persistência', () => {
    render(<App game={fixedGame()} />);
    expect(document.body.textContent ?? '').not.toMatch(
      /salv|persist|armazen|guardad|continuar depois|retomar/i,
    );
  });
});
