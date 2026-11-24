# Estado do projeto

> Snapshot vivo para retomada. Máximo de 40 linhas. Só estado; regras ficam em `CLAUDE.md` e `PROCESSO.md`.

- **Fase:** 1 (domínio e primeira UI), na branch `feat/001-tabuleiro-conflitos`. Fase 0 encerrada com o merge do [PR #1](https://github.com/axmbo/sudoku-pwa/pull/1) em 23/11/2026 (`8b5b40e`). Regras vivas: `PROCESSO.md` v0.4.
- **Passos 0 a 4 concluídos** (Node 26.13.1 via `.nvmrc`, ADRs 0001–0006, estrutura do processo). **Passo 5 (esqueleto) concluído:** tarefas em [passo-5-tarefas.md](process/passo-5-tarefas.md); `check` verde (100 testes, cobertura e Stryker 100% no domínio), E2E + axe verde. Revisão: r1 não saiu (2 major, 3 minor, corrigidos; `PROCESSO.md` v0.2), [r2](process/revisoes/passo-5-r2.md) sai (2 minor, débito abaixo). Tokens: 558k (1,4× o pessimista), ver `metrics.csv`.
- **Passo 6 (assinatura) concluído:** [runbook](runbooks/assinatura.md) etapas 1–6 feitas (chave de commit em software, chave de tag `ed25519-sk` na Thetis com backup cifrado no Drive, `allowed_signers`, repo público `axmbo/sudoku-pwa`, Signing Keys cadastradas, commits "Verified"). Etapa 7: `release.yml` recusa tag sem assinatura no remoto (provado em 22/11/2026, tag apagada); tag assinada com a Thetis passa (provado em 23/11/2026, tag apagada).
- **Passo 7 concluído:** [plano da Fase 1](process/plano-fase-1.md) (specs 001–005 = B-01 a B-05; B-06 a B-10 na Fase 2, aprovado em 22/11/2026) e [spec 001](../specs/001-tabuleiro-conflitos/spec.md) aprovada (25 CA; o CA-001-25 entrou na revisão do PR #1). A spec 001 nasceu na `chore/fase-0`; o ciclo dela (`/planejar 001`) abre a `feat/001-tabuleiro-conflitos` na Fase 1. Tokens: 113k (1,13× o provável), ver `metrics.csv`.
- **Passos 8 e 9 concluídos (22/11/2026):** sobrevivência aprovada (54k tokens, 1,34×); a Fase 0 somou 1,73M tokens, 1,75× o provável de 990k.
- **Spec 001 planejada (23/11/2026):** [plan.md](../specs/001-tabuleiro-conflitos/plan.md) e [tasks.md](../specs/001-tabuleiro-conflitos/tasks.md) com 7 tarefas (T01–T07, T07 isenta por invariante), 25 de 25 CA cobertos, manifestos de 5,5k a 12k tokens; [ADR 0007](adr/0007-convencoes-do-dominio.md) aceito (Result, `unknown` na fronteira, índices 0–8, imutabilidade). Estimativa: 670k tokens prováveis, reestimada em 23/11 para ~1,05M (T03–T07 ×2, decisão do Diretor), ver `metrics.csv`.
- **Análise de consistência da 001: ok (23/11/2026)** na rodada 3. M1 (vermelhos que nasceriam verdes) foi tratado no `tasks.md`. M2 (vermelho por símbolo inexistente) virou a regra "Motivo do vermelho" do `PROCESSO.md` v0.4. Nit N6 e os itens finais do `tasks.md` seguem como débito (abaixo).
- **T01 a T05 concluídas (23/11/2026):** 133, 176, 228, 240 e 258 testes; `check` verde e Stryker 100% no projeto. Real (log jsonl) contra o provável: T01 1,78×, T02 2,57×, T03 0,56×, T04 0,76×, T05 0,54×; M-001 a M-003 e M-004 (SendMessage, 3 amostras a favor) em [melhorias.md](process/melhorias.md). `Stryker disable` justificado em `digit.ts` ([notas.md](../specs/001-tabuleiro-conflitos/notas.md)). Ver `metrics.csv`.
- **T06 concluída (23/11/2026, 22:04 a 22:11 BRT):** 3 vermelhos (`139ee63`, `2bdb25c`, `bcb28ac`) e 3 GREENs (`f074cd7`, `72dae3e`, `146f5d4`), sem REFACTOR; `cell-is-given`, `invalid-value`, `cell-not-found` e precedência (CA-07, 08, 16, 20, 21, 24, 25). `check` verde (369 testes, cobertura 100%); Stryker 100% (`board.ts`: 127 mortos, 0 sobreviventes). Tokens dos subagentes (log jsonl): 211,0k = 1,05× o provável de 200k (eng-testes 140,0k = 1,17×; dev 70,9k = 0,89×; harness 213,3k). 0 leituras fora do manifesto. Spawn por ciclo (6 agentes, sem SendMessage): contra-amostra de M-004. `row`/`col` seguem `number`; `isCoordinate(unknown)` valida em runtime. `board.test.ts` tem 32,9 KB (~8,2k tokens), acima do limiar de ~7k.
- **Próximo:** `/clear` + `/retomar`, depois `/implementar 001 T07`. A T07 não lê `board.test.ts` (manifesto: `board.ts`, `board.prop.test.ts`, `digit.*`, `__arbitraries__/grid.ts`), então o tamanho não a afeta. Recomendação (decisão do Diretor): quem for ler `board.test.ts` (revisão do ciclo, retro) lê só os `describe` relevantes; dividir o arquivo por operação (`placeValue`, `eraseValue`, criação) fica como tarefa futura, antes de crescer de novo.
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
