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
- Reavaliação (retro 25/11/2026, ciclo 02): nenhuma ocorrência nas 8 tarefas da 004 (15 tarefas sem recorrência). **Recomendação: manter até a revisão estrutural do ciclo 03 e descartar se seguir sem ocorrência** (regra de 5 ciclos sem uso; o custo de manter é nulo, o de implementar um hook por filtro de stage não se paga sem recorrência).
- Estado: candidata (mantida pelo Diretor em 24/11/2026 e em 25/11/2026). Critério: descartar na revisão estrutural do ciclo 03 se não houver ocorrência até lá

## M-002 — Tolerar TS7006 no vermelho (ciclo 01, 23/11/2026)
- Lição: símbolo inexistente gera TS7006 em cascata; a `eng-testes` anotou o tipo à mão.
- Proposta (diff): incluir TS7006 na lista tolerada do `tsc-red-filter` ou documentar a anotação manual no agente `eng-testes`.
- Lugar de promoção: hook
- Evidência do ciclo (retro 24/11/2026): sem nova ocorrência em `notas.md` nas T02–T07. Amostra única.
- Reavaliação (retro 25/11/2026, ciclo 02): reincidiu na T02 da 004 (TS7006 em cascata barrou o pre-commit; a `eng-testes` tipou à mão, `notas.md`); 2 ocorrências em 15 tarefas, ambas resolvidas com a anotação manual. **Recomendação: promover só a opção documental** (uma linha no agente `eng-testes`, que tem 33 linhas de limite 40: "TS7006 em cascata no vermelho de símbolo novo: tipe o parâmetro à mão"); não mexer no `tsc-red-filter`, para não afrouxar o RED.
- Estado: **promovida** em 25/11/2026 (v0.8), só a nota de uma linha no agente `eng-testes`; `tsc-red-filter` inalterado

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
- Reavaliação (retro 25/11/2026, ciclo 02): vazão de `eng-testes` com tokens e minutos medidos na 004 (T01 a T08, relógio): 0,16M a 1,13M tokens/h, mediana ~0,67M (a informada de ~1,04M no ciclo 01 fica no topo); os minutos estimados (320) ficaram 2,6× acima dos 124,6 medidos, e 6 de 17 linhas têm `min_real` n/d. Dispersão de 7× não permite uma vazão única. **Recomendação: manter como candidata** (mantida pelo Diretor em 25/11/2026); reavaliar na revisão estrutural do ciclo 03, exigindo `min_real` em todas as linhas (hoje n/d demais) e, se promover, `min_est = tokens_est / 0,67M por hora` por agente, e não uma constante global.

## M-010 — Prever a via 7b no template de tasks.md para mutantes (ciclo 02, 24/11/2026)
- Lição: na T01 da 004, mutantes sobreviventes em `canUndo`/`canRedo` só se mataram com `Game` montado à mão, num `test` isolado nascido verde (via 7b, commit 51b359e, aceito pelo Diretor em 24/11/2026); a tarefa era `tdd: sim` e não declarava isso. Origem: `specs/_arquivo/004-estado-de-jogo/notas.md`, descoberta 3.
- Proposta (diff): `specs/_templates/tasks.md` ganha, por tarefa, campo opcional "via 7b para mutantes: sim/não (estado ainda não alcançável pela API; `Game` montado à mão)".
- Lugar de promoção: `specs/_templates/tasks.md` (e `PROCESSO.md` §6 se citar a via)
- Reavaliação (retro 25/11/2026, ciclo 02): ocorrências em T01 (51b359e), T02 (3 pontos), T03 (refazível à mão), T04 (tipo diferente: refazer por tipo, achado só no Stryker); sem ocorrência em T05 a T08. 7a/7b continuam sem definição em `PROCESSO.md`, `.claude/skills/` e `.claude/agents/` (R1-02). **Recomendação: promover**, ampliada: campo "via 7b para mutantes" no template de tasks, mais "refazer por tipo de jogada" em "Testes esperados" quando houver desfazer/refazer, e a definição de 7a/7b no `PROCESSO.md` §6 (ver M-012, que a complementa).
- Estado: **promovida** em 25/11/2026 (v0.8), ampliada: campo 7b e "refazer por tipo" no template de tasks, definição de 7a/7b no `PROCESSO.md` §6 (com a M-012)

## M-011 — Interação com o Diretor e comando `/prosseguir` (ciclo 02, 24/11/2026)
- Lição: na T05 da 004, perguntas chegavam ao Diretor com subagentes ainda rodando (saída nova enquanto ele respondia) e em todos os níveis, inclusive detalhe de teste, sem contexto suficiente. Retomar exigia `/clear`, `/retomar` e saber qual era a próxima etapa.
- Proposta (diff): `PROCESSO.md` §1 ganha "Interação com o Diretor" (pergunta só com tudo parado; só decisão de Diretor sobe; relatório gerencial; complexa uma por vez). Skill nova `/prosseguir` executa a etapa da linha **Próximo** do `estado.md`, que passa a trazer um único comando. O `/clear` continua manual (a skill não o dispara).
- Lugar de promoção: `PROCESSO.md` §1 e §5; skill `prosseguir`; skills `retomar`, `implementar`, `analisar`, `gestao-contexto`; `CLAUDE.md` ("Ao começar").
- Estado: aprovada em 24/11/2026 (v0.7), por pedido direto do Diretor, fora de retro.

