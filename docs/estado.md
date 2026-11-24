# Estado do projeto

> Snapshot vivo para retomada. Máximo de 40 linhas. Só estado; regras ficam em `CLAUDE.md` e `PROCESSO.md`.

- **Fase:** 1 (domínio e primeira UI). Fase 0 encerrada no [PR #1](https://github.com/axmbo/sudoku-pwa/pull/1) (23/11/2026, `8b5b40e`; 1,73M tokens, 1,75× o provável). Regras vivas: `PROCESSO.md` v0.6.
- **Spec 001 concluída e arquivada (24/11/2026):** [PR #2](https://github.com/axmbo/sudoku-pwa/pull/2) mergeado; 25 CA, 390 testes, cobertura e Stryker 100% no domínio. Ponto de leitura: [RESUMO](../specs/_arquivo/001-tabuleiro-conflitos/RESUMO.md); detalhe em `specs/_arquivo/001-tabuleiro-conflitos/` ([notas](../specs/_arquivo/001-tabuleiro-conflitos/notas.md), `revisao-r1.md`, `revisao-r2.md`). [ADR 0007](adr/0007-convencoes-do-dominio.md) aceito.
- **Retro do ciclo 01 feita (24/11/2026):** [ciclo-01](process/retro/ciclo-01.md); real das 7 tarefas 836,9k de subagentes contra 900k prováveis (0,93×). Promovidas no v0.6 (24/11/2026): M-003, M-005 a M-008, M-009(a); candidatas: M-001, M-002, M-009(b), em [melhorias.md](process/melhorias.md). Ciclo 01 não é múltiplo de 3: sem revisão estrutural (próxima no ciclo 03).
- **Próximo:** `/especificar 004`, seguida da 005 (primeiro rodável). Branch `docs/retro-001` aguarda commit e PR.
- **Validado no Claude Code:** hook `SessionStart` injeta o estado; o hook do `dev` bloqueia arquivo de teste (provado em 22/11/2026).

## Decisões do Diretor (22/11/2026 a 24/11/2026)

1. MVP: níveis, conflitos, anotações + undo/redo, timer + estatísticas, desafio diário. Dicas no pós-MVP.
2. UI Preact 11 (ADR 0003); persistência IndexedDB via `idb-keyval` (ADR 0004). Licença MIT.
3. nvm + `.nvmrc` com a versão exata; o CI usa `node-version-file`. Referência: Android modesto.
4. Subagentes em sonnet por padrão; opus só com justificativa. Código em inglês; UI e docs em pt-BR.
5. Desafio diário: um por nível por dia, pela data local (ADR 0005); exportar/importar JSON no pós-MVP.
6. Minors aceitos ficam como débito aqui até virarem issues `débito` no GitHub.
7. `board.test.ts` (~8,2k tokens) será dividido por operação antes de crescer, tarefa futura.
8. Depois da 001, segue 004 e depois 005 (primeiro rodável), com puzzle fixo até a 003; 002 e 003 depois (24/11/2026; [plano](process/plano-fase-1.md)).

## Pendências do Diretor

1. Candidatas de processo M-001 a M-009 (a M-005 inclui a regra do v0.3).
2. Proteção da `main` + regra de quem cria tags `v*` (adiada em 23/11/2026: "depois").

## Débitos

- Fora do passo 5: ordem TDD no CI, cobertura do diff, orçamento de bundle/Worker, Lighthouse CI, matriz E2E no `full-ci`, release por tag.
- Proteção da `main`: PR só de docs não dispara o `check`; lista de `.md` no filtro do `ci.yml` duplicada; CodeQL com "default setup"; label `full-ci`.
- CSP em `<meta>`: `frame-ancestors` não funciona; `style-src 'self'` barra `style` inline do Preact; testar com estilo dinâmico.
- Lint do domínio deixa passar alias, `globalThis.setTimeout`, `import()` dinâmico de `ui/`, `crypto.randomUUID`, `requestAnimationFrame`.
- `pre-commit.sh` quebra nomes com espaço (`-z`/`xargs -0`); lista de caminhos de teste duplicada entre `pre-commit.sh` e `guard-test-files.mjs`.
- Release: `verify-tag.sh` e `release.yml` vêm do commit da tag (aceito em 22/11/2026). `npm audit`: 5 moderadas em dev; o gate é `high`.
- Spec 001: issues [#3](https://github.com/axmbo/sudoku-pwa/issues/3) (congelar `ALL_UNITS`/`unitCells`/`CellConflict`) e [#4](https://github.com/axmbo/sudoku-pwa/issues/4) (texto da `tasks.md`). Aceitos sem ação: `Stryker disable` em `digit.ts:3` e `isCoordinate`.
