# Revisão r2 — spec 004 — 24/11/2026

Base: 09e3f4f · Head: 02adcce · check: verde (672 testes, cobertura 100%, branches 243/243; reexecutado pelo revisor)
Veredito: **sai** (0 blocker, 0 major, 1 minor, 1 nit; critério: 0 blocker, 0 major, ≤ 3 minor)

Escopo: delta `09e3f4f..HEAD` sem `revisao-r1.md`. R1-01 e R1-02 aceitos pelo Diretor (notas.md:50), não reabertos. R1-05 anotado na B-06.

| # | Sev. | Arquivo:linha | Achado | Sugestão |
|---|---|---|---|---|
| R2-01 | minor | specs/004-estado-de-jogo/spec.md:183-186 | A fronteira nova (forma de `values`/`notes`, `difficulty`/`seed` texto, dígito 0 em erase/clear-notes) vive só no plan.md (item 3) e nos testes. O texto do CA-004-28 continua genérico ("tipo errado"). Não é deriva (o plano detalha o CA e o código o segue), mas a spec é a fonte de aceite. | Opcional: uma linha no CA-004-28 remetendo ao plano, ou deixar para a retro. Não bloqueia. |
| R2-02 | nit | src/domain/deserialize.test.ts:~440 (it.each CA-004-28) | Não há caso para `cursor` não inteiro (ex. 1.5) nem para `moves` que não seja lista no it.each novo; podem estar cobertos em outro bloco (cobertura 100% e Stryker 99,70% indicam que sim). | Conferir se já existe; se não, acrescentar. |

## Conferências pedidas
- R1-03 resolvido: serialize.ts:227-239 valida `difficulty`/`seed` texto, `generatorVersion` inteiro, `values` por `parseGrid` (`^[.1-9]{81}$`) e `notes` por `isNotesList` (81 inteiros em 0..511) antes de `createGame`. Valor do tipo certo recusado (texto vazio, versão < 1, dígito fora de 1..9) continua `inconsistent-data` (deserialize.test.ts, casos CA-004-29). Confere com plan.md:107 itens (3) e (4).
- R1-04 resolvido: serialize.ts:67-76 exige dígito 0 em erase/clear-notes; teste dedicado (erase/clear-notes com 5) e kind 4 com dígito 0.
- Refactor 1212570 sem comportamento novo: remove `notes.length === rebuilt.length` de `sameState` (serialize.ts:~102). Redundante, pois `isNotesList` já garante 81 antes do replay e `rebuilt` tem 81; nenhum caminho novo recusado ou aceito. Cobertura 100% mantida.
- Casos alterados em 756d2e4: os quatro place/toggle-note com dígito 0/10 deixaram de gravar '0'/'10'/máscaras absurdas em values/notes, para continuarem bem formados e testarem só a recusa do jogo (CA-004-29); o mesmo teste foi mantido com o replay recusando. Foi acrescentado o bloco `redoable` (dígito inválido como refazível), que fecha o que o ajuste poderia perder. Os casos de `notes` com 80/82 máscaras migraram de CA-004-29 para CA-004-28 (invalid-data), conforme o plano, e voltaram como 80/82 elementos. Nada do que era verificado se perdeu.
- Ordem TDD: 756d2e4 test (vermelho real: 20 falham, 1 caso nasce verde declarado) → cde08b4 fix → 1212570 refactor → afa376a e 02adcce testes de mutante, verdes com prova no corpo (padrão 7b já aceito). Sem pendência.
- Domínio puro/ADR 0007: sem I/O, sem nova dependência, sem mutação pública; sem impacto em CSP, terceiros ou dados pessoais.

Rastreabilidade: CA-004-28 → deserialize.test.ts (it.each "fronteira de tipo", 21 casos + kind 4) · CA-004-29 → deserialize.test.ts (jogada sem efeito/recusada, `redoable`) | órfãos: nenhum no delta.
