# Tarefas 005a — Grade acessível (primeira UI jogável)

- **Spec:** [spec.md](spec.md) · **Plano:** [plan.md](plan.md)
- **Autores:** `arquiteto` + `eng-testes` · **Análise de consistência:** ok em 25/11/2026 (2 rodadas, [analise.md](analise.md))

Redigido pelo `arquiteto` e refinado pela `eng-testes` (testes) e pelo `curador-pdca` (manifestos, fechados abaixo); revisado na análise r1. **8 tarefas** mais T09 e T10, de correção dos defeitos da T08 (decisão 19 do Diretor, 27/11/2026) (no teto; avaliação e alternativa de divisão em `plan.md#Avaliação do tamanho`). Ordem: contratos e lógica pura antes de componentes; estilo e E2E por último. Todos os CA da spec (30) aparecem em ao menos uma tarefa; ver tabela de cobertura no fim.

Estimativas: hipótese (calibração da 004 já com ×1,4), sem medição própria de UI. Manifestos: ~4 caracteres por token, medidos com `wc -c` quando o arquivo existe (`estado.md` ≈ 1,5k; `constituicao.md` ≈ 0,5k; `game.ts` ≈ 1,9k; `board.ts` ≈ 1,1k; `puzzle.ts` ≈ 0,6k; `conflicts.ts` ≈ 0,3k; `units.ts` ≈ 0,3k; `digit.ts` ≈ 0,1k; `result.ts` ≈ 0,1k; spec inteira ≈ 3,3k, por isso só os CA cobertos, ~0,2k cada); arquivos de saída de tarefa anterior seguem a projeção. Todos os totais abaixo de 15k.

**Manifestos fechados (curador-pdca, passo 3 do `/planejar`).** Conferidos por `wc -c` (~4 car./token): nenhum estoura os 15k; o maior é T05 (~9,6k, ~10,5k com L0 de ~0,85k), margem ≥ 4k (valores revistos na análise r1; T03 a T06 +0,3k pela decisão 16). `qualidade-web` mede ~0,7k (a lista usa 1,2k, folga). `ctx_inicial_est` por tarefa em `metrics.csv`: T01 4,7k · T02 3,2k · T03 4,5k · T04 9,2k · T05 9,6k · T06 7,6k · T07 8,9k · T08 9,1k. Risco: T05, T07 e T08 ficam perto de 9k mais leituras do código recém-escrito (Grid/Cell/CSS); se o agente reportar leituras fora do manifesto, o manifesto está pobre. Estimativa por tarefa × agente (split 62/38; T07 50/50; T08 só `eng-testes`) em `docs/process/metrics.csv`; a coluna `Estimativa` abaixo é o total da tarefa. **Incerteza:** primeira UI, sem histórico; âncora do ciclo 860k / 1,47M / 2,74M (provável: tarefas 850k).

## T01 — Puzzle fixo e `fixedGame()`

- **CA cobertos:** CA-005-01 (conteúdo: pistas e solução única), CA-005-37 (a partida nasce sempre do mesmo puzzle)
- **tdd:** sim
- **Testes esperados** (camada: unit puro, sem DOM; sem propriedade fast-check, porque o puzzle é um dado único e não há entrada a variar): `src/ui/fixed-puzzle.test.ts`: `CA-005-01:` `fixedGame()` devolve `Game` válido (sem lançar); quantidade de pistas e grade de pistas sem conflito; **solução única** (contador de soluções só no teste: escolhe a célula vazia com menos candidatos, corte em 2, teto de tempo explícito no teste para não ficar instável; roda uma vez, sem propriedade) e solução igual à de `FIXED_PUZZLE`. `CA-005-37:` mesma grade de pistas em duas chamadas (e chamadas independentes: jogar numa não altera a outra); nenhuma jogada prévia (`cursor` 0, `history` vazio). O render das 81 células e a abertura da tela ficam em T05/T08.
- **via 7b para mutantes:** não
- **Arquivos a criar/alterar:** `src/ui/fixed-puzzle.ts`, `src/ui/fixed-puzzle.test.ts`. O puzzle em si é dado a escolher pelo `dev` (uma grade conhecida de solução única, com fonte registrada no comentário). `FIXED_PUZZLE` traz os cinco campos que `createPuzzle` exige: pistas, solução, `difficulty`, `seed` (strings não vazias) e `generatorVersion` (inteiro ≥ 1); os três últimos são rótulos opacos (ex.: `'fixo'`, `'005a'`, `1`) que o gerador substitui; a unicidade é provada pelo teste, não assumida.
- **Manifesto de contexto** (lista fechada):
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md` (~1,5k)
  - `docs/constituicao.md` (~0,5k)
  - `specs/005a-grade-acessivel/spec.md#CA-005-01` e `#CA-005-37` (~0,4k)
  - `specs/005a-grade-acessivel/plan.md#Módulos e fronteiras` (linha `fixed-puzzle.ts`) e `#Tipos públicos` (bloco `fixed-puzzle.ts`) (~0,5k)
  - `src/domain/game.ts#L1-60` (`Game`, `createGame`) (~0,9k)
  - `src/domain/puzzle.ts#L1-45` (`Puzzle`, `createPuzzle`) (~0,6k)
  - `src/domain/board.ts#L1-20` (`Grid`) (~0,3k)
  - Total ≈ 4,7k (sem L0)
