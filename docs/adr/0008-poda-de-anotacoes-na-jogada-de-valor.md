# ADR 0008: Poda das anotações vizinhas como parte da jogada de valor

- **Status:** Aceito (27/11/2026, opção A, pelo Diretor; decisão 23 do plano da 005b)
- **Data:** 27/11/2026
- **Autor:** agente `arquiteto`
- **Origem:** planejamento da spec 005b (CA-005-43) contra a spec 004 (CA-004-10, decisão 9 do Diretor, 24/11/2026)

## Contexto

A spec 005b (aprovada em 25/11/2026) exige, no CA-005-43, que ao colocar o valor X numa célula a anotação X **some** das vizinhas (linha, coluna e caixa), visível na grade. A spec diz que anotações e desfazer "vêm do domínio (001/004)", mas o domínio entregue na 004 faz o contrário: `gamePlace` limpa só as anotações da própria célula e **mantém** as dos vizinhos (CA-004-10; "limpeza automática de anotações dos vizinhos" ficou fora de escopo da 004, decisão 9). Cada jogada do histórico guarda o conteúdo anterior de **uma** célula (`HistoryEntry.before: CellMemo`), e desfazer restaura só essa célula (invariante 8 do domínio: `undo(apply(b, m)) = b`).

Consequência: a poda pedida pela 005b não existe no domínio, e a decisão sobre como obtê-la define a granularidade do desfazer (CA-005-23: "a última ação é revertida"), o formato do histórico e a serialização (spec 004, formato v1). Não há ainda persistência em uso (B-06 não feita), então não há dado gravado a migrar.

## Opções consideradas

| Opção | Como | Prós | Contras |
|---|---|---|---|
| **A. Nova jogada de domínio `gamePlaceAndPrune`** (recomendada) | Novo tipo de jogada `place-prune` no histórico; ao colocar X, remove X das anotações dos vizinhos numa só jogada; `before` guarda também as anotações podadas; desfazer restaura tudo; refazer reaplica a poda. `gamePlace` fica como está. | Uma ação = um desfazer (CA-005-23); invariantes 7 e 8 preservadas por teste; CA-004-10 continua valendo para `gamePlace`; sem dado legado | Muda o domínio (history, game, serialize, geradores de teste): ~2 tarefas; mutação 100% do código novo; `Move` ganha um tipo |
| B. A UI compõe `gamePlace` + `gameToggleNote` por vizinho | Reducer chama a jogada de valor e depois alterna a anotação em cada vizinho que a tem | Domínio intacto | Até ~20 entradas de histórico por valor: desfazer exige vários passos e restaura "meio estado"; viola CA-005-23; refazer idem |
| C. Poda só na visão (derivada) | `gridView` esconde a anotação X de células com vizinho de valor X | Domínio intacto; desfazer correto | A anotação continua no estado e reaparece ao apagar o valor; **impede** anotar X numa célula que já tem vizinho com X (permitido pelo CA-004-06; contradiz CA-005-17: a anotação nunca apareceria); nome acessível e estado divergem |
| D. `gamePlace` passa a podar sempre | Muda o comportamento existente | Menor código novo | Reverte a decisão 9 e o CA-004-10; quebra testes e propriedades da 004; reabre spec arquivada |

## Decisão

Adotar a **opção A**.

- `src/domain/history.ts`: `Move` ganha `{ kind: 'place-prune'; index; digit }`; `HistoryEntry` ganha `pruned?: readonly { index: number; notes: Notes }[]` (só nas jogadas `place-prune`; as anotações dos vizinhos antes da poda, só dos que tinham X). Desfazer restaura valor e anotações da célula e as dos vizinhos podados. Refazer reaplica o valor e **recalcula** a poda (determinística a partir do estado), sem depender de dado extra.
- `src/domain/game.ts`: `gamePlaceAndPrune(game, row, col, digit): Result<Game, GamePlaceRefusal>` (mesmas recusas de `gamePlace`, inclusive `game-over`; mesmo valor = sem efeito, mesmo `Game`).
- `src/domain/serialize.ts`: código numérico novo para `place-prune`; `before` e `pruned` continuam **reconstruídos pela repetição das jogadas** (como hoje), sem campo novo no JSON. `GAME_FORMAT_VERSION` fica em 1, porque nenhum dado v1 foi gravado em produção (B-06 pendente); se isso mudar antes do merge, reabrir esta decisão.
- A UI usa `gamePlaceAndPrune` no modo valor; `gamePlace` segue exportado e testado.

## Consequências

- Positivas: poda e desfazer coerentes, uma ação por entrada; invariantes do domínio mantidas e testáveis por propriedade; CA-004-10 intacto.
- Negativas: domínio cresce (~+60 linhas); arbitrários de teste e serialização precisam do tipo novo; custo ~230k tokens de tarefas (T01 e T02 da 005b) a mais do que uma 005b só de UI; exige que o Diretor reconheça que o CA-005-43 amplia a 004 (a 004 dizia "fora de escopo", não "proibido").
- Se o Diretor preferir a opção C ou D: refazer `plan.md`/`tasks.md` da 005b (C elimina T01 e T02 e muda o CA-005-17; D reabre a 004).

## Fontes (consultadas em 27/11/2026)

- `specs/_arquivo/004-estado-de-jogo/spec.md` (CA-004-06, CA-004-10, decisão 1 da spec, linhas 55 a 80, 219, 224) e `docs/estado.md` (decisão 9 do Diretor).
- `specs/_arquivo/005b-anotacoes-e-tema/spec.md` (CA-005-17, 23, 43).
- Código: `src/domain/history.ts`, `src/domain/game.ts`, `src/domain/serialize.ts`.
- [ADR 0004](0004-persistencia-local.md) (envelope e `schemaVersion`) e [ADR 0007](0007-convencoes-do-dominio.md) (recusa como valor, índices 0–8).
