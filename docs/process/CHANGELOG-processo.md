# CHANGELOG do processo

Toda mudança aprovada em regra (`PROCESSO.md`, `CLAUDE.md`, constituição, skills, agentes) entra aqui com versão. Mudanças vêm de candidatas aprovadas em [melhorias.md](melhorias.md).

## v0.7 — 24/11/2026

Pedido direto do Diretor depois da T05 da spec 004 ([M-011](melhorias.md)):

- `PROCESSO.md` §1, "Interação com o Diretor": pergunta só com os subagentes parados; só sobe decisão de Diretor (o detalhe com padrão sensato o Orquestrador decide e registra em `notas.md`); relatório gerencial com contexto, opções, recomendação e custo de desfazer; pergunta complexa uma por vez.
- Skill nova `/prosseguir`: depois do `/clear`, retoma e executa a etapa da linha **Próximo** do `estado.md`; para sem executar se houver divergência ou decisão do Diretor. `/retomar` continua para só ver o estado.
- Skill `gestao-contexto`: a linha **Próximo** traz um único comando de etapa. Skills `implementar` e `analisar` sugerem `/clear` + `/prosseguir`. `CLAUDE.md` e `PROCESSO.md` §4 e §5 apontam para o novo fluxo.
- Skills `especificar`, `planejar`, `revisar` e `retro` gravam a etapa seguinte na linha **Próximo** do `estado.md` e sugerem `/clear` + `/prosseguir`; `conferencia-claude-code.md` registra por que o `/prosseguir` lê o `SKILL.md` da etapa em vez de invocá-la (correções da revisão r1 do PR #15).

## v0.6 — 24/11/2026

Aprovado pelo Diretor na `/retro 001` ([ciclo-01](retro/ciclo-01.md); candidatas em [melhorias.md](melhorias.md)):

- M-003 (ampliada), agente `eng-testes`: retorno e corpo do commit de teste com `total N / falham F / passam P` e a falha do vermelho colada (3 de 7 tarefas ficaram sem).
- M-005, `PROCESSO.md` §6: a lista fechada ganha "mudança só de contrato de tipo, com comportamento já coberto"; a regra do v0.3 (isenção só por tarefa) ganha essa única exceção pontual. O `tsc-red-filter` não muda.
- M-006, skill `implementar`: antes de propor exceção a regra, buscar em `PROCESSO.md` e no CHANGELOG e citar a regra conflitante.
- M-007, skill `revisar` (passo 6): `estado.md` atualizado antes de abrir o PR.
- M-008, `metricas.md`: `testes_novos` = delta de testes do projeto na tarefa; o agente `eng-testes` aponta para lá.
- M-009 (a), skill `gestao-contexto`: o manifesto lista os contratos importados com linhas.

## v0.5 — 23/11/2026

Aprovado pelo Diretor ao fechar a T06 da spec 001 ([M-004](melhorias.md)):

- Skill `implementar`, passo 2.3: um contexto por agente por tarefa. A `eng-testes` e o `dev` abrem uma vez cada e recebem os vermelhos e GREENs seguintes da mesma tarefa por `SendMessage`. Três amostras com a regra (T03–T05) fecharam entre 0,54× e 0,76× do provável; a T06, em que o orquestrador não a seguiu, fechou em 1,05×.

## v0.4 — 23/11/2026

Aprovado pelo Diretor no vermelho (1) da T01 da spec 001, quando o pre-commit barrou o primeiro commit `test` de símbolo novo (TS2307 no import de `./units`):

- `PROCESSO.md` §6, "Motivo do vermelho", e §7, tabela de pipelines: num commit só de testes, o pre-commit roda o `tsc` e tolera apenas erro de símbolo inexistente (TS2305, TS2307, TS2339, TS2724); qualquer outro erro falha. O Diretor descartou duas alternativas: pular o `tsc` no RED, que deixaria passar erro de tipo real no teste, e `--no-verify` caso a caso.

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
