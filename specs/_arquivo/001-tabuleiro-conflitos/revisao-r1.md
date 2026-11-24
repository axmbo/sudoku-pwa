# Revisão r1 — spec 001 — 24/11/2026
Base: 8b5b40e · Head: 3b7c1bc · check: verde (informado pelo Orquestrador: 390 testes, cobertura 100%, Stryker 100% no domínio; não reexecutado)
Veredito: nova rodada (1 major)

Contagem: blocker 0 · major 1 · minor 2 · nit 1. Critério de saída (0/0/≤3) não atendido por causa do R1-01.

| # | Sev. | Arquivo:linha | Achado | Sugestão | Dono |
|---|---|---|---|---|---|
| R1-01 | major | src/domain/board.ts:77-81, 98 | Deriva do plano e violação do ADR 0007, decisão 2. O ADR diz que `createBoard`, `placeValue` e `eraseValue` "aceitam `unknown` e validam". O plan.md:59-60 fixa `row: unknown, col: unknown, value: unknown`. O código declara `row: number, col: number, value: number`. Os testes escondem o desvio com um cast (`dirty = (v: unknown) => v as number`, board.test.ts:714). A API pública que as specs 004 e 005 vão importar fica com o contrato errado: a UI será forçada a fazer cast na fronteira, o que o ADR queria evitar. O desvio não está em `notas.md` nem tem aprovação do Diretor. | Mudar os parâmetros para `unknown`. `isCoordinate` e `isDigit` já aceitam `unknown`; ajustar o cast `value as Digit` e remover o cast `dirty` dos testes. Se o Diretor preferir tipos estreitos, registrar a mudança do ADR e do plan antes de aceitar. | dev (assinatura) + eng-testes (remover `dirty`) |
| R1-02 | minor | src/domain/board.ts:68, 104, 112 e plan.md:55 | O plano define o tipo único `MoveRefusal`. O código tem `PlaceRefusal` e `EraseRefusal`, e `eraseValue` não pode devolver `invalid-value`. É mais preciso que o plano, mas é um nome de API pública que diverge e não foi registrado. | Registrar a decisão em `notas.md` e atualizar o plan.md, ou alinhar ao plano. | dev |
| R1-03 | minor | src/domain/board.ts:99, 104 | Duplicação local: `row * 9 + col` aparece em `isGivenAt` e `replaceCell`, apesar de `cellIndex` existir em `units.ts`. `cellAt` usa `cellIndex`. Uma mudança futura de layout teria três pontos de edição. | Usar `cellIndex(row, col)` nos dois pontos. | dev |
| R1-04 | nit | specs/_arquivo/001-tabuleiro-conflitos/tasks.md:117 (commit 0094691) | O commit 0094691 isenta os geradores de `__arbitraries__` e o `grid.test.ts` e `board.test.ts` deles "porque nasce verde". Isso é infraestrutura de teste, não "teste de invariante sobre estado existente" no sentido estrito do §6. A tarefa T07 lista os geradores explicitamente e o Diretor aprovou o tasks.md, então não bloqueia. | Se a prática se repetir, explicitar na lista fechada do §6 que fixtures/geradores de teste são isentos. | curador-pdca |

## Validade da isenção de TDD da T07
Válida. Os commits 4494ebc, 855ff1c e c679816 são testes de invariante sobre código existente, sem código de produção novo (`git diff` de `src/domain/*.ts` sem alteração nesses commits). Cada um traz no corpo a prova do vermelho por mutante manual (Number(x) em `isDigit`; `eraseValue` sem apagar; precedência invertida; índice de bloco com off-by-one; `getConflicts` ignorando `given`). Nenhuma propriedade achou bug. Os mutantes cobrem os quatro itens previstos em tasks.md:118.

## Ordem TDD (git log 8b5b40e..HEAD)
- T01 a T06: cada `feat` é precedido pelo `test` correspondente (c15ef1c→042aabb, 9096b1c→980071c, d1b50d3→121b761, be6d500→b23aa93, 269450c→da5e9a1 e assim por diante, até bcb28ac→146f5d4). Não há `feat` sem `test` anterior.
- Os `refactor` (efad534, a3844ed) vêm depois do verde.
- Débitos já aceitos pelo Diretor (N6, `ALL_UNITS` sem freeze, `Stryker disable` em digit.ts:3, GREEN de T05, T02, T07 `mutation`, commits de T2/T3/T6 sem vermelho no corpo) não foram reabertos e não pioraram.
- O hook `tsc-red-filter` e o pre-commit foram introduzidos em ordem test→feat (a33113f→4a794f0, 55dcd9f→2bd4f9e).

## Domínio e constituição
- Domínio puro: nenhuma ocorrência de `Math.random`, `Date` ou `performance` em `src/domain` fora de testes. Recusa por valor (`Result`), sem exceção na entrada do jogador. Estado congelado (`Object.freeze` em células, array e board). Conflito derivado (`getConflicts` calcula a cada chamada, nada armazenado).
- Correção: `isCoordinate` aceita `-0` e recusa `bigint` e objetos sem lançar. Precedência `cell-not-found` > `invalid-value` > `cell-is-given` está implementada como o CA-001-25 pede. `createBoard` checa a forma antes dos conflitos. `flattenGrid` trata buracos esparsos com `Object.hasOwn`. Sem defeito encontrado.

## Hooks (scripts/hooks)
- `tsc-red-filter.mjs`: falha fechado (entrada sem `error TS` sai com 1) e tolera só TS2305, TS2307, TS2339 e TS2724. A continuação indentada não conta. Os testes cobrem esses casos. OK.
- `pre-commit.sh`: o typecheck do commit RED só afrouxa quando todos os arquivos de código staged são teste, `__arbitraries__`, `e2e` ou `tests`. Falha do `node` ou do filtro cai no ramo `else` e bloqueia (fail closed). Observação, não achado: a tolerância vale para qualquer erro TS2339 do projeto, mesmo fora dos arquivos staged. Está de acordo com PROCESSO.md §6 e é limitada por design.
- Segurança: sem segredo, dependência nova, terceiros ou dado pessoal no diff.

## Rastreabilidade
CA-001-01 → board.test.ts, board.prop.test.ts | 02 → board.test.ts, board.prop.test.ts | 03, 04, 05, 06 → board.test.ts | 07 → board.test.ts, board.prop.test.ts | 08 → board.test.ts, board.prop.test.ts | 09 → conflicts.test.ts, board.test.ts, board.prop.test.ts | 10, 11, 12, 13 → conflicts.test.ts | 14 → conflicts.test.ts, board.prop.test.ts | 15, 16 → board.test.ts | 17 → board.invariants.test.ts | 18 → board.invariants.test.ts, board.prop.test.ts | 19 → conflicts.test.ts | 20, 21 → board.test.ts | 22 → board.test.ts, board.prop.test.ts | 23 → board.test.ts | 24 → board.invariants.test.ts, board.test.ts | 25 → board.test.ts. Os 25 CA têm teste que os cita (conferido por grep do ID).
Órfãos: nenhum entre os testes de domínio. units.test.ts usa os IDs U1 e U2 do plano (sem CA, previsto na T03) e digit.test.ts tem casos de `isDigit` da T02/T07 sem CA próprio. Os testes dos hooks usam o prefixo INV e não pertencem à spec 001.
