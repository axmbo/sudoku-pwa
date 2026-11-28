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

// T05 (spec 005b): atalhos globais N, Ctrl+Z, Ctrl+Y (document), botões de ação e foco.
// Contrato: o App compõe <Actions> (botões "Anotar", "Desfazer", "Refazer") ao lado do teclado;
// o modo é lido por aria-pressed do botão Anotar; o foco real vai à célula afetada por undo/redo.
const btn = (name: string): HTMLElement => screen.getByRole('button', { name });
const mode = (): string | null => btn('Anotar').getAttribute('aria-pressed');
const status = (): string => screen.getByRole('status').textContent ?? '';
const label = (row: number, col: number): string =>
  cellAtRC(row, col).getAttribute('aria-label') ?? '';
const digitAt = (row: number, col: number): string =>
  cellAtRC(row, col).querySelector('.cell-digit')?.textContent ?? '';
const noteSlots = (row: number, col: number): string =>
  [...cellAtRC(row, col).querySelectorAll('.cell-notes > *')].map((e) => e.textContent).join('');
const ctrl = (key: string, target: Element | Document = document, init = {}): boolean =>
  fireEvent.keyDown(target, { key, ctrlKey: true, ...init });

describe('App: modo anotação', () => {
  it('CA-005-16: N com o foco na grade alterna o modo, que é pegajoso, e anuncia', () => {
    render(<App game={fixedGame()} />);
    expect(mode()).toBe('false');
    fireEvent.click(cellAtRC(4, 4));
    cellAtRC(4, 4).focus();
    fireEvent.keyDown(cellAtRC(4, 4), { key: 'n' });
    expect(mode()).toBe('true');
    expect(status()).toBe(messages.noteModeOn);
    fireEvent.click(cellAtRC(0, 2));
    expect(mode()).toBe('true');
    fireEvent.keyDown(cellAtRC(0, 2), { key: 'N' });
    expect(mode()).toBe('false');
    expect(status()).toBe(messages.noteModeOff);
  });

  it('CA-005-16: N com o foco num botão do teclado na tela também alterna', () => {
    render(<App game={fixedGame()} />);
    const um = btn('Inserir 1');
    um.focus();
    fireEvent.keyDown(um, { key: 'n' });
    expect(mode()).toBe('true');
  });

  it.each([
    ['Ctrl', { ctrlKey: true }],
    ['Alt', { altKey: true }],
    ['Meta', { metaKey: true }],
  ])(
    'CA-005-16: N com %s não alterna o modo e não é impedido (segue para o navegador)',
    (_n, mod) => {
      render(<App game={fixedGame()} />);
      const notPrevented = fireEvent.keyDown(document.body, { key: 'n', ...mod });
      expect(mode()).toBe('false');
      expect(notPrevented).toBe(true);
    },
  );

  it('CA-005-16: N com repeat (tecla segurada) não alterna em rajada', () => {
    render(<App game={fixedGame()} />);
    fireEvent.keyDown(document.body, { key: 'n' });
    expect(mode()).toBe('true');
    fireEvent.keyDown(document.body, { key: 'n', repeat: true });
    fireEvent.keyDown(document.body, { key: 'n', repeat: true });
    expect(mode()).toBe('true');
  });

  it('CA-005-38: o botão Anotar alterna o modo e mantém a célula selecionada', () => {
    render(<App game={fixedGame()} />);
    fireEvent.click(cellAtRC(4, 4));
    fireEvent.click(btn('Anotar'));
    expect(mode()).toBe('true');
    expect(status()).toBe(messages.noteModeOn);
    expect(cellAtRC(4, 4).classList.contains('is-selected')).toBe(true);
  });
});

