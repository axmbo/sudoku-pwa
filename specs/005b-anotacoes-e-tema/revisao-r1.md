# Revisão r1 — spec 005b — 28/11/2026

Base: 2428514 · Head: 693d4ef · check: verde (48 arquivos, 1102 testes, cobertura 100%; informado pelo Orquestrador, não rodado de novo)
Veredito: **nova rodada** (0 blocker, 1 major, 3 minor, 4 nit). O major é de processo (declaração de via 7b) e se resolve em `tasks.md`/`notas.md`, sem código.

## Achados

| # | Sev. | Arquivo:linha | Achado | Sugestão |
|---|---|---|---|---|
| 1 | major | `specs/005b-anotacoes-e-tema/tasks.md:35` (T02), `:94` (T05), `:114` (T06); commits `c5c58ee`, `feb5388`, `1cbf8f0` | Testes que nascem verdes em tarefas `tdd: sim` sem "via 7b" declarada (PROCESSO §6, R1-02 da 004). T02: guardas "JSON sem campo novo" e "índice 81" e os INV dos geradores "passam de imediato"; T05: CA-005-45 no `aria-label` e CA-005-42 (seta após vitória) "já verdes"; T06: 19 pares do tema claro e 2 testes de `styles.rules` verdes, estes últimos com "isenção de invariante" pontual dentro de tarefa `tdd: sim`, o que §6 proíbe ("nunca pontual dentro de tarefa `tdd: sim`"). Todos estão divulgados no corpo do commit e têm motivo plausível (regressão do que já existia), mas a declaração na tarefa não existe. | Declarar "via 7b" com motivo nas T02, T05 e T06 em `tasks.md` (ou em `notas.md`), ou o Diretor registrar a dispensa. Sem mexer em histórico (rebase merge preserva). Candidato a melhoria: template da `eng-testes` com campo de verdes esperados. |
| 2 | minor | `tasks.md:94` × `src/ui/Actions.tsx:19-26`, `src/ui/model/view.ts:60-63` | Deriva tasks×spec já conhecida: a T05 pede "os três botões `aria-disabled`" na vitória; o código deixa Anotar sem `aria-disabled` (só ignora o clique, `reducer.ts` `toggle-mode` silencioso). CA-005-42 exige só "nada muda", então o código segue a spec; a `tasks.md` é que está desatualizada. | Corrigir o texto da T05 (a spec manda). Decisão de produto opcional: desabilitar Anotar na vitória seria acréscimo, não pedido. |
| 3 | minor | `src/domain/serialize.ts:144` (`applyPrune` também no `place`, com `pruned ?? []`) e `src/domain/history.ts:52-87` | Stryker da 005b não rodado; `notas.md` já aponta o ramo indireto de `place` como candidato a mutante. Mutante sobrevivente em código novo do domínio é major, mas não há resultado para afirmar. | Rodar o Stryker incremental (job `mutation` do CI) antes do merge; sobrevivente em `pruneTargets`/`applyPrune`/`replay` vira major na r2. |
| 4 | minor | `src/ui/styles.css:178` (`font-size: 32cqi`), `e2e/` (sem teste de tamanho), `notas.md` T07 | CA-005-04 pede anotações "legíveis"; a ~9 px em 320 px nenhum teste fixa um mínimo, e o "texto a 200%" foi emulado com `html{font-size:200%}`. Como a grade é limitada pela viewport (`min(100%, 24.75rem)`), o texto das anotações não cresce com o tamanho de fonte do usuário (WCAG 1.4.4); o mesmo vale para os dígitos desde a 005a. | Registrar como débito (issue `débito`) e incluir zoom real e leitura das anotações no roteiro manual do `qa-auditor`; opcional: E2E com piso de ~8 px renderizados em 320 px. |
| 5 | nit | `src/ui/theme.contrast.test.ts:137-138`, `theme.css` (`--color-action-disabled-*`) | Texto desabilitado exige 4,5:1 embora o WCAG isente componente inativo. Está documentado como decisão do projeto e é mais seguro que o piso; manter. | Nenhuma ação. |
| 6 | nit | `src/ui/model/reducer.ts:126` | Desfazer/refazer que deixa a grade cheia com erros não anuncia "há erros" (só a vitória é tratada). CA-005-23/24 só citam CA-005-20 e 21, então não é deriva. | Opcional, issue se importar. |
| 7 | nit | `src/ui/App.tsx:22-29` | `Shift+N` alterna o modo e `Cmd+Z` (macOS) não desfaz; a spec fala só em `N` e Ctrl+Z/Y. | Nenhuma ação. |
| 8 | nit | `git log` (`9d2a4c8`, `5af97be`, `320e2da`, `1cbf8f0`) | Trailer `Co-Authored-By` cita "Opus 5.5" em commits e "Sonnet 5.5" em outros; consistente com a escolha de modelo por tarefa, só conferir se a T09 justificou opus. | Nenhuma ação. |

