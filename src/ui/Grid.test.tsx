import { cleanup, fireEvent, render, screen, within } from '@testing-library/preact';
import { useReducer } from 'preact/hooks';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Game } from '../domain/game';
import { Grid } from './Grid';
import { fixedGame } from './fixed-puzzle';
import { gameReducer, initialState, type UiAction } from './model/reducer';
import { gridView } from './model/view';
import { gameWithNotes } from './tests/fixed-notes';

// Contrato assumido de Grid (o dev implementa; decisão registrada no retorno do RED):
//   <Grid cells={gridView(game, selected)} dispatch={(action: UiAction) => void} />
// Grid não consulta o domínio: a seleção vem de `cells[i].selected`. O dispatch recebe
// UiAction (select/move/digit/erase). Células: gridcell com aria-label de cellLabel,
// dígito em <span class="cell-digit">, classes is-selected, is-peer, is-same-value,
// is-given, is-conflict e, para a borda de caixa, box-end-col (colunas 3 e 6, base 1)
// e box-end-row (linhas 3 e 6).
//
// Puzzle fixo, base 0: (0,0)=5 pista; (0,1)=3 pista; (0,2) vazia; (7,8)=5 pista; (4,4) vazia.

afterEach(cleanup);

function Harness(): preact.JSX.Element {
  const [state, dispatch] = useReducer(gameReducer, fixedGame(), initialState);
  return <Grid cells={gridView(state.game, state.selected)} dispatch={dispatch} />;
}

function renderSpy(): { dispatch: ReturnType<typeof vi.fn> } {
  const dispatch = vi.fn<(action: UiAction) => void>();
  render(<Grid cells={gridView(fixedGame(), { row: 0, col: 0 })} dispatch={dispatch} />);
  return { dispatch };
}

const cellAtRC = (row: number, col: number): HTMLElement => {
  const rows = screen.getAllByRole('row');
  return within(rows[row] as HTMLElement).getAllByRole('gridcell')[col] as HTMLElement;
};

const tabbable = (): HTMLElement[] =>
  screen.getAllByRole('gridcell').filter((c) => c.getAttribute('tabindex') === '0');

const digitOf = (cell: HTMLElement): string | undefined =>
  cell.querySelector('.cell-digit')?.textContent ?? undefined;

describe('Grid: estrutura', () => {
  it('CA-005-01: role=grid com 9 linhas e 81 células, 9 por linha', () => {
    render(<Harness />);
    expect(screen.getByRole('grid')).toBeTruthy();
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(9);
    for (const r of rows) expect(within(r).getAllByRole('gridcell')).toHaveLength(9);
    expect(screen.getAllByRole('gridcell')).toHaveLength(81);
  });

  it('CA-005-01: as pistas aparecem no span cell-digit e as demais células ficam sem dígito', () => {
    render(<Harness />);
    expect(digitOf(cellAtRC(0, 0))).toBe('5');
    expect(digitOf(cellAtRC(0, 1))).toBe('3');
    expect(digitOf(cellAtRC(7, 8))).toBe('5');
    expect(digitOf(cellAtRC(0, 2)) ?? '').toBe('');
    expect(digitOf(cellAtRC(4, 4)) ?? '').toBe('');
  });

  it('CA-005-01: a borda de caixa é marcada por classe nas colunas e linhas 3 e 6', () => {
    render(<Harness />);
    for (let r = 0; r < 9; r += 1) {
      for (let c = 0; c < 9; c += 1) {
        const cls = cellAtRC(r, c).classList;
        expect(cls.contains('box-end-col')).toBe(c === 2 || c === 5);
        expect(cls.contains('box-end-row')).toBe(r === 2 || r === 5);
      }
    }
  });
});

