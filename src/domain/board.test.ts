import { describe, expect, it } from 'vitest';
import { cellAt, createBoard, eraseValue, getConflicts, placeValue, type Board } from './board';
import type { Digit } from './digit';

const _ = null;

// Entrada válida, sem conflito, com pistas em posições assimétricas e nos cantos.
const input = [
  [3, _, _, _, _, _, _, _, 1],
  [_, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, 5, _],
  [_, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _],
  [7, _, _, _, _, _, _, _, 9],
];

describe('board', () => {
  it('CA-001-01: cria o tabuleiro com 81 células, cada uma vazia ou com valor de 1 a 9', () => {
    const result = createBoard(input);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { cells } = result.value;
    expect(cells.length).toBe(81);
    expect(
      cells.every(
        (cell: { readonly value: number | null }) =>
          cell.value === null ||
          (Number.isInteger(cell.value) && cell.value >= 1 && cell.value <= 9),
      ),
    ).toBe(true);
  });

  it('CA-001-02: as pistas são exatamente as células com valor na entrada, nas mesmas posições', () => {
    const result = createBoard(input);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { cells } = result.value;
    // Índices escritos à mão: (0,0)=0, (0,8)=8, (2,7)=25, (8,0)=72, (8,8)=80.
    expect(cells[0]).toEqual({ value: 3, given: true });
    expect(cells[8]).toEqual({ value: 1, given: true });
    expect(cells[25]).toEqual({ value: 5, given: true });
    expect(cells[72]).toEqual({ value: 7, given: true });
    expect(cells[80]).toEqual({ value: 9, given: true });
  });

  it('CA-001-02: as demais células estão vazias e não são pistas', () => {
    const result = createBoard(input);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const givenIndexes = [0, 8, 25, 72, 80];
    const others = result.value.cells.filter((_cell, i) => !givenIndexes.includes(i));
    expect(others.length).toBe(76);
    expect(others.every((cell) => cell.value === null && cell.given === false)).toBe(true);
  });

  it('CA-001-02: tabuleiro, cells e cada célula são congelados', () => {
    const result = createBoard(input);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.cells)).toBe(true);
    expect(result.value.cells.every((cell) => Object.isFrozen(cell))).toBe(true);
  });

  it('CA-001-02: mutar a entrada depois de criar não altera o tabuleiro', () => {
    const mutable = input.map((row) => [...row]);
    const result = createBoard(mutable);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    mutable[0]?.splice(0, 1, 4);
    mutable[2]?.splice(7, 1, null);
    mutable[4]?.splice(4, 1, 8);

    expect(result.value.cells[0]).toEqual({ value: 3, given: true });
    expect(result.value.cells[25]).toEqual({ value: 5, given: true });
    expect(result.value.cells[40]).toEqual({ value: null, given: false });
  });

  it('CA-001-01: cellAt(linha, coluna) devolve a célula do índice literal, nos cantos e em posições assimétricas', () => {
    const result = createBoard(input);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { cells } = result.value;
    expect(cellAt(result.value, 0, 0)).toBe(cells[0]);
    expect(cellAt(result.value, 0, 8)).toBe(cells[8]);
    expect(cellAt(result.value, 2, 7)).toBe(cells[25]);
    expect(cellAt(result.value, 8, 0)).toBe(cells[72]);
    expect(cellAt(result.value, 8, 8)).toBe(cells[80]);
    expect(cellAt(result.value, 2, 7)).toEqual({ value: 5, given: true });
    // célula vazia assimétrica: (7,2) = cells[65]
    expect(cellAt(result.value, 7, 2)).toBe(cells[65]);
    expect(cellAt(result.value, 7, 2)).toEqual({ value: null, given: false });
  });
});

const emptyRow = (): (number | null)[] => Array.from({ length: 9 }, () => null);
const emptyGrid = (): (number | null)[][] => Array.from({ length: 9 }, emptyRow);
const withRowLength = (rowIndex: number, length: number): (number | null)[][] => {
  const grid = emptyGrid();
  grid[rowIndex] = Array.from({ length }, () => null);
  return grid;
};

// Captura não-lançante (regra 10): a falha esperada é de asserção sobre o Result.
const create = (value: unknown): ReturnType<typeof createBoard> | undefined => {
  let result: ReturnType<typeof createBoard> | undefined;
  expect(() => {
    result = createBoard(value);
  }).not.toThrow();
  return result;
};

