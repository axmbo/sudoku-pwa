# Revisão r2 — spec 005b — 28/11/2026

Base: 693d4ef · Head: 5e29174 · check: verde (1103 testes, cobertura 100%; informado pelo Orquestrador, não rodado de novo por esta revisão) · E2E 38/38 em 3 rodadas e com `--workers=8` (informado)
Veredito: **sai, condicionado ao Stryker** (0 blocker, 0 major, 2 minor, 3 nit). Se a rodada de mutação mostrar sobrevivente em `pruneTargets`/`applyPrune`/`replay`, o achado 3 da r1 vira major e há r3.

## Estado dos achados da r1

| r1 | Estado | Evidência |
|---|---|---|
| 1 (major, via 7b não declarada) | **resolvido** | `tasks.md` T02, T05, T06 ganham "via 7b declarada" com motivo e commit; `notas.md` registra o desvio de §6 na T06 com aprovação do Diretor de 28/11/2026. Histórico intacto. |
| 2 (minor, texto da T05) | **resolvido** | `tasks.md` T05 agora diz Desfazer/Refazer `aria-disabled` e Anotar sem `aria-disabled`, clique sem efeito; bate com `Actions.tsx` e `view.ts`. |
| 3 (minor, Stryker) | **pendente** | Rodada completa em andamento. A exclusão em `vitest.stryker.config.ts` (53148ea) tira só testes "gerador ... alcança", que verificam o gerador de teste, não o domínio; não reduz o poder de matar mutantes do código novo. Resultado será anexado. |
| 4 (minor, anotações a ~9 px) | **resolvido como débito** | issue #30 (`débito`, aberta). |
| 5 a 8 (nits) | sem ação, como na r1 | |

## Achados novos (delta)

| # | Sev. | Arquivo:linha | Achado | Sugestão |
|---|---|---|---|---|
| 9 | minor | `docs/process/CHANGELOG-processo.md:63`, `scripts/hooks/pre-commit.sh:14`; commit `a502ecf` | RED feito com `--no-verify`, embora o pre-commit aceite commit só de teste (`:14`, ramo RED com `tsc-red-filter`) e o Diretor tenha descartado `--no-verify` caso a caso (`CHANGELOG-processo.md:63`). Mitigação real: prettier, eslint e tsc reaplicados à mão, limpos; o corpo do commit documenta o vermelho por asserção. Sem dano ao código, mas é quebra de regra de processo e não há registro do motivo (o hook falhou? por quê?). | Registrar em `notas.md` o motivo do `--no-verify` (se o hook falhou, abrir issue do hook; se foi escolha, é desvio). Candidato a verificação em CI ou a `commit-msg`/auditoria que acuse `--no-verify`. |
| 10 | minor | `src/ui/Grid.tsx:48` (`if (!changed \|\| !byKeyboard.current) return;`), `:63`, `:77` | Risco residual relatado pelo `dev`, confirmado: a marca `byKeyboard` é armada só por `move` e só desarmada por clique em célula; nunca por efeito. Depois de navegar por teclado, qualquer mudança de `selected` que não seja clique em célula nem `move` move o foco real. Hoje isso é inócuo: o único outro produtor de seleção é `travel` (`reducer.ts:124-125`), cujo foco já é movido de propósito por `focusTick` (CA-005-23), e `digit`/`erase`/`toggle-mode` não mudam `selected`. É latente: uma futura ação que reposicione a seleção (novo jogo, restaurar partida) com o foco em outro controle roubaria o foco. Tab para fora e volta também mantém a marca armada. Nada disso é coberto por teste nem por comentário de aviso. | Aceitar e registrar como débito (issue `débito`), ou acrescentar à nota do comentário em `Grid.tsx:40-43` que a marca vale só enquanto `select`/`move`/`travel` forem os únicos produtores de seleção. Sem mudar código agora. |
| 11 | nit | `src/ui/Grid.test.tsx:142-145` | O teste da T10 espera `setTimeout` real de 300 ms para os efeitos adiados do Preact: depende de relógio de parede, não determinístico em máquina lenta. Passou nas rodadas medidas. | Se instabilizar, trocar por `vi.useFakeTimers` ou esperar o foco com `waitFor`; teste instável é major, então monitorar. |
| 12 | nit | `vitest.stryker.config.ts:16` | Regex `gerador.*alcança` é por nome de teste: um teste futuro cujo nome contenha as duas palavras sai da mutação sem aviso. | Aceitável; manter o comentário de decisão do Diretor. |
| 13 | nit | `src/ui/Grid.tsx:62` | `Enter`/`Space` e outras ações de teclado não-`move` já não armam a marca: coerente com o diagnóstico (só navegação move o foco), sem deriva da spec. | Nenhuma. |

## Conferido sem achado

- **Ordem TDD da T10:** `a502ecf` (`test`, falha por asserção: foco fica em (0,2), `is-selected` em (0,3) passa) antes de `5e29174` (`fix`); GREEN só toca `Grid.tsx`, sem editar teste; tarefa `tdd: sim` sem isenção; sem teste que nasça verde.
- **Correção do GREEN:** decisão passa a depender só de `changed` do render e da marca; elimina a corrida de efeito adiado que apagava a marca. Clique desarma a marca (CA-005-07/10 seguem verdes).
- **Constituição, CSP, terceiros, segredos, dados pessoais:** nada novo no delta (só Grid, teste, config do Stryker e docs).

## Rastreabilidade (delta)

CA-005-16 → `Grid.test.tsx` (novo teste da T10, cita CA-005-16), além dos testes da r1. Sem CA novo; `tasks.md` atualiza a cobertura (CA-005-16: T03, T04, T05, T08, T10). Órfãos: nenhum novo.