- **Estimativa:** tokens 40k/80k/160k · minutos 15/25/50
- **Agentes:** `eng-testes` → `dev`

## T02 — Navegação da grade (`moveSelection`)

- **CA cobertos:** CA-005-07, CA-005-08, CA-005-09
- **tdd:** sim
- **Testes esperados** (camada: unit puro; invariante de domínio da UI, então propriedade obrigatória, com `seed` reproduzível): `src/ui/model/navigation.test.ts` (exemplos, nome `CA-005-NN: ...`): setas movem uma célula (07); na borda não se move e não dá volta, os quatro lados e os quatro cantos (08); Home/End vão ao início/fim da linha mantendo a linha, Ctrl+Home/Ctrl+End a (0,0)/(8,8) (09). `navigation.prop.test.ts` (fast-check; gerador de `Selection` 0–8 × `NavigationKey` × `ctrl`, com mutante manual provando que alcança as bordas e os cantos): (07/08) resultado sempre em 0–8 e `moveSelection` nunca lança; seta fora da borda desloca exatamente 1 numa só coordenada, na borda devolve a mesma seleção (nunca dá volta); (08) aplicar a mesma seta 9 vezes converge à borda e fica lá; (09) Home/End preservam a linha e levam à coluna 0/8, Ctrl+Home/End independem da origem.
- **via 7b para mutantes:** não
- **Arquivos a criar/alterar:** `src/ui/model/navigation.ts`, `src/ui/model/navigation.test.ts`, `src/ui/model/navigation.prop.test.ts`
- **Manifesto de contexto** (lista fechada):
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md` (~1,5k)
  - `docs/constituicao.md` (~0,5k)
  - `specs/005a-grade-acessivel/spec.md#CA-005-07` a `#CA-005-09` (~0,7k)
  - `specs/005a-grade-acessivel/plan.md#Tipos públicos` (bloco `navigation.ts`) (~0,3k)
  - `src/domain/units.ts#L1-12` (`Index`) (~0,2k)
  - Total ≈ 3,2k (sem L0)
- **Estimativa:** tokens 30k/60k/120k · minutos 10/20/40
- **Agentes:** `eng-testes` → `dev`

## T03 — Textos e nomes acessíveis (`messages`)

- **CA cobertos:** CA-005-02 (nome diz "pista" só nas pistas), CA-005-03, CA-005-19 (parte do nome: "em conflito"), CA-005-20 (texto do conflito), CA-005-36 (todo texto em pt-BR, vindo de uma só fonte)
- **tdd:** sim
- **Testes esperados** (camada: unit puro): `src/ui/model/messages.test.ts`: `cellLabel` nos formatos "Linha 3, coluna 5, 7, pista", "Linha 3, coluna 5, 7", "Linha 3, coluna 5, vazia", com ", em conflito" (03/19); índices 0–8 viram 1–9 (03); `conflictMessage` para linha, coluna e caixa usa a primeira unidade de `units` e índice +1 ("Conflito: 5 repetido na linha 3") (20); constantes `noConflicts`, `givenImmutable`, `won`, `fullWithErrors` (texto exato aprovado na revisão) sem placeholder e sem palavra inglesa de uma lista curta fixa (36; teste fraco por natureza, o rigor de pt-BR é a revisão). `messages.prop.test.ts` (fast-check, `seed` reproduzível; invariante do CA-005-02): para qualquer `row`, `col` 0–8 e `CellView` válida, o rótulo contém `row+1` e `col+1`, contém "pista" **se e somente se** `given`, e contém "em conflito" se e somente se `conflicted` (02, 03, 19).
- **via 7b para mutantes:** não
- **Arquivos a criar/alterar:** `src/ui/model/messages.ts`, `src/ui/model/messages.test.ts`, `src/ui/model/messages.prop.test.ts`
- **Manifesto de contexto** (lista fechada):
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md` (~1,5k)
  - `docs/constituicao.md` (~0,5k)
  - `specs/005a-grade-acessivel/spec.md#CA-005-02`, `#CA-005-03`, `#CA-005-19`, `#CA-005-20`, `#CA-005-36` (~1,1k)
  - `specs/005a-grade-acessivel/plan.md#Tipos públicos` (bloco `messages.ts`) e `#Decisões de projeto` itens 3 e 4 (~0,6k)
  - `src/domain/conflicts.ts#L1-12` (`CellConflict`) (~0,2k)
  - `src/domain/units.ts#L1-12` (`Index`, `UnitKind`, `Unit`) (~0,2k)
  - `src/domain/digit.ts` (~0,1k)
  - `vitest.config.ts#L14` (projeto `ui`) e convenção de `seed` em `src/domain/game.prop.test.ts#L105-112` (~0,3k; decisão 16 do Diretor, 26/11/2026)
  - Total ≈ 4,5k (sem L0)
- **Estimativa:** tokens 30k/60k/120k · minutos 10/20/40
- **Agentes:** `eng-testes` → `dev`

## T04 — Reducer da UI e política de anúncio

