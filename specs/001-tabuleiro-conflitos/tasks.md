# Tarefas 001 — Tabuleiro e validação de conflitos

- **Spec:** [spec.md](spec.md) · **Plano:** [plan.md](plan.md)
- **Autores:** `arquiteto` + `eng-testes` · **Análise de consistência:** pendente

Rascunho do `arquiteto` (passo 1 do `/planejar`); colunas de teste revisadas pela `eng-testes` (passo 2, 23/11/2026); manifestos fechados em 23/11 (curador-pdca; ~4 caracteres por token, sem contar L0, com `docs/estado.md` ~1,3k): T01 7k, T02 6,5k, T03 5,5k, T04 7k, T05 9k, T06 12k, T07 8,5k, todos abaixo de 15k. Estimativas de tokens/minutos por tarefa somam eng-testes + dev (quebra por agente em `docs/process/metrics.csv`). Ordem: contrato e criação, conflitos, jogadas, recusas, propriedades. Dependem do ADR 0007 aprovado e das respostas às perguntas 1 e 2 do plano (se mudarem, T05 e T06 são as afetadas).

Matriz CA → tarefa: 01 T01 · 02 T01 · 03 T05 · 04 T05 · 05 T05 · 06 T05 · 07 T06 · 08 T06 · 09 T03 · 10 T03 · 11 T03 · 12 T03 · 13 T03 · 14 T03 · 15 T05 · 16 T05 · 17 T05 · 18 T05 (+T07) · 19 T03 · 20 T06 · 21 T06 · 22 T02 · 23 T04 · 24 T06 (+T07) · 25 T04 (criar) e T06 (colocar/apagar). Cobertura: 25 de 25.

**Regras de teste comuns (passo 2).** Sem UI nesta spec: nenhum E2E; pirâmide = unit + property-based. (1) Um vermelho por vez: cada linha de `it.each` entra em ciclo próprio ou em grupos da mesma classe, na ordem em que a tarefa lista. (2) Coordenadas assimétricas (linha ≠ coluna, ex.: 2,7) em todo exemplo, para matar mutante que troca `row`/`col`. (3) Valores esperados vêm de tabelas literais nos testes (grades de 81 caracteres, índices escritos à mão), nunca recomputados com a fórmula do código. (4) Propriedades usam o estilo de `digit.prop.test.ts`; falha imprime a seed e a regressão fixa `{ seed, path }` com comentário (skill `tdd-dominio`). (5) Recusa: asserção sobre `{ ok: false, reason }` inteiro (sem chave `value`). (6) `-0` como linha/coluna é inteiro de 0 a 8 e equivale a 0 (aceito); como valor de célula/jogada é recusado (`malformed-grid` / `invalid-value`).

## T01 — Contrato e criação de tabuleiro válido

- **CA cobertos:** CA-001-01, CA-001-02
- **tdd:** sim
- **Testes esperados:** `src/domain/board.test.ts`: CA-001-01 (81 células; cada uma vazia ou 1–9), CA-001-02 (pista ⇔ valor na entrada, mesma posição; demais vazias e não pista; tabuleiro e células congelados: `Object.isFrozen` no `Board`, em `cells` e em cada `Cell`). Exemplos com valores em posições assimétricas e cantos (0,0), (8,8), (0,8), (8,0). Mutar a entrada depois de criar não altera o tabuleiro (sem aliasing). Primeiro teste pode ser "fake it". Tipos de `result.ts` e `board.ts` entram aqui; `cellAt` nasce aqui. **Propriedades** (`src/domain/board.prop.test.ts`, bloco "criação"): para toda grade sem conflito (CA-001-01 e 02 em lote), o tabuleiro tem 81 células, `cellAt(r,c).value` = entrada e `given` ⇔ valor ≠ `null`. Gerador `gridWithoutConflicts`: máscara aleatória sobre uma solução fixa escrita como fixture (a solução fixa é só dado de teste, sem solver).
- **Arquivos a criar/alterar:** `src/domain/result.ts`, `src/domain/units.ts` (só `Index`, `Unit`, `UnitKind`), `src/domain/board.ts`, `src/domain/board.test.ts`, `src/domain/board.prop.test.ts`, `src/domain/__arbitraries__/grid.ts` (+ `grid.test.ts` simples; a T07 reutiliza e estende)
- **Manifesto de contexto** (lista fechada; seção/linhas quando possível):
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md`
  - `specs/001-tabuleiro-conflitos/spec.md#CA-001-01` e `#CA-001-02` (~0,4k)
  - `specs/001-tabuleiro-conflitos/plan.md#Tipos públicos` e `#Contrato das operações` (~2,5k)
  - `docs/adr/0007-convencoes-do-dominio.md#Decisão` (~0,6k)
  - `src/domain/digit.ts` (~0,1k); `src/domain/digit.test.ts` (estilo, ~0,3k)
  - `src/domain/digit.prop.test.ts` (estilo das propriedades, ~0,4k)
  - Total estimado: ~7k tokens (inclui `docs/estado.md` ~1,3k)
