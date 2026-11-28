# Tarefas 005b — Anotações, desfazer/refazer e tema

- **Spec:** [spec.md](spec.md) · **Plano:** [plan.md](plan.md)
- **Autores:** `arquiteto` + `eng-testes` · **Análise de consistência:** ok em 27/11/2026 (2 rodadas; [analise.md](analise.md))

Rascunho do `arquiteto` (etapa 1 do `/planejar`); testes e manifestos a refinar por `eng-testes` e `curador-pdca`. **10 tarefas** (T09 veio do D1, decisão 31; T10 veio do diagnóstico do E2E intermitente do CA-005-16, decisão do Diretor de 28/11/2026). T01 e T02 implementam o [ADR 0008](../../docs/adr/0008-poda-de-anotacoes-na-jogada-de-valor.md), aceito (decisão 23 do plano). Ordem: domínio, contratos e lógica pura, componentes, CSS, E2E.

Estimativas: tokens prováveis a partir da 005a (média 86k por tarefa, ciclo 03 em 0,91×); minutos = tokens prováveis ÷ 0,7M tokens/h (M-009(b)). Manifestos em ~4 caracteres por token (`wc -c` dos arquivos atuais: `estado.md` ≈ 1,6k; `constituicao.md` ≈ 0,5k; `game.ts` ≈ 1,9k; `history.ts` ≈ 0,7k; `serialize.ts` ≈ 2,2k; `reducer.ts` ≈ 0,85k; `styles.css` ≈ 0,9k). Todos abaixo de 15k. **Manifesto de UI** (M-020, passo 2b da `gestao-contexto`) já incluído nas tarefas de UI: exports de `game.ts` usados, projeto `ui` de `vitest.config.ts` (linhas 10 a 16) e a convenção de `seed`, CA de texto fixo e ganchos da tarefa anterior.

## T01 — Jogada `place-prune` no domínio (ADR 0008)

- **CA cobertos:** CA-005-43 (domínio: poda, desfazer e refazer da jogada); base de CA-005-23 e 24 para esse tipo de jogada
- **tdd:** sim
- **Testes esperados:** `src/domain/game.prune.test.ts` (novo): `CA-005-43:` coloca X e remove X só dos vizinhos (linha, coluna, caixa) que o tinham, outras anotações e não vizinhas intactas; célula vazia sem vizinhos com X comporta-se como `gamePlace`; mesmo valor = mesmo `Game`; recusas (pista, valor inválido, coordenada, `game-over`); histórico ganha **uma** jogada; **desfazer** restaura valor, anotações da célula e as podadas; **refazer** reaplica valor e poda (refazer por tipo de jogada: `place-prune`, além de `place`, `erase`, `toggle-note`, `clear-notes` já cobertos). `src/domain/game.prune.prop.test.ts` (fast-check, `seed` fixa, `PROP_TIMEOUT` 30 s no `it`; `Game` com anotações montado pelos geradores existentes de `__arbitraries__`, sem depender da T02), uma propriedade por invariante: `CA-005-23:` `undo ∘ gamePlaceAndPrune = id` (invariante 8); `CA-005-24:` `redo ∘ undo = id` enquanto não há jogada nova; `CA-005-43:` depois da poda nenhuma vizinha do alvo tem X, as anotações de não vizinhas e os demais dígitos das vizinhas ficam intactos, e `gamePlaceAndPrune(g,i,d)` com `d` já no lugar devolve o mesmo `Game`; `CA-005-42:` partida vencida recusa a jogada e `undo`/`redo` (invariante 8). O gerador precisa alcançar vizinhas com X anotado (prove com mutante manual que remove a poda, e que a propriedade falha).
- **via 7b para mutantes:** não (a API alcança todos os estados; se o Stryker achar mutante em `pruned`, decidir na hora e declarar)
- **Arquivos a criar/alterar:** `src/domain/history.ts`, `src/domain/game.ts`, `src/domain/serialize.ts` (só o código numérico e a lista de tipos de jogada, para o `tsc` fechar; a leitura/escrita real é T02), `src/domain/game.prune.test.ts`, `src/domain/game.prune.prop.test.ts`
- **Manifesto de contexto** (lista fechada):
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md` (~1,6k) · `docs/constituicao.md` (~0,5k)
  - `docs/adr/0008-poda-de-anotacoes-na-jogada-de-valor.md#Decisão` (~0,9k)
  - `specs/005b-anotacoes-e-tema/spec.md#CA-005-43` (~0,3k) e `plan.md#Tipos públicos` (bloco do domínio, ~0,4k)
  - `src/domain/game.ts` inteiro (~1,9k) · `src/domain/history.ts` inteiro (~0,7k)
  - `src/domain/serialize.ts#L1-55` (`MOVE_KIND_CODE`, `MOVE_KINDS`) (~0,6k)
  - `src/domain/notes.ts`, `src/domain/units.ts#L1-32` (`peers`/unidades), `src/domain/result.ts` (~0,6k)
  - `src/domain/game.notes.test.ts#L1-40` (convenção de teste) (~0,5k)
  - `src/domain/__arbitraries__/moves.ts` (~1,1k)
  - Total ≈ 9,5k (sem L0)
