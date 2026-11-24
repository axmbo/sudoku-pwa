# Notas 001 — Tabuleiro e conflitos

Decisões e descobertas durante a execução. Curto: uma linha por item, com data e tarefa. O `curador-pdca` resume no `RESUMO.md` ao fechar.

- 23/11 · T01 · O pre-commit rodava `tsc` em todo commit e barrava o vermelho de símbolo novo → corrigido pelo `tsc-red-filter` (`PROCESSO.md` v0.4), que tolera TS2305/2307/2339/2724.
- 23/11 · T01 · O `tsc` do pre-commit enxerga arquivos não rastreados e fora do stage: um vermelho guardado no working tree barrou outro commit, e no RED um TS2339 em arquivo fora do stage também passaria → M-001.
- 23/11 · T01 · Erro em cascata do símbolo inexistente: TS7006 (`any` implícito); a `eng-testes` anotou o tipo do parâmetro à mão → M-002 (tolerar TS7006 ou documentar a anotação).
- 23/11 · T01 · `cellIndex` recebe `number`, não `Index`, porque o teste passa `number`.
- 23/11 · T01 · O `dev` criou `export type Digit` em `digit.ts`, fora da lista de arquivos da tarefa; o plano prevê o tipo.
- 23/11 · T01 · Em `board.test.ts`, a mutação da entrada usa `mutable[0]?.splice(...)` porque o lint barra `!`; se a linha não existir, o `?.` vira no-op silencioso.
- 23/11 · T01 · Aviso para a T02: `createBoard` usa `grid.flat()`; a validação de forma precisa vir antes, senão uma linha curta gera menos de 81 células.
- 23/11 · T02 · Mutante sobrevivente equivalente em `digit.ts:3`: `typeof value === 'number'` → `true`. `Number.isInteger` já devolve `false` para não numéricos; o `typeof` fica só para estreitar o tipo (`unknown` → `number`) no type guard. Casos `unknown` de `isDigit` vão para a T07.
- 23/11 · T02 · Decisão do Diretor: o mutante equivalente acima fica marcado com `// Stryker disable next-line ConditionalExpression` justificado; `digit.ts` volta a 100%.
