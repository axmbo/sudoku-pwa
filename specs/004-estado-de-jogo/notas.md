# Notas 004 — Estado de jogo

Decisões e descobertas durante a execução. Curto: uma linha por item, com data e tarefa. O `curador-pdca` resume no `RESUMO.md` ao fechar.

- 24/11 · T01 · `flattenGrid` passou a ser exportada de `src/domain/board.ts` (fora da lista de arquivos da tarefa) para `createPuzzle` validar a forma; aprovado pelo Diretor em 24/11/2026.
- 24/11 · T01 · O `dev` adicionou em `createGame` a propagação da recusa de `createPuzzle` sem teste pedindo (branches caíram a 98,79%); coberta depois via 7a no commit 6083d87. Lição: o GREEN não cria branch sem teste.
- 24/11 · T01 · Mutantes sobreviventes em `canUndo`/`canRedo` (só a partida nova os cobria) foram mortos no commit 51b359e, nascido verde num `test` isolado pela via 7b (precedente 206ba3e da 001), com `Game` montado à mão. A T01 é `tdd: sim` e não declarava isso. Ajuste possível no template de tasks: prever a via 7b para mutantes quando o estado ainda não é alcançável pela API.
- 24/11 · T01 · `createPuzzle` valida `input` não objeto e forma 9x9 de `Digit | null`; `null` na solution é `invalid-solution`, não `malformed-puzzle`.
- 24/11 · T01 · A assinatura `toggleNote(notes, digit)`/`emptyNotes` foi assumida pela eng-testes e conferida com o plano.
- 24/11 · T01 · O Diretor aceitou o commit 51b359e pela via 7b (24/11/2026); melhoria registrada como M-010 (candidata).
