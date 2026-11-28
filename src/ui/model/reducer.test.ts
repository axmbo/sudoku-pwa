import { describe, expect, it } from 'vitest';
import { cellAt } from '../../domain/board';
import type { Digit } from '../../domain/digit';
import { gameRedo, getGameConflicts, getGameStatus, notesAt } from '../../domain/game';
import type { Index } from '../../domain/units';
import { fixedGame } from '../fixed-puzzle';
import { messages } from './messages';
import {
  gameReducer,
  initialState,
  type Announcement,
  type UiAction,
  type UiState,
} from './reducer';

// Puzzle fixo (src/ui/fixed-puzzle.ts). Células usadas nos cenários (linha, coluna, base 0):
//  - (0,0) = 5 e (0,1) = 3 são pistas; (0,4) = 7 é pista.
//  - (0,2) é vazia, solução 4; candidatos sem conflito: 1, 2, 4. O 5 repete a linha 1 (e a caixa),
//    o 3 repete a linha 1 (com (0,1)); a unidade citada primeiro é a linha.
//  - (4,4) é vazia (solução 5), usada só como "outra célula" sem conflito.
//  - (8,0) é a ÚLTIMA vazia nas partidas quase vencidas; solução 3. O 1 repete a linha 9 (com (8,6)).

const sel = (row: Index, col: Index): UiAction => ({ type: 'select', to: { row, col } });
const dig = (digit: Digit): UiAction => ({ type: 'digit', digit });
const ERASE: UiAction = { type: 'erase' };

function run(state: UiState, ...actions: UiAction[]): UiState {
  return actions.reduce(gameReducer, state);
}

function start(): UiState {
  return initialState(fixedGame());
}

/** Preenche com a solução todas as células vazias, exceto as listadas em `skip` (índice linha*9+col). */
function fillSolution(state: UiState, skip: readonly number[]): UiState {
  const { givens, solution } = state.game.puzzle;
  let current = state;
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const answer = solution[row]?.[col];
      if (answer == null) throw new Error('solução incompleta');
      if (givens[row]?.[col] === null && !skip.includes(row * 9 + col)) {
        current = run(current, sel(row as Index, col as Index), dig(answer));
      }
    }
  }
  return current;
}

/** Única célula vazia: (8,0). */
function nearlyWon(): UiState {
  const state = fillSolution(start(), [72]);
  expect(getGameStatus(state.game)).toBe('incomplete');
  return run(state, sel(8, 0));
}

/** Grade cheia com 1 em (8,0) em vez do 3: conflito na linha 9 e status 'full-incorrect'. */
function fullWithError(): UiState {
  const state = run(nearlyWon(), dig(1));
  expect(getGameStatus(state.game)).toBe('full-incorrect');
  return state;
}

function ann(state: UiState): Announcement {
  if (state.announcement === null) throw new Error('esperava um anúncio');
  return state.announcement;
}

function valueAt(state: UiState, row: Index, col: Index): Digit | null {
  return cellAt(state.game.board, row, col).value;
}

describe('gameReducer: initialState', () => {
  it('CA-005-06: seleciona (1,1), sem anúncio, com o jogo recebido', () => {
    const game = fixedGame();
    const state = initialState(game);
    expect(state.selected).toEqual({ row: 0, col: 0 });
    expect(state.announcement).toBeNull();
    expect(state.game).toBe(game);
  });
});

