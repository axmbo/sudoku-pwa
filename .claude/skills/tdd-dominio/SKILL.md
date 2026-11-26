---
name: tdd-dominio
description: Como testar o Sudoku PWA em TDD — ciclo red/green/refactor com commits, unitários, property-based com fast-check, mutation com Stryker, nome de teste com ID de CA e isenções. Use ao escrever testes ou implementar código que eles cobrem.
---

# TDD no domínio — procedimento

Fonte das metas e isenções: `PROCESSO.md` §6. Princípios 5–7 da `docs/constituicao.md`.

## Ciclo e commits
1. **RED** (`eng-testes`): um teste por vez; rode e confirme a falha **pelo motivo certo** (asserção; a exceção do símbolo novo está em `PROCESSO.md` §6, "Motivo do vermelho"). Commit `test(<escopo>): <comportamento exigido>`.
2. **GREEN** (`dev`): o mínimo para passar — fake it no primeiro caso, triangule com o próximo teste. Nunca editar teste nesta fase. Tipo do commit pela semântica real (`feat`, `fix`, `refactor`).
3. **REFACTOR** (`dev`): sem comportamento novo, tudo verde o tempo todo. Sem melhoria real, sem commit (diga isso no retorno).
- Vias 7a/7b, defeito achado no REFACTOR/revisão e GREEN que não adianta ciclo: `PROCESSO.md` §6.
- Teste errado descoberto no GREEN: desfaça a produção não commitada e volte ao RED.
- Dependência grande no caminho: stub agora, item novo em `notas.md`.

## Nome dos testes
`describe('<módulo>')` + `it('CA-001-03: rejeita número repetido na mesma linha', ...)`. Teste sem CA só para invariante técnica, com o prefixo `INV:` e justificativa no plano.

## Unitários
- Arrange/Act/Assert curtos; um comportamento por `it`.
- Grades de exemplo como string de 81 caracteres (`.` = vazio), legíveis em fixture.
- Nada de `Math.random`, `Date.now` ou DOM no domínio: injete PRNG e relógio.

## Property-based (fast-check)
- ≥ 1 propriedade por invariante: solução única do gerado; solver devolve grade válida e consistente com as pistas; `deserialize(serialize(x)) = x`; `undo(do(s)) = s`; mesma seed ⇒ mesmo puzzle.
- Fixe `seed` ao reproduzir falha e registre-a no teste de regressão.
- `numRuns` padrão no `check`; valores maiores no CI agendado.
- Toda propriedade nasce, já no RED, com timeout próprio (`const PROP_TIMEOUT = 30_000` passado ao `it`/`test`): com a suíte em paralelo, os 5 s padrão estouram (M-017).
- Geradores (`Arbitrary`) do domínio ficam em `src/domain/__arbitraries__/` e são reutilizados.

## Mutation (Stryker)
- Só `src/domain/`. Meta ≥ 70%; no PR, incremental (arquivos alterados).
- Mutante sobrevivente em código novo é **major**: escreva o teste que o mata ou justifique como equivalente em `notas.md`.
- O Stryker usa `vitest.stryker.config.ts`, que estende o `vitest.config.ts`: limite por teste de 120 s, propriedades com no máximo 10 rodadas (`tests/stryker.setup.ts`) e o teste de regressão de tempo fora da rodada; propriedade nova também tem de passar sob essa config (decisão do Diretor, 25/11/2026, PR #16; o cache incremental no CI está na issue #17).
- Mutação local só vale como evidência no mesmo escopo do CI. `--mutate <arquivo>` com `related: true` roda só os testes relacionados ao arquivo e não reproduz timeout nem custo da rodada completa.

## Cobertura
≥ 90% de branches em `src/domain/`; linhas novas do domínio sem cobertura derrubam o gate.

## Isenção
Declarada em `tasks.md` como `tdd: isento — <motivo>`, só da lista fechada. Sem isenção declarada, TDD é obrigatório.
