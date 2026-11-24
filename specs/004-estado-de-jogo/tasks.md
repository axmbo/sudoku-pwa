# Tarefas 004 — Estado de jogo (anotações, desfazer/refazer, vitória, serialização)

- **Spec:** [spec.md](spec.md) · **Plano:** [plan.md](plan.md)
- **Autores:** `arquiteto` + `eng-testes` · **Análise de consistência:** pendente

Rascunho do `arquiteto` (passo 1 do `/planejar`, 24/11/2026). Passo 2 feito (`eng-testes` revisou as colunas de teste, 24/11/2026); falta a análise do `revisor`. 8 tarefas; corte natural em 004a (T01 a T06: jogo) e 004b (T07 e T08: serialização) se o Diretor preferir (ver retorno). Ordem: contrato e criação, anotações, valor×anotação, histórico, vitória, invariantes, serialização, leitura. Depende de ADR 0007 e 0004 (Aceitos) e das decisões 1 a 5 do Diretor (seção da spec).

Estimativas: hipótese, calibrada pelas reestimativas da 001 (tokens ×2 sobre o primeiro palpite); sem medição própria. Manifestos fechados em 24/11/2026 (`curador-pdca`): tamanho de arquivo existente medido com `wc -c`/4 (seção/linhas por `sed -n | wc -c`; `estado.md` real 3,9 KB ≈ 1,0k, sem L0); arquivo que é saída de tarefa anterior (`game.ts`, `history.ts`, `notes.ts`, `puzzle.ts`, `moves.ts`, `serialize.ts`) segue a projeção do arquiteto. Totais 4,1k a 9,9k, todos abaixo de 15k; o maior (T08) tem folga de ~5k para o crescimento de `game.ts`/`history.ts`. O arquiteto superestimou plan/spec/ADR em ~40% (ex.: plan Tipos+Regras 1,2k medido contra 2,0k); `plan.md#Estratégia de teste` (~1,1k) não está nos manifestos: a `eng-testes` lê sob demanda (`leituras_fora_manifesto`).

Matriz CA → tarefa: 01 T02 · 02 T01 · 03 T02 · 04 T02 · 05 T02 · 06 T02 · 07 T02 (+T04) · 08 T03 (+T04) · 09 T03 (+T04) · 10 T03 · 11 T04 · 12 T04 · 13 T04 · 14 T04 · 15 T04 · 16 T06 · 17 T04 (+T06) · 18 T03 (+T06) · 19 T05 · 20 T05 · 21 T05 (+T06) · 22 T06 · 23 T05 · 24 T06 · 25 T08 (+prop) · 26 T07 (+prop) · 27 T08 · 28 T08 · 29 T08 · 30 T07 + T08 · 31 T07 + T08 · 32 T04 · 33 T05. Cobertura: 33 de 33.

**Regras de teste comuns** (as da 001 valem: um vermelho por vez; coordenadas assimétricas (2,7); valores esperados em tabelas literais; recusa afirmada sobre `{ ok: false, reason }` inteiro; **motivo do vermelho** pelo `PROCESSO.md` §6, com **[símbolo novo: `X`]** no primeiro teste de cada símbolo; teste que nasceria verde entra como `it` adicional no commit vermelho vizinho, via 7a; isenção sempre por tarefa). Acréscimos desta spec: (1) fixtures de partida (puzzle 9x9 pequeno e conhecido) em `src/domain/__arbitraries__/puzzle.ts`, da `eng-testes`; o `dev` não escreve em `__arbitraries__/`. (2) O tipo `Move` dos arbitrários existentes (`__arbitraries__/board.ts`, 001) colide em nome com `Move` do `history.ts` (e `moves.ts` da T06 importaria os dois). Decisão: renomear para `BoardAction` como **passo 0 da T01**, antes do primeiro vermelho, em commit próprio `refactor(test): renomeia Move dos arbitrários para BoardAction` (só teste, suíte verde antes e depois, sem comportamento novo). Toca `__arbitraries__/board.ts` e `src/domain/board.prop.test.ts` (importa `Move` nas linhas 11, 109 e 189); `board.test.ts` segue intocado. A `applyMove` do arbitrário (mesmo arquivo) mantém o nome; a `applyMove` interna do `history.ts` (T08) vive em outro módulo, sem import cruzado. (3) Jogada "sem efeito" afirma `toBe` na mesma referência de `Game`. (4) Testes novos ficam em arquivos por assunto (nomes abaixo); `board.test.ts` não é tocado. (5) **Mutation:** ao fim de cada tarefa não isenta, o Stryker incremental roda nos arquivos novos; mutante sobrevivente vira teste na própria tarefa (alvo 100% no domínio novo; abaixo disso, só com equivalente justificado em `notas.md`). Fronteiras a matar de propósito: `cursor` em 0, 1 e `history.length`; truncamento do refazível; `-0`; `before` vs `after`. (6) Propriedades: `numRuns` padrão, `seed` fixa só nas regressões; arbitrário de jogo (`__arbitraries__/moves.ts`) gera sequências de ações do jogador incluindo recusas, sem efeito, undo e redo (não só jogadas válidas), para exercitar CA-004-18.