## Conferido sem achado

- **Ordem TDD:** T01 `07373bf`→`2b44f5e`; T02 `c5c58ee`→`6eccb96`; T03 `ab2cf5a`/`94e5783`→`10382a9`; T04 `472cc97`/`a5eb4b9`/`4e6aee3`→`cc39bac`→`a16814d`; T05 `feb5388`→`c93b725`; T06 `1cbf8f0`→`320e2da`; T09 `9d2a4c8`→`5af97be`. Exceção do símbolo novo declarada nos commits (T01, T03, T04, T05). T07 isenta (CSS visual, `style`) e T08 isenta (invariante; vermelho provado por mutação do CSS e descrito no corpo do commit `4dde5d9`): motivos na lista fechada.
- **Domínio (ADR 0008):** `gamePlaceAndPrune`, `pruneTargets`, `applyPrune`, undo/redo e replay conferem com o ADR; sem campo novo no JSON; `GAME_FORMAT_VERSION` mantido; domínio puro (sem DOM, relógio, aleatoriedade).
- **UI:** reducer, anúncios, `focusTick` e `travel` (célula afetada via `min(cursor)`) corretos; vitória silencia modo, anotação, undo e redo; sem dependência nova, sem estilo inline, sem terceiros (CSP e privacidade ok); sem dado pessoal ou segredo no diff.
- **Tema/layout:** cor só por token (teste estático), `color-scheme: light dark`, foco global `:focus-visible`, estado do Anotar não só por cor (texto "ligado/desligado" e `aria-pressed`), botões ≥ 44 px, `@media` lado a lado sem `order`.
- **Constituição:** princípios 2, 4, 5, 9, 10 sem quebra.

## Rastreabilidade

CA-005-04 → Grid.test.tsx, view.test.ts, theme.contrast.test.ts, styles.rules.test.ts, a11y.spec.ts ·
CA-005-16 → Actions.test.tsx, reducer.test.ts, reducer.prop.test.ts, App.test.tsx, jogo.spec.ts ·
CA-005-17 → reducer.test.ts, reducer.prop.test.ts, App.test.tsx ·
CA-005-18 → reducer.test.ts, App.test.tsx ·
CA-005-23 → game.prune.test.ts, game.prune.prop.test.ts, reducer.test.ts, reducer.prop.test.ts, Actions.test.tsx, App.test.tsx, jogo.spec.ts ·
CA-005-24 → idem, mais messages.test.ts ·
CA-005-25 → reducer.test.ts, Actions.test.tsx, App.test.tsx ·
CA-005-32 → theme.contrast.test.ts, styles.rules.test.ts, a11y.spec.ts ·
CA-005-38 → Actions.test.tsx, App.test.tsx, a11y.spec.ts ·
CA-005-40 → styles.rules.test.ts, a11y.spec.ts ·
CA-005-41 → Grid.test.tsx, a11y.spec.ts ·
CA-005-42 → game.prune.prop.test.ts, reducer.test.ts, reducer.prop.test.ts, Actions.test.tsx, App.test.tsx ·
CA-005-43 → game.prune.test.ts, game.prune.prop.test.ts, serialize.prune.test.ts, serialize.prop.test.ts, reducer.test.ts, App.test.tsx, jogo.spec.ts ·
CA-005-44 → Grid.test.tsx, Keypad.test.tsx, reducer.test.ts, reducer.prop.test.ts, App.test.tsx ·
CA-005-45 → messages.test.ts, messages.prop.test.ts, Grid.test.tsx.

Todos os 15 CA têm teste que os cita. Órfãos (conferência por amostragem): só os testes `INV:` de alcance dos geradores, que seguem a convenção do projeto (prova de gerador, sem CA próprio).