describe('board: grade malformada', () => {
  describe('CA-001-22: forma da grade', () => {
    it.each([
      ['0 linhas', []],
      ['8 linhas', emptyGrid().slice(0, 8)],
      ['10 linhas', [...emptyGrid(), emptyRow()]],
      ['primeira linha com 0 células', withRowLength(0, 0)],
      ['linha do meio (índice 4) com 0 células', withRowLength(4, 0)],
      ['última linha com 0 células', withRowLength(8, 0)],
      ['primeira linha com 8 células', withRowLength(0, 8)],
      ['linha do meio (índice 5) com 8 células', withRowLength(5, 8)],
      ['última linha com 8 células', withRowLength(8, 8)],
      ['primeira linha com 10 células', withRowLength(0, 10)],
      ['linha do meio (índice 3) com 10 células', withRowLength(3, 10)],
      ['última linha com 10 células', withRowLength(8, 10)],
    ])('CA-001-22: recusa grade com %s', (_nome, grade) => {
      const result = create(grade);

      expect(result).toEqual({ ok: false, reason: 'malformed-grid' });
    });
  });

  describe('CA-001-22: limites aceitos', () => {
    it('CA-001-22: aceita a célula com valor 1', () => {
      const grid = emptyGrid().map((row, r) => (r === 2 ? row.with(7, 1) : row));

      const result = create(grid);

      expect(result?.ok).toBe(true);
    });

    it('CA-001-22: aceita a célula com valor 9', () => {
      const grid = emptyGrid().map((row, r) => (r === 7 ? row.with(2, 9) : row));

      const result = create(grid);

      expect(result?.ok).toBe(true);
    });

    it('CA-001-22: aceita a célula null (vazia)', () => {
      const result = create(emptyGrid());

      expect(result?.ok).toBe(true);
    });
  });
});

// Grade vazia com `value` na célula (2,7): linha ≠ coluna (regra 2).
const withCell = (value: unknown): unknown[][] => {
  const grid: unknown[][] = emptyGrid();
  (grid[2] as unknown[])[7] = value;
  return grid;
};

describe('board: grade malformada (conteúdo da célula)', () => {
  it.each([
    ['0', 0],
    ['10', 10],
    ['-1', -1],
    ['2.5', 2.5],
    ['-0', -0],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['-Infinity', Number.NEGATIVE_INFINITY],
    ["'5' (string)", '5'],
    ["'' (string vazia)", ''],
    ['true', true],
    ['5n (bigint)', 5n],
    ['undefined', undefined],
    ['objeto', { value: 5 }],
    ['array [5]', [5]],
  ])('CA-001-22: recusa grade com célula %s em (2,7)', (_nome, conteudo) => {
    const result = create(withCell(conteudo));

    expect(result).toEqual({ ok: false, reason: 'malformed-grid' });
  });
});

describe('board: grade malformada (buracos)', () => {
  it('CA-001-22: recusa array de linhas esparso (new Array(9))', () => {
    expect(create(new Array(9))).toEqual({ ok: false, reason: 'malformed-grid' });
  });

  it('CA-001-22: recusa array de linhas com buraco no meio (índice 4)', () => {
    const grid = emptyGrid();
    delete grid[4];

    expect(grid.length).toBe(9);
    expect(create(grid)).toEqual({ ok: false, reason: 'malformed-grid' });
  });

  it('CA-001-22: recusa linha esparsa com length 9 (buraco em (6,3))', () => {
    const grid = emptyGrid();
    const row = grid[6] as (number | null)[];
    delete row[3];

    expect(row.length).toBe(9);
    expect(create(grid)).toEqual({ ok: false, reason: 'malformed-grid' });
  });

  it('CA-001-22: recusa célula undefined explícita em (5,1)', () => {
    const grid: unknown[][] = emptyGrid();
    (grid[5] as unknown[])[1] = undefined;

    expect(create(grid)).toEqual({ ok: false, reason: 'malformed-grid' });
  });
});

describe('board: grade malformada (entrada que não é array de arrays)', () => {
  const nineStrings = (): unknown[] => {
    const rows: unknown[] = emptyGrid();
    rows[3] = '123456789';
    return rows;
  };
  const nineArrayLike = (): unknown[] => {
    const rows: unknown[] = emptyGrid();
    rows[6] = {
      length: 9,
      0: null,
      1: null,
      2: null,
      3: null,
      4: null,
      5: null,
      6: null,
      7: null,
      8: null,
    };
    return rows;
  };

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['número', 81],
    ['string de 9 caracteres', '123456789'],
    ['objeto array-like { length: 9 }', { length: 9 }],
    ['9 linhas, uma delas string de 9 caracteres', nineStrings()],
    ['9 linhas, uma delas objeto array-like', nineArrayLike()],
  ])('CA-001-22: recusa entrada %s', (_nome, entrada) => {
    const result = create(entrada);

    expect(result).toEqual({ ok: false, reason: 'malformed-grid' });
  });
});

