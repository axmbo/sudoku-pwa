# Estado do projeto

> Snapshot vivo para retomada. Máximo de 40 linhas. Só estado; regras ficam em `CLAUDE.md` e `PROCESSO.md`.

- **Fase:** 0 (bootstrap do processo), na branch `chore/fase-0`. Regras vivas: `PROCESSO.md` v0.2.
- **Passos 0 a 4 concluídos:** Node 26.13.1 via `.nvmrc`; ADR 0006 (GitHub + Renovate, rebase merge); estrutura do processo (agentes, skills, ADRs 0001–0005 aceitos, docs).
- **Passo 5 (esqueleto) concluído:** tarefas em [passo-5-tarefas.md](process/passo-5-tarefas.md); `check` verde (100 testes, cobertura e Stryker 100% no domínio), E2E + axe verde. Revisão: r1 não saiu (2 major, 3 minor, corrigidos; `PROCESSO.md` v0.2), [r2](process/revisoes/passo-5-r2.md) sai (2 minor, débito abaixo). Tokens: 558k (1,4× o pessimista), ver `metrics.csv`.
- **Próximo:** passo 6 (assinatura, com `devsecops`).
- **Validado no Claude Code:** hook `SessionStart` injeta o estado; o `guard-test-files.mjs` do `dev` bloqueia `src/domain/__arbitraries__/x.ts` (provado em 22/11/2026, numa sessão nova; o arquivo não foi criado).
- **Depois:** passo 6 (assinatura), 7 (plano da Fase 1 + spec 001), 8 (teste de sobrevivência), 9 (resumo). `/clear` sugerido depois dos passos 5 e 7.

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

- Nenhuma.

## Débitos e pendências técnicas (viram issues quando houver remoto)

- Fora do passo 5: ordem TDD no CI, cobertura do diff, orçamento de bundle/Worker, Lighthouse CI, matriz E2E no `full-ci`, release por tag.
- Proteção da `main` (passo 6): PR só de docs não dispara o `check`; se ele for obrigatório, o PR trava (r1, nit 6). Desligar o "default setup" do CodeQL; criar a label `full-ci`.
- CSP em `<meta>`: `frame-ancestors` não funciona; `style-src 'self'` barra `style` inline do Preact; testar a CSP quando houver estilo dinâmico (r1, nit 8).
- Lint do domínio deixa passar alias (`const a = Date; a.now()`), `globalThis.setTimeout`, `import()` dinâmico de `ui/`, `crypto.randomUUID`, `requestAnimationFrame` (r2, minor 1).
- Commits de T2, T3 e T6 sem o vermelho no corpo (anteriores à regra v0.2; evidência em `passo-5-tarefas.md`) (r2, minor 2). Lista de caminhos de teste duplicada entre `pre-commit.sh` e `guard-test-files.mjs` (r2, nit).
- `npm audit`: 5 moderadas em dependências de dev (Stryker → minimatch; qs), sem correção disponível; o gate é `high`.
