# Notas 004 — Estado de jogo

Decisões e descobertas durante a execução. Curto: uma linha por item, com data e tarefa. O `curador-pdca` resume no `RESUMO.md` ao fechar.

- 24/11 · T01 · `flattenGrid` passou a ser exportada de `src/domain/board.ts` (fora da lista de arquivos da tarefa) para `createPuzzle` validar a forma; aprovado pelo Diretor em 24/11/2026.
- 24/11 · T01 · O `dev` adicionou em `createGame` a propagação da recusa de `createPuzzle` sem teste pedindo (branches caíram a 98,79%); coberta depois via 7a no commit 6083d87. Lição: o GREEN não cria branch sem teste.
- 24/11 · T01 · Mutantes sobreviventes em `canUndo`/`canRedo` (só a partida nova os cobria) foram mortos no commit 51b359e, nascido verde num `test` isolado pela via 7b (precedente 206ba3e da 001), com `Game` montado à mão. A T01 é `tdd: sim` e não declarava isso. Ajuste possível no template de tasks: prever a via 7b para mutantes quando o estado ainda não é alcançável pela API.
- 24/11 · T01 · `createPuzzle` valida `input` não objeto e forma 9x9 de `Digit | null`; `null` na solution é `invalid-solution`, não `malformed-puzzle`.
- 24/11 · T01 · A assinatura `toggleNote(notes, digit)`/`emptyNotes` foi assumida pela eng-testes e conferida com o plano.
- 24/11 · T01 · O Diretor aceitou o commit 51b359e pela via 7b (24/11/2026); melhoria registrada como M-010 (candidata).
- 24/11 · T02 · A fixture `__arbitraries__/puzzle.ts` só tem vazias na diagonal (r,r) e em (2,7); dois testes usavam (7,2), que é pista, como vazia. O `dev` notou no GREEN de `cell-is-given`, descartou a produção e devolveu à `eng-testes` (correção em 26410a0). Lição: fixture com poucas vazias pede comentário no próprio arquivo listando as células vazias.
- 24/11 · T02 · `isCoordinate` foi exportada de `board.ts` e o predicado passou de `n is number` para `n is Index`, fora da lista de arquivos (faf1a17); aprovado pelo Diretor em 24/11/2026.
- 24/11 · T02 · Via 7b usada de novo: itens 7 e 8 (CA-004-06 e precedência, nascidos verdes, 83567b9) e 3 testes que mataram mutantes (c1547f7); um deles monta à mão o estado pós-desfazer, a trocar por `gameUndo` na T04. O CA-004-04 monta o `Game` com `placeValue`, helper provisório até `gamePlace` (T03). Reforça a M-010.
- 24/11 · T02 · TS7006 em cascata no primeiro vermelho barrou o pre-commit de novo; a `eng-testes` tipou à mão. Reforça a M-002.
- 24/11 · T02 · Os `it.each` de CA-004-05 passam as entradas com `as never`: não falhariam se a assinatura continuasse estreita, e a troca para `unknown` veio por instrução, não por teste. Candidato a minor na revisão.
- 24/11 · T02 · O REFACTOR (46859de) alargou `col` de `gameClearNotes` para `unknown`, que tinha ficado para trás no GREEN.
- 24/11 · T03 · A `eng-testes` errou a contagem absoluta do histórico no CA-004-08 (3 entradas num arranjo de 3 toggles mais o place, que dão 4); o `dev` pegou no GREEN, desfez a produção com `git checkout` e devolveu (correção em d4a3943). Lição: contagem relativa (`before + 1`, como no CA-004-10) em arranjo com várias jogadas.
- 24/11 · T03 · Sem `gameUndo`, os testes montam o refazível à mão (`{...game, cursor: 0}`, via 7b); só é verificado de verdade na T04 e na T06. Nova ocorrência de M-010.
- 24/11 · T03 · No CA-004-10 a fixture não tinha vizinho de bloco vazio, e o teste esvazia (0,6) nas pistas. Reforça o comentário de células vazias na fixture (nota da T02).
- 24/11 · T03 · `history.ts` não mudou: os tipos `place`/`erase`/`CellMemo` já existiam. Real pelo log 85,1k (eng-testes 47,8k, dev 37,3k) contra 154k prováveis (0,55x); avisos de uso (39,9k e 35,6k) ficam abaixo do log.
- 24/11 · T04 · `redo` reaplica a jogada (via `placeValue`/`eraseValue`/`toggleNote`/limpar anotações); o histórico guarda só `before`, sem `after`.
- 24/11 · T04 · M-010 de outro tipo: o RED não pediu refazer de cada tipo de jogada (só desfazer, CA-004-17); a lacuna só apareceu no Stryker (3 sobreviventes e 1 NoCoverage no `redo` de `history.ts`) e exigiu a via 7b (01276a9). Candidata a reforçar "Testes esperados" com refazer por tipo. O M-010 original (refazível montado à mão) não ocorreu: a API alcançou tudo.
- 24/11 · T04 · A `eng-testes` incluiu teste de CA-004-18 fora da lista da T04; aceito pelo orquestrador, está no escopo do CA.
- 24/11 · T04 · Real pelo log 88,9k (eng-testes 55,4k, dev 33,5k) contra 196k prováveis (0,45x); 3 min de relógio contra 45; Stryker `history.ts` 90,24% para 100%, `game.ts` 100%; 507 testes, branches 100%.