- **Estimativa:** tokens 80k/120k/220k · minutos 5/10/23
- **Agentes:** `eng-testes` → `dev`

## T02 — `place-prune` na serialização e nos geradores de teste

- **CA cobertos:** CA-005-43 (invariante 7: ida e volta com histórico contendo `place-prune`)
- **tdd:** sim
- **Testes esperados:** `src/domain/serialize.test.ts` (acrescentar casos; ou novo `serialize.prune.test.ts` se o arquivo estiver grande, `CA-005-43:`): jogo com `place-prune` serializa e volta igual (o JSON **não** ganha campo novo, ADR 0008; `pruned` é reconstruído pelo `replay` e comparado ao do original, inclusive anotações), desfazer depois de ler dá o estado anterior à poda; `place-prune` com `index`/`digit` inválido ou incoerente com o estado → `invalid-data`/`inconsistent-data` como as demais jogadas; `src/domain/serialize.prop.test.ts` e `__arbitraries__/moves.ts` incluem `place-prune` (propriedade `CA-005-43:` `deserialize(serialize(g)) = g` com sequências mistas, invariante 7; depois da leitura, `undo` e `redo` coincidem com os do original). Adulteração (viável sem campo `pruned`): `place-prune` incoerente com o estado reconstruído (célula pista; célula que o replay recusaria) → `inconsistent-data`. Cada gerador novo prova com mutante manual que produz jogadas `place-prune` com `pruned` não vazio (poda real, não só jogada sem vizinhas com X). Risco: a T01 deixa em `serialize.ts` só o código numérico; o vermelho da T02 deve falhar por asserção (ida e volta diferente), não por exceção de tipo.
- **via 7b para mutantes:** não
- **via 7b declarada (r1, 28/11/2026, commit `c5c58ee`):** sim, para os testes que nasceram verdes. Guardas de invariante: "JSON sem campo novo" e "índice 81 é `invalid-data`" (já valiam com o código numérico da T01, ADR 0008) e os testes `INV:` dos geradores (provados por mutante manual: `applyGameAction` com `gamePlace` no lugar de `gamePlaceAndPrune`). Os demais testes da T02 falharam por asserção (via 7a).
- **via 7b declarada (28/11/2026, mutação):** o teste `INV: CA-005-43: place desfeito (refazível) lido do JSON deixa notes só com as 81 chaves de índice` (`serialize.prune.test.ts`) nasce verde e existe só para matar o mutante `serialize.ts:205:34` (`pruned ?? []` → `?? ["Stryker was here"]`), que sobrevivia porque `toEqual` ignora propriedades `undefined`. Prova: com o mutante aplicado à mão, falha com `expected [...] to have a length of 81 but got 82` em `Object.keys(notes)`; produção revertida (`git diff` vazio). O sobrevivente da linha 144 segue como equivalente, a cargo do `dev`.
- **Arquivos a criar/alterar:** `src/domain/serialize.ts` (`replay` com ramo `place-prune`, sem campo novo no JSON), `src/domain/__arbitraries__/moves.ts`, `src/domain/__arbitraries__/board.ts` (se preciso), `src/domain/serialize.test.ts` (ou `serialize.prune.test.ts`), `src/domain/serialize.prop.test.ts`
- **Manifesto de contexto** (lista fechada):
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md` · `docs/constituicao.md` (~2,1k)
  - `docs/adr/0008-poda-de-anotacoes-na-jogada-de-valor.md#Decisão` (~0,9k)
  - `specs/005b-anotacoes-e-tema/spec.md#CA-005-43` (~0,3k)
  - `src/domain/serialize.ts` inteiro (~2,2k) · `src/domain/history.ts` (~0,7k) · `src/domain/game.ts#L1-60,L136-160` (`Game`, `gamePlaceAndPrune` de T01) (~1,2k)
  - `src/domain/__arbitraries__/moves.ts` (~1,1k) e `board.ts` (~0,9k)
  - `src/domain/serialize.prop.test.ts#L1-50` e `serialize.test.ts#L1-40` (convenção) (~1,2k)
  - Total ≈ 10,6k (sem L0)
