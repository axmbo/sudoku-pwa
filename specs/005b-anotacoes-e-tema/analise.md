# Análise de consistência — spec 005b — rodada 1 (27/11/2026)

Escopo: `spec.md` × `plan.md` × `tasks.md`, ADRs 0001/0003/0004/0007/0008, constituição, `PROCESSO.md` §6. Somente leitura; `check` não se aplica (sem diff de código).

**Veredito: não ok** (0 blocker, 2 major, 5 minor, 1 nit). Critério de saída: 0 major.

## Achados

| # | Sev. | Local | Problema | Sugestão | Dono |
|---|---|---|---|---|---|
| 1 | major | tasks.md T03 (L50-67) × T04 (L69-87); `src/ui/model/reducer.ts:57`, `messages.ts:5-9` | Ordem incoerente. T03 torna `notes` obrigatório em `CellView` e cria `controlsView(state: UiState)` lendo `noteMode`, mas `UiState.noteMode`/`focusTick` só nascem na T04. Além disso `reducer.ts:57` chama `cellLabel` com literal sem `notes`; o `tsc` quebra ao fim da T03 e o arquivo não está nos "Arquivos a criar/alterar" da T03. O pre-commit só tolera erros de símbolo inexistente no commit `test`, não no GREEN. | Trocar a ordem (T04 antes da T03 não resolve, pois T04 usa `messages`); melhor: mover a adição de `noteMode`/`focusTick` ao `UiState` e o ajuste da chamada de `cellLabel` para a T03 (declarando `reducer.ts` como arquivo alterado), ou fazer `controlsView(game, noteMode)` e `notes` opcional até a T04. Declarar a escolha na T03. | arquiteto |
| 2 | major | plan.md L16 e L109-ish (tabela de módulos, `serialize.ts`) × tasks.md T02 L35 × ADR 0008 (Decisão, 3º item) | O ADR diz que `pruned` é reconstruído pela repetição das jogadas, "sem campo novo no JSON". O plano fala em "leitura/escrita ... de `pruned`" e a T02 prevê teste de adulteração "`pruned` omitido ou incoerente → `inconsistent-data`". Sem campo no JSON, esse caso é impossível de escrever; a T02 fica com teste inviável ou o ADR é violado (major por violação de ADR aceito). | Reescrever plano/T02: só reconstrução no `replay`; trocar o teste de adulteração por "`place-prune` incoerente com o estado (célula pista, dígito igual ao valor etc.) → `inconsistent-data`" e a ida e volta comparar `pruned` do `Game` lido com o original. | arquiteto |
| 3 | minor | tasks.md T01 L20 e T02 L41 | Manifestos citam `adr/0008...#Decisão (proposta)`; o ADR está `Aceito` e o título é `## Decisão` (ADR L23). Âncora inexistente. | Corrigir para `#Decisão`. | arquiteto |
| 4 | minor | plan.md decisão 5 (L32); spec CA-005-16; tasks.md T05 L93 | `N` e Ctrl+Z/Y num `keydown` global não dizem o que fazer com `N` junto de Ctrl/Alt/Meta (Ctrl+N, Cmd+N do navegador) nem com `repeat`. Nenhum teste previsto. | Definir: `N` só sem modificadoras; incluir o caso na T05 (`App.test.tsx`) com `CA-005-16:`. | arquiteto |
| 5 | minor | plan.md decisão 6 (L33) | "Rótulo fixo Anotar" com `aria-pressed` e, ao mesmo tempo, indicador textual "Anotar: ligado". Se o texto visível entrar no nome acessível, o leitor lê "Anotar: ligado, pressionado" (duplo) e o nome deixa de ser fixo. | Decidir já no plano: indicador `aria-hidden` ou parte fora do nome (ex.: ícone/etiqueta separada), e testar o nome acessível na T05. | arquiteto |
| 6 | minor | tasks.md T04/T05 (L73, L93) × spec CA-005-44 | O CA-005-44 lista Backspace, Delete, `0` e botão Apagar; as tarefas só citam "apagar anotações (44)". Risco de só uma das quatro entradas ser testada. | Enumerar as quatro entradas nos testes esperados (reducer `erase` + `Grid.test`/`Keypad.test`). | arquiteto |
| 7 | minor | plan.md decisão 28 (L128); tasks.md (L184) | A decisão 28 manda o `curador-pdca` estimar o ciclo completo (análise, revisão, `qa-auditor`, retro) nesta `/analisar`; `tasks.md` só estima as 8 tarefas. Pendência aberta. | `curador-pdca` acrescentar a linha de estimativa do ciclo (ou registrar como pendente). | arquiteto / curador-pdca |
| 8 | nit | tasks.md T05 (L105) | T05 em 12,7k de manifesto (limite 15k) com contingência de divisão já prevista; só observar. `Total` por `wc -c` não foi reconferido por mim. | Nenhuma ação. | arquiteto |

