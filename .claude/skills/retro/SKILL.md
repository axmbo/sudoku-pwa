---
name: retro
description: Fecha o ciclo — curador-pdca consolida estimado × real, escreve a retro, propõe melhorias e arquiva a spec.
argument-hint: <NNN>
disable-model-invocation: true
---

# /retro $ARGUMENTS

1. Acione o `curador-pdca` (skills `pdca` e `gestao-contexto`) com: `docs/process/metrics.csv`, os pareceres de revisão do ciclo e `specs/NNN-*/notas.md`.
2. Ele grava `docs/process/retro/ciclo-NN.md` (≤ 10 linhas) e as candidatas `M-NNN` em `docs/process/melhorias.md`.
3. Leve ao Diretor as candidatas, numeradas. Aprovadas: promova ao lugar mais barato e registre no `CHANGELOG-processo.md`.
4. Ciclo múltiplo de 3: inclua a revisão estrutural da equipe (`PROCESSO.md` §9).
5. Spec mergeada: `RESUMO.md` e arquivamento em `specs/_arquivo/`.
6. `docs/estado.md` atualizado, com a etapa seguinte (em geral `/especificar NNN` da próxima spec do plano da fase) como **Próximo**; commit `docs(process): retro do ciclo NN`; sugira `/clear` + `/prosseguir`.
