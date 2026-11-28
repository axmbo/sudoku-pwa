# Plano 005b — Anotações, desfazer/refazer e tema

- **Spec:** [spec.md](spec.md) · **Autor:** `arquiteto` · **Base:** [plano da 005a](../_arquivo/005a-grade-acessivel/plan.md) e [RESUMO](../_arquivo/005a-grade-acessivel/RESUMO.md)
- **ADRs:** [0001](../../docs/adr/0001-stack-e-ferramentas.md) (orçamento), [0003](../../docs/adr/0003-framework-de-ui.md) (Preact, `useReducer`, sem `preact/compat`), [0007](../../docs/adr/0007-convencoes-do-dominio.md) (recusa como valor, índices 0–8), [0004](../../docs/adr/0004-persistencia-local.md) (só contexto: o formato do jogo serializado). **Novo: [0008](../../docs/adr/0008-poda-de-anotacoes-na-jogada-de-valor.md), `Aceito`** (poda das anotações vizinhas como jogada de domínio; decisão 23).

## Módulos e fronteiras

Regra herdada: `src/ui/**` importa de `src/domain/**` (API pública); `src/domain/**` nunca importa de `src/ui/**`; domínio sem DOM, relógio nem aleatoriedade global (lint do domínio vigia). Domínio **muda só em T01 e T02** (ADR 0008); o resto é `src/ui/` e `e2e/`.

**Fato que a spec não previa (ver ADR 0008):** o domínio da 004 mantém as anotações dos vizinhos ao colocar valor (CA-004-10), mas o CA-005-43 exige que elas sumam. Desfazer restaura hoje uma só célula. Daí a jogada nova `place-prune`.

| Arquivo | Muda | Papel | Pode importar |
|---|---|---|---|
| `src/domain/history.ts` | T01 | `Move` ganha `place-prune`; `HistoryEntry.pruned?`; `undo`/`redo` restauram e reaplicam a poda | domínio |
| `src/domain/game.ts` | T01 | `gamePlaceAndPrune` | domínio |
| `src/domain/serialize.ts` | T01 (só o código de tipo, para o `tsc`), T02 (`replay` trata `place-prune` e reconstrói `pruned`; **sem campo novo no JSON**, ADR 0008) | idem | domínio |
| `src/domain/__arbitraries__/moves.ts` (e `board.ts` se preciso) | T02 | geradores incluem `place-prune` | domínio |
| `src/ui/model/messages.ts` | T03 | `cellLabel` com anotações; textos de modo, anotação, desfazer/refazer, "nada para…" | domínio (tipos) |
| `src/ui/model/view.ts` | T03 | `GridCellView.notes`; `controlsView(game, noteMode)` (modo, desfazer/refazer disponíveis) | domínio (`notesAt`, `canUndo`, `canRedo`, `getGameStatus`) |
| `src/ui/model/reducer.ts` | T03 (só a chamada de `cellLabel` em `playText`, com `notes: []`, para o `tsc` fechar), T04 (resto) | modo anotação, `toggle-note`, `undo`, `redo`, apagar anotações, poda, política de anúncio e de foco | domínio, `messages`, `navigation` |
| `src/ui/Cell.tsx`, `Grid.tsx`, `App.tsx` | T05 | anotações na célula (nove vagas fixas), foco após desfazer/refazer, atalhos | `model/*` |
| `src/ui/Actions.tsx` (novo) | T05 | botões Anotar (`aria-pressed`), Desfazer, Refazer (`aria-disabled`, focáveis) | `model/*` |
| `src/ui/theme.css`, `src/ui/styles.css` | T06 (tokens, dois temas), T07 (anotações, botões, layout largo) | só classes e variáveis (CSP `style-src 'self'`) | — |
| `e2e/*.spec.ts`, `e2e/helpers.ts` | T08 | jornadas, axe em modo anotação e no escuro | — |

### Decisões de projeto