## T01 — Puzzle, anotações e criação da partida

- **CA cobertos:** CA-004-02; `INV:` de `createPuzzle`/`createGame` (pré-condição de CA-004-24 e 29; justificativa no plano, "Estratégia de teste")
- **tdd:** sim
- **Passo 0 (antes do primeiro vermelho):** renomear `Move` → `BoardAction` em `__arbitraries__/board.ts` e `board.prop.test.ts` (ver regra comum 2); commit `refactor(test)`, suíte verde.
- **Testes esperados:**
  - `src/domain/notes.test.ts` e `notes.prop.test.ts`: CA-004-02 (toggles 7, 2, 4 → `[2,4,7]`; alternar de novo remove; prop: qualquer sequência dá lista crescente, sem repetição e congelada). **[símbolo novo: `toggleNote`]**.
  - `src/domain/puzzle.test.ts`: `INV:` recusas `malformed-puzzle` (campo ausente, `seed` vazia, `generatorVersion` 0 ou 1,5), `conflicting-givens`, `invalid-solution` (grade incompleta; contradiz pistas; com conflito); caso feliz devolve `Puzzle` congelado. **[símbolo novo: `createPuzzle`]**.
  - `src/domain/game.test.ts` (bloco "criação"): `INV:` `createGame` devolve `Game` com `cursor` 0, `history` vazio, 81 anotações vazias, `board` com as pistas; `canUndo`/`canRedo` falsos; `getGameConflicts` vazio; `notesAt` em posições assimétricas. **[símbolo novo: `createGame`]**.
- **Arquivos a criar/alterar:** `src/domain/notes.ts`, `src/domain/puzzle.ts`, `src/domain/game.ts` (tipos `Game`, `GameStatus`, `createGame`, `notesAt`, `getGameConflicts`, `canUndo`, `canRedo`), testes acima, `src/domain/__arbitraries__/puzzle.ts` (fixtures); passo 0: `src/domain/__arbitraries__/board.ts`, `src/domain/board.prop.test.ts`
- **Manifesto de contexto** (lista fechada):
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md` (~1,0k)
  - `specs/004-estado-de-jogo/spec.md#CA-004-02` (~0,1k)
  - `specs/004-estado-de-jogo/plan.md#Tipos públicos` e `#Regras de comportamento` (~1,2k)
  - `docs/adr/0007-convencoes-do-dominio.md#Decisão` (~0,6k)
  - `src/domain/board.ts#L1-32` (tipos e `createBoard`, ~0,3k); `src/domain/conflicts.ts#L1-20` (~0,2k); `src/domain/result.ts` (~0,06k); `src/domain/digit.ts` (~0,12k); `src/domain/units.ts#L1-15` (~0,15k)
  - `src/domain/__arbitraries__/board.ts#L1-17` e `src/domain/board.prop.test.ts#L1-15` (passo 0, ~0,4k); `src/domain/__arbitraries__/grid.ts` (solução fixa de fixture, ~0,2k); `src/domain/digit.test.ts` e `digit.prop.test.ts` (estilo, ~0,3k)
  - Total estimado: ~4,2k tokens (medido onde o arquivo existe; projetado onde é saída de tarefa anterior)
