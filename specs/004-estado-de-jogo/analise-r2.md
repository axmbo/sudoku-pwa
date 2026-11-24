# Análise de consistência r2 — spec 004 — 24/11/2026
Delta: `git diff -- specs/004-estado-de-jogo .claude/skills/dominio-sudoku/SKILL.md` (working tree sobre 36208a5) · gate de máquina: n/a (só documentos)
Veredito: **ok** (0 blocker, 0 major, 0 minor, 2 nit novos)

## Achados da r1
| # | Sev. r1 | Resolução | Situação |
|---|---|---|---|
| 1 | major | `history.ts` (tipos `Move`, `CellMemo`, `HistoryEntry`) passou para a T01 (tasks.md arquivos e manifesto da T01); a T02 não o cria mais e o lê no manifesto | resolvido |
| 2 | major | A T06 e o plan.md (linhas CA-004-16/17) restringem a propriedade a jogadas que não vencem e acrescentam "vence ⇒ `gameUndo` recusa com `game-over`". CA-004-11, 16 e 17 ressalvados na spec. A invariante 8 da skill ressalvada | resolvido |
| 3 | minor | Tabela de imports reordenada (`history` antes de `game`; `game` importa `conflicts` e `history`); ordem real escrita no texto | resolvido |
| 4 | minor | T02 lista limpar em célula com valor (no-op `ok`, mesma referência) e em pista (`cell-is-given`), com `INV:` citando CA-004-07/18 | resolvido |
| 5 | minor | `moves.test.ts` declara `INV:` | resolvido |
| 6 | minor | T06: defeito achado vira tarefa/ciclo novo fora da T06 | resolvido |
| 7 | minor | plan.md registra que o timer entra como `schemaVersion` 2 com migração, a registrar em B-06/B-07 | resolvido |
| 8 | nit | tasks.md: ciclo único, sem 004a/004b; linha de análise atualizada | resolvido |
| 9 | nit | `values` usa `.` como vazio | resolvido |

## Novos (nit)
| # | Sev. | Arquivo:linha | Achado | Sugestão |
|---|---|---|---|---|
| 10 | nit | spec.md:110 | A redação do CA-004-16 ("nenhuma das quais a vence (exceto em partida vencida, ver CA-004-23)") é truncada e ambígua; o parêntese não acrescenta nada. A de CA-004-17 repete o padrão "não vencida (exceto…)". | Simplificar: "nenhuma delas vence a partida (ver CA-004-23)". |
| 11 | nit | spec.md:3 · tasks.md:4 | A spec "aprovada" em 24/11/2026 foi editada depois (CA-004-11/16/17). A alteração é só ressalva, derivada da decisão 3 já aprovada. | Registrar a ressalva ao Diretor no retorno do ciclo. |

## Verificações do delta
- Nenhuma contradição nova: T01 tdd:sim cria `history.ts` só com tipos (cobertos pelo `tsc` e pelas T02/T04), sem comportamento sem teste. Aceitável, porque tipo não tem comportamento.
- O manifesto da T01 não cresce (tipos já contados no plano), e as T02 a T08 continuam abaixo de 15k.
- A rastreabilidade dos CA-004-01..33 fica inalterada (33 de 33).
