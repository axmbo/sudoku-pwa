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
- Estado: candidata

## M-002 — Tolerar TS7006 no vermelho (ciclo 01, 23/11/2026)
- Lição: símbolo inexistente gera TS7006 em cascata; a `eng-testes` anotou o tipo à mão.
- Proposta (diff): incluir TS7006 na lista tolerada do `tsc-red-filter` ou documentar a anotação manual no agente `eng-testes`.
- Lugar de promoção: hook
- Estado: candidata

## M-003 — Brief da eng-testes com contagens em formato fixo (ciclo 01, 23/11/2026)
- Lição: no vermelho 1 da T02 a mensagem de commit saiu com contagem confusa de testes (o orquestrador fez amend).
- Proposta (diff): o brief da `eng-testes` exige a linha `total N / falham F / passam P` no retorno e no corpo do commit de teste.
- Lugar de promoção: agente eng-testes
- Estado: candidata

## M-004 — Reaproveitar o contexto de eng-testes e dev entre vermelhos (ciclo 01, 23/11/2026)
- Lição: na T03 cada agente ficou num único contexto (SendMessage) por 5 vermelhos; tokens reais por vermelho da eng-testes: T01 21k, T02 41k, T03 12,8k; o dev gastou 9,5k por ciclo. T03 fechou em 0,56x o provável (111,8k contra 200k). Amostra de uma tarefa; confundida com o tamanho de cada vermelho.
- Proposta (diff): `/implementar` (skill) manda cada vermelho/GREEN seguinte da mesma tarefa por SendMessage ao agente já aberto; agente novo só ao trocar de tarefa.
- Lugar de promoção: skill `implementar`
- Estado: aprovada pelo Diretor em 23/11/2026 para teste na T04; promover à skill `implementar` se o ganho se confirmar
- Segunda amostra (T04, 23/11/2026): mesmo padrão (spawn + 1 SendMessage por agente). Tokens reais (log jsonl, dedup por `message.id`): eng-testes 49,1k (24,6k por vermelho), dev 26,5k (13,2k por GREEN); total 75,6k = 0,76× o provável (100k). Sem leitura fora do manifesto. Dois vermelhos por tarefa diluem pouco o custo fixo do spawn, então o por-ciclo sobe contra a T03 (12,8k e 9,5k), mas segue abaixo do provável. Duas amostras abaixo do provável (0,56× e 0,76×), confundidas com o tamanho da tarefa. Recomendação: promover à skill `implementar`; decisão do Diretor.
- Terceira amostra (T05, 23/11/2026): mesmo padrão (spawn + 1 SendMessage por agente). Tokens reais (log jsonl, dedup por `message.id`): eng-testes 48,3k (24,2k por vermelho), dev 32,4k (16,2k por GREEN); total 80,7k = 0,54× o provável (150k). O harness reportou 44,4k e 33,5k (soma 78k): diverge do log em ~3%; vale o log. 5 leituras fora do manifesto (eng-testes 2, dev 3), contra 0 na T04. Três amostras abaixo do provável (0,56×, 0,76×, 0,54×); o por-ciclo sobe com o tamanho do arquivo de teste (`board.test.ts`). Recomendação inalterada: promover; decisão do Diretor.
- Quarta amostra, contra-amostra (T06, 23/11/2026): 6 subagentes com logs distintos (spawn por ciclo, sem SendMessage; confirmar com o orquestrador). Tokens reais (log jsonl, dedup por `message.id`): eng-testes 140,0k (46,7k por vermelho; ~40k de cache write por spawn), dev 70,9k (23,6k por GREEN); total 211,0k = 1,05× o provável (200k), contra 0,54× a 0,76× nas três amostras com SendMessage. O harness reportou 213,3k (diverge ~1,1%; vale o log). Confundida com o tamanho da tarefa (3 ciclos, `board.test.ts` de ~8,2k tokens); o custo fixo de ~40k de cache write por spawn explica quase todo o excesso. Reforça a promoção; decisão do Diretor.
