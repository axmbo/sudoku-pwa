---
name: implementar
description: Executa uma tarefa de tasks.md em TDD — eng-testes (vermelho) depois dev (verde e refatoração) — e atualiza estado e métricas.
argument-hint: <NNN> <TXX>
disable-model-invocation: true
---

# /implementar $ARGUMENTS

Pré-requisito: análise de consistência `ok` em `tasks.md`.

1. Leia só a tarefa em `tasks.md`. Passe o **manifesto** dela a cada agente, nunca o conteúdo.
2. Tarefa com `tdd: sim`:
   1. `eng-testes` escreve o(s) teste(s), confirma a falha certa (`PROCESSO.md` §6, "Motivo do vermelho"), commita `test(...)`.
   2. `dev` implementa até o verde, commita; refatora se houver o que melhorar.
   3. **Um contexto por agente por tarefa (M-004).** Abra a `eng-testes` e o `dev` uma vez cada; mande os vermelhos e GREENs seguintes da mesma tarefa por `SendMessage` ao agente já aberto. Agente novo só ao trocar de tarefa (cada spawn custa ~40k tokens de cache).
3. Tarefa isenta (a isenção precisa estar declarada em `tasks.md`): se o entregável é teste (teste de invariante sobre estado existente), só a `eng-testes`, porque o hook do `dev` bloqueia teste; nas demais isenções (build/CI, visual, código gerado), só o `dev`.
4. `npm run check` verde antes de seguir (gate de máquina).
5. `curador-pdca`: real de tokens e minutos em `metrics.csv` (inclui `leituras_fora_manifesto`), `docs/estado.md` atualizado, `notas.md` se houve descoberta.
6. Commit do estado; sugira `/clear` + `/retomar` antes da próxima tarefa.
7. Última tarefa concluída: próximo é `/revisar NNN`.
