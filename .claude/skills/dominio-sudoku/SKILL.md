---
name: dominio-sudoku
description: Glossário pt-BR↔inglês e invariantes do domínio do Sudoku PWA (grade, pista, anotação, conflito, unicidade, técnicas de dificuldade, seed do desafio diário), para todos os agentes usarem os mesmos termos. Use ao especificar, nomear tipos, testar ou revisar o domínio.
---

# Domínio Sudoku — glossário e invariantes

Detalhe de algoritmo e PRNG: [ADR 0005](../../../docs/adr/0005-worker-e-gerador-deterministico.md). Princípios 5–7 da `docs/constituicao.md`.

## Glossário (UI/doc em pt-BR → código em inglês)
| pt-BR | código | Definição |
|---|---|---|
| grade / tabuleiro | `Grid` / `Board` | 9×9 células; `Grid` = valores, `Board` = estado de jogo completo |
| célula | `Cell` | posição (linha, coluna), índice 0–80 = `row * 9 + col` |
| linha / coluna | `row` / `col` | 0–8 no código; 1–9 na UI |
| bloco / caixa | `box` | sub-grade 3×3, índice 0–8 |
| unidade | `unit` | linha, coluna ou bloco |
| vizinhas | `peers` | as 20 células que compartilham unidade com uma célula |
| pista / dado | `given` | valor inicial do puzzle; imutável |
| valor | `value` | número 1–9 colocado pelo jogador |
| anotação / candidato do jogador | `note` | marca a lápis do jogador (conjunto de 1–9) |
| candidato | `candidate` | valor ainda possível pelo solver lógico |
| conflito | `conflict` | mesmo valor duas vezes numa unidade |
| solução | `solution` | grade completa válida consistente com as pistas |
| puzzle | `Puzzle` | pistas + solução + nível + seed + versão do gerador |
| nível de dificuldade | `Difficulty` | definido pela técnica mais difícil exigida |
| desafio diário | `DailyChallenge` | puzzle derivado da data + versão do gerador |
| desfazer / refazer | `undo` / `redo` | sobre o histórico de jogadas (`Move`) |
| semente | `seed` | entrada do PRNG |

## Técnicas (nomes em inglês no código, pt-BR na UI)
Único nu (*naked single*), único oculto (*hidden single*), par/trinca nu (*naked pair/triple*), par/trinca oculto (*hidden pair/triple*), candidatos travados (*locked candidates*: apontamento e redução em caixa), X-Wing, XY-Wing, Swordfish. A divisão por nível (fácil, médio, difícil, especialista) é do ADR 0005; puzzle que só a busca resolve é rejeitado.

## Invariantes (cada uma vira ≥ 1 propriedade fast-check)
1. Grade válida: nenhum valor repetido em unidade; valores em 1–9 ou vazio.
2. Pistas nunca mudam durante o jogo; colocar valor em pista é rejeitado.
3. Todo puzzle gerado tem **exatamente uma** solução (contagem com corte em 2).
4. A solução respeita todas as pistas e é grade válida completa.
5. O nível do puzzle = nível da técnica mais difícil que o solver lógico precisou; o solver lógico resolve o puzzle só com técnicas até esse nível.
6. Determinismo: `generate(seed, version)` devolve sempre o mesmo puzzle.
7. `deserialize(serialize(board)) = board`, inclusive anotações e histórico.
8. `undo(apply(board, move)) = board`; `redo(undo(b)) = b` enquanto não houver jogada nova.
9. Conflito é derivado do estado, nunca armazenado.
10. Vitória ⇔ grade completa, sem conflito e igual à solução.