- **Estimativa:** tokens 45k/75k/150k · minutos 15/25/50
- **Agentes:** `eng-testes` → `dev`

## T02 — Grade de entrada malformada e `isDigit` para `unknown`

- **CA cobertos:** CA-001-22
- **tdd:** sim
- **Testes esperados:** `src/domain/board.test.ts` (tabela `it.each`): CA-001-22, em classes, uma por ciclo: (a) forma: 0, 8 e 10 linhas; uma linha com 0, 8 e 10 células (em posições diferentes: primeira, do meio, última); (b) conteúdo: célula `0`, `10`, `-1`, `2.5`, `-0`, `NaN`, `Infinity`, `-Infinity`, `'5'`, `''`, `true`, `5n`, `undefined`, objeto, array `[5]`; (c) buracos: array de linhas esparso (`new Array(9)`, buraco no meio), linha esparsa (`[1, , 3, ...]` com 9 de `length`), célula `undefined` explícita; (d) entrada que não é array de arrays: `null`, `undefined`, número, string de 9 caracteres, objeto array-like `{ length: 9 }`, 9 linhas em que uma é string de 9 caracteres ou objeto array-like; (e) limites aceitos: células `1` e `9` aceitas, `null` aceito. Toda recusa: `{ ok: false, reason: 'malformed-grid' }`. Propriedade: grade 9×9 válida com UMA célula trocada por um não-dígito qualquer (`fc.anything()` filtrado) ou uma linha truncada/estendida ⇒ `malformed-grid` (seed reproduzível). `src/domain/digit.test.ts`: `isDigit('5')`, `null`, `undefined`, `-0`, `Infinity` ⇒ `false`; casos atuais seguem. Atenção: em runtime esses casos de `isDigit` já passam hoje (`Number.isInteger` rejeita não-número), então o vermelho do alargamento para `unknown` é só de tipo: a `eng-testes` confirma se o `tsc` do `npm run check` cobre `*.test.ts`; se sim, o vermelho é o erro de tipo (declarado no commit); se não, a mudança de assinatura fica coberta pelos testes de `createBoard` (que falham em runtime) e o fato vai para `notas.md`.
- **Arquivos a criar/alterar:** `src/domain/digit.ts` (parâmetro `unknown` + type guard `Digit`), `src/domain/digit.test.ts`, `src/domain/digit.prop.test.ts` (só se a assinatura exigir ajuste), `src/domain/board.ts`, `src/domain/board.test.ts`
- **Manifesto de contexto:**
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md`
  - `specs/001-tabuleiro-conflitos/spec.md#CA-001-22` (~0,2k)
  - `specs/001-tabuleiro-conflitos/plan.md#Contrato das operações` (createBoard, ~0,5k)
  - `src/domain/board.ts` e `src/domain/board.test.ts` (resultado da T01, ~2k)
  - `src/domain/digit.ts`, `digit.test.ts`, `digit.prop.test.ts` (~0,8k)
  - Total estimado: ~6,5k tokens (inclui `docs/estado.md` ~1,3k)
- **Estimativa:** tokens 39k/65k/130k · minutos 10/20/40
- **Agentes:** `eng-testes` → `dev`

## T03 — Unidades e detecção de conflitos

