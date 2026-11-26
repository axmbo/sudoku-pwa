import { describe, expect, it } from 'vitest';
import { cellAt } from '../../domain/board';
import type { Digit } from '../../domain/digit';
import { getGameConflicts, getGameStatus } from '../../domain/game';
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
