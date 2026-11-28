# QA da 005b — rodada 1

> Auditoria do `qa-auditor` sobre HEAD `693d4ef` (28/11/2026). O texto foi gravado pelo orquestrador, a partir do retorno do agente, que não grava `.md`. Os números são da execução do agente. Tokens: 44,8k (harness); tempo: 144 s (harness).

## Resumo

Há 1 falha de E2E (major, intermitente). O build, o axe e o contraste dos tokens passam. Lighthouse e PWA ficaram n/d.

| Métrica | Valor | Orçamento | OK? |
|---|---|---|---|
| E2E Playwright, suíte completa, 2 rodadas | 37/38 e 37/38 | 38/38 | não |
| CA-005-16 isolado (`-g`, `--repeat-each=5`) | 5/5 | — | intermitente |
| axe serious/critical (testes de a11y, anotação e tema escuro) | 0 violações | 0 | sim |
| Contraste, tema claro (21 pares de tokens) | texto mín. 5,87:1; não-texto mín. 4,39:1 | 4,5:1 e 3:1 | sim |
| Contraste, tema escuro (21 pares de tokens) | texto mín. 5,74:1; não-texto mín. 5,74:1 | 4,5:1 e 3:1 | sim |
| JS inicial gzip | 11,05 kB | ≤ 60 kB | sim |
| CSS inicial gzip | 1,59 kB | ≤ 10 kB | sim |
| Worker gzip; Lighthouse perf/a11y/bp; LCP; TBT | n/d (não há chunk de worker, nem script ou `@lhci/cli`) | ≥ 90/100/≥ 95; ≤ 2,5 s; ≤ 200 ms | n/d |
| Offline, instalação e atualização do SW | n/d (fora do escopo, B-09; não há SW no `dist`) | — | n/d |

## Achados

- **[major] CA-005-16**, em `e2e/jogo.spec.ts:185`, teste "N liga o modo, pegajoso…": depois de `ArrowRight` em modo anotação, o `toBeFocused()` da célula (1,4) falha. O teste falhou nas 2 rodadas da suíte completa e passou 5/5 quando rodado sozinho. Na T09 a suíte deu 38/38, então isto é uma regressão ou um flake novo. A causa ainda não foi diagnosticada.
  - Para reproduzir a falha: `npx playwright test`.
  - Rodado sozinho, passa: `npx playwright test e2e/jogo.spec.ts -g "CA-005-16" --repeat-each=5`.

## Notas

- O contraste foi calculado a partir dos tokens de `src/ui/theme.css`, não dos pixels renderizados. No E2E, o `color-contrast` do axe passou nos testes do tema escuro.
