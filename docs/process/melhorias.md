# Melhorias candidatas do processo

Lições da retro viram candidatas aqui, escritas como diff de proposta. Só o Diretor aprova. Aprovada, a regra é promovida ao lugar mais barato que a garante (lint/teste/hook → skill → agente → `CLAUDE.md`) e registrada no [CHANGELOG-processo](CHANGELOG-processo.md). Procedimento: skill `pdca`.

Formato:

```
## M-NNN — <título> (ciclo NN, DD/MM/AAAA)
- Lição: ...
- Proposta (diff): ...
- Lugar de promoção: lint | teste | hook | skill <x> | agente <x> | CLAUDE.md
- Estado: candidata | aprovada em DD/MM (v0.N) | recusada (motivo)
```

## Candidatas

## M-001 — Typecheck do pre-commit ignora o que está fora do stage (ciclo 01, 23/11/2026)
- Lição: o `tsc` enxerga arquivos não rastreados e fora do stage; um vermelho guardado barrou outro commit e, no RED, um TS2339 em arquivo fora do stage passaria.
- Proposta (diff): `tsc-red-filter` / `pre-commit.sh` checam só os arquivos do stage (ou documentar a limitação na skill `tdd`).
- Lugar de promoção: hook
- Evidência do ciclo (retro 24/11/2026): sem nova ocorrência registrada em `notas.md` nas T02–T07; o `extra-pre-commit-v0.4` (63k) tratou só o vermelho de símbolo novo, não o stage. Amostra única.
- Estado: candidata (mantida pelo Diretor em 24/11/2026; sem recorrência)

## M-002 — Tolerar TS7006 no vermelho (ciclo 01, 23/11/2026)
- Lição: símbolo inexistente gera TS7006 em cascata; a `eng-testes` anotou o tipo à mão.
- Proposta (diff): incluir TS7006 na lista tolerada do `tsc-red-filter` ou documentar a anotação manual no agente `eng-testes`.
- Lugar de promoção: hook
- Evidência do ciclo (retro 24/11/2026): sem nova ocorrência em `notas.md` nas T02–T07. Amostra única.
- Estado: candidata (mantida pelo Diretor em 24/11/2026; sem recorrência)

## M-003 — Brief da eng-testes com contagens em formato fixo (ciclo 01, 23/11/2026)
- Lição: no vermelho 1 da T02 a mensagem de commit saiu com contagem confusa de testes (o orquestrador fez amend).
- Proposta (diff): o brief da `eng-testes` exige a linha `total N / falham F / passam P` no retorno e no corpo do commit de teste.
- Lugar de promoção: agente eng-testes
- Evidência do ciclo (retro 24/11/2026): o débito de `estado.md` aponta commits de T02, T03 e T06 sem o vermelho no corpo, então o problema de forma do commit de teste se repetiu em 3 de 7 tarefas. Reforça a M-003, com contagem ou vermelho no corpo.
- Estado: **promovida** em 24/11/2026 (v0.6) ao agente `eng-testes`, ampliada com a falha colada no corpo