/** Board literal (sem passar por `createBoard`) a partir de 81 caracteres (`.` = vazio). */
function boardFrom(grid: string): Board {
  return {
    cells: [...grid].map((ch) =>
      ch === '.' ? { value: null, given: false } : { value: Number(ch) as Digit, given: false },
    ),
  };
}

describe('board: getConflicts', () => {
  it('CA-001-09: getConflicts aponta a repetição em linha de um Board literal que createBoard recusaria', () => {
    // 4 em (4,2) e (4,8): mesma linha 4, colunas distintas, blocos 4 e 5.
    const board = boardFrom(
      [
        '.........',
        '.........',
        '.........',
        '.........',
        '..4.....4',
        '.........',
        '.........',
        '.........',
        '.........',
      ].join(''),
    );

    expect(getConflicts(board)).toEqual([
      { row: 4, col: 2, value: 4, units: [{ kind: 'row', index: 4 }] },
      { row: 4, col: 8, value: 4, units: [{ kind: 'row', index: 4 }] },
    ]);
  });

  it('CA-001-09: tabuleiro criado sem conflito não tem conflitos', () => {
    const result = createBoard(input);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(getConflicts(result.value)).toEqual([]);
  });
});

/** Grade vazia com `value` em cada `[linha, coluna]` dada. */
const gridWith = (value: number, cells: readonly (readonly [number, number])[]): unknown[][] => {
  const grid: unknown[][] = emptyGrid();
  for (const [r, c] of cells) (grid[r] as unknown[])[c] = value;
  return grid;
};

describe('board: pistas em conflito na criação', () => {
  it('CA-001-23: recusa pistas repetidas na mesma linha, sem criar tabuleiro', () => {
    // 5 em (4,2) e (4,8): mesma linha, colunas e blocos distintos.
    const result = create(
      gridWith(5, [
        [4, 2],
        [4, 8],
      ]),
    );

    expect(result).toEqual({ ok: false, reason: 'conflicting-givens' });
  });

  it('CA-001-23: recusa pistas repetidas na mesma coluna, sem criar tabuleiro', () => {
    // 7 em (1,6) e (7,6): mesma coluna, linhas e blocos distintos.
    const result = create(
      gridWith(7, [
        [1, 6],
        [7, 6],
      ]),
    );

    expect(result).toEqual({ ok: false, reason: 'conflicting-givens' });
  });

  it('CA-001-23: recusa pistas repetidas no mesmo bloco, fora do canto e sem linha ou coluna em comum', () => {
    // 6 em (4,3) e (5,5): bloco 4, linhas e colunas distintas, nenhuma no canto.
    const result = create(
      gridWith(6, [
        [4, 3],
        [5, 5],
      ]),
    );

    expect(result).toEqual({ ok: false, reason: 'conflicting-givens' });
  });

  it('CA-001-23: aceita grade sem valor repetido numa unidade', () => {
    const result = create(input);

    expect(result?.ok).toBe(true);
  });

  it('CA-001-23: aceita o mesmo valor em células sem unidade em comum', () => {
    // 4 em (0,0) e (4,4) e (8,8): linhas, colunas e blocos distintos.
    const result = create(
      gridWith(4, [
        [0, 0],
        [4, 4],
        [8, 8],
      ]),
    );

    expect(result?.ok).toBe(true);
  });
});

describe('board: precedência na criação (CA-001-25)', () => {
  const repeated = [
    [1, 0],
    [1, 4],
  ] as const;

  it('CA-001-25: forma errada antes das pistas repetidas ⇒ malformed-grid', () => {
    const grid = gridWith(5, repeated);
    grid[0] = Array.from({ length: 8 }, () => null);

    expect(create(grid)).toEqual({ ok: false, reason: 'malformed-grid' });
  });

  it('CA-001-25: forma errada depois das pistas repetidas ⇒ malformed-grid', () => {
    const grid = gridWith(5, repeated);
    grid[8] = Array.from({ length: 8 }, () => null);

    expect(create(grid)).toEqual({ ok: false, reason: 'malformed-grid' });
  });

  it('CA-001-25: linhas a mais depois das pistas repetidas ⇒ malformed-grid', () => {
    const grid = gridWith(5, repeated);
    grid.push(emptyRow());

    expect(create(grid)).toEqual({ ok: false, reason: 'malformed-grid' });
  });

  it('CA-001-25: célula de tipo inválido antes das pistas repetidas ⇒ malformed-grid', () => {
    const grid = gridWith(5, [
      [4, 2],
      [4, 8],
    ]);
    (grid[0] as unknown[])[0] = '5';

    expect(create(grid)).toEqual({ ok: false, reason: 'malformed-grid' });
  });

  it('CA-001-25: célula de tipo inválido depois das pistas repetidas ⇒ malformed-grid', () => {
    const grid = gridWith(5, repeated);
    (grid[8] as unknown[])[8] = 0;

    expect(create(grid)).toEqual({ ok: false, reason: 'malformed-grid' });
  });
});

