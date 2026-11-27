# QA 005a (grade acessível) — HEAD f470aa9

| Métrica | Valor | Orçamento | ok? |
|---|---|---|---|
| E2E (Playwright, chromium-mobile), rodada 1 | 23/23 passaram, 20,5 s | 0 falhas | ok |
| E2E rodada 2 (intermitência) | 23/23 passaram, 20,3 s | 0 falhas | ok |
| axe sérias/críticas (inicial, conflito, vitória) | 0 (a11y.spec CA-005-35, CA-005-39) | 0 | ok |
| JS inicial gzip | 9,26 kB (gzip -9; vite informa 9,33 kB) | ≤ 60 kB | ok |
| CSS inicial gzip | 0,94 kB | ≤ 10 kB | ok |
| Chunk do Worker | n/a: sem Worker na 005a | ≤ 30 kB | n/a |
| Lighthouse mobile (perf/a11y/bp, LCP, TBT) | n/d: @lhci/cli não instalado (node_modules/.bin sem lhci/lighthouse; sem script `lighthouse` no package.json) | LCP ≤ 2,5 s; TBT ≤ 200 ms | n/d |
| SW / offline / instalação / atualização | n/a: B-09 fora do escopo da 005a (spec.md l.184); build sem SW | - | n/a |
| Alvos ≥ 44 px (teclado 44x44 qualquer largura; células a 450 px) | passou (CA-005-28) | ≥ 44 px | ok |
| 320 px e texto a 200%: sem rolagem horizontal, dígito inteiro | passou (CA-005-34) | - | ok |
| prefers-reduced-motion | passou (CA-005-33) | - | ok |

## Falhas
Nenhuma bloqueante.
- Lighthouse n/d (sugestão minor, adiar para tag/CI agendado conforme ADR 0001): instalar @lhci/cli e criar script.
- Só chromium-mobile roda; WebKit/Firefox não medidos. Zoom real do navegador e roteiro TalkBack seguem manuais (plan.md l.145), não executados aqui.

Reproduzir: `. ~/.nvm/nvm.sh && nvm use && npm run e2e` ; `npm run build`.