describe('App: anotar e apagar anotações', () => {
  it('CA-005-17: no modo anotação, 1 a 9 alternam o candidato, sem colocar valor, e anunciam as anotações', () => {
    render(<App game={fixedGame()} />);
    fireEvent.click(cellAtRC(0, 2));
    fireEvent.click(btn('Anotar'));
    fireEvent.click(btn('Inserir 4'));
    fireEvent.click(btn('Inserir 2'));
    expect(noteSlots(0, 2)).toBe('24');
    expect(digitAt(0, 2)).toBe('');
    expect(label(0, 2)).toBe('Linha 1, coluna 3, vazia, anotações 2 4');
    expect(status()).toBe('anotações 2 4');
    fireEvent.click(btn('Inserir 4'));
    expect(noteSlots(0, 2)).toBe('2');
    expect(status()).toBe('anotações 2');
  });

  it('CA-005-18: anotar em célula com valor não muda nada e anuncia que já tem valor', () => {
    render(<App game={fixedGame()} />);
    put(4, 4, 5);
    fireEvent.click(btn('Anotar'));
    fireEvent.click(btn('Inserir 3'));
    expect(digitAt(4, 4)).toBe('5');
    expect(cellAtRC(4, 4).querySelector('.cell-notes')).toBeNull();
    expect(status()).toBe(messages.cellHasValue);
  });

  it('CA-005-18: anotar numa pista anuncia "pista, não pode ser alterada"', () => {
    render(<App game={fixedGame()} />);
    fireEvent.click(cellAtRC(0, 0));
    fireEvent.click(btn('Anotar'));
    fireEvent.click(btn('Inserir 3'));
    expect(digitAt(0, 0)).toBe('5');
    expect(status()).toBe(messages.givenImmutable);
  });

  it('CA-005-44: Apagar em célula vazia com anotações apaga todas e anuncia "vazia"', () => {
    render(<App game={fixedGame()} />);
    fireEvent.click(cellAtRC(0, 2));
    fireEvent.click(btn('Anotar'));
    fireEvent.click(btn('Inserir 1'));
    fireEvent.click(btn('Inserir 6'));
    expect(noteSlots(0, 2)).toBe('16');
    fireEvent.click(btn('Apagar'));
    expect(noteSlots(0, 2)).toBe('');
    expect(label(0, 2)).toBe('Linha 1, coluna 3, vazia');
    expect(status()).toBe('Linha 1, coluna 3, vazia');
  });

  it('CA-005-43: colocar um valor remove a anotação do mesmo valor nas vizinhas, visível na grade', () => {
    render(<App game={fixedGame()} />);
    fireEvent.click(cellAtRC(4, 1));
    fireEvent.click(btn('Anotar'));
    fireEvent.click(btn('Inserir 5'));
    fireEvent.click(btn('Inserir 7'));
    expect(noteSlots(4, 1)).toBe('57');
    fireEvent.click(btn('Anotar'));
    fireEvent.click(cellAtRC(4, 4));
    fireEvent.click(btn('Inserir 5'));
    expect(digitAt(4, 4)).toBe('5');
    expect(noteSlots(4, 1)).toBe('7');
    expect(label(4, 1)).toBe('Linha 5, coluna 2, vazia, anotações 7');
  });
});

