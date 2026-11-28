# Notas da 005b

## T01 -> T02: `place-prune` só no código de escrita (27/11/2026)

O `dev` da T01 pôs o código 4 de `place-prune` apenas em `MOVE_KIND_CODE`. `MOVE_KINDS` (leitura) segue com 4 tipos (`Exclude<..., 'place-prune'>`), porque ampliá-lo quebraria `src/domain/deserialize.test.ts` L379-380 ("kind 4 ... é invalid-data").

Consequências para a T02:

- `serializeGame` já grava `place-prune` com código 4, mas `deserializeGame` o recusa como `invalid-data` até a T02.
- A `eng-testes` da T02 precisa mover esse teste de fronteira para o código 5 (ou equivalente); o `dev` amplia `MOVE_KINDS` e `isMoveTuple`.
- Atenção ao risco já escrito na T02: o vermelho deve falhar por asserção (ida e volta diferente), não por exceção de tipo.

## T02 -> T03: recado (27/11/2026)

- `Move['kind']` já inclui `'place-prune'`; os `switch` da UI (`historyMessage`) precisam tratá-lo.
- `serialize.ts` não muda mais. `deserialize.test.ts`: o teste de fronteira passou de kind 4 para kind 5.
- Em `applyTuple`, `applyPrune` também roda no `place` comum, como no-op com `pruned ?? []`. Funciona, mas é indireto e é candidato a mutante no Stryker da `/revisar`.
