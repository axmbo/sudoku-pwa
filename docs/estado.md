# Estado do projeto

> Snapshot vivo para retomada. Máximo de 40 linhas. Só estado; regras ficam em `CLAUDE.md` e `PROCESSO.md`.

- **Fase:** 0 (bootstrap do processo), na branch `chore/fase-0`. Regras vivas: `PROCESSO.md` v0.2.
- **Passos 0 a 4 concluídos:** Node 26.13.1 via `.nvmrc`; ADR 0006 (GitHub + Renovate, rebase merge); estrutura do processo (agentes, skills, ADRs 0001–0005 aceitos, docs).
- **Passo 5 (esqueleto), em revisão:** tarefas e isenções em [passo-5-tarefas.md](process/passo-5-tarefas.md). `npm run check` verde (100 testes, cobertura 100% do domínio), E2E + axe verde, Stryker 100%.
  - Revisão r1 ([parecer](process/revisoes/passo-5-r1.md)): 2 major e 3 minor corrigidos; Diretor aprovou `PROCESSO.md` v0.2 (minors 3 e 4).
  - **Próximo:** r2 do `revisor` só sobre o delta desde `784c61f`; depois, fechar o passo (rito abaixo) e `/clear`.
- **Validado no Claude Code:** hook `SessionStart` injeta o estado; hook do `dev` bloqueia edição de teste. A definição do agente é lida no início da sessão: **na próxima sessão, provar** que o script `guard-test-files.mjs` (não o jq antigo) bloqueia `src/domain/__arbitraries__/x.ts`.
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
- `npm audit`: 5 moderadas em dependências de dev (Stryker → minimatch; qs), sem correção disponível; o gate é `high`.