- **CA cobertos:** CA-005-06 (`initialState`), CA-005-12, CA-005-13, CA-005-14, CA-005-15, CA-005-20, CA-005-21, CA-005-22, CA-005-26 (ação `select`), CA-005-29 (lógica: status e recusa após vitória), CA-005-30 (lógica), CA-005-31
- **tdd:** sim
- **Testes esperados** (camada: unit puro; partidas quase vencidas e cheias com erro montadas a partir de `fixedGame()` + solução de `FIXED_PUZZLE` por `digit`, sem `Game` à mão; fixture lista as células vazias em comentário): `src/ui/model/reducer.test.ts` (e `reducer.prop.test.ts` para as invariantes): `initialState` seleciona (0,0) (CA-005-06, parte lógica); `digit` em célula vazia/ com valor/ com mesmo valor (12, 13); `erase` anuncia "vazia" (14); pista: estado idêntico e `givenImmutable` (15); valor repetido aceito mais anúncio de conflito só se a célula jogada passa a estar em conflito sem estar antes (20, 22); trocar um valor em conflito por outro que continua em conflito **não** anuncia conflito (cai no conteúdo da célula) (21); apagar/trocar que elimina o último conflito anuncia `noConflicts` (21); **precedência (31)**, um caso por par vizinho: vitória vence grade cheia com erros, esta vence conflito criado, este vence `noConflicts`, este vence conteúdo da célula; `select`/`move` mudam `selected` sem mudança no `Game` e com `announcement: null` (decisão do arquiteto: anúncio é por ação, nunca herdado do estado anterior; vale também para jogada sem efeito e recusa `game-over`; `id` não avança sem anúncio novo) (26); jogada que completa igual à solução: `won`, anúncio de vitória e `digit`/`erase` posteriores sem efeito nem anúncio (29); grade cheia errada: `fullWithErrors`, sem listar células, jogo continua (30); propriedades (fast-check, `seed` reproduzível; gerador de sequências de `UiAction` com dígitos, `erase`, `select` e `move`, com mutante manual provando que alcança conflito, vitória e grade cheia errada): (31) para qualquer sequência o reducer é total (nunca lança), cada ação produz no máximo um `Announcement` e o `id` nunca decresce, crescendo estritamente quando há anúncio novo; (invariante 2) pistas inalteradas e `selected` sempre em 0–8; (invariante 9) conflito nunca fica no estado, só derivado de `getGameConflicts`; (29) depois de `won`, nenhuma `digit`/`erase` altera o `Game`; pureza: mesmo `(state, action)` ⇒ mesmo resultado (substitui o "não depende de relógio", que o lint do domínio não cobre em `ui/model`). A política de substituição do anúncio pendente é do `Announcer` (T06).
- **via 7b para mutantes:** não
- **Arquivos a criar/alterar:** `src/ui/model/reducer.ts`, `src/ui/model/reducer.test.ts`, `src/ui/model/reducer.prop.test.ts`
- **Manifesto de contexto** (lista fechada):
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md` (~1,5k)
  - `docs/constituicao.md` (~0,5k)
  - `specs/005a-grade-acessivel/spec.md#CA-005-06`, `#CA-005-12` a `#CA-005-15`, `#CA-005-20` a `#CA-005-22`, `#CA-005-26`, `#CA-005-29`, `#CA-005-30`, `#CA-005-31` (~2,8k)
  - `specs/005a-grade-acessivel/plan.md#Decisões de projeto` itens 1 a 3 e 5, e `#Tipos públicos` (blocos `reducer.ts`, `navigation.ts`, `messages.ts`) (~1,3k)
  - `src/ui/model/messages.ts` e `navigation.ts` (saída de T02/T03, projeção) (~1,0k)
  - `src/domain/game.ts#L21-60` (`Game`, refusals, `GameStatus`), `#L59-62`, `#L136-186` (`gamePlace`, `gameErase`), `#L222-end` (`getGameStatus`) (~1,3k)
  - `src/domain/result.ts` (~0,1k) · `src/domain/conflicts.ts#L1-12` (~0,2k) · `src/domain/board.ts#L57-65` (`cellAt`, para o anúncio de conteúdo) (~0,2k)
  - `src/ui/fixed-puzzle.ts` (saída de T01, só `fixedGame` na assinatura) (~0,2k)
  - `vitest.config.ts#L14` (projeto `ui`) e convenção de `seed` em `src/domain/game.prop.test.ts#L105-112` (~0,3k; decisão 16 do Diretor, 26/11/2026)
  - Total ≈ 9,2k (sem L0)
- **Estimativa:** tokens 70k/130k/260k · minutos 25/45/90
- **Agentes:** `eng-testes` → `dev`

## T05 — Grade e célula (componentes)