- **Estimativa:** tokens 60k/110k/220k · minutos 20/35/70
- **Agentes:** `eng-testes` → `dev`

## T02 — Anotações no jogo (alternar, limpar, recusas)

- **CA cobertos:** CA-004-01, 03, 04, 05, 06, 07 (a parte "desfazível" de 07 é verificada na T04; aqui: uma só entrada no histórico e sem efeito sem entrada)
- **tdd:** sim
- **Testes esperados:** `src/domain/game.notes.test.ts`: CA-004-01 (liga/desliga; demais anotações iguais; (2,7)); CA-004-03 (`cell-is-given`, `Game` e histórico iguais); CA-004-04 (`cell-has-value`); CA-004-05 em `it.each` (dígito 0, 10, 2,5, `'5'`, `undefined`, `-0` → `invalid-value`; linha/coluna -1, 9, 2,5, `'2'`, `undefined` → `cell-not-found`; os dois motivos distintos; `-0` como linha/coluna é aceito, como dígito é recusado); CA-004-06 (5 já na linha: aceita e `getGameConflicts` inalterado); CA-004-07 (limpar três anotações → uma entrada, `history.length` +1; sem anotações → `ok` e mesma referência). **[símbolos novos: `gameToggleNote`, `gameClearNotes`]**. Precedência `cell-not-found` > `invalid-value` > `cell-is-given` > `cell-has-value` em `it` próprio. Recusa e sem efeito não alteram `history` (CA-004-18, parte).
- **Arquivos a criar/alterar:** `src/domain/history.ts` (tipos `Move`, `CellMemo`, `HistoryEntry`), `src/domain/game.ts` (`gameToggleNote`, `gameClearNotes`, `commit` interno: trunca em `cursor` e acrescenta), `src/domain/game.notes.test.ts`
- **Manifesto de contexto:**
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md` (~1,0k)
  - `specs/004-estado-de-jogo/spec.md#CA-004-01`, `#CA-004-03` a `#CA-004-07` (~0,5k)
  - `specs/004-estado-de-jogo/plan.md#Tipos públicos` e `#Regras de comportamento` (~1,2k)
  - `docs/adr/0007-convencoes-do-dominio.md#Decisão` (~0,6k)
  - `src/domain/game.ts` e `src/domain/notes.ts` (saída da T01, ~1,3k); `src/domain/board.ts#L56-98` (`cellAt` e `isCoordinate` por analogia, ~0,4k); `src/domain/units.ts#L1-15` (~0,15k); `src/domain/result.ts` (~0,06k)
  - `src/domain/__arbitraries__/puzzle.ts` (fixtures, ~0,4k); `src/domain/notes.test.ts` (estilo, ~0,3k)
  - Total estimado: ~5,6k tokens (medido onde o arquivo existe; projetado onde é saída de tarefa anterior)
- **Estimativa:** tokens 60k/120k/240k · minutos 20/40/75
- **Agentes:** `eng-testes` → `dev`

## T03 — Valor e anotação: colocar e apagar no jogo