- **CA cobertos:** CA-001-09, CA-001-10, CA-001-11, CA-001-12, CA-001-13, CA-001-14, CA-001-19
- **tdd:** sim
- **Testes esperados:** `src/domain/units.test.ts`: 27 unidades, ordem de `ALL_UNITS` fixa (9 `row`, 9 `column`, 9 `box`), 9 células cada, cada célula em exatamente 3 unidades (uma de cada tipo), e `unitCells` comparado com tabela literal para os 9 blocos (inclui fronteiras 2|3 e 5|6: células (2,2), (2,3), (3,2), (5,5), (5,6), (6,5)); `cellIndex(r,c)=r*9+c` em pontos assimétricos. `src/domain/conflicts.test.ts`: CA-001-09 (linha), 10 (coluna), 11 (bloco sem linha/coluna em comum), 12 (5 sem unidade comum), 13 (vazio), 14 (três repetições), 19 (`row` + `column` na mesma célula); a ordem das unidades (`row`, `column`, `box`) e das células (índice crescente) é verificada (mata mutantes de ordenação). Casos extras: CA-001-12 com pares em fronteira de bloco ((2,2)×(3,3), (0,2)×(1,3), (2,0)×(3,1)) para matar off-by-one da fórmula do bloco; CA-001-14 com triângulo (A=(0,0), B=(0,5), C=(5,0), mesmo valor: A tem `row`+`column`, B só `row`, C só `column`) e três na mesma coluna; dois valores distintos repetidos ao mesmo tempo (5 e 3, sem misturar); linha e bloco juntos (decisão 23/11: `row` + `box`, sem `column`); campo `value` do resultado; CA-001-13 com grade resolvida completa (fixture) e grade toda vazia. **Propriedade P2a** (inline, `fc.array(fc.option(digit), 81)`): `findConflicts` = oráculo ingênuo por pares. Como o oráculo reusa geometria, a independência vem dos exemplos de tabela literal acima.
- **Arquivos a criar/alterar:** `src/domain/units.ts` (`ALL_UNITS`, `unitCells`, `cellIndex`), `src/domain/conflicts.ts`, `src/domain/units.test.ts`, `src/domain/conflicts.test.ts`
- **Manifesto de contexto:**
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md`
  - `specs/001-tabuleiro-conflitos/spec.md#CA-001-09` a `#CA-001-14`, `#CA-001-19` (~1,2k)
  - `specs/001-tabuleiro-conflitos/plan.md#Tipos públicos` (units, conflicts) e `#Contrato das operações` (getConflicts) (~1,5k)
  - `src/domain/units.ts` (T01, ~0,2k); `src/domain/digit.ts` (~0,1k)
  - Total estimado: ~5,5k tokens (inclui `docs/estado.md` ~1,3k)
- **Estimativa:** tokens 60k/100k/200k · minutos 20/35/70
- **Agentes:** `eng-testes` → `dev`

## T04 — Consulta de conflitos no tabuleiro e recusa de pistas em conflito

- **CA cobertos:** CA-001-23, CA-001-25 (parte de criação); fachada `getConflicts`
- **tdd:** sim
- **Testes esperados:** `src/domain/board.test.ts`: `getConflicts(board)` devolve o mesmo que `findConflicts` dos valores; CA-001-23 (pistas repetidas em linha, em coluna e em bloco, cada uma em teste próprio, com pares fora do canto e sem linha/coluna em comum no caso do bloco ⇒ `conflicting-givens`, nenhum tabuleiro; grade sem repetição segue aceita; mesmo valor sem unidade em comum é aceito); CA-001-25 criação (malformada que também teria pistas em conflito ⇒ `malformed-grid`, com o defeito de forma antes e depois das pistas repetidas, e com célula inválida no tipo). `getConflicts` sobre tabuleiro criado nunca tem conflito (criação recusa pistas em conflito), então a fachada é testada aqui só com resultado vazio e fica provada com conflitos de verdade na T05. O exemplo de CA-001-18 migra para a T05 (precisa de `placeValue`; "criar duas vezes" seria tautologia).
- **Arquivos a criar/alterar:** `src/domain/board.ts`, `src/domain/board.test.ts`
- **Manifesto de contexto:**
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md`
  - `specs/001-tabuleiro-conflitos/spec.md#CA-001-18`, `#CA-001-23`, `#CA-001-25` (~0,8k)
  - `specs/001-tabuleiro-conflitos/plan.md#Contrato das operações` (createBoard, getConflicts) (~0,8k)
  - `src/domain/board.ts`, `src/domain/board.test.ts` (T01–T02, ~3k); assinatura de `src/domain/conflicts.ts` (~0,5k)
  - Total estimado: ~7k tokens (inclui `docs/estado.md` ~1,3k)
- **Estimativa:** tokens 30k/50k/100k · minutos 10/20/40
- **Agentes:** `eng-testes` → `dev`

## T05 — Colocar e apagar valor (caminho feliz) e conflito resultante