- **CA cobertos:** CA-005-01 (render), CA-005-02, CA-005-03, CA-005-05, CA-005-06, CA-005-07, CA-005-08, CA-005-09, CA-005-10 (parte), CA-005-11 (classe/foco programático), CA-005-12 a CA-005-15 (por teclado), CA-005-19, CA-005-26
- **tdd:** sim
- **Testes esperados** (camadas: unit puro para `gridView`; componente para Grid/Cell; testa só a fiação tecla/clique → ação e atributos/classes, **sem repetir as regras do reducer** já provadas em T04; jsdom não faz layout nem cor, então aparência real fica em T07/T08): `src/ui/model/view.test.ts` (unit, sem DOM; a derivação do realce mora aqui e não em `Cell.tsx`): `gridView` devolve 81 itens em ordem linha a linha; `selected` só na selecionada; `peer` exatamente para as 20 células de mesma linha/coluna/caixa; `sameValue` só quando a selecionada tem valor e só nas outras com o mesmo valor; `value`/`given`/`conflicted` batem com `cellAt` e `getGameConflicts` (05, 19). `src/ui/Grid.test.tsx` (Testing Library + jsdom, `getByRole`; entrada de `Grid` é `gridView`, não o domínio): `role="grid"` com 9 `row` e 81 `gridcell` (01); borda de caixa por classe (01); pista × valor do jogador por classe e `aria-label` (02, 03); exatamente uma célula com `tabindex=0` e as demais `-1` (06); setas, Home/End e Ctrl+Home/End movem `selected` e o foco real (`document.activeElement`) (07 a 09); classes de realce de linha/coluna/caixa/mesmo valor e `is-selected` independente do foco (05, 11); teclas 1 a 9, Backspace, Delete e 0 disparam `digit`/`erase` (12 a 15); marca de conflito (ícone/classe) em todas as células do conflito e "em conflito" no nome (19); clique seleciona e `tabindex=0` migra (26). Tab sai da grade (parte de 10): jsdom não move foco por Tab de forma fiel, então aqui só se afirma que nenhuma célula além da selecionada é tabulável; o resto fecha no E2E (T08). Entrada na grade em (1,1) na primeira vez e na última selecionada depois (06). Sem propriedade fast-check: a invariante de navegação já é de T02 e o componente só a liga.
- **via 7b para mutantes:** não
- **Arquivos a criar/alterar:** `src/ui/model/view.ts`, `src/ui/model/view.test.ts`, `src/ui/Grid.tsx`, `src/ui/Cell.tsx`, `src/ui/Grid.test.tsx`
- **Estrutura da célula (decisão 7 do plano):** `Cell.tsx` renderiza o dígito num filho `<span class="cell-digit">` dentro do `gridcell`; o `Grid.test.tsx` afirma que o valor aparece nesse filho.
- **Manifesto de contexto** (lista fechada):
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md` (~1,5k)
  - `docs/constituicao.md` (~0,5k)
  - `specs/005a-grade-acessivel/spec.md#CA-005-01` a `#CA-005-03`, `#CA-005-05` a `#CA-005-15`, `#CA-005-19`, `#CA-005-26` (~2,8k)
  - `specs/005a-grade-acessivel/plan.md#Módulos e fronteiras` (linhas `Grid`/`Cell`) e `#Decisões de projeto` itens 1 e 4 (~0,9k)
  - `docs/adr/0003-framework-de-ui.md#Decisão` (~0,6k)
  - `src/ui/model/reducer.ts`, `messages.ts`, `navigation.ts` (saídas T02 a T04, só exports) (~1,5k)
  - `specs/005a-grade-acessivel/plan.md#Tipos públicos` (bloco `view.ts`) (~0,3k)
  - `src/domain/board.ts#L1-20` e `#L57-65` (`CellState`, `Board`, `cellAt`) (~0,5k) · `src/domain/units.ts#L1-12` (~0,2k) · `src/domain/conflicts.ts#L1-12` (~0,2k) · assinatura de `getGameConflicts` em `game.ts` (~0,2k) · `view.ts` a escrever, projeção (~0,3k)
  - `vitest.config.ts#L14` (projeto `ui`) e convenção de `seed` em `src/domain/game.prop.test.ts#L105-112` (~0,3k; decisão 16 do Diretor, 26/11/2026)
  - Total ≈ 9,6k (sem L0)
- **Estimativa:** tokens 90k/170k/340k · minutos 30/60/120
- **Agentes:** `eng-testes` → `dev`

## T06 — Teclado na tela, região viva e `App`

- **CA cobertos:** CA-005-27, CA-005-29 (banner visível), CA-005-30 (aviso visível), CA-005-31 (região viva única), CA-005-36 (`h1`, textos), CA-005-37 (sem promessa de salvamento)
- **tdd:** sim
- **Testes esperados** (camada: componente; integração do `App` com o reducer real, sem E2E para regra): `src/ui/Keypad.test.tsx`: botões 1 a 9 e Apagar com nome acessível pt-BR, cada um dispara a ação igual ao atalho de teclado e a célula selecionada continua selecionada, mesmo com o botão focado (27). `src/ui/Announcer.test.tsx` (31): região `role="status"` educada única; dois anúncios seguidos deixam só o texto do último (substitui, não enfileira); mesmo texto com `id` novo **remonta** o nó filho (`key={id}`): a referência do elemento muda e o texto é o mesmo (o jsdom não prova a fala; ela fica no roteiro de TalkBack do `qa-auditor`); com `announcement: null` a região fica vazia sem anúncio novo. `src/ui/App.test.tsx`: monta com `fixedGame()`; um `role="status"` único com o último anúncio, rajada de jogadas deixa só o último texto (31); preencher a grade igual à solução mostra o banner de vitória e anuncia (29); preencher errado mostra o aviso de erros sem dizer onde (30); um `h1`; nenhum texto sobre salvar/persistir (36, 37).
- **via 7b para mutantes:** não
- **Arquivos a criar/alterar:** `src/ui/Keypad.tsx`, `src/ui/Announcer.tsx`, `src/ui/App.tsx`, `src/ui/Keypad.test.tsx`, `src/ui/Announcer.test.tsx`, `src/ui/App.test.tsx`, `src/main.tsx` (monta `<App/>`)
- **Manifesto de contexto** (lista fechada):
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md` (~1,5k)
  - `docs/constituicao.md` (~0,5k)
  - `specs/005a-grade-acessivel/spec.md#CA-005-27`, `#CA-005-29` a `#CA-005-31`, `#CA-005-36`, `#CA-005-37` (~1,6k)
  - `specs/005a-grade-acessivel/plan.md#Decisões de projeto` itens 2 e 5 e `#Tipos públicos` (~1,3k)
  - `src/ui/model/reducer.ts`, `messages.ts`, `fixed-puzzle.ts`, `Grid.tsx` (saídas anteriores, só exports e props) (~2,0k)
  - `src/main.tsx` (~0,2k) · `index.html` (~0,2k)
  - `vitest.config.ts#L14` (projeto `ui`) e convenção de `seed` em `src/domain/game.prop.test.ts#L105-112` (~0,3k; decisão 16 do Diretor, 26/11/2026)
  - Total ≈ 7,6k (sem L0)
