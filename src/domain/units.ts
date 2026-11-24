/** Índice de linha, coluna ou bloco (0–8); a UI soma 1. */
export type Index = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type UnitKind = 'row' | 'column' | 'box';

export interface Unit {
  readonly kind: UnitKind;
  readonly index: Index;
}

/** Índice (0–80) da célula na linha `row` e coluna `col`. */
export function cellIndex(row: number, col: number): number {
  return row * 9 + col;
}

const INDEXES: readonly Index[] = [0, 1, 2, 3, 4, 5, 6, 7, 8];

/** As 27 unidades em ordem fixa: 9 linhas, 9 colunas, 9 blocos. */
export const ALL_UNITS: readonly Unit[] = (['row', 'column', 'box'] as const).flatMap((kind) =>
  INDEXES.map((index) => ({ kind, index })),
);
