import { describe, expect, it } from 'vitest';
import { deserializeGame } from './serialize';

describe('deserializeGame (recusas)', () => {
  it('CA-004-28: texto vazio é recusado como invalid-data, sem lançar', () => {
    // [símbolo novo: `deserializeGame`]
    expect(deserializeGame('')).toEqual({ ok: false, reason: 'invalid-data' });
  });
});
