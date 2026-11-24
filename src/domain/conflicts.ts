import type { Digit } from './digit';
import type { Index, Unit } from './units';

export interface CellConflict {
  readonly row: Index;
  readonly col: Index;
  readonly value: Digit;
  readonly units: readonly [Unit, ...Unit[]]; // ordem fixa: row, column, box
}

/** Células em conflito (valor repetido na linha ou na coluna); o bloco vem no próximo ciclo. */
export function findConflicts(values: readonly (Digit | null)[]): readonly CellConflict[] {
  const conflicts: CellConflict[] = [];
  values.forEach((value, i) => {
    if (value === null) return;
    const row = Math.floor(i / 9) as Index;
    const col = (i % 9) as Index;
    const sharing = (inUnit: (j: number) => boolean): boolean =>
      values.some((other, j) => j !== i && inUnit(j) && other === value);
    const units: Unit[] = [];
    if (sharing((j) => Math.floor(j / 9) === row)) units.push({ kind: 'row', index: row });
    if (sharing((j) => j % 9 === col)) units.push({ kind: 'column', index: col });
    const [first, ...rest] = units;
    if (first) conflicts.push({ row, col, value, units: [first, ...rest] });
  });
  return conflicts;
}
