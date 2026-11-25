import { vi } from 'vitest';

// Carregado só por vitest.stryker.config.ts. Sob a instrumentação do Stryker, 100 ou mais rodadas
// por propriedade não cabem no job de 60 min; até 10 mantêm as propriedades na mutação a custo
// menor, inclusive nas que fixam `numRuns` no próprio teste. O `npm run check` não carrega este
// arquivo e segue com os valores dos testes. Decisão do Diretor, 25/11/2026 (PR #16).
vi.mock('fast-check', async (importOriginal) => {
  const STRYKER_MAX_RUNS = 10;
  const original = await importOriginal<typeof import('fast-check')>();
  const assert = ((property, params) =>
    original.assert(property, {
      ...params,
      numRuns: Math.min(params?.numRuns ?? STRYKER_MAX_RUNS, STRYKER_MAX_RUNS),
    })) as typeof original.assert;
  return { ...original, assert, default: { ...original.default, assert } };
});