describe('gameReducer: digit e erase', () => {
  it('CA-005-12: dígito em célula vazia coloca o valor e anuncia o novo conteúdo', () => {
    const after = run(start(), sel(0, 2), dig(4));
    expect(valueAt(after, 0, 2)).toBe(4);
    expect(after.announcement).not.toBeNull();
    expect(ann(after).id).toBeGreaterThanOrEqual(1);
    expect(ann(after).text).toContain('4');
    expect(ann(after).text).not.toBe(messages.noConflicts);
    expect(ann(after).text).not.toMatch(/^Conflito:/);
    expect(after.selected).toEqual({ row: 0, col: 2 });
  });

  it('CA-005-13: dígito em célula com valor troca o valor e anuncia o novo conteúdo', () => {
    const first = run(start(), sel(0, 2), dig(4));
    const after = run(first, dig(2));
    expect(valueAt(after, 0, 2)).toBe(2);
    expect(ann(after).id).toBe(ann(first).id + 1);
    expect(ann(after).text).toContain('2');
    expect(ann(after).text).not.toMatch(/^Conflito:/);
  });

  it('CA-005-13: dígito igual ao valor atual não muda o Game nem anuncia', () => {
    const first = run(start(), sel(0, 2), dig(4));
    const after = run(first, dig(4));
    expect(after.game).toBe(first.game);
    expect(after.announcement).toBeNull();
  });

  it('CA-005-14: apagar célula com valor do jogador a deixa vazia e anuncia "vazia"', () => {
    const after = run(start(), sel(0, 2), dig(4), ERASE);
    expect(valueAt(after, 0, 2)).toBeNull();
    expect(after.announcement).not.toBeNull();
    expect(ann(after).text).toContain('vazia');
  });

  it('CA-005-14: apagar célula já vazia não muda o Game nem anuncia', () => {
    const before = run(start(), sel(0, 2));
    const after = run(before, ERASE);
    expect(after.game).toBe(before.game);
    expect(after.announcement).toBeNull();
  });

  it('CA-005-15: dígito em pista deixa o estado igual e anuncia givenImmutable', () => {
    const before = start(); // (0,0) é pista
    const after = run(before, dig(1));
    expect(after.game).toBe(before.game);
    expect(after.selected).toEqual(before.selected);
    expect(ann(after).text).toBe(messages.givenImmutable);
    expect(ann(after).id).toBeGreaterThanOrEqual(1);
  });

  it('CA-005-15: apagar pista deixa o estado igual e anuncia givenImmutable', () => {
    const before = start();
    const after = run(before, ERASE);
    expect(after.game).toBe(before.game);
    expect(ann(after).text).toBe(messages.givenImmutable);
  });

  it('CA-005-15: duas recusas seguidas por pista geram anúncios novos (id cresce, texto igual)', () => {
    const first = run(start(), dig(1));
    const second = run(first, dig(2));
    expect(ann(second).text).toBe(ann(first).text);
    expect(ann(second).id).toBe(ann(first).id + 1);
  });

  it('CA-005-22: valor que gera conflito é aceito', () => {
    const after = run(start(), sel(0, 2), dig(5));
    expect(valueAt(after, 0, 2)).toBe(5);
    expect(getGameConflicts(after.game).length).toBeGreaterThan(0);
  });
});

describe('gameReducer: anúncio de conflito (CA-005-20, CA-005-21)', () => {
  it('CA-005-20: jogada que cria conflito anuncia valor e unidade da célula jogada', () => {
    const after = run(start(), sel(0, 2), dig(5));
    expect(ann(after).text).toBe('Conflito: 5 repetido na linha 1');
  });

  it('CA-005-20: com conflito já existente em outro lugar, novo conflito criado ainda anuncia', () => {
    const before = run(start(), sel(0, 2), dig(5));
    const after = run(before, sel(0, 3), dig(3)); // 3 repete a pista (0,1) na linha 1
    expect(ann(after).text).toBe('Conflito: 3 repetido na linha 1');
  });

  it('CA-005-21: trocar valor em conflito por outro que continua em conflito não anuncia conflito', () => {
    const conflicted = run(start(), sel(0, 2), dig(5)); // conflito com a pista (0,0)
    const after = run(conflicted, dig(3)); // 3 repete a pista (0,1): segue em conflito
    expect(getGameConflicts(after.game).length).toBeGreaterThan(0);
    expect(after.announcement).not.toBeNull();
    expect(ann(after).text).not.toMatch(/^Conflito:/);
    expect(ann(after).text).not.toBe(messages.noConflicts);
    expect(ann(after).text).toContain('3');
  });

  it('CA-005-21: trocar o valor que elimina o último conflito anuncia noConflicts', () => {
    const conflicted = run(start(), sel(0, 2), dig(5));
    const after = run(conflicted, dig(4));
    expect(getGameConflicts(after.game)).toHaveLength(0);
    expect(ann(after).text).toBe(messages.noConflicts);
  });

  it('CA-005-21: apagar que elimina o último conflito anuncia noConflicts', () => {
    const conflicted = run(start(), sel(0, 2), dig(5));
    const after = run(conflicted, ERASE);
    expect(getGameConflicts(after.game)).toHaveLength(0);
    expect(ann(after).text).toBe(messages.noConflicts);
  });

  it('CA-005-21: jogada sem relação com o conflito, que continua, não anuncia noConflicts', () => {
    const conflicted = run(start(), sel(0, 2), dig(5));
    const after = run(conflicted, sel(4, 4), dig(5));
    // (4,4)=5 não cria conflito e o antigo permanece
    expect(getGameConflicts(after.game).length).toBeGreaterThan(0);
    expect(ann(after).text).not.toBe(messages.noConflicts);
  });
});