/** Cria um Board a partir de uma entrada válida; falha o teste se createBoard recusar. */
function mustCreate(grid: unknown): Board {
  const result = createBoard(grid);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error('createBoard recusou entrada válida');
  return result.value;
}

/** Aplica `placeValue` esperando aceite; falha o teste se recusar. */
function mustPlace(board: Board, row: number, col: number, value: number): Board {
  const result = placeValue(board, row, col, value);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error('placeValue recusou jogada válida');
  return result.value;
}

describe('board: placeValue (caminho feliz)', () => {
  it('CA-001-03: coloca o valor na célula vazia; só ela muda e vira célula do jogador', () => {
    const board = mustCreate(input);
    const snapshot = structuredClone(board);

    // (4,2) = cells[38]: vazia, não é pista, sem pista na linha 4, coluna 2 nem bloco 4.
    const next = mustPlace(board, 4, 2, 6);

    expect(next.cells[38]).toEqual({ value: 6, given: false });
    next.cells.forEach((cell, i) => {
      if (i !== 38) expect(cell).toEqual(board.cells[i]);
    });
    expect(board).toEqual(snapshot);
    expect(board.cells[38]).toEqual({ value: null, given: false });
  });

  it('CA-001-04: substitui o valor do jogador; o anterior deixa de existir', () => {
    const board = mustCreate(input);
    const placed = mustPlace(board, 4, 2, 6);
    const snapshot = structuredClone(placed);

    const next = mustPlace(placed, 4, 2, 2);

    expect(next.cells[38]).toEqual({ value: 2, given: false });
    expect(next.cells.some((cell) => cell.value === 6)).toBe(false);
    next.cells.forEach((cell, i) => {
      if (i !== 38) expect(cell).toEqual(placed.cells[i]);
    });
    expect(placed).toEqual(snapshot);
  });

  it.each([
    ['linha 0, coluna 0', 0, 0, 0],
    ['linha 0, coluna 8', 0, 8, 8],
    ['linha 8, coluna 0', 8, 0, 72],
    ['linha 8, coluna 8', 8, 8, 80],
  ])('CA-001-03: aceita %s (limites da grade)', (_nome, row, col, index) => {
    const board = mustCreate(emptyGrid());

    const next = mustPlace(board, row, col, 5);

    expect(next.cells[index]).toEqual({ value: 5, given: false });
    expect(next.cells.filter((cell) => cell.value !== null).length).toBe(1);
  });

  it.each([1, 9])('CA-001-03: aceita o valor %i (limites do valor)', (value) => {
    const board = mustCreate(emptyGrid());

    const next = mustPlace(board, 3, 5, value);

    // (3,5) = cells[32]
    expect(next.cells[32]).toEqual({ value, given: false });
    expect(next.cells.filter((cell) => cell.value !== null).length).toBe(1);
  });

  it('CA-001-03: aceita -0 como linha e como coluna (índice 0)', () => {
    const board = mustCreate(emptyGrid());

    const next = mustPlace(board, -0, -0, 5);

    expect(next.cells[0]).toEqual({ value: 5, given: false });
    expect(next.cells.filter((cell) => cell.value !== null).length).toBe(1);
  });

  it('CA-001-03: o resultado é congelado (Board, cells e cada CellState)', () => {
    const board = mustCreate(input);

    const next = mustPlace(board, 4, 2, 6);

    expect(Object.isFrozen(next)).toBe(true);
    expect(Object.isFrozen(next.cells)).toBe(true);
    expect(next.cells.every((cell) => Object.isFrozen(cell))).toBe(true);
  });
});

/** Aplica `eraseValue` esperando aceite; falha o teste se recusar. */
function mustErase(board: Board, row: number, col: number): Board {
  const result = eraseValue(board, row, col);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error('eraseValue recusou jogada válida');
  return result.value;
}