- **Estimativa:** tokens 70k/110k/200k · minutos 5/9/21
- **Agentes:** `eng-testes` → `dev`

## T03 — Mensagens e visão: anotações, modo e controles

- **CA cobertos:** CA-005-45, CA-005-04 (dado da visão: `notes` por célula), base de CA-005-16, 17, 18, 23, 24, 25, 44 (textos)
- **tdd:** sim
- **Testes esperados:** `src/ui/model/messages.test.ts` (acrescentar): `CA-005-45:` `cellLabel` "Linha 3, coluna 5, vazia, anotações 2 4 9" (ordem crescente), com "em conflito" depois, sem anotações igual à 005a, valor ou pista sem anotações; `notesMessage` ("anotações 2 4 9", "sem anotações"); `historyMessage` para cada tipo de jogada (valor, apagar, anotação, apagar anotações, valor com poda) em "Desfeito" e "Refeito" (`CA-005-23/24`); textos fixos de `messages` (modo ligado/desligado, "a célula já tem valor", "nada para desfazer/refazer"). `src/ui/model/view.test.ts` (acrescentar): `gridView` devolve `notes` da célula vazia e `[]` em célula com valor (`CA-005-04`); `controlsView(game, noteMode)` (`noteMode`, `canUndo`, `canRedo`; falsos após vitória, `CA-005-42`; não lê `UiState`). `src/ui/model/reducer.test.ts`: nenhum caso novo; os existentes seguem verdes (a chamada de `cellLabel` em `playText` passa `notes: []`, correto porque a célula acabou de receber valor). `src/ui/model/messages.prop.test.ts` (acrescentar, `seed` fixa, `PROP_TIMEOUT`): `CA-005-45:` para qualquer conjunto de anotações o `cellLabel` lista os dígitos em ordem crescente, sem repetição, e sem o trecho de anotações quando o conjunto é vazio.
- **via 7b para mutantes:** não
- **Fecha `npm run check` sozinha:** `notes` obrigatório em `CellView` quebraria `reducer.ts:57`; por isso `reducer.ts` entra aqui (só esse literal, `notes: []`). `UiState` (`noteMode`, `focusTick`) fica na T04; `controlsView` recebe `noteMode` como argumento.
- **Arquivos a criar/alterar:** `src/ui/model/messages.ts`, `src/ui/model/view.ts`, `src/ui/model/reducer.ts` (só `playText`, L57), `src/ui/model/messages.test.ts`, `src/ui/model/view.test.ts`
- **Manifesto de contexto** (lista fechada):
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md` · `docs/constituicao.md` (~2,1k)
  - `specs/005b-anotacoes-e-tema/spec.md#CA-005-04,16,17,18,23,24,25,44,45` (CA com texto fixo, ~1,8k) e `plan.md#Decisões de projeto` itens 3, 6, 10 e `#Tipos públicos` (~1,2k)
  - `src/ui/model/messages.ts` (~0,3k) · `src/ui/model/view.ts` (~0,4k) · `src/ui/model/reducer.ts#L1-65` (`UiState` atual e `playText`, ~0,6k)
  - `src/domain/game.ts#L21-40,L59-75` (`Game`, `GameStatus`, `getGameConflicts`, `canUndo`, `canRedo`, `notesAt`) (~0,5k) · `src/domain/history.ts#L1-25` (`Move`) (~0,3k) · `src/domain/notes.ts`, `digit.ts`, `units.ts#L1-15` (~0,4k)
  - `src/ui/model/messages.test.ts#L1-40` e `view.test.ts#L1-40` (convenção) (~1,0k)
  - `vitest.config.ts#L10-16` (projeto `ui`) (~0,2k)
  - Total ≈ 8,5k (sem L0)
- **Estimativa:** tokens 40k/60k/110k · minutos 3/5/12
- **Agentes:** `eng-testes` → `dev`

## T04 — Reducer: modo anotação, anotar, apagar anotações, desfazer e refazer