- **CA cobertos:** CA-004-08, 09, 10, 18 (parte: recusas da 001 e jogadas sem efeito; a parte "não descarta o refazível" fica na T04 e na T06). A parte "desfazer devolve" de 08 e 09 é verificada na T04.
- **tdd:** sim
- **Testes esperados:** `src/domain/game.values.test.ts`: CA-004-08 (anotações 2 e 9, coloca 9 → valor 9 e sem anotações; só a própria célula); CA-004-09 (apagar deixa vazia e sem anotações); CA-004-10 (anotação 6 nos vizinhos de linha, coluna e bloco permanece; uma entrada); CA-004-18 em `it.each`: recusas da 001 repassadas (`cell-not-found`, `invalid-value`, `cell-is-given`) sem entrada no histórico; colocar o valor que a célula já tem e apagar célula vazia → `ok`, mesma referência, histórico igual. **[símbolos novos: `gamePlace`, `gameErase`]**. Valor errado sem conflito é aceito normalmente (base do CA-004-33, afirmado na T05).
- **Arquivos a criar/alterar:** `src/domain/game.ts` (`gamePlace`, `gameErase`, reusando `placeValue`/`eraseValue`), `src/domain/history.ts` (aplicar `place`/`erase`/`CellMemo`), `src/domain/game.values.test.ts`
- **Manifesto de contexto:**
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md` (~1,0k)
  - `specs/004-estado-de-jogo/spec.md#CA-004-08` a `#CA-004-10` e `#CA-004-18` (~0,3k)
  - `specs/004-estado-de-jogo/plan.md#Tipos públicos` e `#Regras de comportamento` (~1,2k)
  - `src/domain/game.ts` (saída das T01 e T02, ~1,6k); `src/domain/history.ts` (~0,6k); `src/domain/notes.ts` (~0,3k)
  - `src/domain/board.ts#L56-98` (assinaturas e recusas de `placeValue`/`eraseValue`, ~0,4k); `src/domain/result.ts` (~0,06k)
  - `src/domain/__arbitraries__/puzzle.ts` (~0,4k); `src/domain/game.notes.test.ts#L1-40` (estilo, ~0,5k)
  - Total estimado: ~6,4k tokens (medido onde o arquivo existe; projetado onde é saída de tarefa anterior)
- **Estimativa:** tokens 60k/110k/220k · minutos 20/35/70
- **Agentes:** `eng-testes` → `dev`

## T04 — Desfazer e refazer

- **CA cobertos:** CA-004-11, 12, 13, 14, 15, 17 (exemplos), 32; fecha as partes "desfazer" de CA-004-07, 08 e 09
- **tdd:** sim
- **Testes esperados:** `src/domain/game.history.test.ts`: CA-004-11 (volta a valores e anotações; `canRedo` verdadeiro); CA-004-12 (refazer = estado de antes do desfazer, `toEqual`); CA-004-13 (`nothing-to-undo`, mesma referência); CA-004-14 (`nothing-to-redo` sem desfazer e depois de refazer tudo); CA-004-15 (jogada nova com algo refazível → `canRedo` falso e `history` truncado); CA-004-17 (um exemplo por tipo de jogada: `place`, `erase`, `toggle-note`, `clear-notes`, cada desfazer restaura o anterior); CA-004-32 (toggles 2, 5, 8, um desfazer → só o 8 sai); CA-004-07/08/09 (desfazer de limpar, de colocar sobre anotações 2 e 9, de apagar). **[símbolos novos: `gameUndo`, `gameRedo`]**. Os casos de CA-004-15 e de "desfazer de toggle" podem nascer verdes com o `commit` da T02: via 7a (no commit vermelho de `gameUndo`) ou via 7b (T06).
- **Arquivos a criar/alterar:** `src/domain/history.ts` (`undo`/`redo` internos usando `before`), `src/domain/game.ts` (`gameUndo`, `gameRedo`), `src/domain/game.history.test.ts`
- **Manifesto de contexto:**
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md` (~1,0k)
  - `specs/004-estado-de-jogo/spec.md#CA-004-07` a `#CA-004-09`, `#CA-004-11` a `#CA-004-15`, `#CA-004-17`, `#CA-004-32` (~0,7k)
  - `specs/004-estado-de-jogo/plan.md#Tipos públicos` e `#Regras de comportamento` (~1,2k)
  - `src/domain/game.ts` (saída de T01 a T03, ~2,2k); `src/domain/history.ts` (~0,8k); `src/domain/result.ts` (~0,06k)
  - `src/domain/__arbitraries__/puzzle.ts` (~0,4k); `src/domain/game.values.test.ts#L1-40` (estilo, ~0,5k)
  - Total estimado: ~6,9k tokens (medido onde o arquivo existe; projetado onde é saída de tarefa anterior)
- **Estimativa:** tokens 70k/140k/280k · minutos 25/45/90
- **Agentes:** `eng-testes` → `dev`

## T05 — Estado derivado e vitória