- **Estimativa:** tokens 70k/130k/260k · minutos 25/45/90
- **Agentes:** `eng-testes` → `dev`

## T07 — Estilo, tokens de cor, layout e movimento reduzido

- **CA cobertos:** CA-005-02 (aparência), CA-005-05 (aparência), CA-005-11, CA-005-19 (ícone/padrão visual), CA-005-28 (tamanho; decisão (a) de 25/11/2026), CA-005-33, CA-005-34 (layout), CA-005-39
- **tdd:** isento — ajuste puramente visual/CSS (`PROCESSO.md` §6). Isenção **válida** porque a tarefa só cria CSS e, no máximo, nomes de classe sem lógica; se o `dev` precisar de lógica em `Grid`/`Cell`/`Keypad`, isso volta a T05/T06 com `tdd: sim`, não cabe aqui. Os testes estáticos do contraste (razão WCAG calculada dos pares de variáveis CSS do tema claro: texto 4,5:1, componente e foco 3:1) e da regra `prefers-reduced-motion` são escritos junto e **o vermelho é provado uma vez** (par de cor propositalmente ruim) e descrito no corpo do commit; a isenção vale pela tarefa inteira.
- **Testes esperados** (camada: verificação estática de CSS em Vitest, sem DOM; nomes `CA-005-NN: ...`): `src/ui/theme.contrast.test.ts` (lê `theme.css`; pares: texto×fundo, pista×fundo, valor do jogador×fundo, conflito×fundo, selecionada×vizinha, foco×fundo e foco×célula vizinha; **e texto de pista e de valor do jogador × cada fundo de realce** (selecionada, par de linha/coluna/caixa, mesmo valor) **× fundo de conflito**; 11, 39); `src/ui/styles.reduced-motion.test.ts` (existe `@media (prefers-reduced-motion: reduce)` que zera `transition`/`animation`; 33); `src/ui/styles.rules.test.ts` (ganchos de CSS que o jsdom não vê: regra de `:focus-visible` com `outline` não nulo (11); pista com `font-weight` diferente do valor do jogador (02); classe de conflito com `::after`/`content` ou `background-image` além de cor (19); classe `is-selected` com contorno próprio (05); **CA-005-34:** célula sem `overflow: hidden`, é contêiner (`container-type` na regra da célula) e o filho `.cell-digit` usa `cqi` no `font-size` (não a própria célula) (decisão 7 do plano), e `html` sem `font-size` em `px`). Tamanho, 320 px CSS, texto a 200% e sem rolagem: conferidos no E2E de T08 (28, 34). **CA-005-28 e CA-005-34 seguem a decisão (a) do Diretor (25/11/2026, pergunta 1 do plano):** células ≥ 44×44 px em largura ≥ ~396 px mais margens; em 320 px CSS, nove células ≥ 24×24 px lado a lado, sem sobreposição, dígito inteiro e sem rolagem horizontal; botões do teclado ≥ 44×44 px sempre.
- **via 7b para mutantes:** não
- **Arquivos a criar/alterar:** `src/ui/theme.css`, `src/ui/styles.css`, import dos estilos em `src/main.tsx`, classes em `Grid.tsx`/`Cell.tsx`/`Keypad.tsx` só se faltar gancho de estilo (sem lógica), os três testes acima (`theme.contrast.test.ts`, `styles.reduced-motion.test.ts`, `styles.rules.test.ts`)
- **Manifesto de contexto** (lista fechada):
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md` (~1,5k)
  - `docs/constituicao.md` (~0,5k)
  - `specs/005a-grade-acessivel/spec.md#CA-005-02`, `#CA-005-05`, `#CA-005-11`, `#CA-005-19`, `#CA-005-28`, `#CA-005-33`, `#CA-005-34`, `#CA-005-39` (~2,1k)
  - `specs/005a-grade-acessivel/plan.md#Decisões de projeto` itens 4, 6 e 7 e `#Riscos` (CSP, 320 px, dígito) (~1,3k)
  - `src/ui/Grid.tsx`, `Cell.tsx`, `Keypad.tsx`, `App.tsx` (nomes de classe e estrutura; saídas T05/T06) (~2,5k)
  - `.claude/skills/qualidade-web/SKILL.md` (~1,2k)
  - Total ≈ 8,9k (sem L0)
- **Estimativa:** tokens 60k/110k/220k · minutos 25/45/90
- **Agentes:** `eng-testes` → `dev`

