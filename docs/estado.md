# Estado do projeto

> Snapshot vivo para retomada. Máximo de 40 linhas. Só estado; regras ficam em `CLAUDE.md` e `PROCESSO.md`.

- **Fase:** 1 (domínio e primeira UI). Fase 0 encerrada no [PR #1](https://github.com/axmbo/sudoku-pwa/pull/1) (23/11/2026, `8b5b40e`). Regras vivas: `PROCESSO.md` v0.8 (retro do ciclo 02, 25/11/2026; v0.7 no [PR #15](https://github.com/axmbo/sudoku-pwa/pull/15)). `main` em `96f096e` ([PR #18](https://github.com/axmbo/sudoku-pwa/pull/18), retro e v0.8).
- **Spec 001 concluída e arquivada (24/11/2026):** [PR #2](https://github.com/axmbo/sudoku-pwa/pull/2); [RESUMO](../specs/_arquivo/001-tabuleiro-conflitos/RESUMO.md); [ADR 0007](adr/0007-convencoes-do-dominio.md). Retro: [ciclo-01](process/retro/ciclo-01.md); promovidas no v0.6: M-003, M-005 a M-008, M-009(a).
- **Spec 004 concluída, mergeada e arquivada (25/11/2026 10:08 BRT, rebase merge):** [PR #16](https://github.com/axmbo/sudoku-pwa/pull/16), 33 CA, 672 testes, cobertura 100%, mutation 100% (rodada completa). Ponto de leitura: [RESUMO](../specs/_arquivo/004-estado-de-jogo/RESUMO.md). A issue [#14](https://github.com/axmbo/sudoku-pwa/issues/14) foi fechada à mão em 25/11/2026 10:20 BRT, com autorização do Diretor (o PR escreveu "Fecha", que o GitHub não reconhece; M-015).
- **Retro do ciclo 02 feita (25/11/2026):** [ciclo-02](process/retro/ciclo-02.md); tarefas 1,19M de subagentes contra 1,22M prováveis (0,97×); real rastreado do ciclo 1,40M contra âncora 1,62M (sem orquestrador, planejamento, análise e CI: n/d). Candidatas novas M-012 a M-015 e reavaliação de M-001, M-002, M-009(b), M-010 em [melhorias](process/melhorias.md). Ciclo 02 não é múltiplo de 3: sem revisão estrutural (próxima no ciclo 03).
- **Spec 005 especificada e dividida (25/11/2026, aprovada pelo Diretor):** [005a](../specs/005a-grade-acessivel/spec.md) (30 CA, [#19](https://github.com/axmbo/sudoku-pwa/issues/19); grade, teclado, valor, conflito, teclado na tela, vitória) e depois [005b](../specs/005b-anotacoes-e-tema/spec.md) (15 CA, [#20](https://github.com/axmbo/sudoku-pwa/issues/20); anotações, desfazer/refazer, tema escuro, tela larga). Recomendações de UX aprovadas em bloco. Branch `feat/005a-grade-acessivel`. Alerta: a 005a ainda pode passar de ~8 tarefas (o `arquiteto` avalia no plano).
- **Próximo:** `/planejar 005a` (puzzle fixo até a 003; [plano da fase](process/plano-fase-1.md)).
- **Validado no Claude Code:** hook `SessionStart` injeta o estado; o hook do `dev` bloqueia arquivo de teste (provado em 22/11/2026).

## Decisões do Diretor (22/11/2026 a 25/11/2026)

1. MVP: níveis, conflitos, anotações + undo/redo, timer + estatísticas, desafio diário. Dicas no pós-MVP.
2. UI Preact 11 (ADR 0003); persistência IndexedDB via `idb-keyval` (ADR 0004). Licença MIT.
3. nvm + `.nvmrc` com a versão exata; o CI usa `node-version-file`. Referência: Android modesto.
4. Subagentes em sonnet por padrão; opus só com justificativa. Código em inglês; UI e docs em pt-BR.
5. Desafio diário: um por nível por dia, pela data local (ADR 0005); exportar/importar JSON no pós-MVP.
6. Minors aceitos viram issues `débito` no GitHub; aqui fica só o índice.
7. `board.test.ts` (~8,2k tokens) será dividido por operação antes de crescer, tarefa futura.
8. Depois da 001, segue 004 e depois 005 (primeiro rodável), com puzzle fixo até a 003; 002 e 003 depois (24/11/2026; [plano](process/plano-fase-1.md)).
9. Spec 004 (24/11/2026): anotações dos vizinhos ficam ao colocar valor; desfazer é por ação; após a vitória tudo é recusado; sem conferir contra a solução antes da grade cheia; o jogo gravado leva o histórico completo, como texto JSON no envelope do ADR 0004; limpar anotações em célula com valor é no-op e jogada sem efeito devolve o mesmo `Game` (sem CA novo); ciclo único, sem dividir.
10. T01 da 004 (24/11/2026): via 7b aceita para matar mutante em estado que a API ainda não alcança (commit `51b359e`); proposta de template na M-010.
11. T02 da 004 (24/11/2026): o Diretor aprovou exportar `isCoordinate` de `board.ts` (predicado `n is Index`), fora da lista de arquivos da tarefa. Reancoragem: tokens de T03 a T08 ×1,4 (minutos inalterados); âncora 1,62M = real T01+T02 321k + provável T03-T08 994k + não-tarefa 305k.
12. PR #16 da 004 (25/11/2026): o job `mutation` falhou duas vezes (`5ec38aa`, `d191a54`); opção C do Diretor: `vitest.stryker.config.ts` própria (timeout 120 s, propriedades com no máximo 10 rodadas via `tests/stryker.setup.ts`, regressão de tempo fora); rodada completa local 22 min, 100%, 0 sobreviventes; CI 17m44s pass. Cache incremental no CI: [#17](https://github.com/axmbo/sudoku-pwa/issues/17). Custo do destravamento: tokens n/d (orquestrador, sem log de subagente).
13. Spec 005 (25/11/2026): dividida em 005a e 005b, com o teclado na tela na 005a e o tema na 005b; as recomendações (a) de UX das perguntas 1 a 8 foram aprovadas em bloco; issues #19 e #20 criadas pela IA com autorização.

## Pendências do Diretor

1. Mantidas até a revisão estrutural do ciclo 03: M-001 (descartar sem ocorrência) e M-009(b) (`min_est` pela vazão).
2. Proteção da `main` + regra de quem cria tags `v*` (adiada em 23/11/2026: "depois").

## Débitos

Issues `débito` no GitHub (25/11/2026): [#7](https://github.com/axmbo/sudoku-pwa/issues/7) ordem TDD no CI; [#8](https://github.com/axmbo/sudoku-pwa/issues/8) gates pendentes do PR; [#9](https://github.com/axmbo/sudoku-pwa/issues/9) filtros do `ci.yml` e CodeQL; [#10](https://github.com/axmbo/sudoku-pwa/issues/10) CSP; [#11](https://github.com/axmbo/sudoku-pwa/issues/11) lint do domínio; [#12](https://github.com/axmbo/sudoku-pwa/issues/12) hooks; [#3](https://github.com/axmbo/sudoku-pwa/issues/3) congelar `ALL_UNITS`/`unitCells`/`CellConflict`; [#4](https://github.com/axmbo/sudoku-pwa/issues/4) texto da `tasks.md` da 001; [#17](https://github.com/axmbo/sudoku-pwa/issues/17) cache incremental do Stryker no CI (rótulo `débito`).

Riscos aceitos, sem ação: `verify-tag.sh` e `release.yml` vêm do commit da tag (22/11/2026); `npm audit` com 5 moderadas em dev, gate `high`; `Stryker disable` em `digit.ts:3` e `isCoordinate`.