- **CA cobertos:** CA-001-03, CA-001-04, CA-001-05, CA-001-06, CA-001-15, CA-001-16 (conflito com pista), CA-001-17, CA-001-18 (exemplo)
- **tdd:** sim
- **Testes esperados:** `src/domain/board.test.ts`: CA-001-03 (só a célula muda; original intacto), 04 (substitui), 05 (apaga), 06 (apagar vazia: `ok`, conteúdo igual), 15 (aceito e marcado, com as células que repetem), 16 (pista e célula do jogador em conflito), 17 (conflito some ao apagar e ao trocar; e caso de três células: apagar uma deixa as outras duas ainda em conflito), 18 por exemplo (5 e depois 3 na célula A, versus só 3; e colocar-e-apagar versus nunca colocar ⇒ `getConflicts` idênticos; a propriedade fecha na T07). Em 15, um teste por unidade (linha, coluna, bloco), e um em que a jogada aceita não é recusada mesmo com conflito. Em 03: a célula colocada tem `given: false`. Resultado de `placeValue`/`eraseValue` também congelado (`Object.isFrozen` no `Board`, `cells`, `Cell`), e o `Board` original continua igual a um snapshot (profundo) tirado antes. Valida só entradas corretas; recusas ficam na T06. Limites aceitos: linha/coluna 0 e 8, valor 1 e 9, `-0` como coordenada.
- **Arquivos a criar/alterar:** `src/domain/board.ts`, `src/domain/board.test.ts`
- **Manifesto de contexto:**
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md`
  - `specs/001-tabuleiro-conflitos/spec.md#CA-001-03` a `#CA-001-06`, `#CA-001-15` a `#CA-001-17` (~1,2k)
  - `specs/001-tabuleiro-conflitos/plan.md#Contrato das operações` (placeValue, eraseValue, imutabilidade) (~0,9k)
  - `src/domain/board.ts`, `src/domain/board.test.ts` (~4k)
  - Total estimado: ~9k tokens (inclui `docs/estado.md` ~1,3k; `board.ts` + `board.test.ts` já com T01–T04, ~5,5k)
- **Estimativa:** tokens 45k/75k/150k · minutos 15/30/60
- **Agentes:** `eng-testes` → `dev`

## T06 — Recusas e precedência de motivos ao colocar e apagar

- **CA cobertos:** CA-001-07, CA-001-08, CA-001-20, CA-001-21, CA-001-24, CA-001-25 (parte de colocar/apagar), CA-001-16 (pista segue imutável)
- **tdd:** sim
- **Testes esperados:** `src/domain/board.test.ts`: CA-001-07 (valor igual e diferente em pista ⇒ `cell-is-given`), 08 (apagar pista), 20 (tabela de valores inválidos ⇒ `invalid-value`: 0, 10, -1, 2.5, `-0`, `NaN`, `Infinity`, `'5'`, `''`, `null`, `undefined`, `{}`, `[5]`, `true`, `5n`; fronteiras 1 e 9 aceitas, 0 e 10 recusadas; também numa célula do jogador já preenchida), 21 (tabela de linhas/colunas inválidas em `placeValue` e `eraseValue` ⇒ `cell-not-found`: -1, 9, 1.5, `NaN`, `Infinity`, `-Infinity`, `'3'`, `null`, `undefined`, `{}`, `[]`, `true`, `3n`; cada um em `row` (col válida) e em `col` (row válida), para matar `&&`/`||`; fronteiras 0 e 8 aceitas, -1 e 9 recusadas; **aliasing de índice**: (0,9), (1,-1), (-1,9), (8,9) apontam para índices 9, 8, 0, 89 e mesmo assim são recusados), 24 (um teste por motivo, os três `reason` distintos entre si; snapshot profundo do tabuleiro e de `getConflicts` iguais antes e depois, com tabuleiro que tem conflito; resultado sem `value`), 25 (tabela de precedência observável: `cell-not-found` > `invalid-value` (coordenada inexistente + valor inválido, em `row` e em `col`); `invalid-value` > `cell-is-given` (pista + valor inválido); pista + valor válido igual e diferente ⇒ `cell-is-given`. **Combinações não observáveis, fora da tabela:** coordenada inexistente + pista (não existe pista fora da grade), "os três motivos ao mesmo tempo" e `cell-not-found` × `cell-is-given` em `eraseValue`. Um teste de robustez cobre a inversão dessas ordens: coordenada fora da grade num tabuleiro com pistas não lança exceção), 16 (tentar mudar/apagar a pista em conflito é recusado).
- **Arquivos a criar/alterar:** `src/domain/board.ts`, `src/domain/board.test.ts`
- **Manifesto de contexto:**
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md`
  - `specs/001-tabuleiro-conflitos/spec.md#CA-001-07`, `#CA-001-08`, `#CA-001-20` a `#CA-001-21`, `#CA-001-24`, `#CA-001-25` (~1,3k)
  - `specs/001-tabuleiro-conflitos/plan.md#Contrato das operações` (ordem de validação) (~0,8k)
  - `src/domain/board.ts` e `src/domain/board.test.ts` (~5k)
  - Total estimado: ~12k tokens (inclui `docs/estado.md` ~1,3k; `board.ts` + `board.test.ts` já com T01–T05, ~8,5k). Acima de 10k: ler só os blocos `describe` de `placeValue`/`eraseValue` e a tabela de precedência por linhas; se o `board.test.ts` passar de ~7k tokens ao chegar aqui, dividir em T06a (CA-20, 21) e T06b (CA-07, 08, 16, 24, 25)