## T08 — E2E, axe e medição de orçamento

- **CA cobertos:** CA-005-01, CA-005-06, CA-005-10, CA-005-11, CA-005-28, CA-005-29, CA-005-33, CA-005-34, CA-005-35, CA-005-36, CA-005-37, CA-005-39 (jornadas e geometria; cobertura de comportamento já está em T04 a T06)
- **tdd:** isento — teste de invariante sobre estado existente sem código de produção novo (`PROCESSO.md` §6); o vermelho é provado uma vez (ex.: cenário com asserção deliberadamente falsa) e descrito no corpo do commit. Isenção **válida só enquanto não houver código de produção**: T08 é só `eng-testes`. Se o E2E revelar defeito (ex.: CSS que estoura em 320 px), vira item novo com `tdd: sim` (o cenário já vermelho serve de RED, ou novo `test` antes do `fix`), registrado em `notas.md`; não se corrige dentro de T08.
- **Testes esperados** (camada: E2E Playwright só para jornada e geometria; nenhuma regra de negócio aqui):  `e2e/jogo.spec.ts` (Playwright): só teclado, Tab entra na grade (célula 1,1) e Shift+Tab/Tab saem, percorrendo todos os controles sem armadilha (06, 10); foco visível (11); jogar a partida inteira até vencer só com teclado (29, e 01 como pré-condição); recarregar volta ao puzzle fixo e a página não promete salvamento (37); `lang`, título e `h1` (36). `e2e/a11y.spec.ts`: axe com 0 sérias/críticas nos estados inicial, com conflito e vitória (35); regra `color-contrast` do axe ativa nos três estados (39); `emulateMedia({reducedMotion: 'reduce'})` e transição computada nula na vitória (33); `boundingBox` dos botões do teclado ≥ 44×44 em qualquer largura, e das células ≥ 44×44 em viewport ≥ ~396 px mais margens (ex.: 450 px) (28); viewport 320 px CSS: nove células por linha, cada uma ≥ 24×24, lado a lado e sem sobreposição entre vizinhas (28, 34); **emulação do CA-005-34** (o viewport do Playwright já é em px CSS, então 320 px CSS equivale a 640 px a 200% de zoom; não se emula zoom): `setViewportSize({width: 320, height: 640})` e, em cenário separado, texto a 200% com `addInitScript` que faz `document.documentElement.style.setProperty('font-size', '200%')` (CSSOM, permitido pela CSP) e confere `getComputedStyle(html).fontSize` = 2× o padrão; em ambos: `documentElement.scrollWidth ≤ clientWidth` (sem rolagem horizontal), teclado abaixo da grade (`boundingBox().y` do teclado ≥ fundo da grade), sem sobreposição, e **dígito inteiro**: em cada célula e no seu dígito `scrollWidth ≤ clientWidth` e `scrollHeight ≤ clientHeight`, com o dígito dentro do `boundingBox` da célula (34); zoom real do navegador e 640 px a 200% ficam no roteiro do `qa-auditor`; recarregar não deixa nada em `localStorage`/IndexedDB (37); sem erro de CSP no console.
- **via 7b para mutantes:** não
- **Arquivos a criar/alterar:** `e2e/jogo.spec.ts`, `e2e/a11y.spec.ts`; ajuste em `e2e/fumaca.spec.ts` só se o `h1`/estado inicial mudar o que ela afirma; registro do tamanho gzip de JS e CSS em `specs/005a-grade-acessivel/notas.md` (medição manual, sem gate; ver pergunta 2 do plano)
- **Manifesto de contexto** (lista fechada):
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md` (~1,5k)
  - `docs/constituicao.md` (~0,5k)
  - `specs/005a-grade-acessivel/spec.md#CA-005-01`, `#CA-005-06`, `#CA-005-10`, `#CA-005-11`, `#CA-005-28`, `#CA-005-29`, `#CA-005-33` a `#CA-005-37`, `#CA-005-39` (~2,5k)
  - `specs/005a-grade-acessivel/plan.md#Estratégia de teste` (~1,8k) e `#Orçamento de performance` (~0,4k)
  - `e2e/fumaca.spec.ts` (~0,5k) · `playwright.config.ts` (~0,2k)
  - `src/ui/fixed-puzzle.ts` (solução para jogar até vencer) (~0,5k)
  - `.claude/skills/qualidade-web/SKILL.md` (~1,2k)
  - Total ≈ 9,1k (sem L0)
- **Estimativa:** tokens 60k/110k/230k · minutos 25/45/90
- **Agentes:** `eng-testes` (só; defeito que o E2E revelar vira item novo `tdd: sim` com `dev`, fora desta tarefa) · `qa-auditor` fora desta lista, após o PR (roteiro manual com TalkBack e zoom real)

## T09 — Teclado na tela sem rolagem em 320 px e a 200% (fix do defeito 1 da T08)

Criada pela decisão 19 do Diretor (27/11/2026): defeitos da T08 viram tarefas `tdd: sim` antes do `/revisar 005a`.