1. **Modo anotação no `UiState`** (`noteMode: boolean`), nunca no domínio (é estado de interface). Modo pegajoso (CA-005-16). Ação `digit` no modo anotação vira `gameToggleNote`; no modo valor, `gamePlaceAndPrune`. Célula com valor ou pista no modo anotação: recusas `cell-has-value` e `cell-is-given` viram anúncio (CA-005-18); `game-over` fica silencioso (CA-005-42, como na 005a).
2. **Apagar (CA-005-44).** Célula com valor: `gameErase` (já limpa anotações). Célula vazia com anotações: `gameClearNotes`, anúncio "vazia". Célula vazia sem anotações ou pista: sem efeito, regras da 005a (pista: "pista, não pode ser alterada").
3. **Desfazer e refazer por ação (CA-005-23, 24, 25).** O reducer lê a jogada em `game.history[cursor − 1]` (desfazer) ou `[cursor]` (refazer), antes de chamar `gameUndo`/`gameRedo`, para saber a célula (`move.index`) e o tipo. Move `selected` para essa célula e incrementa `focusTick` (contador no `UiState`, explicado a seguir). **Um anúncio só**, `id` como na 005a: texto "Desfeito/Refeito: …" (tipo da jogada, célula) mais, se o desfazer ou refazer criou conflito na célula ou removeu o último, a frase do CA-005-20/21 (`conflictMessage` ou "sem conflitos") **anexada à mesma frase**; vitória (só por refazer) vence tudo (precedência do CA-005-31, que ganha os degraus de desfazer e refazer entre o conteúdo da célula e o resto). Nada a desfazer ou refazer: anúncio "nada para desfazer/refazer", sem mudar nada, `focusTick` igual.
4. **Foco para a célula afetada sem depender do teclado.** Na 005a o `Grid` só foca a célula depois de ação **de teclado** (`byKeyboard`, T10). Desfazer por botão também precisa mover o foco (CA-005-38 com CA-005-23). Solução: `UiState.focusTick` sobe só em desfazer/refazer aplicados; o `Grid` tem um efeito que foca a célula selecionada quando `focusTick` muda (sem tocar no efeito `byKeyboard`, que continua para setas e dígitos). Testado em comp e E2E.
5. **Atalhos globais.** `N`, Ctrl+Z e Ctrl+Y valem com o foco em qualquer controle da tela (um botão do teclado na tela, por exemplo), por isso ficam num `keydown` de `document` registrado pelo `App` (efeito com limpeza), não no `Grid`. `key` comparada em minúsculas; **`N` só vale sem Ctrl, Alt e Meta** (Ctrl+N e Cmd+N seguem para o navegador, sem `preventDefault`) **e ignora `event.repeat`** (segurar a tecla não alterna em rajada); Ctrl+Z/Y aceitam `repeat`; só `ctrlKey` (Cmd no Mac e Ctrl+Shift+Z estão fora da spec; decisão 26). O `Grid` continua dono de dígitos, apagar e navegação. Não resolve nem agrava o débito [#24](https://github.com/axmbo/sudoku-pwa/issues/24).
6. **Botão Anotar:** `aria-pressed` (CA-005-16: o estado vai ao leitor de tela) e nome acessível fixo "Anotar" (o estado vai só pelo `aria-pressed`, sem duplicar a leitura). Estado visível além da cor: dentro do botão, `<span class="action-state" aria-hidden="true">ligado</span>` / `desligado`, mais a classe `is-on`; `aria-hidden` tira o span do nome acessível, então o leitor lê "Anotar, botão, pressionado" uma vez. Testado na T05 por `getByRole('button', { name: 'Anotar' })` exato nos dois estados. **Desfazer e Refazer:** `aria-disabled="true"` (nunca `disabled`) quando indisponíveis, para continuarem focáveis (CA-005-25); a indisponibilidade vem de `controlsView` (`!canUndo`, `!canRedo`, ou partida vencida). Clicar neles indisponíveis anuncia "nada para…" (ou nada, se vencida).
7. **Anotações na célula (CA-005-04).** A célula passa a ter, ao lado de `.cell-digit`, um bloco `.cell-notes` com **nove vagas fixas** (1 a 9, ordem do DOM = posição numa grade 3×3 de CSS), cada vaga `aria-hidden` (o nome acessível já lê as anotações, CA-005-45); vaga sem a anotação fica vazia. O bloco só aparece em célula vazia. Tamanho da fonte pelo `cqi` da célula, como o dígito. Posição fixa é testável sem layout (nove filhos na ordem, classe `note-N`) e confirmada por `boundingBox` no E2E.
8. **Tema escuro (CA-005-32).** Mesmos nomes de variáveis (`--color-*`) em `theme.css`; um segundo bloco `@media (prefers-color-scheme: dark) { :root { … } }` com hexadecimais, mais `color-scheme: light dark` para controles nativos. Novos tokens para os dois temas: cor do texto de anotação e do fundo do botão ligado. O teste de contraste da 005a passa a ler os dois blocos e a incluir as anotações sobre cada fundo (normal, selecionada, vizinha, mesmo valor, conflito). Sem seletor manual de tema (fora de escopo). O `qa-auditor` confere a emulação `colorScheme: 'dark'` do Playwright.
9. **Layout lado a lado (CA-005-40).** `@media (min-width: 48rem), (orientation: landscape) and (min-width: 36rem)`: `main` vira duas colunas (grade e controles) por `display: grid`, **sem `order`/`flex-direction: row-reverse`**, para a ordem de Tab (grade, dígitos, Apagar, Anotar, Desfazer, Refazer) seguir a visual. Controles agrupados em `<div class="controls">` no `App`. Retrato e zoom (CA-005-34 da 005a) não mudam. O limite exato da consulta é ajustado na T07 com as capturas (M-019).
10. **Mensagens.** Todo texto novo sai de `messages.ts` (CA-005-36 da 005a). Textos aprovados (decisão 24): `modo anotação ligado`/`desligado`; `anotações 2 4 9`/`sem anotações`; `a célula já tem valor` (célula com valor); `nada para desfazer`/`nada para refazer`; `Desfeito: valor 5 na linha 3, coluna 5` (idem para apagar, anotação, apagar anotações); `Refeito: …` no mesmo molde.

## Tipos públicos

```ts
// src/domain/history.ts  (T01)
export type Move = /* … existentes … */ | { readonly kind: 'place-prune'; readonly index: number; readonly digit: Digit };
export interface PrunedMemo { readonly index: number; readonly notes: Notes }
export interface HistoryEntry { readonly move: Move; readonly before: CellMemo; readonly pruned?: readonly PrunedMemo[] }

// src/domain/game.ts  (T01)
export function gamePlaceAndPrune(game: Game, row: unknown, col: unknown, digit: unknown): Result<Game, GamePlaceRefusal>;

// src/ui/model/messages.ts  (T03)
export interface CellView { readonly value: Digit | null; readonly given: boolean; readonly conflicted: boolean; readonly notes: readonly Digit[] } // notes em ordem crescente; vazio se value != null
export function cellLabel(row: Index, col: Index, view: CellView): string; // "Linha 3, coluna 5, vazia, anotações 2 4 9[, em conflito]"
export function notesMessage(notes: readonly Digit[]): string;             // "anotações 2 4 9" | "sem anotações"
export function historyMessage(kind: 'Desfeito' | 'Refeito', move: Move, row: Index, col: Index): string;
// messages ganha: noteModeOn, noteModeOff, cellHasValue, nothingToUndo, nothingToRedo

// src/ui/model/view.ts  (T03)
export interface GridCellView extends CellView { /* … da 005a … */ }          // `notes` herdado de CellView
export interface ControlsView { readonly noteMode: boolean; readonly canUndo: boolean; readonly canRedo: boolean }
export function controlsView(game: Game, noteMode: boolean): ControlsView;     // canUndo/canRedo falsos se a partida está vencida; não depende de UiState (T03 fecha sozinha)

// src/ui/model/reducer.ts  (T04)
export interface UiState { /* … da 005a … */ readonly noteMode: boolean; readonly focusTick: number }
export type UiAction = /* … da 005a … */
  | { readonly type: 'toggle-mode' } | { readonly type: 'undo' } | { readonly type: 'redo' };
// `digit` e `erase` mudam de efeito conforme `noteMode`; `initialState` devolve noteMode=false, focusTick=0. T03 não toca em `UiState`

// src/ui/Actions.tsx  (T05)
export interface ActionsProps { readonly controls: ControlsView; readonly dispatch: (a: UiAction) => void }
```

## Estratégia de teste

Camadas como no plano da 005a: **unit** = funções puras (`ui/model`, domínio); **prop** = fast-check (domínio e reducer, `seed` reproduzível, M-017); **comp** = Testing Library + jsdom; **E2E** = Playwright; **a11y** = axe; **CSS** = verificação estática. jsdom não faz layout nem cor: contraste, tamanho de toque e lado a lado vão a CSS estático e a E2E.

| CA | Camada | Observação |
|---|---|---|
| CA-005-04 | comp + CSS estático + E2E | comp: nove vagas fixas na ordem, só as anotações presentes preenchidas, bloco ausente em célula com valor; CSS: grade 3×3 e fonte por `cqi`; E2E: `boundingBox` de cada vaga na mesma posição relativa em duas células distintas; contraste dos tokens de anotação em CSS estático |
| CA-005-16 | unit (reducer) + comp + E2E | alterna e anuncia ligado/desligado (um anúncio por ação); `aria-pressed`, nome acessível exato "Anotar" e span `aria-hidden`; `N` por teclado em qualquer foco, ignorado com Ctrl/Alt/Meta e com `repeat`; E2E: pegajoso entre duas células |
| CA-005-17 | unit + prop + comp | alterna o candidato, sem valor; anúncio das anotações atuais; propriedade: duas alternâncias = estado original |
| CA-005-18 | unit + comp | célula com valor e pista, modo anotação: estado idêntico, anúncio "a célula já tem valor" / "pista, não pode ser alterada" |
| CA-005-23 | unit + prop + comp + E2E | desfazer de cada tipo de jogada (valor, apagar, anotação, apagar anotações, **valor com poda**); foco e `selected` na célula afetada; anúncio com conflito criado/eliminado; propriedade: `undo` do reducer ∘ ação = estado do jogo (`game`) anterior; E2E: Ctrl+Z e botão |
| CA-005-24 | unit + prop + comp + E2E | refazer por tipo de jogada (inclui `place-prune`); só sem jogada nova depois; refazer que vence anuncia vitória |
| CA-005-25 | unit + comp | histórico vazio: nada muda, anúncio "nada para desfazer/refazer"; botão `aria-disabled` e focável (Tab chega nele) |
| CA-005-38 | comp + E2E | botão = mesmo efeito do atalho (mesmos casos, por botão); `selected` não muda ao clicar Anotar; E2E: `boundingBox` ≥ 44×44 nos três, também a 320 px CSS |
| CA-005-32 | CSS estático + a11y | `theme.contrast.test.ts` lê os dois temas: texto 4,5:1 e componente/foco 3:1 em todos os estados, incluindo anotações, botão ligado e desabilitado; axe `color-contrast` no escuro (E2E com `emulateMedia({ colorScheme: 'dark' })`) |
| CA-005-40 | CSS estático + E2E | estático: consulta de mídia presente, sem `order`; E2E (viewport 1280×720 e 800×360 paisagem): grade e controles lado a lado (boxes sem sobreposição), `scrollWidth ≤ clientWidth`, ordem de Tab = ordem visual (compara a posição `x`/`y` dos focos sucessivos) |
| CA-005-41 | a11y (E2E) | axe com 0 sérias/críticas no modo anotação ligado e, separadamente, no tema escuro (claro já na 005a) |
| CA-005-42 | unit + comp | vencida: anotar (modo e botão), desfazer, refazer sem efeito; botões `aria-disabled`; grade navegável (seta ainda move) |
| CA-005-43 | unit (domínio) + prop + unit (reducer) + comp + E2E | domínio: `gamePlaceAndPrune` poda só vizinhos com X, mantém outras anotações, mesmo valor = sem efeito, recusas; propriedade: `undo ∘ gamePlaceAndPrune = id` e `redo ∘ undo = id`, serialização ida e volta com `place-prune` (`pruned` reconstruído pelo `replay`, sem campo no JSON; `place-prune` incoerente com o estado → `inconsistent-data`); reducer: modo valor chama a poda; comp/E2E: a anotação X some das vizinhas na grade |
| CA-005-44 | unit + comp | as quatro entradas (Backspace, Delete, `0`, botão Apagar) em célula vazia com anotações: some tudo, anúncio "vazia" (reducer `erase`; `Grid.test` para as três teclas, `Keypad.test` para o botão); em célula com valor segue o CA-005-14 |
| CA-005-45 | unit + comp | `cellLabel` com anotações em ordem crescente, com e sem "em conflito"; `getByRole('gridcell', { name })` |

Domínio: **mutação** do Stryker cobre o código novo de T01 e T02 (mutante sobrevivente em código novo é major; `PROCESSO.md` §6). Cobertura de branches do domínio ≥ 90% segue. `src/ui/model` sem limiar (débito [#22](https://github.com/axmbo/sudoku-pwa/issues/22)), com um teste por ramo de CA. Invariantes do domínio afetadas: 7 (`deserialize(serialize(b)) = b`, histórico com `place-prune`) e 8 (`undo`/`redo`, depois da vitória recusados).

## Orçamento de performance

ADR 0001: JS ≤ 60 kB gzip, CSS ≤ 10 kB, LCP ≤ 2,5 s, TBT ≤ 200 ms, Lighthouse ≥ 90/100/95.
- **JS:** 005a fechou em 9,26 kB gzip. Acréscimo estimado, sem medição: 3 a 5 kB (reducer, `Actions`, textos, `place-prune` no domínio). Folga ≥ 45 kB. Sem biblioteca nova.
- **CSS:** estimado +1,5 a 2,5 kB gzip (tema escuro duplica ~14 tokens, anotações, botões, layout largo). Ainda abaixo de 10 kB com folga (a medição real fica na T07).
- **Interação:** cada jogada recria 81 células com até 9 vagas cada (≤ 729 nós leves); sem trabalho assíncrono, sem Worker. Se a medição de TBT/INP pedir, `memo` por célula (decisão de medição, não de plano).
- **Medição:** T07 registra o tamanho gzip real de JS e CSS em `notas.md`. O gate de tamanho segue débito [#21](https://github.com/axmbo/sudoku-pwa/issues/21), não desta spec. Lighthouse segue pendente (`@lhci/cli` ausente).

## Avaliação do tamanho: 8 tarefas

Ficaram 8, no teto de "~8" (a ADR 0008 acrescentou T01 e T02 de domínio). **Recomendação: não dividir.** Se T05 (componentes, atalhos e foco) passar de 15k de manifesto na execução ou de 1,5× a estimativa, dividir ali em T05a (anotações e botões) e T05b (atalhos globais e foco). Sem a ADR 0008 aprovada, T01 e T02 caem e a 005b fica com 6 tarefas.

## Riscos

- **CA-005-43 × domínio da 004** → ADR 0008 `Aceito`, opção A (decisão 23).
- **Dupla fala do leitor de tela** (anúncio do desfazer na região viva e leitura do nome da célula ao receber o foco, CA-005-23) → previsto pela spec; um só `Announcement` por ação (CA-005-31) e rótulo da célula curto; só o roteiro de TalkBack do `qa-auditor` confirma.
- **Anotações ilegíveis em célula de 24 px** (320 px CSS, CA-005-28 da 005a) → fonte pelo `cqi` com piso; contraste é verificado, tamanho de leitura não; capturas 320/390/1280/200% da T07 (M-019) e inspeção do Diretor antes da r1.
- **Foco programático × `byKeyboard` do `Grid`** (T10 da 005a mostrou fragilidade) → `focusTick` separado, sem tocar na lógica existente; testes de rajada de teclas mantidos.
- **Modificadoras** (débito #24): Ctrl+dígito ainda é tratado como dígito na grade → não se agrava; Ctrl+Z/Y/`N` não passam pelo mapeamento de dígitos.
- **Paisagem de celular baixo** (≈ 360 px de altura): a grade de 24,75 rem não cabe na vertical → aceitar rolagem vertical (a spec só proíbe a horizontal); a T07 limita a grade pela altura se as capturas mostrarem corte.
- **Serialização v1** (ADR 0008): sem dado gravado hoje; se a B-06 for antes desta spec, reabrir o ADR.
- **Estimativas** são hipóteses (ciclo 03: 0,91× do estimado; vazão 0,7M tokens/h, M-009(b)).

## Decisões do Diretor (27/11/2026)

Numeração contínua com as da 005a (13 a 22, no RESUMO dela).

23. **Poda das anotações vizinhas:** ADR 0008 **opção A** aceita (nova jogada de domínio `gamePlaceAndPrune`, desfazer de uma vez). T01 e T02 liberadas.
24. **Textos de anúncio** da decisão de projeto 10 aprovados como estão; a `eng-testes` pode refinar na T03 sem mudar o sentido.
25. **Após a vitória**, a tecla `N` e o botão Anotar ficam **sem efeito e sem anúncio** (coerente com CA-005-42).
26. **Cmd+Z e Ctrl+Shift+Z ficam fora desta spec**; abrir item no backlog se houver demanda.
27. **Cobertura de E2E** (revisão da `eng-testes`): CA-005-25 e CA-005-42 saem do E2E e ficam em unitário e componente; os testes estáticos de CSS do CA-005-40 e do CA-005-04 vão para a T08, preservando a isenção da T07.
28. **Estimativa do ciclo completo da 005b** (análise, revisão, `qa-auditor`, retro) é feita na `/analisar 005b`, pelo `curador-pdca`, a partir da 005a.
    Estimativa registrada em 27/11/2026: ciclo completo 775k / 1,32M / 2,39M tokens e 54 / 112 / 252 min (T01-T08 730k provável + analisar 256k + revisar 140k + qa-auditor 85k + retro 111k; fora planejar já real 218,7k, orquestrador e CI); linhas em `docs/process/metrics.csv`.
