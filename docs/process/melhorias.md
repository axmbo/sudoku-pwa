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
- Estado: candidata (confirmar na T04 antes de promover)
