# Notas da 005b

## T01 -> T02: `place-prune` só no código de escrita (27/11/2026)

O `dev` da T01 pôs o código 4 de `place-prune` apenas em `MOVE_KIND_CODE`. `MOVE_KINDS` (leitura) segue com 4 tipos (`Exclude<..., 'place-prune'>`), porque ampliá-lo quebraria `src/domain/deserialize.test.ts` L379-380 ("kind 4 ... é invalid-data").

Consequências para a T02:

- `serializeGame` já grava `place-prune` com código 4, mas `deserializeGame` o recusa como `invalid-data` até a T02.
- A `eng-testes` da T02 precisa mover esse teste de fronteira para o código 5 (ou equivalente); o `dev` amplia `MOVE_KINDS` e `isMoveTuple`.
- Atenção ao risco já escrito na T02: o vermelho deve falhar por asserção (ida e volta diferente), não por exceção de tipo.