- **CA cobertos:** CA-004-19, 20, 21, 23, 33
- **tdd:** sim
- **Testes esperados:** `src/domain/game.status.test.ts`: CA-004-19 (uma célula faltando, correto 3 → `won`); CA-004-20 (cheia e errada, com e sem conflito → `full-incorrect`, distinto de `incomplete`); CA-004-21 (incompleta com todos os valores corretos → `incomplete`); CA-004-33 (coloca 7 onde o correto é 3, sem conflito → aceito, `incomplete`, `getGameConflicts` vazio); CA-004-23 em `it.each` sobre as seis operações (`gamePlace`, `gameErase`, `gameToggleNote`, `gameClearNotes`, `gameUndo`, `gameRedo`) → `{ ok:false, reason:'game-over' }`, e precedência: `game-over` vence `cell-not-found`/`invalid-value`/`cell-is-given`. CA-004-19/20/21 também em `it.each` sobre a fronteira da grade cheia (80 de 81 células certas; 81 com uma errada; 81 certas com uma pista) para matar mutantes de contagem. **[símbolo novo: `getGameStatus`]**. O guard `game-over` entra uma operação por ciclo (via 7a para as que o GREEN anterior generaliza).
- **Arquivos a criar/alterar:** `src/domain/game.ts` (`getGameStatus` e guard `game-over` nas seis operações), `src/domain/game.status.test.ts`
- **Manifesto de contexto:**
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md` (~1,0k)
  - `specs/004-estado-de-jogo/spec.md#CA-004-19` a `#CA-004-21`, `#CA-004-23`, `#CA-004-33` (~0,4k)
  - `specs/004-estado-de-jogo/plan.md#Tipos públicos` e `#Regras de comportamento` (~1,2k)
  - `src/domain/game.ts` (saída de T01 a T04, ~2,6k); `src/domain/conflicts.ts#L1-20` (~0,2k); `src/domain/result.ts` (~0,06k)
  - `src/domain/__arbitraries__/puzzle.ts` (~0,4k); `src/domain/game.history.test.ts#L1-40` (estilo, ~0,5k)
  - Total estimado: ~6,4k tokens (medido onde o arquivo existe; projetado onde é saída de tarefa anterior)
- **Estimativa:** tokens 50k/100k/200k · minutos 20/35/70
- **Agentes:** `eng-testes` → `dev`

## T06 — Propriedades e invariantes do jogo