- **CA cobertos:** CA-005-16, 17, 18, 23, 24, 25, 42, 43 (modo valor chama `gamePlaceAndPrune`), 44; política de anúncio única (CA-005-31 da 005a, estendida)
- **tdd:** sim
- **Testes esperados:** `src/ui/model/reducer.test.ts` (acrescentar, `CA-005-NN:`): `toggle-mode` alterna e anuncia ligado/desligado, não toca no jogo (16); `digit` no modo anotação alterna o candidato, anuncia as anotações atuais, sem valor (17); célula com valor e pista: estado igual, anúncios "a célula já tem valor" e "pista, não pode ser alterada" (18); `digit` no modo valor poda os vizinhos (43; um `undo` desfaz tudo); `erase` em célula vazia com anotações limpa e anuncia "vazia" (44; a ação `erase` é a mesma de Backspace, Delete, `0` e botão Apagar, que o `Grid`/`Keypad` mapeiam na T05); `undo`/`redo` de **cada tipo de jogada**: `selected` vai à célula afetada, `focusTick` sobe, anúncio "Desfeito/Refeito…", conflito criado ou eliminado anexado ao mesmo anúncio (23, 24, 20, 21); refazer que vence anuncia só a vitória; histórico vazio ou nada a refazer: estado igual, `focusTick` igual, anúncio "nada para…" (25); partida vencida: `toggle-mode`, anotação, `undo`, `redo` sem efeito e sem anúncio (42, decisão 25 do plano). `src/ui/model/reducer.prop.test.ts` (acrescentar, `seed` fixa, `PROP_TIMEOUT` M-017): `CA-005-31:` um anúncio por ação (estende a propriedade existente às ações novas); `CA-005-23:`/`CA-005-24:` ação de jogo seguida de `undo` devolve o `game` anterior, e `undo` seguido de `redo` (e vice-versa) devolve o `game` (invariante 8 pela UI), incluindo valor com poda; `CA-005-44:` `erase` em célula vazia com anotações deixa `notesAt` vazio e `game` com uma jogada nova; `CA-005-17:` duas anotações iguais seguidas = `game` original; `CA-005-16:` modo anotação nunca altera valores; `CA-005-42:` depois de `won`, `toggle-mode`, anotação, `undo` e `redo` não alteram o estado nem anunciam (estende a propriedade `CA-005-29` existente).
- **via 7b para mutantes:** não
- **Arquivos a criar/alterar:** `src/ui/model/reducer.ts` (`UiState` ganha `noteMode` e `focusTick`; `initialState` e todo literal de estado atualizados), `src/ui/model/reducer.test.ts`, `src/ui/model/reducer.prop.test.ts`
- **Manifesto de contexto** (lista fechada):
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md` · `docs/constituicao.md` (~2,1k)
  - `specs/005b-anotacoes-e-tema/spec.md#CA-005-16,17,18,23,24,25,42,43,44` (~1,8k) e `plan.md#Decisões de projeto` itens 1 a 3 e `#Tipos públicos` (~1,4k)
  - `src/ui/model/reducer.ts` (~0,85k) · `src/ui/model/messages.ts` (T03, ~0,5k) · `src/ui/model/view.ts#L1-15` (~0,2k) · `src/ui/model/navigation.ts#L1-12` (tipos, ~0,1k)
  - `src/domain/game.ts#L21-38,L59-237` (assinaturas de `gameToggleNote`, `gameClearNotes`, `gamePlaceAndPrune`, `gameUndo`, `gameRedo`, `getGameStatus`, `canUndo`, `canRedo`; só cabeçalhos) (~1,2k) · `src/domain/history.ts#L1-25` (~0,3k)
  - `src/ui/fixed-puzzle.ts#L1-12` (exports) (~0,2k)
  - `src/ui/model/reducer.test.ts#L1-40` e `reducer.prop.test.ts#L1-60` (convenção de teste e de `seed`) (~1,4k)
  - `vitest.config.ts#L10-16` (~0,2k)
  - Total ≈ 9,9k (sem L0)
- **Estimativa:** tokens 70k/110k/200k · minutos 5/9/21
- **Agentes:** `eng-testes` → `dev`

## T05 — Componentes: anotações na célula, botões, atalhos e foco