- **CA cobertos:** CA-005-34 (sem rolagem horizontal a partir de 320 px CSS, também com texto a 200%), mantendo CA-005-28 (botões do teclado sempre ≥ 44×44 px)
- **tdd:** sim
- **Testes esperados** (camada: E2E, que já existe): RED = tirar o `test.fail` dos dois cenários "sem rolagem horizontal ..." de `e2e/a11y.spec.ts` (L191-207); o vermelho é o `scrollWidth` 337 (320 px) e 584 (200%) contra `clientWidth`. Os cenários de CA-005-28 (botões ≥ 44×44) e o resto de CA-005-34 continuam verdes. Sem teste estático novo, salvo se o `dev` precisar de gancho que os testes de `src/ui/styles.rules.test.ts` não cobrem.
- **via 7b para mutantes:** não
- **Arquivos a criar/alterar:** `e2e/a11y.spec.ts` (só o marcador, pela `eng-testes`); `src/ui/styles.css` (regra `.keypad`: hoje 5 colunas de `minmax(2.75rem, 1fr)`, que a 200% não cabem em 320 px; o `dev` escolhe a solução, ex.: colunas que quebram em mais linhas), pelo `dev`. Sem lógica em `.tsx`.
- **Manifesto de contexto** (lista fechada):
  - `CLAUDE.md` (L0, automático) · `docs/estado.md` (~1,5k) · `docs/constituicao.md` (~0,5k)
  - `specs/005a-grade-acessivel/spec.md#CA-005-28` e `#CA-005-34` e item 11 das decisões de UX (~0,6k)
  - `specs/005a-grade-acessivel/notas.md#T07` (layout) e `#T08` (defeito 1) (~1,2k)
  - `src/ui/styles.css` (~0,7k) · `src/ui/Keypad.tsx` (~0,2k)
  - `e2e/a11y.spec.ts#L150-230` (geometria) e `e2e/helpers.ts` (~1,5k) · `playwright.config.ts` (~0,2k)
  - Total ≈ 6,4k (sem L0)
- **Estimativa:** tokens 40k/80k/160k · minutos 10/20/40 (hipótese: par eng-testes + dev das T06/T07, ~95k a 107k, com RED trivial)
- **Agentes:** `eng-testes` → `dev`

## T10 — Foco real acompanha a seleção em rajada de setas (fix do defeito 2 da T08)

Criada pela decisão 19 do Diretor (27/11/2026).

- **CA cobertos:** CA-005-07 (setas movem a seleção e o foco real), CA-005-06 (exatamente uma célula tabulável, que é a selecionada)
- **tdd:** sim
- **Testes esperados** (camada: componente, determinístico): em `src/ui/Grid.test.tsx`, uma rajada de teclas de seta disparadas sem esperar os efeitos (várias `keydown` seguidas antes de o Preact rodar o efeito de foco) termina com `document.activeElement` na célula selecionada final; o teste tem de falhar hoje de forma estável (provar o vermelho repetindo a execução, não por sorte). Depois do GREEN, tirar o `test.fixme` do cenário CA-005-07 de `e2e/jogo.spec.ts` (L45) e confirmar verde em pelo menos 5 execuções seguidas (`--repeat-each=5`).
- **via 7b para mutantes:** não
- **Arquivos a criar/alterar:** `src/ui/Grid.test.tsx`, `e2e/jogo.spec.ts` (só o marcador), pela `eng-testes`; `src/ui/Grid.tsx` (`focusPending`, L35-48: consumido pelo primeiro efeito, a causa provável), pelo `dev`.
- **Manifesto de contexto** (lista fechada):
  - `CLAUDE.md` (L0, automático) · `docs/estado.md` (~1,5k) · `docs/constituicao.md` (~0,5k)
  - `specs/005a-grade-acessivel/spec.md#CA-005-06` e `#CA-005-07` (~0,4k)
  - `specs/005a-grade-acessivel/notas.md#T08` (defeito 2) (~0,4k)
  - `src/ui/Grid.tsx` (~0,6k) · `src/ui/Grid.test.tsx` (cabeçalho, `Harness` e testes de CA-005-07, por grep; ~1,5k)
  - `e2e/jogo.spec.ts#L30-70` (~0,6k)
  - `vitest.config.ts#L14` (projeto `ui`) (~0,1k)
  - Total ≈ 5,6k (sem L0)
- **Estimativa:** tokens 50k/100k/200k · minutos 15/30/60 (hipótese: corrida de efeito, depuração possível)
- **Agentes:** `eng-testes` → `dev`

## T11 — Acabamento visual: teclado na tela e dígitos da grade (defeitos da inspeção visual)

Criada pela decisão 21 do Diretor (27/11/2026), antes do merge do PR #25. A inspeção visual do build (`vite preview`, capturas em 390×844 e 1280×800) achou defeitos que os testes não pegam, porque conferem só tamanhos mínimos.

- **CA cobertos:** CA-005-28 (aparência do teclado na tela), CA-005-34 (layout, dígito inteiro), CA-005-02 (aparência dos dígitos)
- **tdd:** isento, por ser ajuste puramente visual em CSS (`PROCESSO.md` §6), verificado por inspeção visual com capturas antes e depois. Isenção **válida** só se a tarefa mexer apenas em CSS e, no máximo, em nomes de classe sem lógica. Se precisar de lógica, volta como tarefa `tdd: sim`.
- **Defeitos a corrigir:**
  1. O rótulo "Apagar" vaza para fora do botão de 44 px. Corrigir com largura mínima, sem cortar o texto nem reduzir o alvo abaixo de 44×44 px.
  2. O teclado na tela quebra em fileiras irregulares (7 + 3 a 390 px, 8 + 2 a 1280 px) e, no desktop, fica desalinhado da grade. Corrigir com distribuição regular e alinhada à largura da grade, por exemplo 5 + 5 ou uma linha única quando couber.
  3. Os dígitos das colunas 3 e 6 (e possivelmente das linhas 3 e 6), vizinhas da borda grossa da caixa, saem menores que os demais. Causa provável: o `font-size` em `cqi` medido numa célula que a borda grossa encolhe. O dígito deve ter o mesmo tamanho em todas as células.
  4. Linhas finas desalinhadas na última fileira a 390 px, se persistirem depois do item 3.
