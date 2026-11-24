import type { Digit } from './digit';
import { ALL_UNITS, unitCells, type Index, type Unit } from './units';

export interface CellConflict {
  readonly row: Index;
  readonly col: Index;
  readonly value: Digit;
  readonly units: readonly [Unit, ...Unit[]]; // ordem fixa: row, column, box
}

/** Unidades em que a célula `i` repete o valor de outra célula. */
function repeatedUnits(values: readonly (Digit | null)[], i: number): Unit[] {
  return ALL_UNITS.filter((unit) => {
    const cells = unitCells(unit);
    return cells.includes(i) && cells.some((j) => j !== i && values[j] === values[i]);
  });
}

/** Células em conflito (valor repetido na linha, na coluna ou no bloco), em índice crescente. */
export function findConflicts(values: readonly (Digit | null)[]): readonly CellConflict[] {
  const conflicts: CellConflict[] = [];
  values.forEach((value, i) => {
    if (value === null) return;
    const [first, ...rest] = repeatedUnits(values, i);
    if (first) {
      conflicts.push({
        row: Math.floor(i / 9) as Index,
        col: (i % 9) as Index,
        value,
        units: [first, ...rest],
      });
    }
  });
  return conflicts;
}