- **CA cobertos:** CA-005-04, 16, 17, 18, 23, 24, 25, 38, 42, 43, 44, 45 (na camada de componente)
- **tdd:** sim
- **Testes esperados:** `src/ui/Grid.test.tsx` (acrescentar; não existe `Cell.test.tsx`, a célula é testada pela grade): `CA-005-44:` Backspace, Delete e `0` em célula vazia com anotações apagam todas (cada tecla num `it`); nove vagas fixas na ordem 1 a 9 e só as anotações presentes preenchidas, ausentes em célula com valor (04); `aria-label` com anotações (45); `aria-hidden` nas vagas. `src/ui/Keypad.test.tsx` (acrescentar): `CA-005-44:` botão Apagar em célula vazia com anotações apaga todas. `src/ui/Actions.test.tsx` (novo): Anotar com `aria-pressed`, nome acessível exato "Anotar" nos dois estados (`getByRole('button', { name: 'Anotar' })`, o span `action-state` é `aria-hidden` e fora do nome) e indicador visual `ligado`/`desligado`; Desfazer e Refazer com `aria-disabled` (focáveis) quando indisponíveis; clique = efeito do atalho; `selected` não muda ao clicar Anotar (38, 16, 25); vencida: Desfazer e Refazer ficam `aria-disabled` e Anotar fica sem `aria-disabled`, mas o clique em qualquer dos três não muda nada (42; `Actions.tsx` e `view.ts`, `toggle-mode` é ignorado após a vitória). `src/ui/App.test.tsx` (acrescentar): `CA-005-16:` `N` com Ctrl, Alt ou Meta e `N` com `repeat` não alternam o modo (plano, decisão 5); `N`, Ctrl+Z, Ctrl+Y com foco na grade e **num botão do teclado na tela** (16, 23, 24); desfazer por botão e por teclado move o foco para a célula afetada (efeito de `focusTick`, 23); anotar, apagar anotações (17, 18, 44); valor remove anotação vizinha na tela (43); vencida: atalhos e botões sem efeito, seta ainda move (42); rajada de teclas da 005a segue passando (regressão do `byKeyboard`).
- **via 7b para mutantes:** não
- **via 7b declarada (r1, 28/11/2026, commit `feb5388`):** sim, para os testes que nasceram verdes: CA-005-45 (o `aria-label` com anotações já vem de `cellLabel`, T04/T03) e CA-005-42 (seta move após a vitória) com a regressão da rajada de setas (`byKeyboard`, 005a). Motivo: regressão de comportamento existente. Os demais falharam por asserção, elemento ausente ou símbolo novo (`Actions`).
- **Arquivos a criar/alterar:** `src/ui/Cell.tsx`, `src/ui/Grid.tsx`, `src/ui/Actions.tsx` (novo), `src/ui/App.tsx`, `src/ui/Grid.test.tsx`, `src/ui/Keypad.test.tsx`, `src/ui/Actions.test.tsx`, `src/ui/App.test.tsx`
- **Manifesto de contexto** (lista fechada):
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md` · `docs/constituicao.md` (~2,1k)
  - `specs/005b-anotacoes-e-tema/spec.md#CA-005-04,16,17,18,23,24,25,38,42,43,44,45` (~2,4k) e `plan.md#Decisões de projeto` itens 4 a 7, 9 (só o `<div class="controls">`) e `#Tipos públicos` (~1,6k)
  - `src/ui/Cell.tsx`, `Grid.tsx`, `Keypad.tsx`, `App.tsx`, `Announcer.tsx` (~1,8k)
  - `src/ui/model/reducer.ts` (de T04, ~1,3k) · `messages.ts` e `view.ts` (de T03, ~1,0k; `controlsView(game, noteMode)` chamada pelo `App`)
  - `src/domain/game.ts#L38-40,L222-237` (`GameStatus`, `getGameStatus`) (~0,2k)
  - `src/ui/Grid.test.tsx#L1-60`, `Keypad.test.tsx#L1-40`, `App.test.tsx#L1-60` (convenções, `seed` e puzzle fixo) (~2,1k)
  - `vitest.config.ts#L10-16` (~0,2k)
  - Total ≈ 12,7k (sem L0); **pesada**: se o agente reportar leitura fora do manifesto ou passar de 15k, dividir em T05a (célula, botões) e T05b (atalhos globais e foco)
- **Estimativa:** tokens 180k/260k/480k · minutos 12/22/50 (×2, decisão 30; antes 90k/130k/240k)
- **Agentes:** `eng-testes` → `dev`

## T06 — Tema escuro e tokens de anotação, com contraste estático