- **Verificação:** `npm run check` e `npm run e2e` verdes, sem mexer nos testes existentes. Capturas antes e depois do build (`npm run build` + `vite preview`) em 320, 390 e 1280 px de largura, e em 390 px com texto a 200%, gravadas fora do repositório e descritas no corpo do commit.
- **via 7b para mutantes:** não
- **Arquivos a criar/alterar:** `src/ui/styles.css` e, se necessário, `src/ui/theme.css`. Nomes de classe em `Keypad.tsx`/`Cell.tsx` só se faltar gancho de estilo, sem lógica.
- **Manifesto de contexto** (lista fechada):
  - `CLAUDE.md` (L0, automático) · `docs/estado.md` (~1,5k)
  - `specs/005a-grade-acessivel/spec.md#CA-005-28` e `#CA-005-34` (~0,6k)
  - `src/ui/styles.css` (~1,5k) · `src/ui/theme.css` (~0,2k) · `src/ui/Keypad.tsx` e `src/ui/Cell.tsx` (~0,7k)
  - `src/ui/styles.rules.test.ts` (ganchos que não podem quebrar; ~0,8k)
  - Total ≈ 5,3k (sem L0)
- **Estimativa:** tokens 30k/60k/120k · minutos 10/20/40 (hipótese: CSS localizado, com iteração por captura)
- **Agentes:** `dev`

## T12 — Rótulo "Apagar" acompanha o texto a 200% (minor 1 da revisão r2)

Criada pela decisão 22 do Diretor (27/11/2026), antes do merge do PR #25. Achado em `revisao-r2.md`, minor 1 e nit 3.

- **CA cobertos:** CA-005-34 (texto a 200%, sem corte e sem rolagem), CA-005-28 (alvo ≥ 44×44 px)
- **tdd:** isento, por ser ajuste puramente visual em CSS (`PROCESSO.md` §6), com nome de classe sem lógica em `Keypad.tsx` e verificado por capturas antes e depois.
- **O que corrigir:**
  1. Com texto a 200%, o rótulo "Apagar" fica no teto de `min(0.875rem, 3.8cqi)` e não cresce (WCAG 1.4.4). O rótulo deve acompanhar a ampliação do texto, como os dígitos do teclado, sem corte, sem rolagem horizontal a 320 px e com alvo ≥ 44×44 px. Sugestão da r2: com o contêiner do teclado estreito em relação ao texto (`@container`, medido em `rem`), o botão ocupa uma fileira própria de largura total e a fonte volta a escalar. A 100%, o 5 + 5 continua.
  2. Trocar o seletor `:last-child` por uma classe no botão Apagar em `Keypad.tsx` (só o nome de classe, sem lógica).
- **Verificação:** `npm run check` e `npm run e2e` verdes, sem mexer nos testes existentes. Capturas do build em 320, 390 e 1280 px e em 320 e 390 px com texto a 200%, conferidas visualmente.
- **via 7b para mutantes:** não
- **Arquivos a criar/alterar:** `src/ui/styles.css`, `src/ui/Keypad.tsx` (classe).
- **Manifesto de contexto** (lista fechada): `CLAUDE.md` (L0) · `specs/005a-grade-acessivel/spec.md#CA-005-28` e `#CA-005-34` (~0,6k) · `specs/005a-grade-acessivel/revisao-r2.md` (~1k) · `src/ui/styles.css` (~1,7k) · `src/ui/Keypad.tsx` (~0,3k) · `src/ui/styles.rules.test.ts` (~0,8k). Total ≈ 4,4k (sem L0).
- **Estimativa:** tokens 20k/40k/80k · minutos 5/10/20
- **Agentes:** `dev`

## Cobertura dos CA (30)

| CA | Tarefas | CA | Tarefas |
|---|---|---|---|
| 01 | T01, T05, T08 | 20 | T03, T04 |
| 02 | T03, T05, T07 | 21 | T04 |
| 03 | T03, T05 | 22 | T04 |
| 05 | T05, T07 | 26 | T04, T05 |
| 06 | T04, T05, T08 | 27 | T06 |
| 07 | T02, T05, T10 | 28 | T07, T08, T11, T12 |
| 08 | T02, T05 | 29 | T04, T06, T08 |
| 09 | T02, T05 | 30 | T04, T06 |
| 10 | T05 (parte), T08 | 31 | T04, T06 |
| 11 | T05, T07, T08 | 33 | T07, T08 |
| 12 a 15 | T04, T05 | 34 | T07, T08, T09, T11, T12 |
| 19 | T03, T05, T07 | 35 | T08 |
| 36 | T03, T06, T08 | 37 | T01, T06, T08 |
| 39 | T07, T08 | | |