## Verificações sem achado

- **CA × tarefa × teste:** os 15 CA da 005b (04, 16, 17, 18, 23, 24, 25, 32, 38, 40, 41, 42, 43, 44, 45) aparecem na tabela de cobertura, na estratégia de teste do plano e em ≥ 1 tarefa com teste que cita o ID. CA-005-25 e 42 em unit/comp por decisão 27 (E2E só jornada). IDs 01-45 completos entre 005a e 005b, sem duplicata nem buraco.
- **Tarefas órfãs:** nenhuma; cada tarefa mapeia CA. T07 (CSS) e T08 (E2E) estão ligadas aos CA 04/38/40 e 04/16/23/24/32/38/40/41/43.
- **Decisões 23 a 28:** 23 (T01, T02), 24 (T03, textos), 25 (T04 e T05: N e Anotar sem efeito após vitória), 26 (fora de escopo, decisão 5 só `ctrlKey`), 27 (T08 absorve estáticos de CA-005-40/04 e preserva a isenção da T07) refletidas; 28 é o achado 7.
- **Tipos públicos × tarefas:** `Move`/`HistoryEntry`/`gamePlaceAndPrune` (T01), serialização (T02), `CellView`/`cellLabel`/`notesMessage`/`historyMessage`/`controlsView` (T03, ver achado 1), `UiState`/`UiAction` (T04), `ActionsProps` (T05) batem com os arquivos listados. `history.ts`, `game.ts` (`gamePlace` L136, `gameUndo` L187, `getGameStatus` L222) e `fixed-puzzle.ts` existem; faixas de linhas dos manifestos são plausíveis (`units.ts` 32 linhas, `game.ts` 237).
- **Isenções TDD:** T07 ("ajuste puramente visual/CSS") e T08 ("teste de invariante sobre estado existente sem código de produção novo", com vermelho provado e descrito no commit) estão na lista fechada do `PROCESSO.md` §6, declaradas por tarefa. `tdd: sim` nas demais; T01-T06 com `via 7b: não` declarado.
- **ADRs/constituição:** domínio continua sem DOM/relógio/aleatoriedade (T01/T02 só tocam o domínio, `src/ui` não é importado por ele); Preact + `useReducer` sem `compat` (ADR 0003); CSP `style-src 'self'` respeitada (só classes); orçamento (ADR 0001) estimado e medido na T07; formato v1 mantido (ADR 0008, sem dado gravado). Sem dependência nova nem dado pessoal.
- **Manifestos:** todos ≤ 15k (maior: T05, ~12,7k); arquivos citados existem (`src/ui/tests/css.ts`, `__arbitraries__/moves.ts`/`board.ts`, `e2e/*`, `qualidade-web` com seção "Tarefa de CSS/layout" L32, plano 005a com CA-005-39 L116), exceto a âncora do achado 3. `Cell.test.tsx` realmente não existe (testado via `Grid.test.tsx`).
- **Nota informativa (sem ação):** `serialize.ts` tem `replay` próprio com cadeia `if/else` por tipo; sem tratamento explícito de `place-prune` a T01 deixaria o tipo cair no ramo final (`clear-notes`). A T02 já prevê o vermelho por asserção; vale o `dev` tratar o ramo na T02 e não na T01.

