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
- 23/11 · T03 · Lacuna do plan.md: o tipo de retorno de `unitCells` não estava especificado; a eng-testes supôs `readonly number[]` e o Diretor confirmou.
- 23/11 · T03 · Desvio do plano: `unitCells(unit)` calcula os índices 0–80 (crescentes) a cada chamada, sem tabela pré-calculada, porque a tabela exigia `!`, proibido pelo lint `no-non-null-assertion`. Registrado no plan.md (`9219b4a`).
- 23/11 · T03 · Decisão do Diretor: `ALL_UNITS`/`unitCells` sem `Object.freeze` em runtime (constante de módulo); fica como débito, pois o ADR 0007 pede estado congelado.
- 23/11 · T03 · P2a com seed fixa 20260003 e 300 execuções.
- 23/11 · T03 · Novidade de processo: eng-testes e dev ficaram cada um num único contexto, retomado por SendMessage entre vermelhos. Custo por vermelho caiu (eng-testes 21k na T01, 41k na T02, 12,8k na T03) → M-004. Os `subagent_tokens` do harness (29k a 51k) são o tamanho do contexto no turno, não o acumulado.
- 23/11 · T04 · A fachada `getConflicts` não tem CA próprio: o vermelho 1 cita o CA-001-09 (conflito em linha), que a T03 cobre em `conflicts.ts`. Rastreabilidade só indireta; o plan.md já lista a fachada, sem ação.
- 23/11 · T05 · `placeValue` e `eraseValue` retornam `Result<Board, never>` provisório; a T06 troca pelo tipo de recusa (CA-07, 08, 16, 20, 21, 24, 25).
- 23/11 · T05 · Commitlint avisou `footer-leading-blank` no `adf4dac` (corpo do vermelho); o aviso não se repetiu nos demais commits.
- 23/11 · T05 · Cinco leituras fora do manifesto: eng-testes leu `conflicts.ts` e `units.ts` (formato de `CellConflict`/`Unit`); dev leu `result.ts` (tipo `Result`), `package.json` e `stryker.config.json` (comando do Stryker). Sugere incluir esses contratos nos manifestos de T06/T07.
- 23/11 · T07 · P4 (igualdade entre caminhos) não matava o mutante "getConflicts ignora pistas", porque os dois caminhos erram igual; a propriedade ganhou comparação com o oráculo de P2.
- 23/11 · T07 · `numRuns` reduzidos (P2 100, P3 150, P4 100): com P3 em 500, o dry-run do Stryker estourou 5 s.
- 23/11 · T07 · Nit/débito: o script de mutação é `npm run test:mut`, mas `tasks.md` diz `npm run mutation`; registrado aqui, sem editar `tasks.md`.
- 24/11 · revisão r1 · R1-02: o código separa `PlaceRefusal` e `EraseRefusal` (apagar nunca recusa por `'invalid-value'`), em vez do `MoveRefusal` único do plano; o Diretor manteve o código e o plan.md foi ajustado.
- 24/11 · revisão r1 · R1-04 (nit aceito): os geradores de `__arbitraries__` foram isentos por "nascerem verdes", justificativa fora da lista fechada do `PROCESSO.md` §6; a `tasks.md` já cobre o caso.
- 24/11 · revisão r1 · R1-01: vermelho só de tipo (TS2345), barrado pelo pre-commit e fora da lista fechada do §6. Decisão do Diretor: exceção pontual, testes sem o cast `dirty` e assinaturas `unknown` num único commit `fix(domain)`, com o `tsc` vermelho no corpo → M-005.
- 24/11 · revisão r1 · R1-01: `isCoordinate` virou type guard (`typeof` + `Number.isInteger`); o mutante do `typeof` é equivalente (mesmo caso de `digit.ts:3`) e ficou com `// Stryker disable next-line ConditionalExpression` justificado; Stryker 100% em `board.ts`.
- 24/11 · PR #2 · PR-04: a exceção do R1-01 contraria a regra do CHANGELOG-processo v0.3 (isenção só por tarefa, nunca pontual); o conflito não foi sinalizado ao Diretor na hora. O Diretor manteve a exceção e leva a regra à `/retro 001` (M-005).