describe('board: eraseValue (caminho feliz)', () => {
  it('CA-001-05: apaga o valor do jogador; a célula fica vazia e nenhuma outra muda', () => {
    const board = mustPlace(mustCreate(input), 4, 2, 6);
    const snapshot = structuredClone(board);

    // (4,2) = cells[38]
    const next = mustErase(board, 4, 2);

    expect(next.cells[38]).toEqual({ value: null, given: false });
    next.cells.forEach((cell, i) => {
      if (i !== 38) expect(cell).toEqual(board.cells[i]);
    });
    expect(board).toEqual(snapshot);
    expect(board.cells[38]).toEqual({ value: 6, given: false });
  });

  it('CA-001-06: apagar célula vazia é aceito e o conteúdo fica idêntico', () => {
    const board = mustCreate(input);
    const snapshot = structuredClone(board);

    const next = mustErase(board, 6, 3);

    expect(next).toEqual(board);
    expect(next.cells.length).toBe(81);
    expect(board).toEqual(snapshot);
  });

  it('CA-001-05: o resultado é congelado (Board, cells e cada CellState)', () => {
    const board = mustPlace(mustCreate(input), 4, 2, 6);

    const next = mustErase(board, 4, 2);

    expect(Object.isFrozen(next)).toBe(true);
    expect(Object.isFrozen(next.cells)).toBe(true);
    expect(next.cells.every((cell) => Object.isFrozen(cell))).toBe(true);
  });
});

describe('board: conflito ao colocar valor', () => {
  it('CA-001-15: valor repetido na linha é aceito e as duas células constam em conflito', () => {
    // 4 em (4,6) e depois (4,1): mesma linha 4, colunas e blocos distintos.
    const board = mustPlace(mustCreate(input), 4, 6, 4);

    const next = mustPlace(board, 4, 1, 4);

    expect(next.cells[37]).toEqual({ value: 4, given: false });
    expect(getConflicts(next)).toEqual([
      { row: 4, col: 1, value: 4, units: [{ kind: 'row', index: 4 }] },
      { row: 4, col: 6, value: 4, units: [{ kind: 'row', index: 4 }] },
    ]);
  });

  it('CA-001-15: valor repetido na coluna é aceito e as duas células constam em conflito', () => {
    // 2 em (6,5) e depois (1,5): mesma coluna 5, linhas e blocos distintos.
    const board = mustPlace(mustCreate(input), 6, 5, 2);

    const next = mustPlace(board, 1, 5, 2);

    expect(next.cells[14]).toEqual({ value: 2, given: false });
    expect(getConflicts(next)).toEqual([
      { row: 1, col: 5, value: 2, units: [{ kind: 'column', index: 5 }] },
      { row: 6, col: 5, value: 2, units: [{ kind: 'column', index: 5 }] },
    ]);
  });

  it('CA-001-15: valor repetido no bloco é aceito e as duas células constam em conflito', () => {
    // 8 em (3,4) e depois (5,3): bloco 4, linhas e colunas distintas.
    const board = mustPlace(mustCreate(input), 3, 4, 8);

    const next = mustPlace(board, 5, 3, 8);

    expect(next.cells[48]).toEqual({ value: 8, given: false });
    expect(getConflicts(next)).toEqual([
      { row: 3, col: 4, value: 8, units: [{ kind: 'box', index: 4 }] },
      { row: 5, col: 3, value: 8, units: [{ kind: 'box', index: 4 }] },
    ]);
  });

  it('CA-001-15: a jogada em conflito não é recusada', () => {
    const board = mustPlace(mustCreate(input), 4, 6, 4);

    const result = placeValue(board, 4, 1, 4);

    expect(result.ok).toBe(true);
    expect(getConflicts(board)).toEqual([]);
  });

  it('CA-001-16: pista e célula do jogador em conflito; a pista segue intacta', () => {
    // Pista 5 em (2,7); 5 em (2,1): mesma linha 2, blocos 0 e 2.
    const board = mustCreate(input);

    const next = mustPlace(board, 2, 1, 5);

    expect(getConflicts(next)).toEqual([
      { row: 2, col: 1, value: 5, units: [{ kind: 'row', index: 2 }] },
      { row: 2, col: 7, value: 5, units: [{ kind: 'row', index: 2 }] },
    ]);
    expect(next.cells[25]).toEqual({ value: 5, given: true });
    expect(next.cells[19]).toEqual({ value: 5, given: false });
  });
});