- **CA cobertos:** CA-004-16, 21 (parte propriedade), 22, 24, e a parte propriedade de CA-004-17 e 18; mais `INV:` invariantes 9 e 10 (ver abaixo). A propriedade de CA-004-02 fica só em `notes.prop.test.ts` (T01), sem duplicar aqui; no nível do `Game`, só a checagem de `notesAt` dentro da propriedade de sequência.
- **tdd:** isento — teste de invariante sobre estado existente sem código de produção novo (`PROCESSO.md` §6); o vermelho é provado uma vez contra mutante manual descrito no corpo do commit (ex.: `gameUndo` que não restaura `notes`; `getGameStatus` que ignora conflito ou a igualdade com a solução; `commit` que não trunca o refazível). Validade da isenção: confere com a lista fechada do `PROCESSO.md` §6 (teste de invariante sobre estado existente, sem código de produção novo), pois a T06 só roda depois da T05 e `moves.ts` é código de teste. Se uma propriedade achar defeito, deixa de ser isenta naquele caso e segue RED→GREEN com registro em `notas.md`.
- **Testes esperados:** `src/domain/game.prop.test.ts` (estilo de `digit.prop.test.ts`; falha imprime a seed e a regressão fixa `{ seed, path }`): CA-004-16 (500 jogadas válidas geradas; desfaz tudo = estado inicial; refaz tudo = idêntico; `numRuns` reduzido pelo custo); CA-004-17/invariante 8 (`gameUndo(apply(g,m))` = `g` para toda jogada aceita; `gameRedo(gameUndo(g))` = `g` sem jogada nova); CA-004-18 (jogada recusada ou sem efeito: `history` e `canRedo` iguais); CA-004-21 (jogo incompleto, com todos os valores colocados corretos, nunca `won`); CA-004-22/invariante 10 (`won` ⇔ grade cheia, sem conflito e igual à solução, sobre jogos quase completos com valor certo ou perturbado; `won` ⇒ sem conflito; com conflito ⇒ não `won`); `INV:` invariante 9 (`getGameConflicts(g)` = `getConflicts(g.board)` para todo jogo gerado: conflito derivado, nunca armazenado); CA-004-24/invariante 2 (`puzzle` e pistas inalterados após qualquer sequência de jogadas/undo/redo); notas de toda célula crescentes e únicas ao longo das sequências (verificação dentro das propriedades acima, sem propriedade própria).
- **Arquivos a criar/alterar:** `src/domain/game.prop.test.ts`, `src/domain/__arbitraries__/moves.ts` (+ `moves.test.ts` simples: gerador de ação de jogo sobre um `Game`, incluindo recusas, sem efeito, undo e redo, e gerador de jogo quase completo; `eng-testes`)
- **Manifesto de contexto:**
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md` (~1,0k)
  - `specs/004-estado-de-jogo/spec.md#CA-004-16`, `#CA-004-17`, `#CA-004-18`, `#CA-004-22`, `#CA-004-24` (~0,4k)
  - `specs/004-estado-de-jogo/plan.md#Tipos públicos` (~0,9k)
  - `.claude/skills/dominio-sudoku/SKILL.md#Invariantes` (~0,2k)
  - Assinaturas exportadas de `src/domain/game.ts`, `notes.ts` e `puzzle.ts` (`grep -n "^export"`, ~0,6k); `src/domain/__arbitraries__/board.ts#L1-30` (~0,6k) e `grid.ts` (~0,2k); `src/domain/__arbitraries__/puzzle.ts` (~0,4k)
  - `src/domain/digit.prop.test.ts` (estilo, ~0,15k)
  - Total estimado: ~4,1k tokens (medido onde o arquivo existe; projetado onde é saída de tarefa anterior)
- **Estimativa:** tokens 40k/80k/160k · minutos 20/40/80
- **Agentes:** `eng-testes` (o `dev` só entra se a propriedade achar defeito: aí a tarefa volta ao ciclo RED→GREEN do caso, com `notas.md`)

## T07 — Serializar a partida

- **CA cobertos:** CA-004-26, e a parte "serializa" de CA-004-30 e 31
- **tdd:** sim
- **Testes esperados:** `src/domain/serialize.test.ts`: CA-004-26 (resultado é JSON com `schemaVersion` 1 inteiro; duas serializações idênticas byte a byte; ordem de chaves fixa, com exemplo dourado literal escrito à mão para um jogo pequeno); CA-004-31 (com conflito presente, o texto não contém conflitos nem status; `before` fora do dado; tempo fora); CA-004-30 (partida `won` serializa com o mesmo histórico, inclusive `cursor`). Notas como máscara de bits e jogadas como `[tipo, índice, dígito]` conferidas em tabela literal. `src/domain/serialize.prop.test.ts` (criado aqui): CA-004-26 (para todo jogo gerado por `__arbitraries__/moves.ts`, duas serializações idênticas byte a byte e `JSON.parse` válido com `schemaVersion` 1) e CA-004-31 (o texto nunca contém `status` nem `conflicts`). **[símbolo novo: `serializeGame`]**.
- **Arquivos a criar/alterar:** `src/domain/serialize.ts` (`GAME_FORMAT_VERSION`, `serializeGame`), `src/domain/serialize.test.ts`, `src/domain/serialize.prop.test.ts`
- **Manifesto de contexto:**
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md` (~1,0k)
  - `specs/004-estado-de-jogo/spec.md#CA-004-26`, `#CA-004-30`, `#CA-004-31` (~0,2k)
  - `specs/004-estado-de-jogo/plan.md#Tipos públicos` (~0,9k) e `#Formato serializado` (~0,4k)
  - `docs/adr/0004-persistencia-local.md#Decisão` (linhas 24-35, ~0,7k)
  - Assinaturas exportadas de `src/domain/game.ts`, `history.ts` e `puzzle.ts` (~0,9k)
  - `src/domain/__arbitraries__/puzzle.ts` e `moves.ts` (~0,9k); `src/domain/game.status.test.ts#L1-40` (estilo, ~0,5k)
  - Total estimado: ~5,5k tokens (medido onde o arquivo existe; projetado onde é saída de tarefa anterior)
