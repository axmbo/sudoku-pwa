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
- Reavaliação (revisão estrutural do ciclo 03, 27/11/2026): nenhuma ocorrência nas 12 tarefas da 005a (27 tarefas sem recorrência em 3 ciclos; `notas.md` da 005a não cita stage fora do índice). **Recomendação: descartar**, conforme o critério fixado; reabre-se com uma ocorrência nova. Ver [estrutural-ciclo-03](revisoes/estrutural-ciclo-03.md).
- Estado: **descartada** em 27/11/2026 (Diretor, revisão estrutural do ciclo 03): sem ocorrência em 27 tarefas

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
- Estado: **promovida** em 24/11/2026 (v0.6) só a parte (a), à skill `gestao-contexto`; parte (b) (`min_est` pela vazão) **promovida** em 27/11/2026 (v0.10) à skill `pdca` (Estimar, passo 3), vazão 0,7M tokens/h
- Reavaliação (retro 25/11/2026, ciclo 02): vazão de `eng-testes` com tokens e minutos medidos na 004 (T01 a T08, relógio): 0,16M a 1,13M tokens/h, mediana ~0,67M (a informada de ~1,04M no ciclo 01 fica no topo); os minutos estimados (320) ficaram 2,6× acima dos 124,6 medidos, e 6 de 17 linhas têm `min_real` n/d. Dispersão de 7× não permite uma vazão única. **Recomendação: manter como candidata** (mantida pelo Diretor em 25/11/2026); reavaliar na revisão estrutural do ciclo 03, exigindo `min_real` em todas as linhas (hoje n/d demais) e, se promover, `min_est = tokens_est / 0,67M por hora` por agente, e não uma constante global.
- Reavaliação (revisão estrutural do ciclo 03, 27/11/2026): 005a tem `min_real` em todas as linhas de tarefa; vazão = 1,03M / 69,8 min = 0,88M tokens/h (004: 1,19M / 124,6 min = 0,57M/h); os minutos estimados (385) ficaram 5,5× acima dos medidos (004: 2,6×). A dispersão entre ciclos caiu a 1,5× (era 7× por linha). **Recomendação (aprovada em 27/11/2026, v0.10): promover (b)** com vazão única de 0,7M tokens/h, revista a cada ciclo, não por agente (a amostra por agente é pequena), e só depois de M-022 alinhar a definição de `min_real`. Alternativa: manter candidata mais um ciclo (custo: estimativa de minutos segue 3× a 5× alta).

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
- Estado: corrigida em `55c4efa` (timeout próprio de 30 s na CA-004-22, rodadas e seeds intactas; Diretor, 26/11/2026); issue [#23](https://github.com/axmbo/sudoku-pwa/issues/23) fecha com o merge do PR da 005a

## M-017 — Template de teste de propriedade já nasce com timeout próprio (005a T04, 26/11/2026)
- Lição: as 8 propriedades fast-check do `reducer` (UI) estouraram os 5 s no `npm run check` completo, mesmo defeito do #23 / `55c4efa`; o `dev` parou o GREEN, o orquestrador tirou o `reducer.ts`, a eng-testes ajustou o RED (`9dbd375`) e o `dev` recolocou o arquivo: uma rodada extra de cada um (T04 1,35x o provável).
- Proposta (diff): no template de propriedade (skill `tdd-ciclo` ou o exemplo do agente `eng-testes`), declarar `const PROP_TIMEOUT = 30_000` e passá-lo a toda propriedade já no RED. Sem regra nova de processo; M-016 corrige só a CA-004-22.
- Lugar de promoção: template/skill (o mais barato que garante); alternativa: teste estático que rejeite `fc.assert` sem timeout
- Estado: **promovida** em 26/11/2026 (v0.9) à skill `tdd-dominio` (seção property-based); o teste estático ficou de fora

## M-018 — Teste que depende de contagem no puzzle fixo deriva a contagem do `FIXED_PUZZLE` (005a T05, 26/11/2026)
- Lição: 2 testes de `sameValue` (CA-005-05) assumiram dois 5 no puzzle fixo, mas há três (o terceiro, dado em (1,5)); o `dev` pegou no GREEN, desfez a produção e voltou ao RED: uma rodada extra de eng-testes e dev (T05 fechou em 0,72x, mas a rodada custou ~1 passe de cada). Ocorrência única.
- Proposta (diff): em `eng-testes` ou na skill `tdd-dominio`/de UI, uma linha: "teste que depende de contagem ou posição no puzzle fixo calcula o valor a partir de `FIXED_PUZZLE` (ou confere no arquivo antes), nunca de memória".
- Lugar de promoção: skill de teste de UI ou agente `eng-testes`; alternativa: manifesto de testes de UI traz as contagens por dígito do puzzle fixo
- Reavaliação (ciclo 03, 27/11/2026): não repetiu de T06 a T12 (`notas.md`); ocorrência única em 12 tarefas. **Recomendação: descartar** (custo de manter é nulo, mas uma linha no agente `eng-testes`, 35 de 40, não se paga sem recorrência).
- Estado: **descartada** em 27/11/2026 (Diretor): ocorrência única

## M-019 — Inspeção visual do build antes da primeira revisão (ciclo 03, 27/11/2026)
- Lição: depois da r1 saída, a inspeção visual do Diretor achou defeitos de acabamento (teclado, "Apagar" a 200%, degrau de 1 px) que a revisão de código não pega: T11, T12, r2, r3 custaram 151,6k (8% do real de subagentes) e geraram #26 e #27. A r2 só achou os minors porque usou capturas (320, 390, 1280, 390-200).
- Proposta (diff): skill `revisar`, antes da r1 de spec com UI: o `qa-auditor` (ou o `dev` na T07) gera capturas do build em 320, 390, 1280 px e 390 px com texto a 200%, grava em `specs/NNN-*/capturas/` fora do git (ou no diretório de artefatos do CI) e o `revisor` as lê junto do diff. Alternativa B: tarefa de CSS (isenta de TDD) fecha com as mesmas capturas anexadas à `notas.md`. Alternativa C: nada (a inspeção segue com o Diretor).
- Prós/contras: A e B antecipam o defeito para uma rodada só (economia estimada de 1 a 2 revisões, 30k a 70k); custo ~10k a 15k de qa-auditor por ciclo de UI; C não custa nada e depende do Diretor. **Recomendação: B** (o mais barato: a T07 já existe e o E2E já abre o build; a captura é um passo do Playwright).
- Lugar de promoção: skill `revisar` (A) ou template de tasks para tarefa de CSS (B)
- Estado: **promovida** em 27/11/2026 (v0.10), alternativa B, à skill `qualidade-web` (seção "Tarefa de CSS/layout"): o lugar mais barato, pois o `dev` e o `qa-auditor` já a carregam e ela já trata zoom e acessibilidade

## M-020 — Checklist de manifesto para tarefa de UI (ciclo 03, 27/11/2026)
- Lição: `notas.md` da 005a registra leituras fora do manifesto repetidas: exports de `game.ts` (`getGameStatus`/`GameStatus`) em T04, T05 e T06; `vitest.config.ts` (projeto `ui`) e a convenção de seed em T01 e T02; CA com texto fixo na T03; seletores e ganchos na T08 (9 arquivos). A M-009(a) cobriu só `Result`/`Unit`/`CellConflict`.
- Proposta (diff): skill `gestao-contexto`, "Montar um manifesto": passo 2b "tarefa de UI inclui: assinaturas dos exports de `src/domain/game.ts` usados (por linhas), o projeto `ui` de `vitest.config.ts`, a convenção de seed, os CA de texto fixo e, para E2E/CSS, a lista de classes e ganchos da tarefa anterior".
- Prós/contras: três linhas na skill (42 de 80), corta ~2 a 3 leituras por tarefa de UI; risco: manifesto maior (+0,3k a 1k), ainda longe dos 15k. Alternativa: um manifesto-base de UI em `docs/process/` que os manifestos referenciam (mais um arquivo para manter). **Recomendação: as 3 linhas na skill.**
- Lugar de promoção: skill `gestao-contexto`
- Estado: **promovida** em 27/11/2026 (v0.10) à skill `gestao-contexto` (passo 2b)

## M-021 — Medir o orquestrador na retro (ciclo 03, 27/11/2026)
- Lição: nos 3 ciclos o orquestrador foi `n/d`, mas o log de topo existe. Medição do ciclo 03 (sessões de topo de 25/11 13:08Z a 27/11 19:30Z, dedup por `message.id`, modelo `claude-opus-5-5`): 1,86M tokens (in 928 + cache write 1.647.923 + out 213.991 = 1.862.842), contra 1,84M de todos os subagentes rastreados. É teto: a janela inclui a retro do ciclo 02 e o v0.8/v0.9. O custo do orquestrador é metade do ciclo e nunca entrou na âncora.
- Proposta (diff): skill `pdca`, "Coletar o real": passo "orquestrador: some as sessões de topo do intervalo do ciclo (jq da skill, um arquivo por sessão), em linha `orquestrador` de `metrics.csv`, com a ressalva de que a janela pode incluir trabalho fora da spec". Alternativa B: trocar o modelo do orquestrador para sonnet em ciclos de implementação (decisão do Diretor, custo menor, risco de pior coordenação); C: não medir.
- Prós/contras: A custa uma consulta `jq` por retro (~2k de tokens) e conserta a âncora; B é a maior alavanca de custo, mas sem dado de qualidade; C mantém o ponto cego. **Recomendação: A agora; B só depois de 2 ciclos medidos** (decisão sobre o modelo é do Diretor).
- Lugar de promoção: skill `pdca` e `metricas.md`
- Estado: **promovida** em 27/11/2026 (v0.10) à skill `pdca` (Coletar o real, passo 4) e à skill `retro`; troca de modelo do orquestrador só após 2 ciclos medidos, por decisão do Diretor

## M-022 — `min_real` com uma definição só (ciclo 03, 27/11/2026)
- Lição: `metricas.md` define `min_real` como relógio com a espera do Diretor; a 005a registrou o tempo de trabalho do subagente (duração da notificação ou do log), e a 004 misturou as duas formas. Sem definição única, a vazão da M-009(b) não é comparável.
- Proposta (diff): `metricas.md` (Tempo): "`min_real` = minutos de trabalho do subagente (duração do log ou da notificação), sem a espera do Diretor; espera e relógio vão em `obs`". Alternativa: manter o relógio e medir a espera à parte (o log não separa).
- Prós/contras: a primeira casa com `min_est` (trabalho, sem espera) e com a prática de 2 ciclos; a segunda exige dado que o log não dá. **Recomendação: a primeira**, antes de promover M-009(b).
- Lugar de promoção: `docs/process/metricas.md`
- Estado: **promovida** em 27/11/2026 (v0.10) a `docs/process/metricas.md` (definição única de `min_real`)

## M-023 — Teste estático de tamanho e de links dos arquivos de processo (ciclo 03, 27/11/2026)
- Lição: a higiene de tamanho (`wc -l`, `estado.md` já em 40 de 40) e a conferência de links relativos (o arquivamento da 005a exigiu corrigir `../../docs/` e `../005b-...` à mão) são checklist manual a cada retro. Nenhum teste em `tests/repo/` cobre isso.
- Proposta (diff): `tests/repo/processo.test.ts` (vitest, mesmo projeto de `readme-unico.test.ts`): `CLAUDE.md` ≤ 80, `estado.md` ≤ 40, corpo de agente ≤ 40, skill ≤ 80 linhas; e todo link markdown relativo em `docs/`, `specs/`, `.claude/` aponta para arquivo existente. Alternativa B: script no `npm run check`; C: manter manual.
- Prós/contras: A usa a infraestrutura que já roda no `check` e no CI, sem ferramenta nova (regra global de documentação); custo de escrever ~1 tarefa pequena (TDD aplica); risco: links com âncora e fora de `docs/` geram falso positivo, resolvido ignorando `#`. **Recomendação: A**, como item de backlog próprio, não nesta retro.
- Lugar de promoção: teste (`tests/repo/`)
- Estado: **aprovada em 27/11/2026, implementação pendente** (item de backlog próprio: [#28](https://github.com/axmbo/sudoku-pwa/issues/28))