---

# Rodada 2 (27/11/2026)

Escopo: delta de `plan.md`, `tasks.md` e `docs/process/metrics.csv` desde a rodada 1; ADR 0008 (`## Decisão`); `src/ui/model/reducer.ts` e `messages.ts`. Somente leitura.

**Veredito: ok** (0 blocker, 0 major, 0 minor, 1 nit novo).

## Status dos achados anteriores

| # | Status | Verificação |
|---|---|---|
| 1 | resolvido | `controlsView(game, noteMode)` (plan L60, tasks T03) não depende de `UiState`; `noteMode`/`focusTick` ficam na T04 (plan L66). `reducer.ts` entra na T03 só em `playText` (`reducer.ts:57`, `cellLabel` sem `notes`), manifesto passa a `reducer.ts#L1-65` (arquivo tem 92 linhas) e T03 declara "Fecha `npm run check` sozinha". T05 chama `controlsView(game, noteMode)` (tasks L102). |
| 2 | resolvido | Plano (L16), CA-005-43 e T02 (testes e arquivos) dizem "sem campo novo no JSON", `replay` reconstrói `pruned`; adulteração agora é `place-prune` incoerente (pista; célula que o replay recusaria) → `inconsistent-data`, viável. Coerente com ADR 0008, 3º item. |
| 3 | resolvido | `#Decisão (proposta)` não aparece mais; âncora `#Decisão` existe no ADR. |
| 4 | resolvido | Decisão 5: `N` só sem Ctrl/Alt/Meta e ignora `repeat`; Ctrl+Z/Y aceitam `repeat`. Cobertura no CA-005-16 da tabela do plano. |
| 5 | resolvido | Decisão 6: nome acessível fixo "Anotar", `aria-pressed`, span `action-state` com `aria-hidden`; T05 testa `getByRole('button', { name: 'Anotar' })` exato nos dois estados. |
| 6 | resolvido | CA-005-44 enumera as quatro entradas: reducer `erase`, `Grid.test` (Backspace, Delete, `0`, um `it` cada), `Keypad.test.tsx` (existe) para o botão Apagar; arquivo entra no manifesto da T05. |
| 7 | resolvido | Linha "Estimativa registrada…" após a decisão 28 e linhas 005b em `metrics.csv`. Conferi a soma: 730k + 256k + 140k (110k revisar + 30k fix) + 85k (25k + 60k qa) + 111k = 1.322k, igual à linha `ciclo-completo`. |
| 8 | sem ação | Nit da rodada 1, mantido. |

## Achados novos

| # | Sev. | Local | Problema | Sugestão | Dono |
|---|---|---|---|---|---|
| 9 | nit | tasks.md T03 (manifesto "Total ≈ 8,5k" e rodapé "T03 8,5k") × `docs/process/metrics.csv` (linhas 005b T03, `ctx_inicial_est` 8200) | Tarefa T03 subiu de 8,2k para 8,5k por causa do `reducer.ts#L1-65`; o CSV, gerado antes, ainda tem 8200. Diferença de 300 tokens, sem efeito no limite de 15k. | Atualizar `ctx_inicial_est` para 8500 nas duas linhas T03 quando convier (ou ignorar). | curador-pdca |

## Regressões verificadas (sem achado)

- Cada tarefa fecha `check` sozinha: T01 (tipos para o `tsc`), T02 (`replay`), T03 (agora com o literal do `reducer.ts`), T04 (`UiState`). Nenhuma dependência para trás.
- Nenhum CA órfão após as mudanças; manifestos ≤ 15k (maior, T05, ~12,7k) com caminhos existentes; sem conflito com ADR 0008, constituição nem decisões 23-28.
- Cabeçalho de `tasks.md` ainda diz "rodada 2 pendente"; atualizar para o resultado desta rodada (ação do arquiteto/orquestrador, não é achado).
