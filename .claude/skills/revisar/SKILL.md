---
name: revisar
description: Loop de revisão de um ciclo — npm run check, revisor no diff, qa-auditor se tocar UI/PWA — até o critério de saída.
argument-hint: <NNN> [rodada]
disable-model-invocation: true
---

# /revisar $ARGUMENTS

1. `npm run check`. Vermelho: volte ao `dev`, sem chamar LLM de revisão.
2. Acione o `revisor` com: base e head (`git merge-base main HEAD`..`HEAD`; na rodada N>1, só o delta da rodada anterior), a spec/plan/tasks ativos e os ADRs citados.
3. Se o ciclo tocou UI ou PWA, acione o `qa-auditor` em paralelo.
4. Grave os pareceres em `specs/NNN-*/revisao-rN.md` e `qa.md`.
5. **Critério de saída: 0 blocker, 0 major, ≤ 3 minor.** Não atingido: achados voltam ao dono (teste → `eng-testes`, código → `dev`) e nova rodada. Na 4ª rodada, pare e escale ao Diretor.
6. Saiu do loop: minors viram issues `débito` (com o Diretor), `docs/estado.md` atualizado (revisão, PR, próximo passo) antes de abrir o PR, PR aberto (skill `git-fluxo`), métricas da revisão em `metrics.csv`.
7. Próximo: `/retro NNN`.