describe('gameReducer: select e move (CA-005-26)', () => {
  it('CA-005-26: select muda selected, mantém o Game e não anuncia', () => {
    const before = start();
    const after = run(before, sel(3, 5));
    expect(after.selected).toEqual({ row: 3, col: 5 });
    expect(after.game).toBe(before.game);
    expect(after.announcement).toBeNull();
  });

  it('CA-005-26: move muda selected pela navegação, mantém o Game e não anuncia', () => {
    const before = run(start(), sel(2, 2));
    const after = run(before, { type: 'move', key: 'ArrowRight', ctrl: false });
    expect(after.selected).toEqual({ row: 2, col: 3 });
    expect(after.game).toBe(before.game);
    expect(after.announcement).toBeNull();
  });

  it('CA-005-26: move com Ctrl+End vai a (9,9) sem anúncio', () => {
    const after = run(start(), { type: 'move', key: 'End', ctrl: true });
    expect(after.selected).toEqual({ row: 8, col: 8 });
    expect(after.announcement).toBeNull();
  });

  it('CA-005-31: select depois de um anúncio limpa o anúncio (nunca herdado)', () => {
    const announced = run(start(), sel(0, 2), dig(5));
    expect(announced.announcement).not.toBeNull();
    expect(run(announced, sel(1, 1)).announcement).toBeNull();
    expect(run(announced, { type: 'move', key: 'ArrowDown', ctrl: false }).announcement).toBeNull();
  });

  it('CA-005-31: jogada sem efeito depois de um anúncio também devolve announcement null', () => {
    const announced = run(start(), sel(0, 2), dig(4));
    expect(announced.announcement).not.toBeNull();
    const noop = run(announced, dig(4));
    expect(noop.game).toBe(announced.game);
    expect(noop.announcement).toBeNull();
  });
});

describe('gameReducer: vitória e grade cheia (CA-005-29, CA-005-30)', () => {
  it('CA-005-29: jogada que completa igual à solução vence e anuncia a vitória', () => {
    const after = run(nearlyWon(), dig(3));
    expect(getGameStatus(after.game)).toBe('won');
    expect(ann(after).text).toBe(messages.won);
    expect(ann(after).id).toBeGreaterThanOrEqual(1);
  });

  it('CA-005-29: depois da vitória, dígito não muda o Game nem anuncia', () => {
    const won = run(nearlyWon(), dig(3));
    const after = run(won, dig(1));
    expect(after.game).toBe(won.game);
    expect(after.announcement).toBeNull();
    expect(getGameStatus(after.game)).toBe('won');
  });

  it('CA-005-29: depois da vitória, apagar não muda o Game nem anuncia', () => {
    const won = run(nearlyWon(), dig(3));
    const after = run(won, ERASE);
    expect(after.game).toBe(won.game);
    expect(after.announcement).toBeNull();
  });

  it('CA-005-29: depois da vitória, a grade segue navegável (select e move)', () => {
    const won = run(nearlyWon(), dig(3));
    const moved = run(won, sel(4, 4), { type: 'move', key: 'ArrowLeft', ctrl: false });
    expect(moved.selected).toEqual({ row: 4, col: 3 });
    expect(moved.game).toBe(won.game);
    expect(moved.announcement).toBeNull();
  });

  it('CA-005-30: grade cheia errada anuncia fullWithErrors sem listar células', () => {
    const after = fullWithError();
    expect(ann(after).text).toBe(messages.fullWithErrors);
  });

  it('CA-005-30: com grade cheia errada o jogo continua e corrigir vence', () => {
    const fixed = run(fullWithError(), dig(3));
    expect(getGameStatus(fixed.game)).toBe('won');
    expect(ann(fixed).text).toBe(messages.won);
  });
});

