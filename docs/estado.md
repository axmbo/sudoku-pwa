# Estado do projeto

> Snapshot vivo para retomada. Máximo de 40 linhas. Só estado; regras ficam em `CLAUDE.md` e `PROCESSO.md`.

- **Fase:** 1 (domínio e primeira UI). Fase 0 encerrada no [PR #1](https://github.com/axmbo/sudoku-pwa/pull/1) (23/11/2026, `8b5b40e`; 1,73M tokens, 1,75× o provável). Regras vivas: `PROCESSO.md` v0.6.
- **Spec 001 concluída e arquivada (24/11/2026):** [PR #2](https://github.com/axmbo/sudoku-pwa/pull/2) mergeado; 25 CA, 390 testes, cobertura e Stryker 100% no domínio. Ponto de leitura: [RESUMO](../specs/_arquivo/001-tabuleiro-conflitos/RESUMO.md); detalhe em `specs/_arquivo/001-tabuleiro-conflitos/` ([notas](../specs/_arquivo/001-tabuleiro-conflitos/notas.md), `revisao-r1.md`, `revisao-r2.md`). [ADR 0007](adr/0007-convencoes-do-dominio.md) aceito.
- **Retro do ciclo 01 feita (24/11/2026):** [ciclo-01](process/retro/ciclo-01.md); real das 7 tarefas 836,9k de subagentes contra 900k prováveis (0,93×). Promovidas no v0.6 (24/11/2026): M-003, M-005 a M-008, M-009(a); candidatas: M-001, M-002, M-009(b), em [melhorias.md](process/melhorias.md). Ciclo 01 não é múltiplo de 3: sem revisão estrutural (próxima no ciclo 03).
- **Spec ativa: 004 aprovada (24/11/2026) e planejada**, branch `feat/004-estado-de-jogo`, issue [#14](https://github.com/axmbo/sudoku-pwa/issues/14): [spec](../specs/004-estado-de-jogo/spec.md) (33 CA), [plan](../specs/004-estado-de-jogo/plan.md), [tasks](../specs/004-estado-de-jogo/tasks.md) (8 tarefas, sem ADR novo). Âncora do ciclo reancorada para 1,25M provável (tarefas 940k).
- **Análise de consistência ok (24/11/2026):** r1 não ok (2 major), r2 ok; a spec aprovada recebeu ressalva "partida não vencida" em CA-004-11/16/17, derivada da decisão 3.
- **T01 da 004 concluída (24/11/2026):** `Puzzle`, `Notes`, `createGame` e leituras (`canUndo`, `canRedo`, `getGameConflicts`, `notesAt`); 446 testes, branches 100%, Stryker 100% em notes/puzzle/board/game. Real 157,3k de subagentes (eng-testes 97,7k, dev 59,6k) contra 110k prováveis (1,43×); ~14 min contra 35. Descobertas em [notas](../specs/004-estado-de-jogo/notas.md).
- **Próximo:** `/clear` + `/retomar`, depois `/implementar 004 T02`.
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

## Pendências do Diretor

1. Candidatas que seguem: M-001, M-002 e M-009(b) (reavaliar após a 004).
2. Proteção da `main` + regra de quem cria tags `v*` (adiada em 23/11/2026: "depois").

## Débitos

Issues `débito` no GitHub (24/11/2026): [#7](https://github.com/axmbo/sudoku-pwa/issues/7) ordem TDD no CI; [#8](https://github.com/axmbo/sudoku-pwa/issues/8) gates pendentes do PR; [#9](https://github.com/axmbo/sudoku-pwa/issues/9) filtros do `ci.yml` e CodeQL; [#10](https://github.com/axmbo/sudoku-pwa/issues/10) CSP; [#11](https://github.com/axmbo/sudoku-pwa/issues/11) lint do domínio; [#12](https://github.com/axmbo/sudoku-pwa/issues/12) hooks; [#3](https://github.com/axmbo/sudoku-pwa/issues/3) congelar `ALL_UNITS`/`unitCells`/`CellConflict`; [#4](https://github.com/axmbo/sudoku-pwa/issues/4) texto da `tasks.md` da 001.

Riscos aceitos, sem ação: `verify-tag.sh` e `release.yml` vêm do commit da tag (22/11/2026); `npm audit` com 5 moderadas em dev, gate `high`; `Stryker disable` em `digit.ts:3` e `isCoordinate`.