- **CA cobertos:** CA-005-32; CA-005-04 (contraste dos tokens de anotação)
- **tdd:** sim (os testes estáticos de contraste e de regras de `theme.css` falham sem o bloco escuro e os tokens novos)
- **Testes esperados:** `src/ui/theme.contrast.test.ts` (estender, `CA-005-32:`): lê o bloco `:root` claro e o bloco `@media (prefers-color-scheme: dark)`; pares dos dois temas: texto 4,5:1 e componente/foco 3:1 para célula normal, selecionada, vizinha, mesmo valor, conflito, pista, valor do jogador, **anotação sobre cada fundo**, botão Anotar ligado e botões desabilitados; `color-scheme: light dark` presente; os pares de anotação levam também `CA-005-04:` no nome. Sem propriedade: a entrada é uma tabela finita de pares, um `it.each` por tema e par basta. `src/ui/styles.rules.test.ts` (acrescentar): nenhum `color`/`background` literal fora de `theme.css` para os componentes novos (só `var(--…)`).
- **via 7b para mutantes:** não
- **via 7b declarada (r1, 28/11/2026, commit `1cbf8f0`):** sim, para os 21 testes verdes: 19 pares de contraste do tema claro (já atendidos) e 2 testes de `styles.rules` (CSS atual já só usa `var()`; vermelho provado com o mutante `color: #123456` em `.cell-digit`). **Desvio do §6:** esta tarefa é `tdd: sim` e a isenção de invariante foi aplicada pontualmente dentro dela, o que o §6 proíbe. O desvio foi registrado depois do fato, com aprovação do Diretor em 28/11/2026.
- **Arquivos a criar/alterar:** `src/ui/theme.css`, `src/ui/theme.contrast.test.ts`, `src/ui/styles.rules.test.ts`, `src/ui/tests/css.ts` (só se o parser precisar entender `@media` aninhado em `:root`)
- **Manifesto de contexto** (lista fechada):
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md` · `docs/constituicao.md` (~2,1k)
  - `specs/005b-anotacoes-e-tema/spec.md#CA-005-32` (~0,3k) e `plan.md#Decisões de projeto` item 8 (~0,4k)
  - `src/ui/theme.css` (~0,15k) · `src/ui/tests/css.ts` (~0,6k)
  - `src/ui/theme.contrast.test.ts` (~1,3k) · `src/ui/styles.rules.test.ts` (~0,9k)
  - `specs/_arquivo/005a-grade-acessivel/plan.md#CA-005-39` (linha da tabela, ~0,3k)
  - `.claude/skills/qualidade-web/SKILL.md` (~0,75k)
  - Total ≈ 6,8k (sem L0)
- **Estimativa:** tokens 80k/120k/220k · minutos 6/10/24 (×2, decisão 30; antes 40k/60k/110k)
- **Agentes:** `eng-testes` → `dev`

## T07 — CSS: anotações, botões e layout lado a lado, com capturas

- **CA cobertos:** CA-005-04 (visual), CA-005-38 (≥ 44×44, visual), CA-005-40
- **tdd:** isento — ajuste puramente visual/CSS (`PROCESSO.md` §6); fecha com as capturas da M-019(B) em 320, 390, 1280 px e 390 px com texto a 200%, mais 800×360 (paisagem) e o tema escuro, anexadas à `notas.md`; verificação automática vem da T08
- **Testes esperados:** nenhum novo nesta tarefa; os testes estáticos já existentes (`styles.rules.test.ts`, reduced motion) seguem verdes. A T08 prova geometria e a11y. Se a captura mostrar defeito (corte, sobreposição, anotação ilegível), vira tarefa nova `tdd: sim` antes da revisão (como T09/T10 da 005a).
- **via 7b para mutantes:** não
- **Arquivos a criar/alterar:** `src/ui/styles.css` (anotações em grade 3×3 por `cqi`, botões `.actions` e `.is-on`, `.controls`, consulta de largura/paisagem, sem `order`), `specs/005b-anotacoes-e-tema/notas.md` (tamanho gzip de JS/CSS e capturas)
- **Manifesto de contexto** (lista fechada):
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md` · `docs/constituicao.md` (~2,1k)
  - `specs/005b-anotacoes-e-tema/spec.md#CA-005-04,38,40` (~0,6k) e `plan.md#Decisões de projeto` itens 7 e 9 (~0,6k)
  - `src/ui/styles.css` (~0,9k) · `src/ui/theme.css` (de T06, ~0,3k)
  - Classes e ganchos de T05: `Cell.tsx`, `Actions.tsx`, `App.tsx` (~0,9k)
  - `.claude/skills/qualidade-web/SKILL.md` (seção "Tarefa de CSS/layout") (~0,75k)
  - `e2e/helpers.ts` (como abrir o build e capturar) (~0,7k)
  - Total ≈ 6,9k (sem L0)
- **Estimativa:** tokens 60k/100k/200k · minutos 4/8/22 (×2, decisão 30; antes 30k/50k/100k)
- **Agentes:** `dev` (sem `eng-testes`; isenta)

## T08 — E2E e acessibilidade: jornadas, modo anotação, tema escuro, lado a lado