describe('gameReducer: precedência dos anúncios (CA-005-31)', () => {
  it('CA-005-31: vitória vence "sem conflitos" (a correção que vence também elimina o último conflito)', () => {
    const before = fullWithError();
    expect(getGameConflicts(before.game).length).toBeGreaterThan(0);
    const after = run(before, dig(3));
    expect(getGameConflicts(after.game)).toHaveLength(0);
    expect(ann(after).text).toBe(messages.won);
  });

  it('CA-005-31: vitória vence o conteúdo da célula', () => {
    const after = run(nearlyWon(), dig(3));
    expect(ann(after).text).toBe(messages.won);
  });

  it('CA-005-31: grade cheia com erros vence conflito criado', () => {
    // o 1 em (8,0) cria conflito na linha 9 e completa a grade errada
    const after = fullWithError();
    expect(getGameConflicts(after.game).some((c) => c.row === 8 && c.col === 0)).toBe(true);
    expect(ann(after).text).toBe(messages.fullWithErrors);
    expect(ann(after).text).not.toMatch(/^Conflito:/);
  });

  it('CA-005-31: grade cheia com erros vence o conteúdo da célula (trocar erro por outro erro)', () => {
    const after = run(fullWithError(), dig(2)); // 2 também repete a linha 9
    expect(getGameStatus(after.game)).toBe('full-incorrect');
    expect(ann(after).text).toBe(messages.fullWithErrors);
  });

  it('CA-005-31: conflito criado vence o conteúdo da célula', () => {
    const after = run(start(), sel(0, 2), dig(5));
    expect(ann(after).text).toMatch(/^Conflito:/);
  });

  it('CA-005-31: "sem conflitos" vence o conteúdo da célula', () => {
    const after = run(start(), sel(0, 2), dig(5), dig(4));
    expect(ann(after).text).toBe(messages.noConflicts);
  });

  it('CA-005-31: anúncios em ações seguidas têm id crescendo de 1 em 1', () => {
    let state = run(start(), sel(0, 2));
    let pairs = 0;
    for (const action of [dig(5), dig(3), dig(4), dig(4), ERASE, ERASE]) {
      const previous = state;
      state = gameReducer(state, action);
      if (previous.announcement !== null && state.announcement !== null) {
        expect(state.announcement.id).toBe(previous.announcement.id + 1);
        pairs += 1;
      }
    }
    expect(pairs).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------------------------
// 005b T04: modo anotação, anotar, apagar anotações, desfazer e refazer.
// As três ações novas entram por `act`: o tipo `UiAction` ainda não as declara (símbolo novo,
// PROCESSO.md §6); o cast é inofensivo depois do GREEN. Células usadas (base 0), vazias no puzzle:
//  - (0,2) alvo (solução 4); vizinhas dela: (0,3) linha, (3,2) coluna, (1,1) caixa.
//  - (4,4) não é vizinha de (0,2): serve de "outra célula" e para provar que a poda não a atinge.
// ---------------------------------------------------------------------------------------------

const act = (type: string): UiAction => ({ type }) as UiAction;
const TOGGLE = act('toggle-mode');
const UNDO = act('undo');
const REDO = act('redo');

function notes(state: UiState, row: Index, col: Index): readonly Digit[] {
  return notesAt(state.game, row, col);
}

describe('gameReducer: modo anotação (CA-005-16)', () => {
  it('CA-005-16: initialState começa no modo valor, com focusTick 0', () => {
    const state = start();
    expect(state.noteMode).toBe(false);
    expect(state.focusTick).toBe(0);
  });

  it('CA-005-16: toggle-mode liga, anuncia "ligado" e não toca no jogo nem na seleção', () => {
    const before = run(start(), sel(2, 3));
    const after = run(before, TOGGLE);
    expect(after.noteMode).toBe(true);
    expect(ann(after).text).toBe(messages.noteModeOn);
    expect(after.game).toBe(before.game);
    expect(after.selected).toEqual(before.selected);
    expect(after.focusTick).toBe(before.focusTick);
  });

  it('CA-005-16: toggle-mode de novo desliga e anuncia "desligado" com id seguinte', () => {
    const on = run(start(), TOGGLE);
    const off = run(on, TOGGLE);
    expect(off.noteMode).toBe(false);
    expect(ann(off).text).toBe(messages.noteModeOff);
    expect(ann(off).id).toBe(ann(on).id + 1);
    expect(off.game).toBe(on.game);
  });

  it('CA-005-16: o modo é pegajoso (select, move e anotações não o desligam)', () => {
    const state = run(
      start(),
      TOGGLE,
      sel(0, 2),
      dig(4),
      { type: 'move', key: 'ArrowRight', ctrl: false },
      dig(2),
    );
    expect(state.noteMode).toBe(true);
  });
});

describe('gameReducer: anotar (CA-005-17, CA-005-18)', () => {
  it('CA-005-17: dígito no modo anotação alterna o candidato, sem valor, e anuncia as anotações', () => {
    const first = run(start(), TOGGLE, sel(0, 2), dig(4));
    expect(valueAt(first, 0, 2)).toBeNull();
    expect(notes(first, 0, 2)).toEqual([4]);
    expect(ann(first).text).toBe('anotações 4');
    const second = run(first, dig(2));
    expect(notes(second, 0, 2)).toEqual([2, 4]);
    expect(ann(second).text).toBe('anotações 2 4');
    expect(ann(second).id).toBe(ann(first).id + 1);
  });

  it('CA-005-17: repetir o dígito remove a anotação e anuncia "sem anotações"', () => {
    const after = run(start(), TOGGLE, sel(0, 2), dig(4), dig(4));
    expect(notes(after, 0, 2)).toEqual([]);
    expect(ann(after).text).toBe('sem anotações');
  });

  it('CA-005-17: anotar não anuncia conflito nem altera focusTick', () => {
    const after = run(start(), TOGGLE, sel(0, 2), dig(5)); // 5 repetiria a pista (0,0), mas é só anotação
    expect(getGameConflicts(after.game)).toHaveLength(0);
    expect(ann(after).text).toBe('anotações 5');
    expect(after.focusTick).toBe(0);
  });

  it('CA-005-18: anotar em célula com valor deixa o estado igual e anuncia cellHasValue', () => {
    const before = run(start(), sel(0, 2), dig(4), TOGGLE);
    const after = run(before, dig(1));
    expect(after.game).toBe(before.game);
    expect(after.selected).toEqual(before.selected);
    expect(ann(after).text).toBe(messages.cellHasValue);
  });

  it('CA-005-18: anotar em pista deixa o estado igual e anuncia givenImmutable', () => {
    const before = run(start(), TOGGLE); // (0,0) é pista
    const after = run(before, dig(1));
    expect(after.game).toBe(before.game);
    expect(ann(after).text).toBe(messages.givenImmutable);
  });

  it('CA-005-18: duas recusas seguidas geram anúncios novos (id cresce)', () => {
    const first = run(start(), TOGGLE, dig(1));
    const second = run(first, dig(2));
    expect(ann(second).text).toBe(ann(first).text);
    expect(ann(second).id).toBe(ann(first).id + 1);
  });
});

describe('gameReducer: valor poda as anotações vizinhas (CA-005-43)', () => {
  /** Anotações com 4 nas vizinhas (0,3), (3,2), (1,1), em (4,4) (não vizinha) e 2 em (0,3). */
  function withNotes(): UiState {
    return run(
      start(),
      TOGGLE,
      sel(0, 3),
      dig(4),
      dig(2),
      sel(3, 2),
      dig(4),
      sel(1, 1),
      dig(4),
      sel(4, 4),
      dig(4),
      TOGGLE,
      sel(0, 2),
    );
  }

  it('CA-005-43: colocar X no modo valor tira X das vizinhas e preserva as demais anotações', () => {
    const after = run(withNotes(), dig(4));
    expect(valueAt(after, 0, 2)).toBe(4);
    expect(notes(after, 0, 3)).toEqual([2]);
    expect(notes(after, 3, 2)).toEqual([]);
    expect(notes(after, 1, 1)).toEqual([]);
    expect(notes(after, 4, 4)).toEqual([4]);
  });

  it('CA-005-43: um único undo desfaz o valor e devolve todas as anotações podadas', () => {
    const before = withNotes();
    const after = run(before, dig(4), UNDO);
    expect(valueAt(after, 0, 2)).toBeNull();
    expect(notes(after, 0, 3)).toEqual([2, 4]);
    expect(notes(after, 3, 2)).toEqual([4]);
    expect(notes(after, 1, 1)).toEqual([4]);
    expect(notes(after, 4, 4)).toEqual([4]);
    expect(after.game.board).toEqual(before.game.board);
    expect(after.game.notes).toEqual(before.game.notes);
  });
});

describe('gameReducer: apagar anotações (CA-005-44)', () => {
  it('CA-005-44: erase em célula vazia com anotações limpa todas, anuncia "vazia" e registra uma jogada', () => {
    const before = run(start(), TOGGLE, sel(0, 2), dig(2), dig(4));
    const after = run(before, ERASE);
    expect(notes(after, 0, 2)).toEqual([]);
    expect(valueAt(after, 0, 2)).toBeNull();
    expect(ann(after).text).toContain('vazia');
    expect(after.game.cursor).toBe(before.game.cursor + 1);
  });

  it('CA-005-44: erase em célula vazia sem anotações não muda o Game nem anuncia', () => {
    const before = run(start(), TOGGLE, sel(0, 2));
    const after = run(before, ERASE);
    expect(after.game).toBe(before.game);
    expect(after.announcement).toBeNull();
  });

  it('CA-005-44: erase em pista, com o modo anotação ligado, anuncia givenImmutable', () => {
    const after = run(start(), TOGGLE, ERASE);
    expect(ann(after).text).toBe(messages.givenImmutable);
  });
});

describe('gameReducer: desfazer e refazer por tipo de jogada (CA-005-23, CA-005-24)', () => {
  // [rótulo, estado com a jogada feita e a seleção em (4,4), texto sem o prefixo, verificação do efeito]
  const cases: ReadonlyArray<readonly [string, () => UiState, string, (s: UiState) => void]> = [
    [
      'valor (com poda)',
      () => run(start(), sel(0, 2), dig(4), sel(4, 4)),
      'valor 4 na linha 1, coluna 3',
      (s) => expect(valueAt(s, 0, 2)).toBeNull(),
    ],
    [
      'apagar valor',
      () => run(start(), sel(0, 2), dig(4), ERASE, sel(4, 4)),
      'apagar na linha 1, coluna 3',
      (s) => expect(valueAt(s, 0, 2)).toBe(4),
    ],
    [
      'anotação',
      () => run(start(), TOGGLE, sel(0, 2), dig(4), sel(4, 4)),
      'anotação 4 na linha 1, coluna 3',
      (s) => expect(notes(s, 0, 2)).toEqual([]),
    ],
    [
      'apagar anotações',
      () => run(start(), TOGGLE, sel(0, 2), dig(4), ERASE, sel(4, 4)),
      'apagar anotações na linha 1, coluna 3',
      (s) => expect(notes(s, 0, 2)).toEqual([4]),
    ],
  ];

  for (const [label, build, tail, checkUndone] of cases) {
    it(`CA-005-23: undo de ${label} reverte, seleciona a célula afetada, sobe focusTick e anuncia`, () => {
      const before = build();
      const after = run(before, UNDO);
      checkUndone(after);
      expect(after.selected).toEqual({ row: 0, col: 2 });
      expect(after.focusTick).toBe(before.focusTick + 1);
      expect(ann(after).text).toBe(`Desfeito: ${tail}`);
    });

    it(`CA-005-24: redo de ${label} reaplica, seleciona a célula afetada, sobe focusTick e anuncia`, () => {
      const before = build();
      const undone = run(before, UNDO, sel(4, 4));
      const after = run(undone, REDO);
      expect(after.game.board).toEqual(before.game.board);
      expect(after.game.notes).toEqual(before.game.notes);
      expect(after.selected).toEqual({ row: 0, col: 2 });
      expect(after.focusTick).toBe(undone.focusTick + 1);
      expect(ann(after).text).toBe(`Refeito: ${tail}`);
    });
  }

  it('CA-005-23: undo que elimina o último conflito anexa "sem conflitos" ao mesmo anúncio', () => {
    const before = run(start(), sel(0, 2), dig(5));
    expect(getGameConflicts(before.game).length).toBeGreaterThan(0);
    const after = run(before, UNDO);
    expect(getGameConflicts(after.game)).toHaveLength(0);
    expect(ann(after).text).toContain('Desfeito: valor 5 na linha 1, coluna 3');
    expect(ann(after).text).toContain(messages.noConflicts);
    expect(ann(after).id).toBe(ann(before).id + 1);
  });

  it('CA-005-23: undo que cria conflito anexa o aviso de conflito (CA-005-20) ao mesmo anúncio', () => {
    const before = run(start(), sel(0, 2), dig(5), ERASE);
    const after = run(before, UNDO); // devolve o 5, que repete a pista (0,0)
    expect(ann(after).text).toContain('Desfeito: apagar na linha 1, coluna 3');
    expect(ann(after).text).toContain('Conflito: 5 repetido na linha 1');
  });

  it('CA-005-24: redo que cria conflito anexa o aviso de conflito ao mesmo anúncio', () => {
    const after = run(start(), sel(0, 2), dig(5), UNDO, REDO);
    expect(ann(after).text).toContain('Refeito: valor 5 na linha 1, coluna 3');
    expect(ann(after).text).toContain('Conflito: 5 repetido na linha 1');
  });

  it('CA-005-24: redo que elimina o último conflito anexa "sem conflitos"', () => {
    const after = run(start(), sel(0, 2), dig(5), dig(4), UNDO, UNDO, REDO, REDO);
    expect(getGameConflicts(after.game)).toHaveLength(0);
    expect(ann(after).text).toContain('Refeito: valor 4 na linha 1, coluna 3');
    expect(ann(after).text).toContain(messages.noConflicts);
  });

  it('CA-005-24: redo que vence anuncia só a vitória', () => {
    // Pela UI a jogada que vence não pode ser desfeita (o domínio recusa depois da vitória, CA-005-42);
    // o estado "vitória desfeita" vem de montar o Game à mão: histórico completo, cursor antes dela.
    const pre = nearlyWon();
    const won = run(pre, dig(3));
    const undone = { ...pre.game, history: won.game.history };
    const redone = gameRedo(undone);
    expect(redone.ok && getGameStatus(redone.value) === 'won').toBe(true); // pré-condição
    const after = run({ ...pre, game: undone }, REDO);
    expect(getGameStatus(after.game)).toBe('won');
    expect(ann(after).text).toBe(messages.won);
  });

  it('CA-005-24: nova jogada depois do undo descarta o redo (nada para refazer)', () => {
    const after = run(start(), sel(0, 2), dig(4), UNDO, dig(2), REDO);
    expect(ann(after).text).toBe(messages.nothingToRedo);
    expect(valueAt(after, 0, 2)).toBe(2);
  });
});

describe('gameReducer: nada a desfazer ou refazer (CA-005-25)', () => {
  it('CA-005-25: undo com histórico vazio deixa tudo igual, inclusive focusTick, e anuncia', () => {
    const before = run(start(), sel(3, 3));
    const after = run(before, UNDO);
    expect(after.game).toBe(before.game);
    expect(after.selected).toEqual(before.selected);
    expect(after.focusTick).toBe(before.focusTick);
    expect(ann(after).text).toBe(messages.nothingToUndo);
  });

  it('CA-005-25: redo sem nada a refazer deixa tudo igual, inclusive focusTick, e anuncia', () => {
    const before = run(start(), sel(0, 2), dig(4), sel(3, 3));
    const after = run(before, REDO);
    expect(after.game).toBe(before.game);
    expect(after.selected).toEqual(before.selected);
    expect(after.focusTick).toBe(before.focusTick);
    expect(ann(after).text).toBe(messages.nothingToRedo);
  });

  it('CA-005-25: undo além do começo anuncia "nada para desfazer" e o id segue crescendo', () => {
    const once = run(start(), sel(0, 2), dig(4), UNDO);
    const twice = run(once, UNDO);
    expect(ann(twice).text).toBe(messages.nothingToUndo);
    expect(ann(twice).id).toBe(ann(once).id + 1);
    expect(twice.focusTick).toBe(once.focusTick);
  });
});

describe('gameReducer: partida vencida (CA-005-42)', () => {
  function won(): UiState {
    const state = run(nearlyWon(), dig(3));
    expect(getGameStatus(state.game)).toBe('won');
    return state;
  }

  for (const [label, action] of [
    ['toggle-mode', TOGGLE],
    ['undo', UNDO],
    ['redo', REDO],
  ] as const) {
    it(`CA-005-42: depois da vitória, ${label} não muda nada e não anuncia`, () => {
      const before = won();
      const after = run(before, action);
      expect(after.game).toBe(before.game);
      expect(after.selected).toEqual(before.selected);
      expect(after.noteMode).toBe(before.noteMode);
      expect(after.focusTick).toBe(before.focusTick);
      expect(after.announcement).toBeNull();
    });
  }

  it('CA-005-42: depois da vitória, anotar não muda nada e não anuncia', () => {
    // Pela UI o modo anotação não liga depois da vitória; o estado "vencida com modo ligado"
    // (modo ligado antes, vitória vinda de fora do fluxo) é montado à mão.
    const before = { ...won(), noteMode: true } as UiState;
    const after = run(before, dig(1));
    expect(after.game).toBe(before.game);
    expect(after.noteMode).toBe(true);
    expect(after.announcement).toBeNull();
  });
});
