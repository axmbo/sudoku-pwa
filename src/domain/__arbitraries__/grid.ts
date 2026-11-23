import fc from 'fast-check';
import type { Digit } from '../digit';
import type { Grid } from '../board';

/** Solução fixa (fixture de teste, sem solver): cada linha, coluna e bloco tem 1–9 uma vez. */
export const SOLUTION: readonly string[] = [
  '123456789',
  '456789123',
  '789123456',
  '234567891',
  '567891234',
  '891234567',
  '345678912',
  '678912345',
  '912345678',
];

/** Grade 9x9 sem conflito: máscara aleatória (vazio = `null`) sobre `SOLUTION`. */
export const gridWithoutConflicts: fc.Arbitrary<Grid> = fc
  .array(fc.boolean(), { minLength: 81, maxLength: 81 })
  .map((mask) =>
    SOLUTION.map((line, r) =>
      [...line].map((ch, c) => (mask[r * 9 + c] ? (Number(ch) as Digit) : null)),
    ),
  );
