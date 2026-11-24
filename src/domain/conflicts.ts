import type { Digit } from './digit';
import type { Index, Unit } from './units';

export interface CellConflict {
  readonly row: Index;
  readonly col: Index;
  readonly value: Digit;
  readonly units: readonly [Unit, ...Unit[]]; // ordem fixa: row, column, box
}

/** Células em conflito (valor repetido na linha); coluna e bloco vêm nos próximos ciclos. */
export function findConflicts(values: readonly (Digit | null)[]): readonly CellConflict[] {
  const conflicts: CellConflict[] = [];
  values.forEach((value, i) => {
    if (value === null) return;
    const row = Math.floor(i / 9) as Index;
    const col = (i % 9) as Index;
    const repeated = values.some(
      (other, j) => j !== i && Math.floor(j / 9) === row && other === value,
    );
    if (repeated) conflicts.push({ row, col, value, units: [{ kind: 'row', index: row }] });
  });
  return conflicts;
}
