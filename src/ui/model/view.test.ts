import { describe, expect, it } from 'vitest';
import { cellAt } from '../../domain/board';
import {
  gamePlace,
  gameToggleNote,
  getGameConflicts,
  gameUndo,
  type Game,
} from '../../domain/game';
import type { Index } from '../../domain/units';
import { fixedGame } from '../fixed-puzzle';
import type { Selection } from './navigation';
import { controlsView, gridView, type GridCellView } from './view';

// Puzzle fixo (src/ui/fixed-puzzle.ts), células em base 0 (linha, coluna):
//  - (0,0) = 5, (1,5) = 5 e (7,8) = 5 são pistas (o mesmo valor em unidades diferentes).
//  - (0,2) é vazia; o 5 ali repete a linha e a caixa de (0,0): conflito entre (0,0) e (0,2).
//  - (4,4) é vazia, usada como selecionada sem valor e sem conflito.

const sel = (row: Index, col: Index): Selection => ({ row, col });

function withValue(
  game: Game,
  row: Index,
  col: Index,
  digit: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
): Game {
  const result = gamePlace(game, row, col, digit);
  if (!result.ok) throw new Error(`jogada de preparo recusada: ${result.reason}`);
  return result.value;
}

const boxOf = (row: number, col: number): number => Math.floor(row / 3) * 3 + Math.floor(col / 3);

describe('gridView', () => {
  it('CA-005-01: devolve 81 itens em ordem linha a linha', () => {
    const view = gridView(fixedGame(), sel(0, 0));
    expect(view).toHaveLength(81);
    view.forEach((item: GridCellView, i: number) => {
      expect(item.row).toBe(Math.floor(i / 9));
      expect(item.col).toBe(i % 9);
    });
  });

  it('CA-005-05: selected é verdadeiro só na célula selecionada', () => {
    const view = gridView(fixedGame(), sel(3, 6));
    const selected = view.filter((c: GridCellView) => c.selected);
    expect(selected).toHaveLength(1);
    expect(selected[0]).toMatchObject({ row: 3, col: 6 });
  });

  it('CA-005-05: peer vale exatamente para as 20 células de mesma linha, coluna ou caixa', () => {
    const view = gridView(fixedGame(), sel(4, 4));
    const peers = view.filter((c: GridCellView) => c.peer);
    expect(peers).toHaveLength(20);
    for (const c of view as readonly GridCellView[]) {
      const shares =
        !(c.row === 4 && c.col === 4) && (c.row === 4 || c.col === 4 || boxOf(c.row, c.col) === 4);
      expect(c.peer).toBe(shares);
    }
  });

  it('CA-005-05: a selecionada não é peer de si mesma, e a caixa vale em canto', () => {
    const view = gridView(fixedGame(), sel(0, 0));
    expect(view[0]?.peer).toBe(false);
    expect(view[1 * 9 + 1]?.peer).toBe(true); // (1,1): só pela caixa
    expect(view.filter((c: GridCellView) => c.peer)).toHaveLength(20);
  });

  it('CA-005-05: sameValue marca as outras células com o valor da selecionada', () => {
    const view = gridView(fixedGame(), sel(0, 0)); // 5
    const same = view.filter((c: GridCellView) => c.sameValue);
    expect(same.map((c: GridCellView) => [c.row, c.col])).toEqual([
      [1, 5],
      [7, 8],
    ]);
    expect(view[0]?.sameValue).toBe(false); // nunca a própria selecionada
  });

  it('CA-005-05: sameValue é falso em todas as células quando a selecionada está vazia', () => {
    const view = gridView(fixedGame(), sel(4, 4));
    expect(view.some((c: GridCellView) => c.sameValue)).toBe(false);
  });

  it('CA-005-05: sameValue inclui valor colocado pelo jogador', () => {
    const game = withValue(fixedGame(), 4, 4, 5);
    const view = gridView(game, sel(4, 4));
    const same = view
      .filter((c: GridCellView) => c.sameValue)
      .map((c: GridCellView) => [c.row, c.col]);
    expect(same).toEqual(
      expect.arrayContaining([
        [0, 0],
        [1, 5],
        [7, 8],
      ]),
    );
    expect(same).toHaveLength(3);
  });

  it('CA-005-05: a seleção muda selected, peer e sameValue na mesma visão', () => {
    const game = fixedGame();
    const a = gridView(game, sel(0, 0));
    const b = gridView(game, sel(8, 8));
    expect(a[0]?.selected).toBe(true);
    expect(b[0]?.selected).toBe(false);
    expect(b[80]?.selected).toBe(true);
  });

  it('CA-005-02: value e given batem com cellAt', () => {
    const game = withValue(fixedGame(), 4, 4, 5);
    const view = gridView(game, sel(0, 0));
    for (const c of view as readonly GridCellView[]) {
      const state = cellAt(game.board, c.row, c.col);
      expect(c.value).toBe(state.value);
      expect(c.given).toBe(state.given);
    }
    expect(view[0]).toMatchObject({ value: 5, given: true });
    expect(view[4 * 9 + 4]).toMatchObject({ value: 5, given: false });
  });

  it('CA-005-19: conflicted bate com getGameConflicts', () => {
    const game = withValue(fixedGame(), 0, 2, 5);
    const conflicts = getGameConflicts(game);
    expect(conflicts.length).toBeGreaterThan(0);
    const view = gridView(game, sel(0, 2));
    for (const c of view as readonly GridCellView[]) {
      expect(c.conflicted).toBe(conflicts.some((k) => k.row === c.row && k.col === c.col));
    }
    expect(view[0]?.conflicted).toBe(true);
    expect(view[2]?.conflicted).toBe(true);
  });

  it('CA-005-19: sem jogadas conflitantes, nenhuma célula está em conflito', () => {
    const view = gridView(fixedGame(), sel(0, 0));
    expect(view.some((c: GridCellView) => c.conflicted)).toBe(false);
  });
});