describe('App: desfazer e refazer', () => {
  it('CA-005-23: Ctrl+Z com o foco na grade desfaz, anuncia e leva o foco à célula afetada', () => {
    render(<App game={fixedGame()} />);
    put(4, 4, 5);
    fireEvent.click(cellAtRC(0, 2));
    cellAtRC(0, 2).focus();
    ctrl('z', cellAtRC(0, 2));
    expect(digitAt(4, 4)).toBe('');
    expect(status()).toBe('Desfeito: valor 5 na linha 5, coluna 5');
    expect(cellAtRC(4, 4).classList.contains('is-selected')).toBe(true);
    expect(document.activeElement).toBe(cellAtRC(4, 4));
  });

  it('CA-005-23: Ctrl+Z com o foco num botão do teclado na tela também desfaz e move o foco', () => {
    render(<App game={fixedGame()} />);
    put(4, 4, 5);
    fireEvent.click(cellAtRC(0, 2));
    const um = btn('Inserir 1');
    um.focus();
    ctrl('z', um);
    expect(digitAt(4, 4)).toBe('');
    expect(document.activeElement).toBe(cellAtRC(4, 4));
  });

  it('CA-005-23: o botão Desfazer desfaz e move o foco para a célula afetada', () => {
    render(<App game={fixedGame()} />);
    put(4, 4, 5);
    fireEvent.click(cellAtRC(0, 2));
    const desfazer = btn('Desfazer');
    desfazer.focus();
    fireEvent.click(desfazer);
    expect(digitAt(4, 4)).toBe('');
    expect(status()).toBe('Desfeito: valor 5 na linha 5, coluna 5');
    expect(document.activeElement).toBe(cellAtRC(4, 4));
  });

  it('CA-005-24: Ctrl+Y e o botão Refazer reaplicam, anunciam e movem o foco', () => {
    render(<App game={fixedGame()} />);
    put(4, 4, 5);
    fireEvent.click(btn('Desfazer'));
    fireEvent.click(cellAtRC(0, 2));
    const um = btn('Inserir 1');
    um.focus();
    ctrl('y', um);
    expect(digitAt(4, 4)).toBe('5');
    expect(status()).toBe('Refeito: valor 5 na linha 5, coluna 5');
    expect(document.activeElement).toBe(cellAtRC(4, 4));
    fireEvent.click(btn('Desfazer'));
    fireEvent.click(cellAtRC(0, 2));
    const refazer = btn('Refazer');
    refazer.focus();
    fireEvent.click(refazer);
    expect(digitAt(4, 4)).toBe('5');
    expect(document.activeElement).toBe(cellAtRC(4, 4));
  });

  it('CA-005-23: desfazer uma anotação restaura as anotações anteriores', () => {
    render(<App game={fixedGame()} />);
    fireEvent.click(cellAtRC(0, 2));
    fireEvent.click(btn('Anotar'));
    fireEvent.click(btn('Inserir 3'));
    fireEvent.click(btn('Inserir 8'));
    ctrl('z');
    expect(noteSlots(0, 2)).toBe('3');
    ctrl('z');
    expect(noteSlots(0, 2)).toBe('');
  });

  it('CA-005-25: sem histórico, Desfazer e Refazer anunciam "nada para…" e ficam aria-disabled e focáveis', () => {
    render(<App game={fixedGame()} />);
    expect(btn('Desfazer').getAttribute('aria-disabled')).toBe('true');
    expect(btn('Refazer').getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(btn('Desfazer'));
    expect(status()).toBe(messages.nothingToUndo);
    fireEvent.click(btn('Refazer'));
    expect(status()).toBe(messages.nothingToRedo);
    ctrl('z');
    expect(status()).toBe(messages.nothingToUndo);
  });

  it('CA-005-25: com histórico, Desfazer deixa de ser aria-disabled; depois de desfazer, é o Refazer', () => {
    render(<App game={fixedGame()} />);
    put(4, 4, 5);
    expect(btn('Desfazer').getAttribute('aria-disabled')).not.toBe('true');
    expect(btn('Refazer').getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(btn('Desfazer'));
    expect(btn('Desfazer').getAttribute('aria-disabled')).toBe('true');
    expect(btn('Refazer').getAttribute('aria-disabled')).not.toBe('true');
  });
});

describe('App: partida vencida', () => {
  it('CA-005-42: após a vitória, N, Ctrl+Z, Ctrl+Y e os botões não mudam nada', () => {
    render(<App game={fixedGame()} />);
    fillGrid(false);
    const before = screen.getAllByRole('gridcell').map((c) => c.textContent);
    fireEvent.keyDown(document.body, { key: 'n' });
    ctrl('z');
    ctrl('y');
    fireEvent.click(btn('Anotar'));
    fireEvent.click(btn('Desfazer'));
    fireEvent.click(btn('Refazer'));
    expect(mode()).toBe('false');
    expect(screen.getAllByRole('gridcell').map((c) => c.textContent)).toEqual(before);
    expect(outsideStatus(messages.won)).toHaveLength(1);
  });

  it('CA-005-42: após a vitória, Desfazer e Refazer ficam aria-disabled', () => {
    render(<App game={fixedGame()} />);
    fillGrid(false);
    expect(btn('Desfazer').getAttribute('aria-disabled')).toBe('true');
    expect(btn('Refazer').getAttribute('aria-disabled')).toBe('true');
  });

  it('CA-005-42: após a vitória a grade segue navegável por seta', () => {
    render(<App game={fixedGame()} />);
    fillGrid(false);
    fireEvent.click(cellAtRC(0, 2));
    cellAtRC(0, 2).focus();
    fireEvent.keyDown(cellAtRC(0, 2), { key: 'ArrowRight' });
    expect(cellAtRC(0, 3).classList.contains('is-selected')).toBe(true);
    expect(document.activeElement).toBe(cellAtRC(0, 3));
  });
});

describe('App: regressão da 005a', () => {
  it('CA-005-05: rajada de setas seguida pela grade mantém o foco real na célula selecionada', () => {
    render(<App game={fixedGame()} />);
    fireEvent.click(cellAtRC(0, 0));
    cellAtRC(0, 0).focus();
    for (let i = 0; i < 3; i += 1) {
      fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowRight' });
    }
    fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowDown' });
    expect(cellAtRC(1, 3).classList.contains('is-selected')).toBe(true);
    expect(document.activeElement).toBe(cellAtRC(1, 3));
  });
});
