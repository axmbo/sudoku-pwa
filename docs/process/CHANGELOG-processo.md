# CHANGELOG do processo

Toda mudança aprovada em regra (`PROCESSO.md`, `CLAUDE.md`, constituição, skills, agentes) entra aqui com versão. Mudanças vêm de candidatas aprovadas em [melhorias.md](melhorias.md).

## v0.3 — 23/11/2026

Aprovado pelo Diretor na análise de consistência da spec 001 (minor M2 da rodada 3):

- `PROCESSO.md` §6, "Motivo do vermelho": o teste falha por asserção. Única exceção: o primeiro teste de um símbolo novo pode falhar porque o símbolo não existe, e o corpo do commit declara isso e cola a falha. Não há stub antes do teste. O Diretor considerou e descartou duas alternativas: stub do `dev` num commit `chore` e stub da `eng-testes` no commit `test`. A skill `tdd-dominio`, o agente `eng-testes` e a skill `implementar` só apontam para o `PROCESSO.md`; o agente `dev` não precisa da regra e ficou como estava.
- Isenção de TDD só por tarefa, nunca pontual dentro de tarefa `tdd: sim`. Já é o que o `PROCESSO.md` §6 diz; o Diretor confirmou em 23/11/2026, e o `tasks.md` da 001 segue essa regra.

## v0.2 — 22/11/2026

Aprovado pelo Diretor após a revisão r1 do passo 5 da Fase 0 ([parecer](revisoes/passo-5-r1.md), minors 3 e 4):

- `PROCESSO.md` §6: a lista fechada de isenções de TDD ganha "teste de invariante sobre estado existente, sem código de produção novo", com o vermelho provado uma vez e descrito no corpo do commit.
- `PROCESSO.md` §6, guardrail 2: o hook do `dev` bloqueia também `*.snap`, `tests/`, `__arbitraries__/` e `__snapshots__/`, e falha fechado também se o `node` ou o script faltarem. Mudança em agente só vale em sessão nova.

## v0.1 — 22/11/2026

Versão inicial, derivada do `BOOTSTRAP.md` (agora em `docs/historico/`) com a contestação aprovada pelo Diretor ([plano-fase-0.md](plano-fase-0.md)):

- `curador-contexto` + `analista-pdca` fundidos em `curador-pdca`; 8 agentes.
- Todos os agentes em `sonnet` por padrão (`qa-auditor` em `haiku`); `opus` por tarefa com justificativa.
- `CLAUDE.md` ≤ 80 linhas; orçamento de contexto inicial de 15k tokens por subagente.
- 8 skills de atividade (`estimativa` + `pdca-retro` → `pdca`) e 7 pontos de entrada como skills (`/especificar`, `/planejar`, `/analisar`, `/implementar`, `/revisar`, `/retro`, `/retomar`), no lugar de `.claude/commands/`.
- Hook `SessionStart` injeta `docs/estado.md`; hook `PreToolUse` do `dev` bloqueia edição de testes.
- Lighthouse sem categoria PWA (checagens PWA próprias); 0 aprovações obrigatórias na `main`; rebase merge.
- Gerador determinístico por seed e versionado; avaliação de dificuldade por técnicas no MVP.
- `.claude/settings.json` nega toda a pasta `~/.ssh/**` (inclusive `*.pub`), `~/.gnupg/**` e `**/.env*`.
- SDD próprio (ADR 0002); GitHub + Renovate (ADR 0006).