/** Partida vencida: todas as células vazias preenchidas com a solução do puzzle fixo. */
function solvedGame(): Game {
  let game = fixedGame();
  const { givens, solution } = game.puzzle;
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const answer = solution[row]?.[col];
      if (answer == null) throw new Error('solução incompleta');
      if (givens[row]?.[col] === null) game = withValue(game, row as Index, col as Index, answer);
    }
  }
  return game;
}

function withNote(
  game: Game,
  row: Index,
  col: Index,
  digit: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
): Game {
  const result = gameToggleNote(game, row, col, digit);
  if (!result.ok) throw new Error(`anotação de preparo recusada: ${result.reason}`);
  return result.value;
}

describe('gridView: notes', () => {
  it('CA-005-04: célula vazia traz as anotações em ordem crescente', () => {
    const game = withNote(withNote(withNote(fixedGame(), 4, 4, 9), 4, 4, 2), 4, 4, 4);
    const view = gridView(game, sel(0, 0));
    expect(view[4 * 9 + 4]?.notes).toEqual([2, 4, 9]);
  });

  it('CA-005-04: células sem anotação trazem lista vazia', () => {
    const view = gridView(withNote(fixedGame(), 4, 4, 3), sel(0, 0));
    expect(view[4 * 9 + 5]?.notes).toEqual([]);
  });

  it('CA-005-04: célula com valor ou pista traz notes vazio', () => {
    const view = gridView(withValue(fixedGame(), 0, 2, 5), sel(0, 0));
    expect(view[0]?.notes).toEqual([]);
    expect(view[2]?.notes).toEqual([]);
  });
});

describe('controlsView', () => {
  it('CA-005-16: repete o noteMode recebido', () => {
    expect(controlsView(fixedGame(), true).noteMode).toBe(true);
    expect(controlsView(fixedGame(), false).noteMode).toBe(false);
  });

  it('CA-005-25: sem histórico, canUndo e canRedo são falsos', () => {
    const c = controlsView(fixedGame(), false);
    expect(c.canUndo).toBe(false);
    expect(c.canRedo).toBe(false);
  });

  it('CA-005-23: com jogada feita, canUndo é verdadeiro e canRedo falso', () => {
    const c = controlsView(withValue(fixedGame(), 4, 4, 1), false);
    expect(c.canUndo).toBe(true);
    expect(c.canRedo).toBe(false);
  });

  it('CA-005-24: depois de desfazer, canRedo é verdadeiro', () => {
    const done = gameUndo(withValue(fixedGame(), 4, 4, 1));
    if (!done.ok) throw new Error('undo recusado');
    const c = controlsView(done.value, false);
    expect(c.canUndo).toBe(false);
    expect(c.canRedo).toBe(true);
  });

  it('CA-005-42: partida vencida tem canUndo e canRedo falsos', () => {
    const solved = solvedGame();
    const c = controlsView(solved, true);
    expect(c.canUndo).toBe(false);
    expect(c.canRedo).toBe(false);
    expect(c.noteMode).toBe(true);
  });
});