- **CA cobertos:** CA-005-04, 16, 23, 24, 32, 38, 40, 41, 43 (25 e 42 ficam em unit + comp, como no plano: E2E é jornada, não regra)
- **tdd:** isento — teste de invariante sobre estado existente, sem código de produção novo (o vermelho é provado uma vez e descrito no corpo do commit; defeito achado vira tarefa `tdd: sim`, como T09/T10 da 005a)
- **Testes esperados:** `e2e/jogo.spec.ts` (jornada só com teclado, `CA-005-NN:`): `N` liga o modo (pegajoso entre células) e anota com 1 a 9; valor remove a anotação das vizinhas (43); Ctrl+Z e Ctrl+Y revertem e reaplicam, foco na célula afetada (23, 24); `e2e/a11y.spec.ts`: axe 0 sérias/críticas **no modo anotação** e **no escuro** (`emulateMedia({ colorScheme: 'dark' })`), separados (41, 32); `boundingBox` de Anotar/Desfazer/Refazer ≥ 44×44 em 390 px e 320 px (38); anotações na mesma posição relativa em duas células (04); viewport 1280×720 e 800×360: grade e controles lado a lado, sem sobreposição, sem rolagem horizontal, ordem de Tab = ordem visual (40). `src/ui/styles.rules.test.ts` (acrescentar, estático, `CA-005-40:`/`CA-005-04:`): consulta de mídia de largura/paisagem presente, nenhum `order`, anotações em grade 3×3 com fonte por `cqi` (o plano os classifica como CSS estático; entram aqui, não na T07, para não quebrar a isenção da T07; passam de imediato, vermelho provado contra cópia sem a regra). `e2e/helpers.ts`: helpers de anotação e de modo.
- **via 7b para mutantes:** não
- **Arquivos a criar/alterar:** `e2e/jogo.spec.ts`, `e2e/a11y.spec.ts`, `e2e/helpers.ts`, `src/ui/styles.rules.test.ts`
- **Manifesto de contexto** (lista fechada):
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md` · `docs/constituicao.md` (~2,1k)
  - `specs/005b-anotacoes-e-tema/spec.md#CA-005-04,16,23,24,25,32,38,40,41,42,43` (~2,2k) e `plan.md#Estratégia de teste` (linhas desses CA) (~1,3k)
  - `e2e/helpers.ts` (~0,7k) · `e2e/a11y.spec.ts` (~2,0k) · `e2e/jogo.spec.ts` (~1,5k)
  - Gancho de seletores de T05/T07: `Actions.tsx`, `Cell.tsx` (classes `.cell-notes`, `.note-N`, `.is-on`, `.controls`) (~0,5k)
  - Total ≈ 10,3k (sem L0)
- **Estimativa:** tokens 120k/180k/340k · minutos 8/16/36 (×2, decisão 30; antes 60k/90k/170k)
- **Agentes:** `eng-testes`

## T09 — Correção do D1: texto visível das anotações dentro do nome acessível

- **CA cobertos:** CA-005-41 (axe no modo anotação), sem mudar CA-005-45 e CA-005-04
- **tdd:** sim (defeito achado na T08; decisão 31 do plano)
- **Testes esperados:** RED pela `eng-testes`: em `src/ui/Grid.test.tsx` (acrescentar), `CA-005-41:` o texto visível da `.cell-notes` de uma célula com anotações 1, 2, 5, 9, com espaços normalizados, é "1 2 5 9", e o nome acessível contém esse texto. Em `e2e/a11y.spec.ts`, tirar o `test.fail` do teste CA-005-41 do modo anotação e o comentário do defeito. Se algum teste de componente que lê o texto das vagas quebrar no GREEN, ajustar nesta fase RED. GREEN pelo `dev`: espaço entre as vagas em `src/ui/Cell.tsx`, sem tocar `messages.ts`. Os E2E de posição das anotações (CA-005-04) e de 44 px (CA-005-38) seguem verdes.
- **via 7b para mutantes:** não
- **Arquivos a criar/alterar:** `src/ui/Cell.tsx`, `src/ui/Grid.test.tsx`, `e2e/a11y.spec.ts`, `specs/005b-anotacoes-e-tema/notas.md` (D1 resolvido)
- **Manifesto de contexto** (lista fechada):
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md` · `docs/constituicao.md` (~2,1k)
  - `specs/005b-anotacoes-e-tema/spec.md#CA-005-04,41,45` (~0,5k) · `plan.md` decisão 31 (~0,3k) · `notas.md#T08: defeitos achados` (~0,3k)
  - `src/ui/Cell.tsx` (~0,5k) · `src/ui/Grid.test.tsx#L1-60` e o bloco de `slotTexts` (~1,5k)
  - `e2e/a11y.spec.ts#L232-250` e `e2e/helpers.ts#seriousViolations,annotate` (~0,6k)
  - Total ≈ 5,8k (sem L0)
