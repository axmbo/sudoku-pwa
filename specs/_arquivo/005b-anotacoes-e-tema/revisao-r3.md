# Revisão r3 — spec 005b — 28/11/2026

Base: 5e29174 · Head: 6fe8dcf · check: verde (1104 testes, cobertura 100%; informado pelo Orquestrador, não rodado por esta revisão, Stryker completo em andamento)
Veredito: **sai, condicionado ao resultado do Stryker completo** (0 blocker, 0 major, 0 minor novo, 2 nit). Minors abertos no total: 0 (débitos #30 e #31 fora da contagem). Se o Stryker acusar sobrevivente novo em código novo do domínio, vira major e há r4 (só o disparo, sem rodada extra de revisão do delta restante).

## Estado dos achados da r2

| r2 | Estado | Evidência |
|---|---|---|
| 3 (r1, Stryker) | **resolvido na parte do domínio novo**, pendente só da confirmação final | `:144` e `:205` tratados (abaixo); `:95` é pré-existente, aceito na 005a. |
| 9 (minor, `--no-verify`) | **resolvido** | `notas.md` ganha seção "Revisão r2, achado 9" com motivo, mitigação e encaminhamento à retro do ciclo 04 (b41203b). |
| 10 (minor, marca `byKeyboard`) | **resolvido como débito** | issue #31 (informada). |
| 11 a 13 (nits) | sem ação | |

## Avaliação dos três pontos pedidos

1. **Equivalência de `serialize.ts:144` (`entry.pruned ?? []` -> `["Stryker was here"]`): procede.** `applyPrune` (`src/domain/history.ts:74-82`) faz `new Set(pruned.map(memo => memo.index))`; com uma string no lugar do memo, `.index` é `undefined`, o conjunto é `{undefined}`, e `targets.has(i)` é falso para todo `i` de `notes.map` (0-80). O resultado tem o mesmo conteúdo de `[]` (cada elemento é a mesma referência), e o `splice(0, 81, ...)` copia o conteúdo para `scratch.notes`; nenhuma diferença observável. O ramo só é alcançado por jogada sem `pruned` (`place`), onde o original usa `[]`. A diretiva está na linha certa (`:144`, imediatamente antes do `splice`), restrita ao mutador `ArrayDeclaration` e à linha seguinte (`disable next-line`); segue o precedente de `board.ts:102` e `digit.ts:3`, e o motivo está escrito no comentário e no corpo de `6fe8dcf`.
2. **O teste de `6efae6e` exerce o laço de `serialize.ts:205` (hoje `:206`, pelo comentário acrescentado): sim.** `gamePlace` + `gameUndo` deixa `cursor 0 < moves.length 1`, então `deserializeGame` passa por `for (let i = moves.length - 1; i >= target; i--)` com `i = 0`, e `pruned` do `place` é `undefined`, logo `pruned ?? []` usa o `[]`. Sob o mutante, `memo = "Stryker was here"` grava `scratch.notes[undefined] = undefined`, criando a chave `"undefined"` (82 chaves em vez de 81), que `Object.keys(notes)` com `toHaveLength(81)` detecta; o `toEqual` anterior não via isso. A prova com mutante manual está no corpo do commit e na T02. Nome cita `CA-005-43`; o teste não é órfão.
3. **Via 7b conforme `PROCESSO.md` §6: sim.** `tasks.md` T02 ganha o item "via 7b declarada (28/11/2026, mutação)" com o teste, o mutante, o motivo (`toEqual` ignora `undefined`) e a prova; o corpo de `6efae6e` repete a declaração e traz o placar (nasce verde). Tarefa `tdd: sim`, via 7b declarada, sem produção alterada no commit `test`. Sem desvio.

## Achados novos (delta)

| # | Sev. | Arquivo:linha | Achado | Sugestão |
|---|---|---|---|---|
| 14 | nit | `specs/005b-anotacoes-e-tema/tasks.md:38` | Texto desatualizado depois de `6fe8dcf`: diz que o `:144` "segue como equivalente, a cargo do `dev`" (já marcado com `Stryker disable`), e cita `:205:34`, hoje `:206` pelo comentário inserido na `:144`. | Opcional: ao fechar a spec, acrescentar "marcado em `6fe8dcf`" e o deslocamento de linha. |
| 15 | nit | `src/domain/serialize.ts:144` | O comentário tem ~190 colunas, na mesma linha de estilo dos de `board.ts:102` e `digit.ts:3`; o prettier não quebra comentário. Sem ação. | Nenhuma. |

## Conferido sem achado

- Ordem TDD: o delta de código é um commit `test` (7b, sem produção) e um `chore` só de comentário; nenhuma tarefa nova, nenhuma isenção nova. Tipo `chore(domain)` coerente para comentário de ferramenta sem mudança de comportamento.
- Produção: a única linha alterada em `serialize.ts` é comentário; nenhum risco de comportamento, constituição, CSP, terceiros, segredos ou dados pessoais.
- Os mutantes: `:205` morto por teste; `:144` equivalente documentado; `:95` pré-existente aceito na 005a. Fica a confirmação do Stryker completo (esperado: 0 sobrevivente em código novo da 005b).

## Rastreabilidade (delta)

CA-005-43 → `serialize.prune.test.ts` ("INV: CA-005-43: place desfeito ... 81 chaves"), além dos testes anteriores. Sem CA novo. Órfãos: nenhum.
