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

## T06 -> T07/T08: recado (28/11/2026)

- `theme.css` ganhou `color-scheme: light dark` no `:root` e o bloco `@media (prefers-color-scheme: dark)`. Cor só por token; `styles.css` não pode ter cor literal (teste de regra).
- Tokens novos: `--color-note`; `--color-action-bg|text|border`; `--color-action-on-bg|text` (Anotar ligado); `--color-action-disabled-bg|text`. Todos existem nos dois temas.
- Anotar ligado no tema claro usa `#93c5fd` com texto `#111111`: o foco `#7c2d12` não teria 3:1 sobre `#1e3a8a`.
- Desabilitado = `[aria-disabled="true"]` (T05); a T07 aplica `--color-action-disabled-*` nele.
- Para a `/revisar`: a eng-testes exigiu 4,5:1 no texto do botão desabilitado (letra da tarefa), embora o WCAG isente componente desabilitado; decidir se mantém.
- Fechamento: RED `1cbf8f0` (82 testes, 61 vermelhos), GREEN `320e2da` (só `theme.css`), sem REFACTOR; 1096/1096 testes, cobertura 100%, Stryker não rodado.

## T07: capturas e tamanho (28/11/2026)

Capturas do build (`vite preview`), Playwright/Chromium, em `specs/005b-anotacoes-e-tema/capturas/`. Cena: Anotar ligado, anotações 1, 2, 3, 5, 9 na célula (1,3) e 1 a 9 na (1,4); sem rolagem horizontal em nenhuma.

| Captura | Mostra | Corte | Sobreposição | Anotação ilegível |
|---|---|---|---|---|
| `320.png` | retrato, 3 botões numa linha | não | não | não (~9 px, pequena mas legível) |
| `390.png` | retrato | não | não | não |
| `1280.png` | grade e controles lado a lado | não | não | não |
| `390-texto200.png` | texto a 200% (`font-size: 200%`); botões quebram linha, Apagar em fileira própria | não | não | não |
| `800x360-paisagem.png` | paisagem, lado a lado, 3 botões numa linha | não | não | não |
| `390-escuro.png` | tema escuro, anotações e botões com tokens | não | não | não |

- Defeito achado e resolvido só com CSS: com texto a 200% os botões de ação eram cortados (grid de 3 colunas); virou `flex-wrap`. Nenhum candidato a tarefa nova.
- Extra: os botões do teclado numérico ficaram cinza do navegador no escuro; passaram a usar os tokens `--color-action-*`.
- Tamanho do build (gzip): JS 11,04 kB, CSS 1,59 kB (`dist/assets/index-*.js` 28,48 kB, `index-*.css` 5,37 kB brutos).
- `npm run check`: 1096/1096 testes, cobertura 100%.

## T07 -> T08: recado (28/11/2026)

- Layout lado a lado: `@media (min-width: 50rem), (orientation: landscape) and (min-width: 36rem)` em `src/ui/styles.css` (grade e `.controls` lado a lado); abaixo disso, retrato em coluna.
- Ganchos para os E2E: `.controls > .keypad`, `.controls > .actions` (3 botões em `flex-wrap`), `.is-on` (Anotar ligado), `.cell-notes` e `.note-N`; desabilitado = `[aria-disabled="true"]`.
- Capturas de referência (320, 390, 1280, 390 com texto a 200%, 800x360 paisagem, 390 escuro) em `capturas/`; a cena usa anotações 1, 2, 3, 5, 9 na célula (1,3) e 1 a 9 na (1,4).

## T08: defeitos achados (28/11/2026)

- **D1 (serious, axe `label-content-name-mismatch`, WCAG 2.5.3):** célula vazia com anotações tem `aria-label="Linha 1, coluna 3, vazia, anotações 1 2 5 9"`, mas o texto visível é "1259" (os `span.note-N` concatenados); o axe acusa que o texto visível não está no nome acessível. Reproduz no modo anotação (CA-005-41). Candidato a tarefa nova `tdd: sim` (correção em `Cell.tsx`/`messages`, p.ex. nome sem separador não serve ao CA-005-45; as opções são `aria-label` com as anotações coladas ou esconder o texto das anotações do cálculo do axe; decisão de produto, a levar à `/revisar`). O E2E `CA-005-41` do modo anotação está marcado `test.fail()` até a correção; ao corrigir, remover o `fail`.
- O tema escuro passou no axe (sem violação séria/crítica) e `color-contrast` avalia e passa com anotações e conflito.

- **D1, decisão (28/11/2026):** opção A, decisão 31 do plano. As vagas já eram `aria-hidden`, mas o axe-core 4.14.1 avalia o texto visível sem considerar `aria-hidden`. Correção na T09: espaço entre as vagas, provado no Playwright (com espaço, nenhuma violação séria).
- **D1: resolvido** no commit 5af97be (espaço entre as vagas em `Cell.tsx`; E2E CA-005-41 do modo anotação verde, suíte E2E 38/38).

## Revisão r1, achado 1: via 7b não declarada (28/11/2026)

Declarada depois do fato em `tasks.md` (T02, T05, T06), a partir das mensagens dos commits; histórico intacto.

- **T02, `c5c58ee`:** nasceram verdes as guardas "JSON sem campo novo" e "índice 81" (valem desde a T01) e os `INV:` dos geradores (mutante manual em `applyGameAction`).
- **T05, `feb5388`:** nasceram verdes CA-005-45 (`cellLabel` já inclui as anotações) e CA-005-42 (seta após a vitória), mais a regressão da rajada de setas; regressão de comportamento existente.
- **T06, `1cbf8f0`:** 19 pares do tema claro e 2 testes de `styles.rules` verdes. A isenção de invariante pontual dentro de tarefa `tdd: sim` foi desvio do §6 (proíbe isenção pontual em tarefa não isenta); registrado depois do fato, com aprovação do Diretor em 28/11/2026.