- **Estimativa:** tokens 40k/80k/160k · minutos 15/30/60
- **Agentes:** `eng-testes` → `dev`

## T08 — Ler a partida: recusas, coerência e ida e volta

- **CA cobertos:** CA-004-25, 27, 28, 29, e a parte "lê" de CA-004-30 e 31
- **tdd:** sim
- **Testes esperados:** `src/domain/deserialize.test.ts`: CA-004-28 em `it.each` (`''`, texto que não é JSON, JSON que não é objeto, campo obrigatório ausente, tipo errado, `schemaVersion` ausente/`1.5`/`'1'`/`0`/`-1` → `invalid-data`, sem lançar: captura não-lançante da regra 10 da 001); CA-004-27 (`schemaVersion` 2 e 99, inclusive com o resto do dado ilegível → `future-version`; a entrada não é alterada); CA-004-29 em `it.each` (valor sobre pista diferente do dado; anotação em célula com valor; solução que contradiz as pistas; histórico que não leva ao estado gravado; `cursor` negativo, maior que `moves.length` e não inteiro; extras do plano: refazíveis inaplicáveis em sequência, vitória antes do último movimento aplicado → `inconsistent-data`); CA-004-30 (vencida volta `won`, mesmo histórico); CA-004-31 (conflitos e status recalculados iguais aos da original); CA-004-25 (jogo com valores, anotações, refazíveis e puzzle completo volta `toEqual`; desfazer até o inicial e refazer funcionam). `src/domain/serialize.prop.test.ts` (acrescenta ao da T07): CA-004-25/invariante 7 (`deserializeGame(serializeGame(g))` = `g` para jogos gerados por sequências de `__arbitraries__/moves.ts` com undo e redo, portanto com refazíveis e cursor em 0); CA-004-28 (fuzz: `fc.anything()`/`fc.string()` e JSON mutado nunca lançam, sempre `ok` ou um dos três motivos); CA-004-27 (qualquer inteiro ≥ 2 → `future-version`); e regressão de tempo (jogo de 10.000 jogadas lê em tempo registrado em `notas.md`, sem limiar inventado). **[símbolo novo: `deserializeGame`]**. Precedência: `invalid-data` < `future-version` < `inconsistent-data` conforme o plano ("deserializeGame ordem").
- **Arquivos a criar/alterar:** `src/domain/serialize.ts` (`deserializeGame`, replay com arrays locais), `src/domain/history.ts` (exportar o `applyMove` interno para o replay, se ainda não for), `src/domain/deserialize.test.ts`, `src/domain/serialize.prop.test.ts` (já existente da T07)
- **Manifesto de contexto:**
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md` (~1,0k)
  - `specs/004-estado-de-jogo/spec.md#CA-004-25`, `#CA-004-27` a `#CA-004-31` (~0,5k)
  - `specs/004-estado-de-jogo/plan.md#Tipos públicos` (~0,9k), `#Regras de comportamento` (~0,4k) e `#Formato serializado` (~0,4k)
  - `docs/adr/0004-persistencia-local.md#Decisão` (linhas 24-35, ~0,7k)
  - `src/domain/serialize.ts` (saída da T07, ~0,6k); `src/domain/game.ts` (~2,6k); `src/domain/history.ts` (~0,9k); `src/domain/puzzle.ts` (~0,5k)
  - `src/domain/__arbitraries__/puzzle.ts` e `moves.ts` (~0,9k); `src/domain/serialize.test.ts#L1-40` (estilo, ~0,5k)
  - Total estimado: ~9,9k tokens (medido onde o arquivo existe; projetado onde é saída de tarefa anterior)
- **Estimativa:** tokens 100k/200k/400k · minutos 35/60/120
- **Agentes:** `eng-testes` → `dev`
