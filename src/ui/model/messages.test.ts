import { describe, expect, it } from 'vitest';
import type { CellConflict } from '../../domain/conflicts';
import type { Index, Unit } from '../../domain/units';
import { cellLabel, conflictMessage, messages } from './messages';

const plain = { given: false, conflicted: false } as const;

describe('messages: cellLabel', () => {
  it('CA-005-03: pista leva linha, coluna, valor e "pista"', () => {
    expect(cellLabel(2, 4, { value: 7, given: true, conflicted: false })).toBe(
      'Linha 3, coluna 5, 7, pista',
    );
  });

  it('CA-005-03: valor do jogador não leva "pista"', () => {
    expect(cellLabel(2, 4, { value: 7, ...plain })).toBe('Linha 3, coluna 5, 7');
  });

  it('CA-005-03: célula vazia diz "vazia"', () => {
    expect(cellLabel(2, 4, { value: null, ...plain })).toBe('Linha 3, coluna 5, vazia');
  });

  it('CA-005-19: conflito acrescenta ", em conflito" ao valor do jogador', () => {
    expect(cellLabel(2, 4, { value: 7, given: false, conflicted: true })).toBe(
      'Linha 3, coluna 5, 7, em conflito',
    );
  });

  it('CA-005-19: pista em conflito traz "pista" e depois "em conflito"', () => {
    expect(cellLabel(2, 4, { value: 7, given: true, conflicted: true })).toBe(
      'Linha 3, coluna 5, 7, pista, em conflito',
    );
  });

  it('CA-005-03: índices 0 e 8 viram 1 e 9', () => {
    expect(cellLabel(0, 0, { value: null, ...plain })).toBe('Linha 1, coluna 1, vazia');
    expect(cellLabel(8, 8, { value: 9, ...plain })).toBe('Linha 9, coluna 9, 9');
  });
});

function conflict(units: readonly [Unit, ...Unit[]]): CellConflict {
  return { row: 2, col: 4, value: 5, units };
}

describe('messages: conflictMessage', () => {
  it('CA-005-20: unidade linha usa índice +1', () => {
    expect(conflictMessage(conflict([{ kind: 'row', index: 2 }]))).toBe(
      'Conflito: 5 repetido na linha 3',
    );
  });

  it('CA-005-20: unidade coluna usa índice +1', () => {
    expect(conflictMessage(conflict([{ kind: 'column', index: 0 }]))).toBe(
      'Conflito: 5 repetido na coluna 1',
    );
  });

  it('CA-005-20: unidade caixa usa índice +1', () => {
    expect(conflictMessage(conflict([{ kind: 'box', index: 8 as Index }]))).toBe(
      'Conflito: 5 repetido na caixa 9',
    );
  });

  it('CA-005-20: com várias unidades usa só a primeira', () => {
    const c = conflict([
      { kind: 'column', index: 4 },
      { kind: 'row', index: 2 },
      { kind: 'box', index: 1 },
    ]);
    expect(conflictMessage(c)).toBe('Conflito: 5 repetido na coluna 5');
  });
});

describe('messages: constantes', () => {
  const texts: [string, string][] = Object.entries(messages);
  const english =
    /\b(conflict|won|win|error|errors|invalid|cell|row|column|box|given|empty|the|and|game|grid)\b/i;

  it('CA-005-36: expõe exatamente as quatro constantes, todas texto não vazio', () => {
    expect(Object.keys(messages).sort()).toEqual(
      ['fullWithErrors', 'givenImmutable', 'noConflicts', 'won'].sort(),
    );
    for (const [, text] of texts) {
      expect(typeof text).toBe('string');
      expect(text.trim().length).toBeGreaterThan(0);
    }
  });

  it('CA-005-21: noConflicts diz "sem conflitos"', () => {
    expect(messages.noConflicts).toBe('sem conflitos');
  });

  it('CA-005-15: givenImmutable diz "pista, não pode ser alterada"', () => {
    expect(messages.givenImmutable).toBe('pista, não pode ser alterada');
  });

  // Textos exatos aprovados pelo Diretor em 26/11/2026 (T03 da 005a).
  it('CA-005-29: won é o texto aprovado de vitória', () => {
    expect(messages.won).toBe('Parabéns, você venceu!');
  });

  it('CA-005-30: fullWithErrors é o texto aprovado de grade cheia com erros', () => {
    expect(messages.fullWithErrors).toBe('Grade completa, mas há erros. Corrija para vencer.');
  });

  it('CA-005-36: constantes sem placeholder e sem palavra inglesa da lista fixa', () => {
    for (const [, text] of texts) {
      expect(text).not.toMatch(/\{|\}|\$\{|%s|%d|undefined|null/);
      expect(text).not.toMatch(english);
    }
  });

  it('CA-005-36: textos dinâmicos também não trazem palavra inglesa da lista fixa', () => {
    const labels = [
      cellLabel(0, 0, { value: null, ...plain }),
      cellLabel(1, 1, { value: 3, given: true, conflicted: true }),
      conflictMessage(conflict([{ kind: 'box', index: 4 }])),
    ];
    for (const text of labels) expect(text).not.toMatch(english);
  });
});
