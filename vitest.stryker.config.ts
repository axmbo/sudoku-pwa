import { mergeConfig } from 'vitest/config';
import base from './vitest.config';

// Só para o Stryker (stryker.config.json). A instrumentação perTest deixa as propriedades do
// domínio ~10x mais lentas: o limite por teste sobe e as propriedades rodam 10 vezes, não 100
// (tests/stryker.setup.ts). O teste de regressão de tempo (10.000 jogadas) mede desempenho,
// não mata mutante: fica fora da rodada de mutação e continua no `npm run check`.
// Decisão do Diretor, 25/11/2026 (PR #16).
export default mergeConfig(base, {
  test: {
    testTimeout: 120_000,
    testNamePattern: /^(?!.*regressão de tempo)/,
    setupFiles: ['./tests/stryker.setup.ts'],
  },
});
