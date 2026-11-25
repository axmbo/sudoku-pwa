---
name: analisar
description: Análise de consistência spec × plan × tasks de uma spec, pelo revisor, antes de implementar.
argument-hint: <NNN>
disable-model-invocation: true
---

# /analisar $ARGUMENTS

1. Acione o `revisor` com ponteiros: `specs/$ARGUMENTS-*/{spec,plan,tasks}.md` e os ADRs citados no plano. Peça a análise de consistência da skill `sdd`.
2. Achados blocker/major: devolva ao dono (spec → `produto-ux`; plan/tasks → `arquiteto`) e rode de novo. Máximo de 3 rodadas.
3. Resultado `ok`: data no cabeçalho de `tasks.md`, `docs/estado.md` atualizado, commit `docs(spec): análise de consistência NNN`.
4. Grave `/implementar NNN T01` como **Próximo** no `estado.md` e sugira `/clear` + `/prosseguir`.
