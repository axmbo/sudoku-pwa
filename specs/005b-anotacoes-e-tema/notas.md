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

## T03 -> T04: recado (27/11/2026)

- `historyMessage(kind, move, row, col)` recebe `row` e `col` base 0 e soma 1 internamente. `move.index` vale `row*9+col`. Caudas aprovadas na decisão 29 do [plano](plan.md).
- `controlsView(game, noteMode)` não lê `UiState`; a T04 passa `state.noteMode`.
- `playText` usa `notes: []` fixo.
- `gridView.notes` vem de `notesAt`, congelado e ordenado.
- Fechamento: RED `ab2cf5a`, RED de correção `94e5783` (teste antigo CA-005-36 exigia 4 chaves em `messages`), GREEN `10382a9`; 925/925 testes, cobertura 100%.
- Lição candidata ao PDCA: a RED não previu teste existente de "conjunto exato" sobre exports e chaves dos módulos tocados; sugestão para o checklist da `eng-testes` (a levar à retro, não é regra).

## T04 -> T05: recado (27/11/2026)

- `UiState` ganhou `noteMode` e `focusTick`. `UiAction` ganhou `toggle-mode`, `undo` e `redo`.
- `travel` atende undo e redo. A célula afetada vem de `history[min(cursor antes, depois)].move.index`. `focusTick` só sobe quando a ação é aplicada.
- Anúncio de histórico = `historyMessage` + ". " + frase de conflito. Vitória anuncia só `messages.won`.
- `toggle-mode` em partida vencida é silencioso. `erase` em célula vazia com anotações usa `gameClearNotes`. A jogada `place` sem poda não sai mais do reducer.
- Os testes usam `act(type)` com cast (pode virar literal).
- Pendência para a revisão: provar o INV "gerador estendido alcança ..." por mutante manual (tirar `TOGGLE`/`UNDO`/`REDO` do gerador e ver falhar).
- Fechamento: RED `472cc97`, REDs de correção `a5eb4b9` e `4e6aee3`, GREEN `cc39bac`, REFACTOR `a16814d`; 970/970 testes, cobertura 100%, Stryker não rodado.
- Lição candidata ao PDCA (para a retro, não é regra): a RED de propriedade deve rodar a prop nova isolada com meta de tempo (~≤ 3 s) e conferir as chaves de alcance do gerador com a seed fixa antes de commitar; sem isso custou duas idas e voltas RED↔GREEN. A lição da T03 (conjunto exato) foi aplicada e funcionou.

## T05 -> T06/T07/T08: recado (27/11/2026)

- Estilos de `.controls`, `.actions`, `.is-on`, `.cell-notes` e `.note-N` ainda não existem (T07).
- `span.action-state` fica dentro do botão Anotar, separado por `{' '}`, com `aria-hidden`.
- Desfazer e Refazer usam `aria-disabled` sem `disabled`; o CSS pode usar `[aria-disabled="true"]`.
- As vagas `note-1` a `note-9` vão numa grade 3×3 por `cqi`.
- Ganchos de layout para a T08: `.controls > .keypad` e `.controls > .actions`.
- `focusTick` (prop opcional de `Grid`) só foca quando o valor muda.
- Atalhos no `document` (em `App.tsx`); controles em `<div class="controls">`.
- Fechamento: RED `feb5388` (44 testes novos, 39 vermelhos; `Actions.test.tsx` é módulo novo e não carregava, exceção do §6 declarada no commit; fixture `src/ui/tests/fixed-notes.ts`), GREEN `c93b725`, sem REFACTOR (código já limpo); 1014/1014 testes, cobertura 100% (330/330 statements, 266/266 branches, 92/92 funções, 305/305 linhas), Stryker não rodado.
- **Deriva tasks×spec, a decidir na `/revisar` (não é defeito):** a `tasks.md` da T05 pede "os três botões `aria-disabled`" na vitória, mas o CA-005-42 só exige "nada muda" e `ControlsView` (plan) não tem `won`. Por isso o Anotar não fica `aria-disabled` e só ignora o clique; a RED segue a spec.
- Lições candidatas ao PDCA (para a retro, não são regra): cabeçalho de commit com mais de 100 caracteres é barrado pelo commitlint (um commit da GREEN foi refeito).