## M-004 — Reaproveitar o contexto de eng-testes e dev entre vermelhos (ciclo 01, 23/11/2026)
- Lição: na T03 cada agente ficou num único contexto (SendMessage) por 5 vermelhos; tokens reais por vermelho da eng-testes: T01 21k, T02 41k, T03 12,8k; o dev gastou 9,5k por ciclo. T03 fechou em 0,56x o provável (111,8k contra 200k). Amostra de uma tarefa; confundida com o tamanho de cada vermelho.
- Proposta (diff): `/implementar` (skill) manda cada vermelho/GREEN seguinte da mesma tarefa por SendMessage ao agente já aberto; agente novo só ao trocar de tarefa.
- Lugar de promoção: skill `implementar`
- Estado: **promovida** à skill `implementar` (passo 2.3) pelo Diretor em 23/11/2026, após a T06; CHANGELOG-processo v0.5
- Segunda amostra (T04, 23/11/2026): mesmo padrão (spawn + 1 SendMessage por agente). Tokens reais (log jsonl, dedup por `message.id`): eng-testes 49,1k (24,6k por vermelho), dev 26,5k (13,2k por GREEN); total 75,6k = 0,76× o provável (100k). Sem leitura fora do manifesto. Dois vermelhos por tarefa diluem pouco o custo fixo do spawn, então o por-ciclo sobe contra a T03 (12,8k e 9,5k), mas segue abaixo do provável. Duas amostras abaixo do provável (0,56× e 0,76×), confundidas com o tamanho da tarefa. Recomendação: promover à skill `implementar`; decisão do Diretor.
- Terceira amostra (T05, 23/11/2026): mesmo padrão (spawn + 1 SendMessage por agente). Tokens reais (log jsonl, dedup por `message.id`): eng-testes 48,3k (24,2k por vermelho), dev 32,4k (16,2k por GREEN); total 80,7k = 0,54× o provável (150k). O harness reportou 44,4k e 33,5k (soma 78k): diverge do log em ~3%; vale o log. 5 leituras fora do manifesto (eng-testes 2, dev 3), contra 0 na T04. Três amostras abaixo do provável (0,56×, 0,76×, 0,54×); o por-ciclo sobe com o tamanho do arquivo de teste (`board.test.ts`). Recomendação inalterada: promover; decisão do Diretor.
- T06 (23/11/2026), **M-004 não aplicada** (falha do orquestrador, confirmada): 6 subagentes, um spawn por ciclo, sem SendMessage. Não é contra-amostra da melhoria; é amostra do custo de não segui-la. Tokens reais (log jsonl, dedup por `message.id`): eng-testes 140,0k (46,7k por vermelho; ~40k de cache write por spawn), dev 70,9k (23,6k por GREEN); total 211,0k = 1,05× o provável (200k), contra 0,54× a 0,76× nas três amostras com SendMessage. O harness reportou 213,3k (diverge ~1,1%; vale o log). Confundida com o tamanho da tarefa (3 ciclos, `board.test.ts` de ~8,2k tokens); o custo fixo de ~40k de cache write por spawn explica quase todo o excesso. Como a regra vivia só na memória do orquestrador, o Diretor aprovou promovê-la à skill.

## M-005 — Vermelho só de tipo não cabe no §6 (revisão r1 da spec 001, 24/11/2026)
- Lição: o R1-01 (assinaturas `number` → `unknown` em `placeValue`/`eraseValue`) só tem vermelho de tipo (TS2345), porque o comportamento em runtime já estava coberto. O pre-commit só tolera erros de símbolo inexistente, e a lista fechada de isenções não cobre mudança só de contrato. O Diretor autorizou exceção pontual: teste e produção num único commit `fix(domain)`, com o `tsc` vermelho no corpo.
- Proposta (diff): incluir na lista fechada do `PROCESSO.md` §6 "mudança só de contrato de tipo, com comportamento já coberto (vermelho do `tsc` colado no corpo do commit)"; não ampliar o `tsc-red-filter`, para não afrouxar o RED de todos os ciclos.
- Conflito: a exceção contraria a regra do [CHANGELOG-processo](CHANGELOG-processo.md) v0.3 ("isenção de TDD só por tarefa, nunca pontual dentro de tarefa `tdd: sim`"), confirmada pelo Diretor em 23/11/2026. O orquestrador não sinalizou o conflito ao propor a exceção; achado PR-04 da revisão do PR #2. O Diretor manteve a exceção em 24/11/2026.
- Lugar de promoção: `PROCESSO.md` §6 (e revisão da regra do v0.3)
- Evidência do ciclo (retro 24/11/2026): ocorrência única (R1-01), sem outra necessidade de vermelho só de tipo nas 7 tarefas; o custo do commit único foi baixo (correção R1-01 + R1-03: 68k de subagentes).
- Recomendação do curador: aprovar a classe "só contrato de tipo" no §6 e emendar a regra do v0.3 para "pontual só nessa classe, declarada em `notas.md`"; mantém a regra por tarefa para todo o resto.
- Estado: **promovida** em 24/11/2026 (v0.6) ao `PROCESSO.md` §6, com a emenda da regra do v0.3