## M-012 — Definir 7a/7b e exigir vermelho antes de corrigir defeito (ciclo 02, 25/11/2026)
- Lição: na revisão r1 da 004, R1-01 (comportamento novo no commit `refactor` dc9708e, coberto só depois em ddac5f8) e R1-02 (commits `test` nascidos verdes em tarefas `tdd: sim`: e614b26, a8ea390, 63444ce, ddac5f8, rotulados "7a" sem a definição existir) eram major; o Diretor aceitou por escrito, sem reescrever histórico. O GREEN também adiantou ciclos seguintes (T07, T08). Origem: `specs/_arquivo/004-estado-de-jogo/notas.md`, revisão r1.
- Proposta (diff): `PROCESSO.md` §6 define 7a (commit `test` que falha pelo vizinho do que muda) e 7b (nasce verde: só para mutante/estado inalcançável, declarado em `tasks.md`); acrescenta "defeito achado no REFACTOR ou na revisão pede um vermelho antes, nunca comportamento novo em `refactor`" e "o GREEN não implementa o ciclo seguinte". A skill `tdd-dominio` aponta para o §6, sem copiar.
- Lugar de promoção: `PROCESSO.md` §6 (regra), skill `tdd-dominio` (ponteiro)
- Estado: **promovida** em 25/11/2026 (v0.8) ao `PROCESSO.md` §6; a skill `tdd-dominio` só aponta

## M-013 — Mutation completo antes do PR e propriedades sob Stryker (ciclo 02, 25/11/2026)
- Lição: o job `mutation` do PR #16 falhou 2 vezes (timeout de 5 s por teste sob `perTest`; 5ec38aa e d191a54) e travou a spec depois da revisão; o Stryker incremental relatou 2 sobreviventes e o completo 8 (cache incremental suspeito). A solução do Diretor (opção C) foi `vitest.stryker.config.ts` com timeout de 120 s e no máximo 10 rodadas por propriedade; rodada completa local 22 min, CI 17m44s. Custo em tokens n/d (orquestrador, sem log).
- Proposta (diff): skill `revisar` (ou `implementar`, último passo): "antes de abrir o PR, rode a mutação completa (`full-ci` ou local) no que mudou; o incremental só serve para iterar e não fecha tarefa". Skill `tdd-dominio`: propriedade nova roda sob a config do Stryker (limite de rodadas), e teste de tempo fica fora dela. Issue [#17](https://github.com/axmbo/sudoku-pwa/issues/17) cobre o cache incremental no CI.
- Lugar de promoção: skill `revisar` e skill `tdd-dominio`
- Estado: **promovida** em 25/11/2026 (v0.8) às skills `revisar` (passo 5) e `tdd-dominio`

## M-014 — Fixture e gerador alcançam os estados que o teste quer (ciclo 02, 25/11/2026)
- Lição: T02 e T03 usaram células "vazias" que eram pistas (fixture só com vazias na diagonal e em (2,7); o `dev` descartou a produção e devolveu à `eng-testes`, d4a3943 e 26410a0); na T06 o gerador quase não produzia estados com refazível e o mutante sobreviveu. Três ocorrências em 8 tarefas, todas descobertas só no GREEN ou no mutante.
- Proposta (diff): agente `eng-testes` (ou skill `tdd-dominio`): "fixture com poucas vazias lista as células vazias em comentário no arquivo; gerador de propriedade prova com mutante manual que alcança o estado coberto".
- Lugar de promoção: agente `eng-testes` (33 de 40 linhas) ou skill `tdd-dominio` (41 de 80)
- Estado: **promovida** em 25/11/2026 (v0.8) ao agente `eng-testes`

## M-015 — PR fecha a issue com palavra-chave que o GitHub reconhece (ciclo 02, 25/11/2026)
- Lição: o PR #16 trazia "Fecha #14" no corpo; o GitHub só reconhece palavras em inglês (`Closes`, `Fixes`, `Resolves`), então `closingIssuesReferences` ficou vazio e a issue #14 seguiu aberta após o merge (25/11/2026 10:08 BRT).
- Proposta (diff): skill `git-fluxo` (modelo do corpo do PR): "a linha de fechamento usa `Closes #N` (em inglês)"; conferir `closingIssuesReferences` ao abrir o PR.
- Lugar de promoção: skill `git-fluxo` (46 de 80 linhas)
- Estado: **promovida** em 25/11/2026 (v0.8) à skill `git-fluxo`

## M-016 — Propriedade da 004 estoura o timeout de 5 s sob carga (005a T02, 26/11/2026)
- Lição: `game.prop.test.ts` > "CA-004-22: won se e só se..." levou 5167 ms com a suíte inteira em paralelo (load average ~3,6) e falhou o gate; isolado leva ~1,2 s e a 2ª rodada passou. Teste instável por tempo trava o `npm run check` sem defeito real.
- Proposta (diff): dar `timeout` explícito (ex.: 15 s) ou reduzir `numRuns` nessa propriedade, em item de backlog próprio (não na tarefa da UI); avaliar issue `débito` para o Diretor. Sem regra nova no processo.
- Lugar de promoção: teste/config (`vitest.config.ts`), fora de skill e agente
- Estado: aprovada como débito [#23](https://github.com/axmbo/sudoku-pwa/issues/23) (Diretor, 26/11/2026)
