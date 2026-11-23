# Estado do projeto

> Snapshot vivo para retomada. Máximo de 40 linhas. Só estado; regras ficam em `CLAUDE.md` e `PROCESSO.md`.

- **Fase:** 0 (bootstrap do processo), na branch `chore/fase-0`. Regras vivas: `PROCESSO.md` v0.2.
- **Passos 0 a 4 concluídos:** Node 26.13.1 via `.nvmrc`; ADR 0006 (GitHub + Renovate, rebase merge); estrutura do processo (agentes, skills, ADRs 0001–0005 aceitos, docs).
- **Passo 5 (esqueleto) concluído:** tarefas em [passo-5-tarefas.md](process/passo-5-tarefas.md); `check` verde (100 testes, cobertura e Stryker 100% no domínio), E2E + axe verde. Revisão: r1 não saiu (2 major, 3 minor, corrigidos; `PROCESSO.md` v0.2), [r2](process/revisoes/passo-5-r2.md) sai (2 minor, débito abaixo). Tokens: 558k (1,4× o pessimista), ver `metrics.csv`.
- **Passo 6 (assinatura) concluído, com ressalva:** [runbook](runbooks/assinatura.md) etapas 1–6 feitas (chave de commit em software, chave de tag `ed25519-sk` na Thetis com backup cifrado no Drive, `allowed_signers`, repo público `axmbo/sudoku-pwa`, Signing Keys cadastradas, commits "Verified"). Etapa 7: `release.yml` recusa tag sem assinatura no remoto (provado em 22/11/2026, tag apagada); a prova de que uma tag válida passa é débito pós-merge.
- **Passo 7 concluído:** [plano da Fase 1](process/plano-fase-1.md) (specs 001–005 = B-01 a B-05; B-06 a B-10 na Fase 2, aprovado em 22/11/2026) e [spec 001](../specs/001-tabuleiro-conflitos/spec.md) aprovada (25 CA; o CA-001-25 entrou na revisão do PR #1). A spec 001 nasceu na `chore/fase-0`; o ciclo dela (`/planejar 001`) abre a `feat/001-tabuleiro-conflitos` na Fase 1. Tokens: 113k (1,13× o provável), ver `metrics.csv`.
- **Passo 8 concluído:** depois de `/clear`, o `/retomar` recuperou só pelos arquivos o critério de saída da revisão, o orçamento de contexto e o próximo passo; o Diretor aprovou em 22/11/2026. Tokens: 54k (1,34× o provável), ver `metrics.csv`.
- **Passo 9 (resumo) entregue em 22/11/2026.** Fase 0 somou 1,73M tokens, 1,75× a estimativa provável de 990k e abaixo da pessimista de 1,9M.
- **Próximo:** Ciclo 1 aprovado em 22/11/2026. [PR #1](https://github.com/axmbo/sudoku-pwa/pull/1) da Fase 0 em revisão: a r1 não saiu (1 major, 3 minor, 1 nit, em correção). Depois do merge: provar no remoto que tag assinada passa, aplicar a proteção da `main` e das tags `v*` e rodar `/planejar 001`.
- **Validado no Claude Code:** hook `SessionStart` injeta o estado; o `guard-test-files.mjs` do `dev` bloqueia `src/domain/__arbitraries__/x.ts` (provado em 22/11/2026, numa sessão nova; o arquivo não foi criado).

## Decisões do Diretor (22/11/2026)

1. MVP: níveis, conflitos, anotações + undo/redo, timer + estatísticas, desafio diário. Dicas no pós-MVP.
2. UI Preact 11 (ADR 0003); persistência IndexedDB via `idb-keyval` (ADR 0004). Licença MIT.
3. nvm + `.nvmrc` com a versão exata; o CI usa `node-version-file`. Referência: Android modesto.
4. Subagentes em sonnet por padrão; opus só com justificativa. Código em inglês; UI e docs em pt-BR.
5. Desafio diário: um por nível por dia, pela data local (ADR 0005); exportar/importar JSON no pós-MVP.
6. Minors aceitos ficam como débito aqui até existir remoto no GitHub (aí viram issues `débito`).

## Rito da Fase 0

Ao fim de cada passo: commit, hash, resumo ≤ 5 linhas, o que conferir no diff, real de tokens do log jsonl (`docs/process/metricas.md`).

## Pendências do Diretor

1. Preparar já, como proposta, a proteção da `main` + regra de quem cria tags `v*`, para aplicar após o merge da Fase 0?

## Débitos e pendências técnicas (viram issues quando houver remoto)

- Fora do passo 5: ordem TDD no CI, cobertura do diff, orçamento de bundle/Worker, Lighthouse CI, matriz E2E no `full-ci`, release por tag.
- Proteção da `main` (passo 6): PR só de docs não dispara o `check`; se ele for obrigatório, o PR trava (r1, nit 6). Desligar o "default setup" do CodeQL; criar a label `full-ci`.
- CSP em `<meta>`: `frame-ancestors` não funciona; `style-src 'self'` barra `style` inline do Preact; testar a CSP quando houver estilo dinâmico (r1, nit 8).
- Lint do domínio deixa passar alias (`const a = Date; a.now()`), `globalThis.setTimeout`, `import()` dinâmico de `ui/`, `crypto.randomUUID`, `requestAnimationFrame` (r2, minor 1).
- Commits de T2, T3 e T6 sem o vermelho no corpo (anteriores à regra v0.2; evidência em `passo-5-tarefas.md`) (r2, minor 2). Lista de caminhos de teste duplicada entre `pre-commit.sh` e `guard-test-files.mjs` (r2, nit).
- Release: `verify-tag.sh` e `release.yml` vêm do commit da tag (podem ser alterados por ela); fecha com a regra das tags `v*` e o deploy dependendo do job (aceito em 22/11/2026). Prova positiva pós-merge: tag assinada com a Thetis passa no `release.yml`.
- `npm audit`: 5 moderadas em dependências de dev (Stryker → minimatch; qs), sem correção disponível; o gate é `high`.
