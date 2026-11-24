# Estado do projeto

> Snapshot vivo para retomada. Máximo de 40 linhas. Só estado; regras ficam em `CLAUDE.md` e `PROCESSO.md`.

- **Fase:** 1 (domínio e primeira UI), na branch `feat/001-tabuleiro-conflitos`. Fase 0 encerrada com o merge do [PR #1](https://github.com/axmbo/sudoku-pwa/pull/1) em 23/11/2026 (`8b5b40e`). Regras vivas: `PROCESSO.md` v0.5.
- **Passos 0 a 9 concluídos** (Node, ADRs 0001–0006, processo, esqueleto, assinatura ([runbook](runbooks/assinatura.md): chave de tag `ed25519-sk` na Thetis, `release.yml` recusa tag sem assinatura), [plano da Fase 1](process/plano-fase-1.md), sobrevivência). A Fase 0 somou 1,73M tokens (1,75× o provável). Real por passo em `metrics.csv`.
- **Spec 001 planejada (23/11/2026):** [spec](../specs/001-tabuleiro-conflitos/spec.md), [plan.md](../specs/001-tabuleiro-conflitos/plan.md) e [tasks.md](../specs/001-tabuleiro-conflitos/tasks.md): 7 tarefas (T01–T07), 25 de 25 CA cobertos. [ADR 0007](adr/0007-convencoes-do-dominio.md) aceito. Estimativa reestimada em 23/11 para ~1,05M tokens (decisão do Diretor).
- **Spec 001 implementada, todas as 7 tarefas concluídas (23/11/2026):** `check` verde com 390 testes, cobertura 100% e Stryker 100% no domínio. T06 e T07 em `metrics.csv`; notas da execução em [notas.md](../specs/001-tabuleiro-conflitos/notas.md).
- **T07 (invariantes e propriedades, isenta de TDD):** 4 commits `test(domain)` (`0094691`, `4494ebc`, `855ff1c`, `c679816`), sem commit `dev` (nenhuma propriedade achou bug). Real do log: 83,5k tokens contra 110k prováveis (0,76×).
- **Tokens da 001 até a T07:** real de tarefas e agentes em `metrics.csv`; o harness reporta valores diferentes do log, e prevalece o log.
- **Revisão da spec 001 concluída (24/11/2026):** r1 (1 major, 2 minor, 1 nit) e r2 (sai). [PR #2](https://github.com/axmbo/sudoku-pwa/pull/2) mergeado pelo Diretor em 24/11/2026. Melhoria M-005 candidata para a `/retro 001`.
- **Próximo:** `/retro 001` (inclui a M-005); depois `/especificar 004`, seguida da 005 (primeiro rodável).
- **Validado no Claude Code:** hook `SessionStart` injeta o estado; o hook do `dev` bloqueia arquivo de teste (provado em 22/11/2026).

## Decisões do Diretor (22/11/2026 a 24/11/2026)

1. MVP: níveis, conflitos, anotações + undo/redo, timer + estatísticas, desafio diário. Dicas no pós-MVP.
2. UI Preact 11 (ADR 0003); persistência IndexedDB via `idb-keyval` (ADR 0004). Licença MIT.
3. nvm + `.nvmrc` com a versão exata; o CI usa `node-version-file`. Referência: Android modesto.
4. Subagentes em sonnet por padrão; opus só com justificativa. Código em inglês; UI e docs em pt-BR.
5. Desafio diário: um por nível por dia, pela data local (ADR 0005); exportar/importar JSON no pós-MVP.
6. Minors aceitos ficam como débito aqui até virarem issues `débito` no GitHub.
7. `board.test.ts` (~8,2k tokens) será dividido por operação antes de crescer, tarefa futura.
8. Depois da 001, segue 004 e depois 005 (primeiro rodável); 002 e 003 depois (24/11/2026). Puzzle fixo na 005 até o gerador: pendente.

## Pendências do Diretor

1. Puzzle fixo na 005 enquanto não há gerador (003).
2. Proteção da `main` + regra de quem cria tags `v*`, para aplicar após o merge da Fase 0 (adiada em 23/11/2026: "depois").

## Débitos (os de antes da spec 001 ainda viram issues)

- Fora do passo 5: ordem TDD no CI, cobertura do diff, orçamento de bundle/Worker, Lighthouse CI, matriz E2E no `full-ci`, release por tag.
- Proteção da `main`: PR só de docs não dispara o `check`; lista de `.md` no filtro do `ci.yml` duplicada; CodeQL com "default setup"; label `full-ci`.
- CSP em `<meta>`: `frame-ancestors` não funciona; `style-src 'self'` barra `style` inline do Preact; testar a CSP quando houver estilo dinâmico.
- Lint do domínio deixa passar alias, `globalThis.setTimeout`, `import()` dinâmico de `ui/`, `crypto.randomUUID`, `requestAnimationFrame`.
- Commits de T2, T3 e T6 sem o vermelho no corpo; `pre-commit.sh` quebra nomes com espaço (`-z`/`xargs -0`, teste com `npx` falso); lista de caminhos de teste duplicada entre `pre-commit.sh` e `guard-test-files.mjs`.
- Release: `verify-tag.sh` e `release.yml` vêm do commit da tag (aceito em 22/11/2026).
- `npm audit`: 5 moderadas em dependências de dev, sem correção; o gate é `high`.
- Spec 001: issues [#3](https://github.com/axmbo/sudoku-pwa/issues/3) (congelar `ALL_UNITS`/`unitCells`/`CellConflict`) e [#4](https://github.com/axmbo/sudoku-pwa/issues/4) (texto da `tasks.md`: `test:mut`, regra 9, T02, N6). Só registro, sem ação: `Stryker disable` em `digit.ts:3` e em `isCoordinate` (mutantes equivalentes, aceitos); T05, GREEN do vermelho 2 generaliza `placeValue` e cria `eraseValue` de uma vez.