describe('Grid: pista e nome acessível', () => {
  it('CA-005-02: só as pistas têm a classe is-given e a palavra "pista" no nome', () => {
    render(<Harness />);
    expect(cellAtRC(0, 0).classList.contains('is-given')).toBe(true);
    expect(cellAtRC(0, 0).getAttribute('aria-label')).toContain('pista');
    expect(cellAtRC(0, 2).classList.contains('is-given')).toBe(false);
    expect(cellAtRC(0, 2).getAttribute('aria-label')).not.toContain('pista');
  });

  it('CA-005-02: valor do jogador não é pista, nem por classe nem por nome', () => {
    render(<Harness />);
    fireEvent.keyDown(cellAtRC(0, 0), { key: 'ArrowRight' });
    fireEvent.keyDown(cellAtRC(0, 1), { key: 'ArrowRight' });
    fireEvent.keyDown(cellAtRC(0, 2), { key: '4' });
    const cell = cellAtRC(0, 2);
    expect(digitOf(cell)).toBe('4');
    expect(cell.classList.contains('is-given')).toBe(false);
    expect(cell.getAttribute('aria-label')).not.toContain('pista');
  });

  it('CA-005-03: o nome acessível segue os formatos pt-BR (pista, vazia)', () => {
    render(<Harness />);
    expect(screen.getByRole('gridcell', { name: 'Linha 1, coluna 1, 5, pista' })).toBeTruthy();
    expect(screen.getByRole('gridcell', { name: 'Linha 1, coluna 3, vazia' })).toBeTruthy();
  });

  it('CA-005-03: valor do jogador vira "Linha 1, coluna 3, 4" sem pista', () => {
    render(<Harness />);
    fireEvent.keyDown(cellAtRC(0, 0), { key: 'ArrowRight' });
    fireEvent.keyDown(cellAtRC(0, 1), { key: 'ArrowRight' });
    fireEvent.keyDown(cellAtRC(0, 2), { key: '4' });
    expect(screen.getByRole('gridcell', { name: 'Linha 1, coluna 3, 4' })).toBeTruthy();
  });
});

