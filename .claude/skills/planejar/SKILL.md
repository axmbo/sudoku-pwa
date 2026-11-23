---
name: planejar
description: Gera plan.md e tasks.md (com manifestos e estimativas) de uma spec aprovada — arquiteto + eng-testes + curador-pdca.
argument-hint: <NNN>
disable-model-invocation: true
---

# /planejar $ARGUMENTS

Pré-requisito: `specs/$ARGUMENTS-*/spec.md` com status `aprovada`. Senão, pare.

1. Acione o `arquiteto` com ponteiros: a spec, os ADRs relevantes e `specs/_templates/{plan,tasks}.md`. Ele grava `plan.md` e o rascunho de `tasks.md`.
2. Acione a `eng-testes` para revisar a coluna de testes de cada tarefa (camada certa, propriedades por invariante).
3. Acione o `curador-pdca` para fechar os manifestos (orçamento de 15k tokens) e estimar cada tarefa × agente em `docs/process/metrics.csv`.
4. ADR novo `Proposto`: leve ao Diretor antes de seguir.
5. Atualize `docs/estado.md`; commit `docs(spec): planeja NNN`.
6. Próximo: `/analisar NNN`.
