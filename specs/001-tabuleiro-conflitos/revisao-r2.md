# Revisão r2 — spec 001 — 24/11/2026
Base: 3b7c1bc · Head: d396fb8 · check: verde (informado pelo Orquestrador: 390 testes, 100%; não reexecutado)
Veredito: sai (0 blocker, 0 major, 0 minor abertos)

Contagem: blocker 0 · major 0 · minor 0 · nit 0 novos. Os minors R1-02 e R1-03 estão resolvidos. O nit R1-04 foi aceito pelo Diretor.

| # | Sev. | Arquivo:linha | Achado | Sugestão |
|---|---|---|---|---|
| R1-01 | resolvido | src/domain/board.ts:68-90 | `placeValue` e `eraseValue` recebem `row`, `col` e `value` como `unknown`, como pedem o ADR 0007 (decisão 2) e o plan.md. `isCoordinate` virou type guard, e o `isDigit` anterior estreita `value` para `Digit`. O `as Digit` saiu, sem cast residual. | nenhuma |
| R1-02 | resolvido | plan.md:55-62 | O plan.md traz `PlaceRefusal` e `EraseRefusal`, com assinaturas iguais às do código. A decisão está em notas.md. | nenhuma |
| R1-03 | resolvido | src/domain/board.ts:109, 114 | `isGivenAt` e `replaceCell` usam `cellIndex`. Sobra `row * 9 + col` só dentro de `cellIndex`. | nenhuma |
| R1-04 | nit aceito | tasks.md:117 | Aceito pelo Diretor e registrado em notas.md. | nenhuma |

## Verificações pedidas
- Mutante do `typeof` em `isCoordinate` (board.ts:102-103): equivalente. Para a entrada não numérica, `Number.isInteger` já devolve `false`, então trocar `typeof n === 'number'` por `true` não muda nenhum resultado. O `typeof` serve só para estreitar o tipo, como em `digit.ts:3`. A justificativa no comentário é correta. A mutação do mesmo trecho para `false` é morta pelos testes de coordenada válida. A marca está restrita a uma linha e à categoria `ConditionalExpression`.
- Mudanças de teste em 7c15aad: só de forma. Os helpers `tryPlace` e `tryErase` passam a aceitar `unknown`, e o cast `dirty` foi removido, passando-se o valor direto. Todas as asserções (`toStrictEqual` de `{ ok:false, reason }`, `board.cells[...]`, `not.toThrow`) ficaram idênticas. Nenhuma asserção foi removida ou enfraquecida, e nenhum `it` foi removido. A contagem de testes segue em 390.
- Exceção de TDD do R1-01: aprovada pelo Diretor em 24/11/2026. Está registrada em notas.md e M-005. O corpo do commit 7c15aad cola o vermelho TS2345, e o comportamento em runtime já estava coberto (188 testes de board passavam).
- plan.md × código: bate nas assinaturas e nos tipos de recusa.
- Nada novo quebrado: o diff de produção tem 19 linhas, só em `board.ts`, sem novo efeito colateral. O domínio segue puro e imutável.
- Rastreabilidade: inalterada em relação à r1; os 25 CA seguem citados em testes. Sem órfãos novos.