describe('Grid: foco e seleção', () => {
  it('CA-005-06: na primeira vez só a célula (1,1) tem tabindex=0 e as outras 80 têm -1', () => {
    render(<Harness />);
    expect(tabbable()).toEqual([cellAtRC(0, 0)]);
    const others = screen.getAllByRole('gridcell').filter((c) => c !== cellAtRC(0, 0));
    expect(others).toHaveLength(80);
    for (const c of others) expect(c.getAttribute('tabindex')).toBe('-1');
  });

  it('CA-005-06: depois de mover, a última selecionada é a única tabulável', () => {
    render(<Harness />);
    fireEvent.keyDown(cellAtRC(0, 0), { key: 'ArrowDown' });
    expect(tabbable()).toEqual([cellAtRC(1, 0)]);
  });

  it('CA-005-10: nenhuma célula além da selecionada é alcançável por Tab', () => {
    render(<Harness />);
    fireEvent.keyDown(cellAtRC(0, 0), { key: 'End', ctrlKey: true });
    expect(tabbable()).toHaveLength(1);
    expect(tabbable()[0]).toBe(cellAtRC(8, 8));
  });

  it('CA-005-07: setas movem a seleção e o foco real para a vizinha', () => {
    render(<Harness />);
    cellAtRC(0, 0).focus();
    fireEvent.keyDown(cellAtRC(0, 0), { key: 'ArrowRight' });
    expect(document.activeElement).toBe(cellAtRC(0, 1));
    fireEvent.keyDown(cellAtRC(0, 1), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(cellAtRC(1, 1));
    fireEvent.keyDown(cellAtRC(1, 1), { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(cellAtRC(1, 0));
    fireEvent.keyDown(cellAtRC(1, 0), { key: 'ArrowUp' });
    expect(document.activeElement).toBe(cellAtRC(0, 0));
  });

  it('CA-005-07: rajada de setas sem esperar os efeitos termina com o foco real na selecionada final', async () => {
    render(<Harness />);
    cellAtRC(0, 0).focus();
    // Eventos nativos fora de act(): o Preact renderiza entre as teclas (microtarefa), mas o
    // efeito de foco (pós-pintura) só roda depois, como numa rajada real do navegador.
    const press = async (target: HTMLElement, key: string): Promise<void> => {
      target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      for (let i = 0; i < 5; i += 1) await Promise.resolve();
    };
    await press(cellAtRC(0, 0), 'ArrowRight');
    await press(cellAtRC(0, 1), 'ArrowRight');
    await press(cellAtRC(0, 2), 'ArrowDown');
    await press(cellAtRC(1, 2), 'ArrowDown');
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(tabbable()).toEqual([cellAtRC(2, 2)]);
    expect(document.activeElement).toBe(cellAtRC(2, 2));
  });

  it('CA-005-08: seta contra a borda não move nem dá a volta', () => {
    render(<Harness />);
    cellAtRC(0, 0).focus();
    fireEvent.keyDown(cellAtRC(0, 0), { key: 'ArrowLeft' });
    fireEvent.keyDown(cellAtRC(0, 0), { key: 'ArrowUp' });
    expect(document.activeElement).toBe(cellAtRC(0, 0));
    expect(tabbable()).toEqual([cellAtRC(0, 0)]);
  });

  it('CA-005-09: Home e End vão ao início e ao fim da linha; Ctrl vai aos cantos da grade', () => {
    render(<Harness />);
    cellAtRC(0, 0).focus();
    fireEvent.keyDown(cellAtRC(0, 0), { key: 'ArrowDown' });
    fireEvent.keyDown(cellAtRC(1, 0), { key: 'End' });
    expect(document.activeElement).toBe(cellAtRC(1, 8));
    fireEvent.keyDown(cellAtRC(1, 8), { key: 'Home' });
    expect(document.activeElement).toBe(cellAtRC(1, 0));
    fireEvent.keyDown(cellAtRC(1, 0), { key: 'End', ctrlKey: true });
    expect(document.activeElement).toBe(cellAtRC(8, 8));
    fireEvent.keyDown(cellAtRC(8, 8), { key: 'Home', ctrlKey: true });
    expect(document.activeElement).toBe(cellAtRC(0, 0));
  });

  it('CA-005-26: clicar numa célula a seleciona, migra o tabindex e despacha select', () => {
    render(<Harness />);
    fireEvent.click(cellAtRC(4, 4));
    expect(tabbable()).toEqual([cellAtRC(4, 4)]);
    expect(cellAtRC(4, 4).classList.contains('is-selected')).toBe(true);
    expect(cellAtRC(0, 0).classList.contains('is-selected')).toBe(false);
  });

  it('CA-005-26: o clique despacha select com a posição da célula', () => {
    const { dispatch } = renderSpy();
    fireEvent.click(cellAtRC(2, 5));
    expect(dispatch).toHaveBeenCalledWith({ type: 'select', to: { row: 2, col: 5 } });
  });
});

describe('Grid: realce', () => {
  it('CA-005-05 e CA-005-11: is-selected só na selecionada, sem depender de foco', () => {
    render(<Harness />);
    // Nenhum foco programático: a classe vem do estado, não de :focus.
    expect(document.activeElement).not.toBe(cellAtRC(0, 0));
    const selected = screen
      .getAllByRole('gridcell')
      .filter((c) => c.classList.contains('is-selected'));
    expect(selected).toEqual([cellAtRC(0, 0)]);
  });

  it('CA-005-05: is-peer marca as 20 células de linha, coluna e caixa; is-same-value o mesmo valor', () => {
    render(<Harness />);
    const peers = screen.getAllByRole('gridcell').filter((c) => c.classList.contains('is-peer'));
    expect(peers).toHaveLength(20);
    expect(cellAtRC(0, 0).classList.contains('is-peer')).toBe(false);
    expect(cellAtRC(0, 8).classList.contains('is-peer')).toBe(true); // linha
    expect(cellAtRC(8, 0).classList.contains('is-peer')).toBe(true); // coluna
    expect(cellAtRC(1, 1).classList.contains('is-peer')).toBe(true); // caixa
    expect(cellAtRC(4, 4).classList.contains('is-peer')).toBe(false);
    expect(cellAtRC(7, 8).classList.contains('is-same-value')).toBe(true);
    expect(cellAtRC(0, 1).classList.contains('is-same-value')).toBe(false);
  });
});

describe('Grid: teclas despacham ações', () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9])('CA-005-12: a tecla %i despacha digit', (n) => {
    const { dispatch } = renderSpy();
    fireEvent.keyDown(cellAtRC(0, 0), { key: String(n) });
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: 'digit', digit: n });
  });

  it('CA-005-13: com a célula do jogador, outra tecla de 1 a 9 troca o valor na tela', () => {
    render(<Harness />);
    fireEvent.keyDown(cellAtRC(0, 0), { key: 'ArrowRight' });
    fireEvent.keyDown(cellAtRC(0, 1), { key: 'ArrowRight' });
    fireEvent.keyDown(cellAtRC(0, 2), { key: '4' });
    fireEvent.keyDown(cellAtRC(0, 2), { key: '2' });
    expect(digitOf(cellAtRC(0, 2))).toBe('2');
  });

  it.each(['Backspace', 'Delete', '0'])('CA-005-14: a tecla %s despacha erase', (key) => {
    const { dispatch } = renderSpy();
    fireEvent.keyDown(cellAtRC(0, 0), { key });
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: 'erase' });
  });

  it('CA-005-14: apagar o valor do jogador esvazia a célula na tela', () => {
    render(<Harness />);
    fireEvent.keyDown(cellAtRC(0, 0), { key: 'ArrowRight' });
    fireEvent.keyDown(cellAtRC(0, 1), { key: 'ArrowRight' });
    fireEvent.keyDown(cellAtRC(0, 2), { key: '4' });
    fireEvent.keyDown(cellAtRC(0, 2), { key: 'Backspace' });
    expect(digitOf(cellAtRC(0, 2)) ?? '').toBe('');
    expect(cellAtRC(0, 2).getAttribute('aria-label')).toBe('Linha 1, coluna 3, vazia');
  });

  it('CA-005-15: digitar numa pista não muda o dígito exibido', () => {
    render(<Harness />);
    fireEvent.keyDown(cellAtRC(0, 0), { key: '9' });
    fireEvent.keyDown(cellAtRC(0, 0), { key: 'Backspace' });
    expect(digitOf(cellAtRC(0, 0))).toBe('5');
  });

  it('CA-005-07: setas e saltos despacham move com a tecla e o estado de Ctrl', () => {
    const { dispatch } = renderSpy();
    fireEvent.keyDown(cellAtRC(0, 0), { key: 'ArrowDown' });
    fireEvent.keyDown(cellAtRC(0, 0), { key: 'Home', ctrlKey: true });
    fireEvent.keyDown(cellAtRC(0, 0), { key: 'End' });
    expect(dispatch.mock.calls.map((c) => c[0])).toEqual([
      { type: 'move', key: 'ArrowDown', ctrl: false },
      { type: 'move', key: 'Home', ctrl: true },
      { type: 'move', key: 'End', ctrl: false },
    ]);
  });

  it('CA-005-10: Tab não é interceptado (o navegador move o foco para fora da grade)', () => {
    const { dispatch } = renderSpy();
    const notPrevented = fireEvent.keyDown(cellAtRC(0, 0), { key: 'Tab' });
    expect(notPrevented).toBe(true);
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe('Grid: conflito', () => {
  function placeConflict(): void {
    render(<Harness />);
    fireEvent.keyDown(cellAtRC(0, 0), { key: 'ArrowRight' });
    fireEvent.keyDown(cellAtRC(0, 1), { key: 'ArrowRight' });
    fireEvent.keyDown(cellAtRC(0, 2), { key: '5' }); // repete o 5 de (0,0)
  }

  it('CA-005-19: todas as células do conflito ganham is-conflict e "em conflito" no nome', () => {
    placeConflict();
    const marked = screen
      .getAllByRole('gridcell')
      .filter((c) => c.classList.contains('is-conflict'));
    expect(marked).toEqual([cellAtRC(0, 0), cellAtRC(0, 2)]);
    expect(cellAtRC(0, 0).getAttribute('aria-label')).toBe(
      'Linha 1, coluna 1, 5, pista, em conflito',
    );
    expect(cellAtRC(0, 2).getAttribute('aria-label')).toBe('Linha 1, coluna 3, 5, em conflito');
  });

  it('CA-005-19: resolvido o conflito, marca e "em conflito" somem', () => {
    placeConflict();
    fireEvent.keyDown(cellAtRC(0, 2), { key: 'Backspace' });
    for (const c of screen.getAllByRole('gridcell')) {
      expect(c.classList.contains('is-conflict')).toBe(false);
      expect(c.getAttribute('aria-label')).not.toContain('em conflito');
    }
  });

  it('CA-005-19: sem conflito, nenhuma célula tem a marca', () => {
    render(<Harness />);
    expect(screen.getAllByRole('gridcell').some((c) => c.classList.contains('is-conflict'))).toBe(
      false,
    );
  });
});

// T05 (spec 005b). Contrato assumido da célula: célula vazia ganha, ao lado de `.cell-digit`,
// um `<div class="cell-notes">` com nove filhos fixos na ordem 1..9 (classe `note-N`, `aria-hidden="true"`),
// cada um com o dígito se a anotação existe e vazio se não. Célula com valor: sem `.cell-notes`.
// Células vazias do puzzle fixo usadas: (4,4), (0,2), (4,1) — nenhuma com anotação no início, salvo a fixture.
function NotesHarness({ game }: { game: Game }): preact.JSX.Element {
  const [state, dispatch] = useReducer(gameReducer, game, initialState);
  return <Grid cells={gridView(state.game, state.selected)} dispatch={dispatch} />;
}

const slots = (cell: HTMLElement): HTMLElement[] => [
  ...cell.querySelectorAll<HTMLElement>('.cell-notes > *'),
];
const slotTexts = (cell: HTMLElement): string[] => slots(cell).map((s) => s.textContent ?? '');

describe('Grid: anotações na célula', () => {
  it('CA-005-04: célula vazia com anotações tem nove vagas fixas na ordem 1 a 9, só as presentes preenchidas', () => {
    render(<NotesHarness game={gameWithNotes([{ row: 4, col: 4, digits: [9, 2, 4] }])} />);
    const cell = cellAtRC(4, 4);
    expect(slots(cell)).toHaveLength(9);
    expect(slotTexts(cell)).toEqual(['', '2', '', '4', '', '', '', '', '9']);
    slots(cell).forEach((slot, i) => {
      expect(slot.classList.contains(`note-${i + 1}`)).toBe(true);
    });
  });

  it('CA-005-04: as vagas não mudam de lugar quando uma anotação some', () => {
    render(<NotesHarness game={gameWithNotes([{ row: 4, col: 4, digits: [1, 5, 9] }])} />);
    expect(slotTexts(cellAtRC(4, 4))).toEqual(['1', '', '', '', '5', '', '', '', '9']);
    expect(slots(cellAtRC(4, 4))).toHaveLength(9);
  });

  it('CA-005-04: célula com valor ou pista não tem bloco de anotações', () => {
    render(<NotesHarness game={fixedGame()} />);
    expect(cellAtRC(0, 0).querySelector('.cell-notes')).toBeNull();
    fireEvent.click(cellAtRC(4, 4));
    fireEvent.keyDown(cellAtRC(4, 4), { key: '7' });
    expect(digitOf(cellAtRC(4, 4))).toBe('7');
    expect(cellAtRC(4, 4).querySelector('.cell-notes')).toBeNull();
  });

  it('CA-005-04: as vagas são aria-hidden (o nome acessível já lê as anotações)', () => {
    render(<NotesHarness game={gameWithNotes([{ row: 4, col: 4, digits: [2, 4, 9] }])} />);
    for (const slot of slots(cellAtRC(4, 4))) expect(slot.getAttribute('aria-hidden')).toBe('true');
  });

  it('CA-005-45: o aria-label da célula traz as anotações em ordem crescente e o conflito por último', () => {
    render(<NotesHarness game={gameWithNotes([{ row: 4, col: 4, digits: [9, 2, 4] }])} />);
    expect(cellAtRC(4, 4).getAttribute('aria-label')).toBe(
      'Linha 5, coluna 5, vazia, anotações 2 4 9',
    );
  });

  it('CA-005-41: o texto visível das anotações separa os dígitos por espaço e está contido no nome acessível', () => {
    render(<NotesHarness game={gameWithNotes([{ row: 4, col: 4, digits: [1, 2, 5, 9] }])} />);
    const cell = cellAtRC(4, 4);
    const visible = (cell.querySelector('.cell-notes')?.textContent ?? '')
      .replace(/\s+/g, ' ')
      .trim();
    expect(visible).toBe('1 2 5 9');
    expect(cell.getAttribute('aria-label')).toContain(visible);
  });

  it.each(['Backspace', 'Delete', '0'])(
    'CA-005-44: %s em célula vazia com anotações apaga todas',
    (key) => {
      render(<NotesHarness game={gameWithNotes([{ row: 4, col: 4, digits: [1, 5, 9] }])} />);
      fireEvent.click(cellAtRC(4, 4));
      expect(slotTexts(cellAtRC(4, 4)).join('')).toBe('159');
      fireEvent.keyDown(cellAtRC(4, 4), { key });
      const cell = cellAtRC(4, 4);
      expect(slotTexts(cell).join('')).toBe('');
      expect(cell.getAttribute('aria-label')).toBe('Linha 5, coluna 5, vazia');
    },
  );
});
