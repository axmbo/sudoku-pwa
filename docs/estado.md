# Estado do projeto

> Snapshot vivo para retomada. Máximo de 40 linhas. Só estado; regras ficam em `CLAUDE.md` e `PROCESSO.md`.

- **Fase:** 0 (bootstrap do processo), na branch `chore/fase-0`.
- **Plano aprovado:** [docs/process/plano-fase-0.md](process/plano-fase-0.md) (registro histórico; as regras vivas estão em `PROCESSO.md` v0.1).
- **Passos 0 a 3 concluídos:** Node 26.13.1 via `.nvmrc`; conferência do Claude Code; ADR 0006 aceito (GitHub + Renovate, rebase merge).
- **Passo 4 concluído (estrutura do processo):**
  - `CLAUDE.md`, `PROCESSO.md`, `docs/constituicao.md`, templates em `specs/_templates/`;
  - 8 agentes, 8 skills de atividade + 7 pontos de entrada, `.claude/settings.json` (deny + hook `SessionStart`);
  - ADRs 0001–0005 aceitos;
  - README, CONTRIBUTING, SECURITY, LICENSE, visão, backlog; `BOOTSTRAP.md` em `docs/historico/`.
- **Próximo:** passo 5, esqueleto (Vite + TS 6.0 strict + Preact 11 + Vitest + fast-check + Playwright + axe + Stryker no domínio; commitlint + pre-commit; workflows do GitHub; testes de README único e de versão do Node).
- **A validar no passo 5:** o hook `SessionStart` e o hook do `dev` rodando de verdade dentro do Claude Code (só simulados no shell até agora).
- **Depois:** passo 6 (assinatura), 7 (plano da Fase 1 + spec 001), 8 (teste de sobrevivência), 9 (resumo). `/clear` sugerido depois dos passos 5 e 7.

## Decisões do Diretor (22/11/2026)

1. MVP: níveis, conflitos, anotações + undo/redo, timer + estatísticas, desafio diário. Dicas no pós-MVP.
2. UI e (5) persistência: o arquiteto decide em ADR (propostos: Preact 11; IndexedDB via `idb-keyval`).
3. Licença MIT.
4. nvm + `.nvmrc` com a versão exata; o CI usa `node-version-file`.
6. Referência de dispositivo: Android modesto.
7. Subagentes em sonnet por padrão; opus só com justificativa.
8. Código em inglês; UI e documentação em pt-BR.

## Rito da Fase 0

Ao fim de cada passo: commit, hash, resumo ≤ 5 linhas, o que conferir no diff, real de tokens do log jsonl (`docs/process/metricas.md`).

## Pendências do Diretor

- Nenhuma.

## Decididos no passo 4 (já aplicados)

- ADRs 0001–0005 **Aceitos** após duas rodadas do `revisor` (r1: 3 major e 9 minor corrigidos; r2: sai).
- Desafio diário: um por nível por dia, pela data local (ADR 0005); exportar/importar JSON no pós-MVP.
- Hook do `dev` vira script Node testado em TDD no passo 5, falhando fechado (`PROCESSO.md` §6); até lá vale o comando jq atual.
- Primeira tarefa do passo 5: validar Stryker + Vitest 5 (plano B: command runner).