- **Estimativa:** tokens 60k/100k/200k · minutos 15/25/50
- **Agentes:** `eng-testes` → `dev`

## T07 — Propriedades transversais e geradores (invariantes 1, 2, 9)

- **CA cobertos:** CA-001-18 (propriedade), CA-001-24 (propriedade), reforço de CA-001-02, 07, 08, 09 a 14
- **tdd:** isento — teste de invariante sobre estado existente sem código de produção novo (PROCESSO.md §6; o vermelho é provado uma vez, com mutante manual descrito no corpo do commit)
- **Testes esperados:** `src/domain/__arbitraries__/board.ts` (estende `grid.ts` da T01: jogadas aleatórias válidas e inválidas, coordenadas e valores "sujos" de qualquer tipo, estados com conflito) com teste simples dos geradores (inclui verificar que o gerador "com conflito" produz conflito em fração relevante das amostras); `src/domain/board.prop.test.ts` (acrescenta ao bloco da T01): P1 pistas imutáveis sob sequência qualquer de jogadas aceitas e recusadas; P2 `getConflicts` do tabuleiro = oráculo de pares; P3 recusa nunca altera o tabuleiro e o motivo bate com um modelo de precedência escrito no teste; P4 mesmo conteúdo por sequências diferentes (gerar um alvo, alcançá-lo por dois caminhos, um deles passando por valores intermediários e apagando) ⇒ mesmos conflitos. Prova do vermelho (uma vez, mutante manual no scratchpad, descrito no corpo do commit): P1 `placeValue` sem checar pista; P2 índice de bloco com off-by-one; P3 inversão de precedência entre `invalid-value` e `cell-is-given`; P4 `getConflicts` ignorando células `given`. Conferido em 23/11: `vitest.config.ts` e `stryker.config.json` já excluem `src/domain/__arbitraries__/**` (cobertura e mutation), então não há mudança de config. Roda `npm run mutation` local no domínio (≥ 70%; sobrevivente em código novo é major: teste que mata, ou equivalente justificado em `notas.md`). Se alguma propriedade achar bug real, aquele caso deixa de ser isento: vira `test` vermelho de regressão (seed registrada) seguido de `fix` do `dev`.
- **Arquivos a criar/alterar:** `src/domain/__arbitraries__/board.ts` (+ `board.test.ts` dos geradores), `src/domain/board.prop.test.ts`
- **Manifesto de contexto:**
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md`
  - `specs/001-tabuleiro-conflitos/plan.md#Estratégia de teste` (propriedades P1–P4, ~1,5k)
  - `specs/001-tabuleiro-conflitos/spec.md#CA-001-18`, `#CA-001-24` (~0,4k)
  - `src/domain/board.ts` (~3k, só a API); `src/domain/digit.prop.test.ts` (estilo, ~0,4k)
  - `src/domain/__arbitraries__/grid.ts` (T01, ~0,5k); `src/domain/board.prop.test.ts` (bloco da T01, ~1k)
  - Total estimado: ~8,5k tokens (inclui `docs/estado.md` ~1,3k e `board.prop.test.ts` da T01, ~1k)
- **Estimativa:** tokens 33k/55k/110k · minutos 15/25/50
- **Agentes:** `eng-testes` (o `revisor` valida a isenção; `dev` só se uma propriedade achar bug)
