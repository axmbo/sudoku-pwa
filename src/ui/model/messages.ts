import type { CellConflict } from '../../domain/conflicts';
import type { Digit } from '../../domain/digit';
import type { Move } from '../../domain/history';
import type { Index, UnitKind } from '../../domain/units';

export interface CellView {
  readonly value: Digit | null;
  readonly given: boolean;
  readonly conflicted: boolean;
  readonly notes: readonly Digit[];
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
  if (view.value === null && view.notes.length > 0) parts.push(notesMessage(view.notes));
  if (view.conflicted) parts.push('em conflito');
  return parts.join(', ');
}

export function notesMessage(notes: readonly Digit[]): string {
  return notes.length === 0 ? 'sem anotações' : `anotações ${notes.join(' ')}`;
}

function moveTail(move: Move): string {
  switch (move.kind) {
    case 'place':
    case 'place-prune':
      return `valor ${move.digit}`;
    case 'erase':
      return 'apagar';
    case 'toggle-note':
      return `anotação ${move.digit}`;
    case 'clear-notes':
      return 'apagar anotações';
  }
}

export function historyMessage(
  kind: 'Desfeito' | 'Refeito',
  move: Move,
  row: Index,
  col: Index,
): string {
  return `${kind}: ${moveTail(move)} na linha ${row + 1}, coluna ${col + 1}`;
}

export function conflictMessage(conflict: CellConflict): string {
  const unit = conflict.units[0];
  return `Conflito: ${conflict.value} repetido na ${UNIT_NAMES[unit.kind]} ${unit.index + 1}`;
}

export const messages = {
  noConflicts: 'sem conflitos',
  givenImmutable: 'pista, não pode ser alterada',
  won: 'Parabéns, você venceu!',
  noteModeOn: 'modo anotação ligado',
  noteModeOff: 'modo anotação desligado',
  cellHasValue: 'a célula já tem valor',
  nothingToUndo: 'nada para desfazer',
  nothingToRedo: 'nada para refazer',
  fullWithErrors: 'Grade completa, mas há erros. Corrija para vencer.',
} as const;
