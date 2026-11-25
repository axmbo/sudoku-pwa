# Estado do projeto

> Snapshot vivo para retomada. Máximo de 40 linhas. Só estado; regras ficam em `CLAUDE.md` e `PROCESSO.md`.

- **Fase:** 1 (domínio e primeira UI). Fase 0 encerrada no [PR #1](https://github.com/axmbo/sudoku-pwa/pull/1) (23/11/2026, `8b5b40e`; 1,73M tokens, 1,75× o provável). Regras vivas: `PROCESSO.md` v0.6.
- **Spec 001 concluída e arquivada (24/11/2026):** [PR #2](https://github.com/axmbo/sudoku-pwa/pull/2) mergeado; 25 CA, 390 testes, cobertura e Stryker 100% no domínio. Ponto de leitura: [RESUMO](../specs/_arquivo/001-tabuleiro-conflitos/RESUMO.md); detalhe em `specs/_arquivo/001-tabuleiro-conflitos/` ([notas](../specs/_arquivo/001-tabuleiro-conflitos/notas.md), `revisao-r1.md`, `revisao-r2.md`). [ADR 0007](adr/0007-convencoes-do-dominio.md) aceito.
- **Retro do ciclo 01 feita (24/11/2026):** [ciclo-01](process/retro/ciclo-01.md); real das 7 tarefas 836,9k de subagentes contra 900k prováveis (0,93×). Promovidas no v0.6 (24/11/2026): M-003, M-005 a M-008, M-009(a); candidatas: M-001, M-002, M-009(b), em [melhorias.md](process/melhorias.md). Ciclo 01 não é múltiplo de 3: sem revisão estrutural (próxima no ciclo 03).
- **Spec ativa: 004 aprovada (24/11/2026) e planejada**, branch `feat/004-estado-de-jogo`, issue [#14](https://github.com/axmbo/sudoku-pwa/issues/14): [spec](../specs/004-estado-de-jogo/spec.md) (33 CA), [plan](../specs/004-estado-de-jogo/plan.md), [tasks](../specs/004-estado-de-jogo/tasks.md) (8 tarefas, sem ADR novo). Âncora do ciclo: 1,62M provável (reancorada em 24/11/2026 após T01 e T02; era 1,25M).
- **Análise de consistência ok (24/11/2026):** r1 não ok (2 major), r2 ok; a spec aprovada recebeu ressalva "partida não vencida" em CA-004-11/16/17, derivada da decisão 3.
- **T01 a T05 da 004 concluídas (24 e 25/11/2026):** T01: `Puzzle`, `Notes`, `createGame`; 157,3k contra 110k prováveis (1,43×). T02: anotações; 163,6k contra 120k (1,36×). T03: `gamePlace`/`gameErase`; 85,1k contra 154k (0,55×). T04: `gameUndo`/`gameRedo`; 88,9k contra 196k (0,45×). T05: `getGameStatus` e guard `game-over` nas seis operações; 530 testes, branches 146/146, Stryker 100% em `game.ts`; real pelo log 145,1k (eng-testes 89,5k, dev 55,6k) contra 140k prováveis (1,04×); 14 min contra 35; 20 commits após `06f277f`. Descobertas em [notas](../specs/004-estado-de-jogo/notas.md).
- **Próximo:** `/implementar 004 T06`, depois de o Diretor mergear o [PR #15](https://github.com/axmbo/sudoku-pwa/pull/15) (v0.7, `/prosseguir`) e esta branch ser rebaseada na `main`.
- **Validado no Claude Code:** hook `SessionStart` injeta o estado; o hook do `dev` bloqueia arquivo de teste (provado em 22/11/2026).

## Decisões do Diretor (22/11/2026 a 24/11/2026)

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

## Pendências do Diretor

1. Candidatas que seguem: M-001, M-002, M-009(b) e M-010 (7b no template de tasks); reavaliar após a 004. Ocorrências: T02 M-002 (TS7006 em cascata) e M-010 (via 7b em 3 pontos); T03 M-010 (refazível montado à mão: na T04 a API alcançou tudo, sem ocorrência, verificar na T06); T05: sem ocorrência de 7b; T04 M-010 de outro tipo (RED sem refazer por tipo, lacuna achada só no Stryker, via 7b; candidata: refazer por tipo em "Testes esperados").
2. Proteção da `main` + regra de quem cria tags `v*` (adiada em 23/11/2026: "depois").

## Débitos

Issues `débito` no GitHub (24/11/2026): [#7](https://github.com/axmbo/sudoku-pwa/issues/7) ordem TDD no CI; [#8](https://github.com/axmbo/sudoku-pwa/issues/8) gates pendentes do PR; [#9](https://github.com/axmbo/sudoku-pwa/issues/9) filtros do `ci.yml` e CodeQL; [#10](https://github.com/axmbo/sudoku-pwa/issues/10) CSP; [#11](https://github.com/axmbo/sudoku-pwa/issues/11) lint do domínio; [#12](https://github.com/axmbo/sudoku-pwa/issues/12) hooks; [#3](https://github.com/axmbo/sudoku-pwa/issues/3) congelar `ALL_UNITS`/`unitCells`/`CellConflict`; [#4](https://github.com/axmbo/sudoku-pwa/issues/4) texto da `tasks.md` da 001.

Riscos aceitos, sem ação: `verify-tag.sh` e `release.yml` vêm do commit da tag (22/11/2026); `npm audit` com 5 moderadas em dev, gate `high`; `Stryker disable` em `digit.ts:3` e `isCoordinate`.