- **Estimativa:** tokens 40k/80k/160k · minutos 3/7/15 (escala da T06 e da T07)
- **Agentes:** `eng-testes` (RED) e depois `dev` (GREEN)

## T10 — Correção do foco da grade na rajada dígito + seta (E2E intermitente do CA-005-16)

- **CA cobertos:** CA-005-16 (o E2E da jornada de anotação falha em `toBeFocused()`); o CA de foco da 005a que o diagnóstico cita, CA-005-07 (setas movem seleção e foco real), sem mudá-lo
- **tdd:** sim (defeito de produção achado na revisão r1; [diagnóstico](diagnostico-e2e-ca-005-16.md))
- **Testes esperados:** RED pela `eng-testes`: em `src/ui/Grid.test.tsx` (acrescentar), `CA-005-16:` com a grade focada numa célula vazia, dispara `keydown` de um dígito e, depois de deixar o render (microtarefa) mas não os efeitos rodarem, `keydown` de `ArrowRight`, sem `act`/`fireEvent` entre as teclas; depois de os efeitos rodarem, `document.activeElement` é a célula de destino (a mesma de `is-selected`). Os testes atuais (CA-005-07, 10) seguem verdes. GREEN pelo `dev`: não depender de marca mutável limpa por efeito; ação que não move a seleção não pode apagar a marca de uma tecla de movimento posterior (opções no diagnóstico, "Correção proposta" 2). Depois do GREEN, suíte completa do E2E umas 5 vezes e com `--workers=8`.
- **via 7b para mutantes:** não (UI fica fora do Stryker)
- **Arquivos a criar/alterar:** `src/ui/Grid.test.tsx`, `src/ui/Grid.tsx`
- **Manifesto de contexto** (lista fechada):
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md` · `docs/constituicao.md` (~2,1k)
  - `specs/005b-anotacoes-e-tema/diagnostico-e2e-ca-005-16.md` (~1,3k)
  - `src/ui/Grid.tsx` (~1,7k) · `src/ui/Grid.test.tsx#L1-60` e o teste CA-005-07 (~1,5k)
  - `src/ui/model/reducer.ts#UiState,initialState` (~0,4k)
  - Total ≈ 7k (sem L0)
- **Estimativa:** tokens 30k/60k/120k · minutos 2/5/10 (menor que a T09: um teste e um arquivo de produção); custo real n/d
- **Agentes:** `eng-testes` (RED) e depois `dev` (GREEN)

## Cobertura de CA (spec: CA-005-04, 16, 17, 18, 23, 24, 25, 32, 38, 40, 41, 42, 43, 44, 45)

| CA | Tarefas |
|---|---|
| CA-005-04 | T03, T05, T06, T07, T08 |
| CA-005-16 | T03, T04, T05, T08, T10 |
| CA-005-17 | T03, T04, T05 |
| CA-005-18 | T03, T04, T05 |
| CA-005-23 | T01, T03, T04, T05, T08 |
| CA-005-24 | T01, T03, T04, T05, T08 |
| CA-005-25 | T03, T04, T05 |
| CA-005-32 | T06, T08 |
| CA-005-38 | T05, T07, T08 |
| CA-005-40 | T07, T08 |
| CA-005-41 | T08, T09 |
| CA-005-42 | T01, T03, T04, T05 |
| CA-005-43 | T01, T02, T04, T05, T08 |
| CA-005-44 | T03, T04, T05 |
| CA-005-45 | T03, T05 |

Total (inalterado na rodada 2, correções só de ordem e de texto): 480k/730k/1,35M tokens (T01 120k, T02 110k, T03 60k, T04 110k, T05 130k, T06 60k, T07 50k, T08 90k), 33/61/143 minutos de trabalho de subagente (vazão 0,88/0,7/0,57M tokens/h, M-009(b)). Manifestos conferidos por `wc -c` em 27/11/2026: nenhum passa de 15k; T05 (12,7k) fica inteira, com a divisão T05a (célula e botões) / T05b (atalhos globais e foco) como contingência se o agente passar de 15k ou reportar leitura fora do manifesto. Linhas por tarefa x agente em `docs/process/metrics.csv` (split 62/38 eng-testes/dev). `ctx_inicial_est` por tarefa para `metrics.csv` (sem L0): T01 9,5k · T02 10,6k · T03 8,5k · T04 9,9k · T05 12,7k · T06 6,8k · T07 6,9k · T08 10,3k.
