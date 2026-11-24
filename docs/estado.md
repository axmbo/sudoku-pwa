# Estado do projeto

> Snapshot vivo para retomada. Máximo de 40 linhas. Só estado; regras ficam em `CLAUDE.md` e `PROCESSO.md`.

- **Fase:** 1 (domínio e primeira UI), na branch `feat/001-tabuleiro-conflitos`. Fase 0 encerrada com o merge do [PR #1](https://github.com/axmbo/sudoku-pwa/pull/1) em 23/11/2026 (`8b5b40e`). Regras vivas: `PROCESSO.md` v0.4.
- **Passos 0 a 4 concluídos** (Node 26.13.1 via `.nvmrc`, ADRs 0001–0006, estrutura do processo). **Passo 5 (esqueleto) concluído:** tarefas em [passo-5-tarefas.md](process/passo-5-tarefas.md); `check` verde (100 testes, cobertura e Stryker 100% no domínio), E2E + axe verde. Revisão: r1 não saiu (2 major, 3 minor, corrigidos; `PROCESSO.md` v0.2), [r2](process/revisoes/passo-5-r2.md) sai (2 minor, débito abaixo). Tokens: 558k (1,4× o pessimista), ver `metrics.csv`.
- **Passo 6 (assinatura) concluído:** [runbook](runbooks/assinatura.md) etapas 1–6 feitas (chave de commit em software, chave de tag `ed25519-sk` na Thetis com backup cifrado no Drive, `allowed_signers`, repo público `axmbo/sudoku-pwa`, Signing Keys cadastradas, commits "Verified"). Etapa 7: `release.yml` recusa tag sem assinatura no remoto (provado em 22/11/2026, tag apagada); tag assinada com a Thetis passa (provado em 23/11/2026, tag apagada).
- **Passo 7 concluído:** [plano da Fase 1](process/plano-fase-1.md) (specs 001–005 = B-01 a B-05; B-06 a B-10 na Fase 2, aprovado em 22/11/2026) e [spec 001](../specs/001-tabuleiro-conflitos/spec.md) aprovada (25 CA; o CA-001-25 entrou na revisão do PR #1). A spec 001 nasceu na `chore/fase-0`; o ciclo dela (`/planejar 001`) abre a `feat/001-tabuleiro-conflitos` na Fase 1. Tokens: 113k (1,13× o provável), ver `metrics.csv`.
- **Passos 8 e 9 concluídos (22/11/2026):** sobrevivência aprovada (54k tokens, 1,34×); a Fase 0 somou 1,73M tokens, 1,75× o provável de 990k.
- **Spec 001 planejada (23/11/2026):** [plan.md](../specs/001-tabuleiro-conflitos/plan.md) e [tasks.md](../specs/001-tabuleiro-conflitos/tasks.md) com 7 tarefas (T01–T07, T07 isenta por invariante), 25 de 25 CA cobertos, manifestos de 5,5k a 12k tokens; [ADR 0007](adr/0007-convencoes-do-dominio.md) aceito (Result, `unknown` na fronteira, índices 0–8, imutabilidade). Estimativa: 670k tokens prováveis, reestimada em 23/11 para ~1,05M (T03–T07 ×2, decisão do Diretor), ver `metrics.csv`.
- **Análise de consistência da 001: ok (23/11/2026)** na rodada 3. M1 (vermelhos que nasceriam verdes) foi tratado no `tasks.md`. M2 (vermelho por símbolo inexistente) virou a regra "Motivo do vermelho" do `PROCESSO.md` v0.4. Nit N6 e os itens finais do `tasks.md` seguem como débito (abaixo).
- **T01 e T02 concluídas (23/11/2026):** T01: 4 vermelhos, 4 GREENs, 1 REFACTOR, 133 testes, 133k tokens (1,78× o provável); M-001 e M-002. T02: 2 vermelhos e 2 GREENs, 176 testes; `digit.ts` 100% após `Stryker disable` justificado ([notas.md](../specs/001-tabuleiro-conflitos/notas.md)); 167k tokens (2,57×); M-003; casos `unknown` de `isDigit` na T07. Ver `metrics.csv`.
- **T03 e T04 concluídas (23/11/2026):** T03: 5 vermelhos, 5 GREENs, 1 REFACTOR (`a3844ed`), 228 testes, 112k tokens (0,56×); M-004 candidata. T04: 2 vermelhos e 2 GREENs, sem REFACTOR, 240 testes, 75,6k (0,76×), 0 leituras fora; M-004, 2ª amostra a favor. `check` verde e Stryker 100% nas duas. Ver `metrics.csv`.
- **T05 concluída (23/11/2026):** 2 vermelhos e 2 GREENs (`adf4dac`, `bc2c157`, `264199c`, `f5ef321`), sem REFACTOR; `check` verde (258 testes, cobertura 100%, branches 38/38); Stryker 100% no projeto (`board.ts`: 77 mortos, 0 sobreviventes). Tokens dos subagentes (log jsonl): 80,7k (0,54× o provável de 150k; o harness reportou 78k, a diferença é o log prevalecer); 5 leituras fora do manifesto (eng-testes 2, dev 3). M-004, 3ª amostra a favor. `placeValue`/`eraseValue` retornam `Result<Board, never>` provisório até a T06.
- **Próximo:** `/clear` + `/retomar`, depois `/implementar 001 T06`. `board.test.ts` tem 21 KB (~5,3k tokens), abaixo de ~7k: sem divisão em T06a/T06b por ora; reconferir ao abrir a T06.
- **Validado no Claude Code:** hook `SessionStart` injeta o estado; o hook do `dev` bloqueia arquivo de teste (provado em 22/11/2026).

## Decisões do Diretor (22/11/2026)

1. MVP: níveis, conflitos, anotações + undo/redo, timer + estatísticas, desafio diário. Dicas no pós-MVP.
2. UI Preact 11 (ADR 0003); persistência IndexedDB via `idb-keyval` (ADR 0004). Licença MIT.
3. nvm + `.nvmrc` com a versão exata; o CI usa `node-version-file`. Referência: Android modesto.
4. Subagentes em sonnet por padrão; opus só com justificativa. Código em inglês; UI e docs em pt-BR.
5. Desafio diário: um por nível por dia, pela data local (ADR 0005); exportar/importar JSON no pós-MVP.
6. Minors aceitos ficam como débito aqui até virarem issues `débito` no GitHub (remoto existe desde o passo 6).

## Pendências do Diretor

1. Preparar já, como proposta, a proteção da `main` + regra de quem cria tags `v*`, para aplicar após o merge da Fase 0? (adiada pelo Diretor em 23/11/2026: "depois")

## Débitos e pendências técnicas (viram issues quando houver remoto)

- Fora do passo 5: ordem TDD no CI, cobertura do diff, orçamento de bundle/Worker, Lighthouse CI, matriz E2E no `full-ci`, release por tag.
- Proteção da `main` (passo 6): PR só de docs não dispara o `check`; se ele for obrigatório, o PR trava (r1, nit 6). A lista de `.md` que alimentam testes no filtro do `ci.yml` é manual e duplicada (PR #1, r3, nit 2). Desligar o "default setup" do CodeQL; criar a label `full-ci`.
- CSP em `<meta>`: `frame-ancestors` não funciona; `style-src 'self'` barra `style` inline do Preact; testar a CSP quando houver estilo dinâmico (r1, nit 8).
- Lint do domínio deixa passar alias (`const a = Date; a.now()`), `globalThis.setTimeout`, `import()` dinâmico de `ui/`, `crypto.randomUUID`, `requestAnimationFrame` (r2, minor 1).
- Commits de T2, T3 e T6 sem o vermelho no corpo (anteriores à regra v0.2; evidência em `passo-5-tarefas.md`) (r2, minor 2). Lista de caminhos de teste duplicada entre `pre-commit.sh` e `guard-test-files.mjs` (r2, nit). O `pre-commit.sh` quebra nomes com espaço nos `xargs`; corrigir com `-z`/`xargs -0` e teste com `npx` falso (Copilot no PR #1).
- Release: `verify-tag.sh` e `release.yml` vêm do commit da tag (podem ser alterados por ela); fecha com a regra das tags `v*` e o deploy dependendo do job (aceito em 22/11/2026).
- `npm audit`: 5 moderadas em dependências de dev (Stryker → minimatch; qs), sem correção disponível; o gate é `high`.
- Spec 001, aceitos pelo Diretor em 23/11/2026: nit N6 (somas de manifesto T01–T04); T05, GREEN do vermelho 2 generaliza `placeValue` e cria `eraseValue` de uma vez; regra 9 repete parte da exceção; T02, "tende a generalizá-las" vaga. `Stryker disable` justificado em `digit.ts:3` (commit `4b2d657`, decisão do Diretor).; T03 (23/11): `ALL_UNITS`/`unitCells` sem `Object.freeze` em runtime (ADR 0007 pede estado congelado; aceito por serem constantes de módulo).
