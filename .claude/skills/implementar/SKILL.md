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
   1. `eng-testes` escreve o(s) teste(s), confirma a falha certa, commita `test(...)`.
   2. `dev` implementa até o verde, commita; refatora se houver o que melhorar.
3. Tarefa isenta: só o `dev`, e a isenção precisa estar declarada.
4. `npm run check` verde antes de seguir (gate de máquina).
5. `curador-pdca`: real de tokens e minutos em `metrics.csv` (inclui `leituras_fora_manifesto`), `docs/estado.md` atualizado, `notas.md` se houve descoberta.
6. Commit do estado; sugira `/clear` + `/retomar` antes da próxima tarefa.
7. Última tarefa concluída: próximo é `/revisar NNN`.