## M-006 — Sinalizar conflito com regra existente ao propor exceção (ciclo 01, 24/11/2026)
- Lição: o orquestrador propôs a exceção do R1-01 sem avisar que contrariava a regra do v0.3; o conflito só apareceu na revisão do PR (PR-04).
- Proposta (diff): na skill `implementar`, passo de exceção: "antes de propor exceção a uma regra, grep em `PROCESSO.md` e `CHANGELOG-processo.md` pelo tema; se houver regra, cite-a na pergunta ao Diretor".
- Lugar de promoção: skill `implementar`
- Estado: **promovida** em 24/11/2026 (v0.6) à skill `implementar`

## M-007 — `estado.md` atrasado no PR (ciclo 01, 24/11/2026)
- Lição: o PR #2 foi aberto com `estado.md` ainda apontando `/revisar 001` como próximo, sem r1, r2 nem M-005 (PR-01).
- Proposta (diff): o checklist da skill `revisar` ganha "`estado.md` reflete o estado do PR (revisão, próximo passo)", e o `curador-pdca` o atualiza antes de abrir o PR.
- Lugar de promoção: skill `revisar`
- Estado: **promovida** em 24/11/2026 (v0.6) à skill `revisar`

## M-008 — `testes_novos` com definição única (ciclo 01, 24/11/2026)
- Lição: na T05 a coluna trouxe 10 (só o `placeValue`) quando o delta do projeto era 18 (240 para 258) (PR-02); a T02, a T04 e a T06 já usavam o delta.
- Proposta (diff): `metricas.md` define `testes_novos` = delta de testes do projeto na tarefa (`vitest` antes e depois), e o brief da `eng-testes` pede os dois totais.
- Lugar de promoção: `docs/process/metricas.md` (e agente `eng-testes`)
- Estado: **promovida** em 24/11/2026 (v0.6) a `metricas.md`

## M-009 — Calibrar estimativa de minutos e manifesto com contratos (ciclo 01, 24/11/2026)
- Lição: minutos de subagentes nas tarefas somam 59, mas só o log de tokens é confiável; o orquestrador mediu vazão ~1,04M tokens/h ativa (não reverificada). T05 teve 5 leituras fora do manifesto (`Result`, `units`, `conflicts`, `package.json`, `stryker.config.json`).
- Proposta (diff): na skill `pdca` (Estimar), `min_est` provável = tokens prováveis / vazão medida, com a vazão revista a cada ciclo; na skill `gestao-contexto`, manifesto de tarefa que usa `Result`/`Unit`/`CellConflict` inclui esses contratos por linhas.
- Lugar de promoção: skill `pdca` e skill `gestao-contexto`
- Estado: **promovida** em 24/11/2026 (v0.6) só a parte (a), à skill `gestao-contexto`; parte (b) (`min_est` pela vazão) segue candidata, uma amostra só, reavaliar após a 004

## M-011 — Interação com o Diretor e comando `/prosseguir` (ciclo 02, 24/11/2026)
- Lição: na T05 da 004, perguntas chegavam ao Diretor com subagentes ainda rodando (saída nova enquanto ele respondia) e em todos os níveis, inclusive detalhe de teste, sem contexto suficiente. Retomar exigia `/clear`, `/retomar` e saber qual era a próxima etapa.
- Proposta (diff): `PROCESSO.md` §1 ganha "Interação com o Diretor" (pergunta só com tudo parado; só decisão de Diretor sobe; relatório gerencial; complexa uma por vez). Skill nova `/prosseguir` executa a etapa da linha **Próximo** do `estado.md`, que passa a trazer um único comando. O `/clear` continua manual (a skill não o dispara).
- Lugar de promoção: `PROCESSO.md` §1 e §5; skill `prosseguir`; skills `retomar`, `implementar`, `analisar`, `gestao-contexto`; `CLAUDE.md` ("Ao começar").
- Estado: aprovada em 24/11/2026 (v0.7), por pedido direto do Diretor, fora de retro.
