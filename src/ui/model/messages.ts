import type { CellConflict } from '../../domain/conflicts';
import type { Digit } from '../../domain/digit';
import type { Index, UnitKind } from '../../domain/units';

export interface CellView {
  readonly value: Digit | null;
  readonly given: boolean;
  readonly conflicted: boolean;
}

const UNIT_NAMES: Record<UnitKind, string> = {
  row: 'linha',
  column: 'coluna',
  box: 'caixa',
};

export function cellLabel(row: Index, col: Index, view: CellView): string {
  const parts = [
    `Linha ${row + 1}`,
    `coluna ${col + 1}`,
    view.value === null ? 'vazia' : `${view.value}`,
  ];
  if (view.given) parts.push('pista');
  if (view.conflicted) parts.push('em conflito');
  return parts.join(', ');
}

export function conflictMessage(conflict: CellConflict): string {
  const unit = conflict.units[0];
  return `Conflito: ${conflict.value} repetido na ${UNIT_NAMES[unit.kind]} ${unit.index + 1}`;
}

export const messages = {
  noConflicts: 'sem conflitos',
  givenImmutable: 'pista, não pode ser alterada',
  won: 'Parabéns, você venceu!',
  fullWithErrors: 'Grade completa, mas há erros. Corrija para vencer.',
} as const;
